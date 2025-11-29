// src/app/(debate)/debate/new/actions.ts
'use server'

import { headers } from 'next/headers'

import { logger, logDebateEvent, logSecurityEvent } from '@/lib/logging'
import { debateFormSchema } from '@/lib/schemas/debate-schema'
import { validateAndSanitizeDebateConfig } from '@/lib/security'
import { trackVisitFromHeaders, checkBan, hashIP } from '@/lib/security/abuse-tracker'
import { createDebateSession } from '@/services/debate-service'

import type { DebateFormValues } from '@/lib/schemas/debate-schema'
import type { BlockReason } from '@/lib/security'
import type { DebateFormat } from '@/types/debate'
import type { SecurityContext } from '@/types/security'

// Extract security context from headers in Server Actions
async function getSecurityContext(): Promise<SecurityContext> {
  const headersList = await headers()

  // Get IP with fallback to localhost for local development
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    headersList.get('cf-connecting-ip') ??
    '127.0.0.1'

  return {
    ip,
    sessionId: headersList.get('x-session-id'),
    userAgent: headersList.get('user-agent'),
    origin: headersList.get('origin'),
    referer: headersList.get('referer'),
  }
}

// Map BlockReason to human-readable descriptions for logging
const BLOCK_REASON_DESCRIPTIONS: Record<BlockReason, string> = {
  prompt_injection: 'Prompt injection attempt detected',
  harmful_content: 'Harmful or prohibited content detected',
  profanity: 'Profanity or inappropriate language detected',
  manipulation: 'AI manipulation attempt detected',
  dangerous_pattern: 'Dangerous formatting or pattern detected',
  sensitive_topic: 'Sensitive or prohibited topic detected',
  content_policy: 'General content policy violation',
}

export interface CreateDebateActionResult {
  success: boolean
  debateId?: string | undefined
  error?: string | undefined
  fieldErrors?: Record<string, string[] | undefined> | undefined
  blocked?: boolean | undefined
  blockReason?: BlockReason | undefined
}

export async function createDebate(data: DebateFormValues): Promise<CreateDebateActionResult> {
  const validated = debateFormSchema.safeParse(data)

  if (!validated.success) {
    logger.warn('Debate creation failed: Invalid form data', {
      fieldErrors: validated.error.flatten().fieldErrors,
    })
    return {
      success: false,
      error: 'Invalid form data',
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  // Extract security context for abuse tracking
  const securityContext = await getSecurityContext()

  // Check if user is banned before allowing debate creation
  try {
    const ipHash = await hashIP(securityContext.ip)
    const banCheck = await checkBan(ipHash)

    if (banCheck.isBanned && banCheck.ban) {
      // Don't allow shadow-banned users to know they're banned
      if (banCheck.ban.banType !== 'shadow') {
        logger.warn('Banned user attempted to create debate', {
          ipHash: ipHash.substring(0, 16) + '...',
          banReason: banCheck.ban.reason,
          banType: banCheck.ban.banType,
        })

        const remainingMinutes = banCheck.remainingTime
          ? Math.ceil(banCheck.remainingTime / 1000 / 60)
          : undefined

        return {
          success: false,
          error: remainingMinutes
            ? `Your access has been temporarily suspended. Please try again in ${remainingMinutes} minutes.`
            : 'Your access has been permanently suspended due to policy violations.',
          blocked: true,
        }
      }
      // For shadow bans, silently fail without revealing the ban
      logger.info('Shadow-banned user attempted to create debate', {
        ipHash: ipHash.substring(0, 16) + '...',
      })
      return {
        success: false,
        error: 'Unable to create debate at this time. Please try again later.',
      }
    }
  } catch (error) {
    logger.warn('Failed to check ban status', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    // Continue if ban check fails (fail open)
  }

  // Track visit for abuse monitoring (Server Actions don't go through middleware)
  try {
    await trackVisitFromHeaders(securityContext.ip, securityContext.userAgent)
  } catch (error) {
    logger.warn('Failed to track visit', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }

  // Security validation and sanitization (hybrid: regex patterns + OpenAI Moderation API)
  const securityValidation = await validateAndSanitizeDebateConfig(
    {
      topic: validated.data.topic,
      turns: validated.data.turns,
      format: validated.data.format,
      customRules: validated.data.customRules,
    },
    securityContext
  )

  if (!securityValidation.valid || !securityValidation.sanitizedConfig) {
    // Log blocked content with detailed information
    const blockReason = securityValidation.blockReason ?? 'content_policy'
    const severity =
      blockReason === 'prompt_injection' ||
      blockReason === 'harmful_content' ||
      blockReason === 'sensitive_topic'
        ? 'critical'
        : blockReason === 'manipulation' || blockReason === 'dangerous_pattern'
          ? 'high'
          : 'medium'

    logSecurityEvent('debate_creation_blocked', severity, {
      blockReason,
      blockReasonDescription: BLOCK_REASON_DESCRIPTIONS[blockReason],
      contentPreview: validated.data.topic.slice(0, 100),
      contentLength: validated.data.topic.length,
      format: validated.data.format,
      turns: validated.data.turns,
      hasCustomRules: (validated.data.customRules?.length ?? 0) > 0,
      validationErrors: securityValidation.errors,
    })

    return {
      success: false,
      error: securityValidation.errors[0] ?? 'Content validation failed',
      fieldErrors: { topic: securityValidation.errors },
      blocked: securityValidation.blocked,
      blockReason: securityValidation.blockReason,
    }
  }

  // Use sanitized config for debate creation
  const result = await createDebateSession({
    topic: securityValidation.sanitizedConfig.topic,
    turns: securityValidation.sanitizedConfig.turns,
    format: securityValidation.sanitizedConfig.format as DebateFormat,
    customRules: securityValidation.sanitizedConfig.customRules,
  })

  if (!result.success) {
    logger.error('Debate creation failed: Service error', null, {
      error: result.error,
      topic: securityValidation.sanitizedConfig.topic.slice(0, 100),
      format: securityValidation.sanitizedConfig.format,
      turns: securityValidation.sanitizedConfig.turns,
    })
    return {
      success: false,
      error: result.error ?? 'Failed to create debate',
    }
  }

  // Log successful debate creation
  logDebateEvent('debate_created', result.debateId!, {
    topic: securityValidation.sanitizedConfig.topic.slice(0, 100),
    format: securityValidation.sanitizedConfig.format,
    turns: securityValidation.sanitizedConfig.turns,
    hasCustomRules: (securityValidation.sanitizedConfig.customRules?.length ?? 0) > 0,
    customRulesCount: securityValidation.sanitizedConfig.customRules?.length ?? 0,
  })

  return {
    success: true,
    debateId: result.debateId,
  }
}
