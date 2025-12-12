// src/app/(debate)/debate/new/actions.ts
'use server'

import { headers } from 'next/headers'

import { logger, logDebateEvent, logSecurityEvent } from '@/lib/logging'
import { debateFormSchema } from '@/lib/schemas/debate-schema'
import { validateAndSanitizeDebateConfig } from '@/lib/security'
import { trackVisitFromHeaders, checkBan, hashIP } from '@/lib/security/abuse-tracker'
import { createDebateSession } from '@/services/debate-service'
import { sanitizeTopic } from '@/services/topic-sanitizer'

import type { DebateFormValues } from '@/lib/schemas/debate-schema'
import type { BlockReason } from '@/lib/security'
import type { DebateFormat } from '@/types/debate'
import type { SecurityContext } from '@/types/security'

interface CreateDebateData extends DebateFormValues {
  alreadyPolished?: boolean
}

async function getSecurityContext(): Promise<SecurityContext> {
  const headersList = await headers()

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

export async function createDebate(data: CreateDebateData): Promise<CreateDebateActionResult> {
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

  const securityContext = await getSecurityContext()

  try {
    const ipHash = await hashIP(securityContext.ip)
    const banCheck = await checkBan(ipHash)

    if (banCheck.isBanned && banCheck.ban) {
      // Shadow bans must not reveal ban status to the user
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
      logger.info('Shadow-banned user attempted to create debate', {
        ipHash: ipHash.substring(0, 16) + '...',
      })
      return {
        success: false,
        error: 'Unable to create debate at this time. Please try again later.',
      }
    }
  } catch (error) {
    // Fail open: allow debate creation if ban check is unavailable
    logger.warn('Failed to check ban status', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }

  // Server Actions bypass middleware, so we track visits explicitly here
  try {
    await trackVisitFromHeaders(securityContext.ip, securityContext.userAgent)
  } catch (error) {
    logger.warn('Failed to track visit', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }

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

  // Skip AI topic polishing if user already invoked the sparkle button
  let finalTopic = securityValidation.sanitizedConfig.topic
  let originalTopic = securityValidation.sanitizedConfig.topic

  if (!data.alreadyPolished) {
    const sanitizeResult = await sanitizeTopic(securityValidation.sanitizedConfig.topic)
    finalTopic = sanitizeResult.sanitizedTopic
    originalTopic = sanitizeResult.originalTopic
  }

  const result = await createDebateSession({
    topic: finalTopic,
    originalTopic,
    turns: securityValidation.sanitizedConfig.turns,
    format: securityValidation.sanitizedConfig.format as DebateFormat,
    customRules: securityValidation.sanitizedConfig.customRules,
  })

  if (!result.success) {
    logger.error('Debate creation failed: Service error', null, {
      error: result.error,
      topic: finalTopic.slice(0, 100),
      originalTopic: originalTopic.slice(0, 100),
      format: securityValidation.sanitizedConfig.format,
      turns: securityValidation.sanitizedConfig.turns,
    })
    return {
      success: false,
      error: result.error ?? 'Failed to create debate',
    }
  }

  logDebateEvent('debate_created', result.debateId!, {
    topic: finalTopic.slice(0, 100),
    originalTopic: originalTopic.slice(0, 100),
    format: securityValidation.sanitizedConfig.format,
    turns: securityValidation.sanitizedConfig.turns,
    hasCustomRules: (securityValidation.sanitizedConfig.customRules?.length ?? 0) > 0,
    customRulesCount: securityValidation.sanitizedConfig.customRules?.length ?? 0,
    alreadyPolished: data.alreadyPolished ?? false,
  })

  return {
    success: true,
    debateId: result.debateId,
  }
}
