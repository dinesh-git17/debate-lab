// validate-input.ts
/**
 * Unified input validation combining sanitization and 5-layer moderation.
 * Entry point for validating debate topics and custom rules with abuse tracking.
 */

import { logger } from '@/lib/logging'

import { logContentFilterViolation, logInjectionAttempt } from './abuse-logger'
import { recordContentViolation, recordPromptInjection, hashIP } from './abuse-tracker'
import { filterCustomRule, isPromptInjection } from './content-filter'
import { moderateContent } from './moderation-stack'
import { sanitizeTopic, sanitizeCustomRule, containsDangerousPatterns } from './sanitizer'

import type { SecurityContext, ContentFilterResult } from '@/types/security'

async function recordAbuseIfContext(
  context: SecurityContext | undefined,
  type: 'content' | 'injection',
  details: Record<string, unknown>,
  endpoint: string
): Promise<void> {
  // Log immediately to confirm function is being called
  logger.info('recordAbuseIfContext: Function called', {
    type,
    endpoint,
    hasContext: !!context,
    ip: context?.ip ?? 'no-context',
  })

  if (!context?.ip) {
    logger.warn('recordAbuseIfContext: No context or IP provided - skipping Supabase', {
      type,
      endpoint,
    })
    return
  }

  try {
    const ipHash = await hashIP(context.ip)
    logger.info('Recording abuse event to Supabase', {
      type,
      endpoint,
      ipHash: ipHash.substring(0, 16) + '...', // Truncate for privacy
      detailsType: details.type,
    })

    if (type === 'injection') {
      await recordPromptInjection(ipHash, details, endpoint)
    } else {
      await recordContentViolation(ipHash, details, endpoint)
    }

    logger.info('Abuse event recorded successfully', { type, endpoint })
  } catch (error) {
    logger.error(
      'Failed to record abuse event to Supabase',
      error instanceof Error ? error : null,
      {
        type,
        endpoint,
        ip: context.ip,
      }
    )
  }
}

export type BlockReason =
  | 'prompt_injection'
  | 'harmful_content'
  | 'profanity'
  | 'manipulation'
  | 'dangerous_pattern'
  | 'sensitive_topic'
  | 'content_policy'

export interface ValidationResult {
  valid: boolean
  sanitizedValue: string
  errors: string[]
  blocked: boolean
  blockReason?: BlockReason
  filterResult: ContentFilterResult | null
  moderationSource?: 'regex' | 'openai' | 'semantic'
}

export async function validateDebateTopic(
  topic: string,
  context?: SecurityContext
): Promise<ValidationResult> {
  const errors: string[] = []

  if (!topic || topic.trim().length === 0) {
    return {
      valid: false,
      sanitizedValue: '',
      errors: ['Topic is required'],
      blocked: false,
      filterResult: null,
    }
  }

  // CRITICAL: Check ORIGINAL input for dangerous patterns BEFORE sanitization
  // This prevents attackers from bypassing filters by having content stripped
  if (containsDangerousPatterns(topic)) {
    if (context) {
      logInjectionAttempt(context, '/api/debate', 'dangerous_pattern', topic)
      await recordAbuseIfContext(
        context,
        'injection',
        { type: 'dangerous_pattern', topic },
        '/api/debate'
      )
    }
    return {
      valid: false,
      sanitizedValue: '',
      errors: [
        'Your input contains content that violates our Terms of Service. Repeated violations may result in access termination.',
      ],
      blocked: true,
      blockReason: 'dangerous_pattern',
      filterResult: null,
    }
  }

  // Sanitize for XSS/storage first to validate length
  const sanitized = sanitizeTopic(topic)

  if (sanitized.sanitizedLength < 10) {
    errors.push('Topic must be at least 10 characters')
  }

  if (sanitized.sanitizedLength > 500) {
    errors.push('Topic must be less than 500 characters')
  }

  // Return early if basic validation fails
  if (errors.length > 0) {
    return {
      valid: false,
      sanitizedValue: '',
      errors,
      blocked: false,
      filterResult: null,
    }
  }

  // ============================================
  // 5-LAYER MODERATION STACK
  // Layer 1: Keyword Scanner (risk score only)
  // Layer 2: Semantic Category Classifier (GPT-4o-mini)
  // Layer 3: Embedding Similarity Filter (catches euphemisms)
  // Layer 4: OpenAI Moderation API (final gate)
  // Layer 5: Custom Business Rules
  // ============================================
  const moderationResult = await moderateContent(topic)

  if (!moderationResult.allowed) {
    // Map moderation result to block reason
    let blockReason: BlockReason = 'content_policy'

    switch (moderationResult.category) {
      case 'child_safety':
      case 'self_harm':
      case 'violent':
        blockReason = 'harmful_content'
        break
      case 'hate':
      case 'extremist':
        blockReason = 'sensitive_topic'
        break
      case 'illegal':
        blockReason = 'harmful_content'
        break
      case 'sexual':
        blockReason = 'content_policy'
        break
      default:
        blockReason = 'content_policy'
    }

    const errorMessage = getModerationErrorMessage(blockReason)
    errors.push(errorMessage)

    logger.info('5-layer moderation blocked content', {
      category: moderationResult.category,
      severity: moderationResult.severity,
      layer: moderationResult.layer,
      blockReason: moderationResult.blockReason,
      riskScore: moderationResult.riskScore,
      hasContext: !!context,
    })

    if (context) {
      logContentFilterViolation(
        context,
        '/api/debate',
        {
          passed: false,
          matches: [],
          sanitizedContent: null,
          shouldBlock: true,
          shouldLog: true,
        },
        topic
      )
      await recordAbuseIfContext(
        context,
        'content',
        {
          type: 'moderation_stack',
          category: moderationResult.category,
          severity: moderationResult.severity,
          layer: moderationResult.layer,
          blockReason,
          topic,
        },
        '/api/debate'
      )
    }

    return {
      valid: false,
      sanitizedValue: '',
      errors,
      blocked: true,
      blockReason,
      filterResult: null,
      moderationSource: moderationResult.layer === 'openai' ? 'openai' : 'semantic',
    }
  }

  // All moderation layers passed
  logger.info('5-layer moderation approved content', {
    category: moderationResult.category,
    layer: moderationResult.layer,
    riskScore: moderationResult.riskScore,
  })

  return {
    valid: true,
    sanitizedValue: sanitized.value,
    errors: [],
    blocked: false,
    filterResult: null,
    moderationSource: moderationResult.layer === 'openai' ? 'openai' : 'semantic',
  }
}

// Helper function to get user-friendly error messages for moderation blocks
function getModerationErrorMessage(blockReason: BlockReason): string {
  switch (blockReason) {
    case 'harmful_content':
      return 'Your input contains content that violates our Terms of Service. This type of content is strictly prohibited.'
    case 'sensitive_topic':
      return 'This topic involves sensitive content that cannot be debated on our platform. Please choose a different topic.'
    case 'content_policy':
      return 'Your input was flagged by our content moderation system. Please revise your topic.'
    default:
      return 'Your input was flagged by our content filter. Please revise your topic.'
  }
}

export async function validateCustomRules(
  rules: string[],
  context?: SecurityContext
): Promise<ValidationResult> {
  const errors: string[] = []
  const sanitizedRules: string[] = []
  let blocked = false
  let blockReason: BlockReason | undefined
  let aggregateFilterResult: ContentFilterResult | null = null

  if (rules.length > 5) {
    errors.push('Maximum 5 custom rules allowed')
    return {
      valid: false,
      sanitizedValue: '',
      errors,
      blocked: false,
      filterResult: null,
      moderationSource: 'regex',
    }
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]

    if (!rule || rule.trim().length === 0) {
      continue
    }

    // CRITICAL: Check ORIGINAL input for dangerous patterns BEFORE sanitization
    if (containsDangerousPatterns(rule)) {
      blocked = true
      blockReason = 'dangerous_pattern'
      errors.push('Your custom rule contains content that violates our Terms of Service.')
      if (context) {
        logInjectionAttempt(context, '/api/debate', 'dangerous_pattern', rule)
        await recordAbuseIfContext(
          context,
          'injection',
          { type: 'dangerous_pattern', rule, ruleIndex: i },
          '/api/debate'
        )
      }
      continue
    }

    // Check ORIGINAL input for prompt injection
    const filterResult = filterCustomRule(rule)

    if (filterResult.shouldBlock) {
      blocked = true
      aggregateFilterResult = filterResult

      if (context) {
        logContentFilterViolation(context, '/api/debate', filterResult, rule)
      }

      if (isPromptInjection(rule)) {
        blockReason = 'prompt_injection'
        errors.push('Your custom rule contains content that violates our Terms of Service.')
        if (context) {
          logInjectionAttempt(context, '/api/debate', 'custom_rule_injection', rule)
          await recordAbuseIfContext(
            context,
            'injection',
            { type: 'custom_rule_injection', rule, ruleIndex: i },
            '/api/debate'
          )
        }
      } else {
        blockReason = 'content_policy'
        errors.push(`Rule ${i + 1} was flagged by content filter`)
        if (context) {
          await recordAbuseIfContext(
            context,
            'content',
            { type: 'custom_rule_content_violation', rule, ruleIndex: i },
            '/api/debate'
          )
        }
      }
      continue
    }

    // Now sanitize for XSS/storage (after security checks pass)
    // Always use sanitized.value - it has HTML stripped and proper truncation
    const sanitized = sanitizeCustomRule(rule)

    if (sanitized.sanitizedLength > 200) {
      errors.push(`Rule ${i + 1} must be less than 200 characters`)
      continue
    }

    // Use the sanitized value (HTML stripped, truncated) as the final value
    sanitizedRules.push(sanitized.value)
  }

  const result: ValidationResult = {
    valid: errors.length === 0 && !blocked,
    sanitizedValue: JSON.stringify(sanitizedRules),
    errors,
    blocked,
    filterResult: aggregateFilterResult,
    moderationSource: 'regex',
  }

  if (blockReason) {
    result.blockReason = blockReason
  }

  return result
}

export interface DebateConfigValidationResult {
  valid: boolean
  blocked: boolean
  blockReason?: BlockReason
  sanitizedConfig: {
    topic: string
    turns: number
    format: string
    customRules: string[]
  } | null
  errors: string[]
}

export async function validateAndSanitizeDebateConfig(
  config: {
    topic: string
    turns: number
    format?: string
    customRules?: string[]
  },
  context?: SecurityContext
): Promise<DebateConfigValidationResult> {
  const errors: string[] = []
  let blocked = false
  let blockReason: BlockReason | undefined

  // Validate topic with hybrid approach (regex + OpenAI moderation)
  const topicResult = await validateDebateTopic(config.topic, context)
  if (!topicResult.valid) {
    errors.push(...topicResult.errors)
    if (topicResult.blocked) {
      blocked = true
      blockReason = topicResult.blockReason
    }
  }

  const validTurns = [2, 4, 6, 8, 10]
  if (!validTurns.includes(config.turns)) {
    errors.push('Invalid number of turns. Must be 2, 4, 6, 8, or 10')
  }

  const validFormats = ['standard', 'oxford', 'lincoln-douglas']
  const format = config.format ?? 'standard'
  if (!validFormats.includes(format)) {
    errors.push('Invalid debate format')
  }

  let sanitizedRules: string[] = []
  if (config.customRules && config.customRules.length > 0) {
    const rulesResult = await validateCustomRules(config.customRules, context)
    if (!rulesResult.valid) {
      errors.push(...rulesResult.errors)
      if (rulesResult.blocked) {
        blocked = true
        blockReason = blockReason ?? rulesResult.blockReason
      }
    } else {
      sanitizedRules = JSON.parse(rulesResult.sanitizedValue) as string[]
    }
  }

  if (errors.length > 0) {
    const result: DebateConfigValidationResult = {
      valid: false,
      blocked,
      sanitizedConfig: null,
      errors,
    }
    if (blockReason) {
      result.blockReason = blockReason
    }
    return result
  }

  return {
    valid: true,
    blocked: false,
    sanitizedConfig: {
      topic: topicResult.sanitizedValue,
      turns: config.turns,
      format,
      customRules: sanitizedRules,
    },
    errors: [],
  }
}
