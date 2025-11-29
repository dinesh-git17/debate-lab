// src/lib/security/validate-input.ts
// Unified input validation combining sanitization and content filtering
// Uses a hybrid approach: fast regex patterns first, then OpenAI Moderation API as secondary check

import { logger } from '@/lib/logging'

import { logContentFilterViolation, logInjectionAttempt } from './abuse-logger'
import { recordContentViolation, recordPromptInjection, hashIP } from './abuse-tracker'
import { filterDebateTopic, filterCustomRule, isPromptInjection } from './content-filter'
import { moderateWithOpenAI, isOpenAIModerationEnabled } from './openai-moderation'
import { sanitizeTopic, sanitizeCustomRule, containsDangerousPatterns } from './sanitizer'
import { semanticFilter, isSemanticFilterEnabled } from './semantic-filter'

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

  // Check ORIGINAL input for prompt injection and harmful content
  const filterResult = filterDebateTopic(topic)

  if (filterResult.shouldBlock) {
    if (context) {
      logContentFilterViolation(context, '/api/debate', filterResult, topic)
    }

    const categories = [...new Set(filterResult.matches.map((m) => m.category))]
    let blockReason: BlockReason = 'content_policy'

    if (categories.includes('prompt_injection')) {
      errors.push(
        'Your input contains content that violates our Terms of Service. Repeated violations may result in access termination.'
      )
      blockReason = 'prompt_injection'
      if (context) {
        logInjectionAttempt(context, '/api/debate', 'prompt_injection', topic)
        await recordAbuseIfContext(
          context,
          'injection',
          { type: 'prompt_injection', topic, matches: filterResult.matches },
          '/api/debate'
        )
      }
    } else if (categories.includes('harmful_content')) {
      errors.push(
        'Your input contains content that violates our Terms of Service. This type of content is strictly prohibited.'
      )
      blockReason = 'harmful_content'
      if (context) {
        await recordAbuseIfContext(
          context,
          'content',
          { type: 'harmful_content', topic, categories },
          '/api/debate'
        )
      }
    } else if (categories.includes('sensitive_topic')) {
      errors.push(
        'This topic involves sensitive content that cannot be debated on our platform. Please choose a different topic.'
      )
      blockReason = 'sensitive_topic'
      if (context) {
        await recordAbuseIfContext(
          context,
          'content',
          { type: 'sensitive_topic', topic, categories },
          '/api/debate'
        )
      }
    } else if (categories.includes('manipulation')) {
      errors.push(
        'Your input contains content that violates our Terms of Service. Repeated violations may result in access termination.'
      )
      blockReason = 'manipulation'
      if (context) {
        await recordAbuseIfContext(
          context,
          'content',
          { type: 'manipulation', topic, categories },
          '/api/debate'
        )
      }
    } else if (categories.includes('profanity')) {
      errors.push('Your input contains inappropriate language. Please revise your topic.')
      blockReason = 'profanity'
      if (context) {
        await recordAbuseIfContext(
          context,
          'content',
          { type: 'profanity', topic, categories },
          '/api/debate'
        )
      }
    } else {
      errors.push('Your input was flagged by our content filter. Please revise your topic.')
      if (context) {
        await recordAbuseIfContext(
          context,
          'content',
          { type: 'content_policy', topic, categories },
          '/api/debate'
        )
      }
    }

    return {
      valid: false,
      sanitizedValue: '',
      errors,
      blocked: true,
      blockReason,
      filterResult,
    }
  }

  // Now sanitize for XSS/storage (after security checks pass)
  // Always use sanitized.value as the final value - it has HTML stripped and proper truncation
  const sanitized = sanitizeTopic(topic)

  if (sanitized.sanitizedLength < 10) {
    errors.push('Topic must be at least 10 characters')
  }

  if (sanitized.sanitizedLength > 500) {
    errors.push('Topic must be less than 500 characters')
  }

  // Use the sanitized value (HTML stripped, truncated) as the final value
  const finalValue = sanitized.value

  // SECONDARY CHECK: OpenAI Moderation API for content that passed regex filters
  // This catches nuanced harmful content that regex patterns might miss
  if (isOpenAIModerationEnabled()) {
    const moderationResult = await moderateWithOpenAI(topic)

    if (moderationResult.flagged && moderationResult.blockReason) {
      const moderationErrors = getModerationErrorMessage(moderationResult.blockReason)
      errors.push(moderationErrors)

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
          { type: 'openai_moderation', blockReason: moderationResult.blockReason, topic },
          '/api/debate'
        )
      }

      return {
        valid: false,
        sanitizedValue: '',
        errors,
        blocked: true,
        blockReason: moderationResult.blockReason,
        filterResult,
        moderationSource: 'openai',
      }
    }
  }

  // TERTIARY CHECK: Semantic filter using embeddings to catch euphemistic harmful content
  // This catches content that evades both regex patterns and OpenAI moderation (e.g., "societal cleansing")
  if (isSemanticFilterEnabled()) {
    const semanticResult = await semanticFilter(topic)

    if (semanticResult.flagged && semanticResult.blockReason) {
      const semanticErrors = getModerationErrorMessage(semanticResult.blockReason)
      errors.push(semanticErrors)

      logger.info('Semantic filter blocked content - preparing to record abuse', {
        hasContext: !!context,
        contextIp: context?.ip ?? 'no-context',
        blockReason: semanticResult.blockReason,
        maxSimilarity: semanticResult.maxSimilarity,
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
        logger.info('About to call recordAbuseIfContext for semantic filter block')
        await recordAbuseIfContext(
          context,
          'content',
          { type: 'semantic_filter', blockReason: semanticResult.blockReason, topic },
          '/api/debate'
        )
        logger.info('recordAbuseIfContext completed for semantic filter block')
      } else {
        logger.warn('No context provided for semantic filter block - abuse not recorded')
      }

      return {
        valid: false,
        sanitizedValue: '',
        errors,
        blocked: true,
        blockReason: semanticResult.blockReason,
        filterResult,
        moderationSource: 'semantic',
      }
    }
  }

  return {
    valid: errors.length === 0,
    sanitizedValue: finalValue,
    errors,
    blocked: false,
    filterResult,
    moderationSource: 'regex',
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
