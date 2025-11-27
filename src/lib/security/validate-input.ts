// src/lib/security/validate-input.ts
// Unified input validation combining sanitization and content filtering

import { logContentFilterViolation, logInjectionAttempt } from './abuse-logger'
import { filterDebateTopic, filterCustomRule, isPromptInjection } from './content-filter'
import { sanitizeTopic, sanitizeCustomRule, containsDangerousPatterns } from './sanitizer'

import type { SecurityContext, ContentFilterResult } from '@/types/security'

export interface ValidationResult {
  valid: boolean
  sanitizedValue: string
  errors: string[]
  blocked: boolean
  filterResult: ContentFilterResult | null
}

export function validateDebateTopic(topic: string, context?: SecurityContext): ValidationResult {
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

  const sanitized = sanitizeTopic(topic)

  if (sanitized.sanitizedLength < 10) {
    errors.push('Topic must be at least 10 characters')
  }

  if (sanitized.sanitizedLength > 500) {
    errors.push('Topic must be less than 500 characters')
  }

  const filterResult = filterDebateTopic(sanitized.value)

  if (filterResult.shouldBlock) {
    if (context) {
      logContentFilterViolation(context, '/api/debate', filterResult, topic)
    }

    const categories = [...new Set(filterResult.matches.map((m) => m.category))]

    if (categories.includes('prompt_injection')) {
      errors.push('Topic contains disallowed content patterns')
      if (context) {
        logInjectionAttempt(context, '/api/debate', 'prompt_injection', topic)
      }
    } else if (categories.includes('harmful_content')) {
      errors.push('Topic contains inappropriate content')
    } else if (categories.includes('profanity')) {
      errors.push('Topic contains inappropriate language')
    } else {
      errors.push('Topic was flagged by content filter')
    }

    return {
      valid: false,
      sanitizedValue: '',
      errors,
      blocked: true,
      filterResult,
    }
  }

  if (containsDangerousPatterns(sanitized.value)) {
    errors.push('Topic contains disallowed formatting')
    if (context) {
      logInjectionAttempt(context, '/api/debate', 'dangerous_pattern', topic)
    }
    return {
      valid: false,
      sanitizedValue: '',
      errors,
      blocked: true,
      filterResult,
    }
  }

  const finalValue = filterResult.sanitizedContent ?? sanitized.value

  return {
    valid: errors.length === 0,
    sanitizedValue: finalValue,
    errors,
    blocked: false,
    filterResult,
  }
}

export function validateCustomRules(rules: string[], context?: SecurityContext): ValidationResult {
  const errors: string[] = []
  const sanitizedRules: string[] = []
  let blocked = false
  let aggregateFilterResult: ContentFilterResult | null = null

  if (rules.length > 5) {
    errors.push('Maximum 5 custom rules allowed')
    return {
      valid: false,
      sanitizedValue: '',
      errors,
      blocked: false,
      filterResult: null,
    }
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]

    if (!rule || rule.trim().length === 0) {
      continue
    }

    const sanitized = sanitizeCustomRule(rule)

    if (sanitized.sanitizedLength > 200) {
      errors.push(`Rule ${i + 1} must be less than 200 characters`)
      continue
    }

    const filterResult = filterCustomRule(sanitized.value)

    if (filterResult.shouldBlock) {
      blocked = true
      aggregateFilterResult = filterResult

      if (context) {
        logContentFilterViolation(context, '/api/debate', filterResult, rule)
      }

      if (isPromptInjection(rule)) {
        errors.push(`Rule ${i + 1} contains disallowed content`)
        if (context) {
          logInjectionAttempt(context, '/api/debate', 'custom_rule_injection', rule)
        }
      } else {
        errors.push(`Rule ${i + 1} was flagged by content filter`)
      }
      continue
    }

    if (containsDangerousPatterns(sanitized.value)) {
      blocked = true
      errors.push(`Rule ${i + 1} contains disallowed formatting`)
      if (context) {
        logInjectionAttempt(context, '/api/debate', 'dangerous_pattern', rule)
      }
      continue
    }

    sanitizedRules.push(filterResult.sanitizedContent ?? sanitized.value)
  }

  return {
    valid: errors.length === 0 && !blocked,
    sanitizedValue: JSON.stringify(sanitizedRules),
    errors,
    blocked,
    filterResult: aggregateFilterResult,
  }
}

export function validateAndSanitizeDebateConfig(
  config: {
    topic: string
    turns: number
    format?: string
    customRules?: string[]
  },
  context?: SecurityContext
): {
  valid: boolean
  sanitizedConfig: {
    topic: string
    turns: number
    format: string
    customRules: string[]
  } | null
  errors: string[]
} {
  const errors: string[] = []

  const topicResult = validateDebateTopic(config.topic, context)
  if (!topicResult.valid) {
    errors.push(...topicResult.errors)
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
    const rulesResult = validateCustomRules(config.customRules, context)
    if (!rulesResult.valid) {
      errors.push(...rulesResult.errors)
    } else {
      sanitizedRules = JSON.parse(rulesResult.sanitizedValue) as string[]
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      sanitizedConfig: null,
      errors,
    }
  }

  return {
    valid: true,
    sanitizedConfig: {
      topic: topicResult.sanitizedValue,
      turns: config.turns,
      format,
      customRules: sanitizedRules,
    },
    errors: [],
  }
}
