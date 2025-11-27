// src/lib/security/content-filter.ts
// Content filtering for profanity, prompt injection, and harmful content detection

import type {
  ContentFilterConfig,
  ContentFilterMatch,
  ContentFilterResult,
  ContentFilterCategory,
  ContentFilterSeverity,
} from '@/types/security'

interface FilterPattern {
  pattern: RegExp
  category: ContentFilterCategory
  severity: ContentFilterSeverity
  description: string
}

const PROMPT_INJECTION_PATTERNS: FilterPattern[] = [
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Instruction override attempt',
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Instruction override attempt',
  },
  {
    pattern:
      /forget\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompts?|rules?|training)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Memory manipulation attempt',
  },
  {
    pattern: /you\s+are\s+now\s+(in\s+)?(a\s+)?(new|different|dan|developer|jailbreak)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Role manipulation attempt',
  },
  {
    pattern: /\bdan\s+mode\b|\bdeveloper\s+mode\b|\bjailbreak\s+mode\b/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Jailbreak attempt',
  },
  {
    pattern: /pretend\s+(you('re|are)\s+)?(not\s+)?(an?\s+)?ai/gi,
    category: 'prompt_injection',
    severity: 'high',
    description: 'Identity manipulation attempt',
  },
  {
    pattern: /act\s+as\s+(if\s+)?(you\s+)?(have\s+)?no\s+(restrictions?|limitations?|rules?)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Restriction bypass attempt',
  },
  {
    pattern: /\[system\]|\[assistant\]|\[user\]|<\|im_start\|>|<\|im_end\|>/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Token injection attempt',
  },
  {
    pattern: /```(system|assistant|user)\b/gi,
    category: 'prompt_injection',
    severity: 'high',
    description: 'Code block injection attempt',
  },
  {
    pattern: /\{\{.*?(system|prompt|instruction).*?\}\}/gi,
    category: 'prompt_injection',
    severity: 'high',
    description: 'Template injection attempt',
  },
]

const HARMFUL_CONTENT_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(make|create|build|construct)\s+(a\s+)?(bomb|explosive|weapon)/gi,
    category: 'harmful_content',
    severity: 'critical',
    description: 'Weapon creation request',
  },
  {
    pattern: /\bhow\s+to\s+(hack|steal|break\s+into)/gi,
    category: 'harmful_content',
    severity: 'high',
    description: 'Illegal activity request',
  },
  {
    pattern: /\b(kill|murder|harm|hurt)\s+(myself|yourself|someone|people)/gi,
    category: 'harmful_content',
    severity: 'critical',
    description: 'Violence-related content',
  },
]

const MANIPULATION_PATTERNS: FilterPattern[] = [
  {
    pattern: /\byou\s+must\s+(always|never)\b/gi,
    category: 'manipulation',
    severity: 'medium',
    description: 'Behavior override attempt',
  },
  {
    pattern: /\boverride\s+(your\s+)?(safety|content|moderation)\s+(filters?|rules?|guidelines?)/gi,
    category: 'manipulation',
    severity: 'critical',
    description: 'Safety override attempt',
  },
  {
    pattern: /\bbypass\s+(your\s+)?(restrictions?|limitations?|filters?)/gi,
    category: 'manipulation',
    severity: 'critical',
    description: 'Filter bypass attempt',
  },
]

const PROFANITY_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(fuck|shit|ass|bitch|damn|crap|bastard|dick|cock|pussy)\b/gi,
    category: 'profanity',
    severity: 'low',
    description: 'Profanity detected',
  },
  {
    pattern: /\b(nigger|nigga|faggot|retard|kike|spic|chink|wetback)\b/gi,
    category: 'profanity',
    severity: 'critical',
    description: 'Slur detected',
  },
]

const DEFAULT_CONFIG: ContentFilterConfig = {
  enableProfanityFilter: true,
  enablePromptInjectionDetection: true,
  enableHarmfulContentDetection: true,
  strictMode: false,
  customBlockPatterns: [],
  customAllowPatterns: [],
}

function getActivePatterns(config: ContentFilterConfig): FilterPattern[] {
  const patterns: FilterPattern[] = []

  if (config.enablePromptInjectionDetection) {
    patterns.push(...PROMPT_INJECTION_PATTERNS)
  }

  if (config.enableHarmfulContentDetection) {
    patterns.push(...HARMFUL_CONTENT_PATTERNS)
    patterns.push(...MANIPULATION_PATTERNS)
  }

  if (config.enableProfanityFilter) {
    patterns.push(...PROFANITY_PATTERNS)
  }

  if (config.customBlockPatterns) {
    for (const patternStr of config.customBlockPatterns) {
      try {
        patterns.push({
          pattern: new RegExp(patternStr, 'gi'),
          category: 'spam',
          severity: 'medium',
          description: 'Custom block pattern',
        })
      } catch {
        // Skip invalid patterns
      }
    }
  }

  return patterns
}

function isAllowed(content: string, config: ContentFilterConfig): boolean {
  if (!config.customAllowPatterns?.length) {
    return false
  }

  for (const patternStr of config.customAllowPatterns) {
    try {
      const pattern = new RegExp(patternStr, 'gi')
      if (pattern.test(content)) {
        return true
      }
    } catch {
      // Skip invalid patterns
    }
  }

  return false
}

function findMatches(content: string, patterns: FilterPattern[]): ContentFilterMatch[] {
  const matches: ContentFilterMatch[] = []

  for (const filterPattern of patterns) {
    const regex = new RegExp(filterPattern.pattern.source, filterPattern.pattern.flags)
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      matches.push({
        category: filterPattern.category,
        severity: filterPattern.severity,
        pattern: filterPattern.description,
        matchedText: match[0],
        position: match.index,
      })
    }
  }

  return matches
}

function determineShouldBlock(matches: ContentFilterMatch[], config: ContentFilterConfig): boolean {
  if (matches.length === 0) {
    return false
  }

  const hasCritical = matches.some((m) => m.severity === 'critical')
  const hasHigh = matches.some((m) => m.severity === 'high')

  if (hasCritical) {
    return true
  }

  if (config.strictMode && hasHigh) {
    return true
  }

  const hasPromptInjection = matches.some((m) => m.category === 'prompt_injection')
  const hasHarmfulContent = matches.some((m) => m.category === 'harmful_content')

  return hasPromptInjection || hasHarmfulContent
}

function determineShouldLog(matches: ContentFilterMatch[]): boolean {
  return matches.some(
    (m) => m.severity === 'critical' || m.severity === 'high' || m.category === 'prompt_injection'
  )
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function filterContent(
  content: string,
  config: Partial<ContentFilterConfig> = {}
): ContentFilterResult {
  const mergedConfig: ContentFilterConfig = { ...DEFAULT_CONFIG, ...config }

  if (isAllowed(content, mergedConfig)) {
    return {
      passed: true,
      matches: [],
      sanitizedContent: content,
      shouldBlock: false,
      shouldLog: false,
    }
  }

  const patterns = getActivePatterns(mergedConfig)
  const matches = findMatches(content, patterns)

  const shouldBlock = determineShouldBlock(matches, mergedConfig)
  const shouldLog = determineShouldLog(matches)

  let sanitizedContent: string | null = null
  if (!shouldBlock && matches.length > 0) {
    sanitizedContent = content
    for (const match of matches) {
      if (match.category === 'profanity' && match.severity === 'low') {
        sanitizedContent = sanitizedContent.replace(
          new RegExp(escapeRegex(match.matchedText), 'gi'),
          '*'.repeat(match.matchedText.length)
        )
      }
    }
  }

  return {
    passed: !shouldBlock,
    matches,
    sanitizedContent: shouldBlock ? null : (sanitizedContent ?? content),
    shouldBlock,
    shouldLog,
  }
}

export function filterDebateTopic(topic: string): ContentFilterResult {
  return filterContent(topic, {
    enableProfanityFilter: true,
    enablePromptInjectionDetection: true,
    enableHarmfulContentDetection: true,
    strictMode: true,
  })
}

export function filterCustomRule(rule: string): ContentFilterResult {
  return filterContent(rule, {
    enableProfanityFilter: false,
    enablePromptInjectionDetection: true,
    enableHarmfulContentDetection: true,
    strictMode: true,
  })
}

export function isPromptInjection(content: string): boolean {
  const result = filterContent(content, {
    enableProfanityFilter: false,
    enablePromptInjectionDetection: true,
    enableHarmfulContentDetection: false,
    strictMode: true,
  })

  return result.matches.some((m) => m.category === 'prompt_injection')
}

export function getFilterStats(results: ContentFilterResult[]): {
  total: number
  blocked: number
  flagged: number
  byCategory: Record<ContentFilterCategory, number>
  bySeverity: Record<ContentFilterSeverity, number>
} {
  const byCategory: Record<ContentFilterCategory, number> = {
    profanity: 0,
    prompt_injection: 0,
    harmful_content: 0,
    manipulation: 0,
    pii: 0,
    spam: 0,
  }

  const bySeverity: Record<ContentFilterSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }

  let blocked = 0
  let flagged = 0

  for (const result of results) {
    if (result.shouldBlock) {
      blocked++
    }
    if (result.shouldLog) {
      flagged++
    }

    for (const match of result.matches) {
      byCategory[match.category]++
      bySeverity[match.severity]++
    }
  }

  return {
    total: results.length,
    blocked,
    flagged,
    byCategory,
    bySeverity,
  }
}
