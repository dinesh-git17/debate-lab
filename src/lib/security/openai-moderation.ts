// openai-moderation.ts
/**
 * OpenAI Moderation API client with custom score thresholds.
 * Provides secondary content filtering with category-specific blocking.
 */

import { logger } from '@/lib/logging'

import type { BlockReason } from './validate-input'

// OpenAI Moderation API response types
interface ModerationCategory {
  sexual: boolean
  hate: boolean
  harassment: boolean
  'self-harm': boolean
  'sexual/minors': boolean
  'hate/threatening': boolean
  'violence/graphic': boolean
  'self-harm/intent': boolean
  'self-harm/instructions': boolean
  'harassment/threatening': boolean
  violence: boolean
}

interface ModerationCategoryScores {
  sexual: number
  hate: number
  harassment: number
  'self-harm': number
  'sexual/minors': number
  'hate/threatening': number
  'violence/graphic': number
  'self-harm/intent': number
  'self-harm/instructions': number
  'harassment/threatening': number
  violence: number
}

interface ModerationResult {
  id: string
  model: string
  results: Array<{
    flagged: boolean
    categories: ModerationCategory
    category_scores: ModerationCategoryScores
  }>
}

export interface OpenAIModerationResult {
  flagged: boolean
  blockReason?: BlockReason | undefined
  categories: string[]
  scores: Record<string, number>
  error?: string | undefined
}

// Map OpenAI categories to our BlockReason types
function mapCategoryToBlockReason(categories: ModerationCategory): BlockReason | undefined {
  // Critical categories that always block
  if (categories['sexual/minors']) {
    return 'harmful_content'
  }
  if (categories['self-harm/instructions'] || categories['self-harm/intent']) {
    return 'harmful_content'
  }
  if (categories['hate/threatening'] || categories['harassment/threatening']) {
    return 'harmful_content'
  }
  if (categories['violence/graphic']) {
    return 'harmful_content'
  }

  // High severity categories
  if (categories.hate) {
    return 'sensitive_topic'
  }
  if (categories.violence) {
    return 'sensitive_topic'
  }
  if (categories['self-harm']) {
    return 'sensitive_topic'
  }
  if (categories.harassment) {
    return 'sensitive_topic'
  }

  // Medium severity - sexual content not appropriate for debate platform
  if (categories.sexual) {
    return 'content_policy'
  }

  return undefined
}

// Threshold for category scores - tuned for debate platform
// Note: "violence" threshold raised to allow hypothetical/humorous debates
// (e.g., "Would you rather fight one horse-sized duck?" should pass)
const SCORE_THRESHOLDS: Partial<Record<keyof ModerationCategoryScores, number>> = {
  'sexual/minors': 0.1, // Very low threshold for child safety
  'self-harm/instructions': 0.2,
  'self-harm/intent': 0.2,
  'hate/threatening': 0.3,
  'harassment/threatening': 0.3,
  'violence/graphic': 0.5, // Graphic violence still blocked
  hate: 0.5,
  violence: 0.75, // Raised: allow hypothetical/humorous "fight" scenarios
  'self-harm': 0.5,
  harassment: 0.6,
  sexual: 0.7,
}

// Check if any score exceeds our custom thresholds
function checkScoreThresholds(
  scores: ModerationCategoryScores,
  categories: ModerationCategory
): { exceeded: boolean; flaggedCategories: string[] } {
  const flagged: string[] = []

  for (const [category, threshold] of Object.entries(SCORE_THRESHOLDS)) {
    const score = scores[category as keyof ModerationCategoryScores]
    if (score >= threshold) {
      flagged.push(category)
    }
  }

  // Also include any categories OpenAI flagged
  for (const [key, value] of Object.entries(categories)) {
    if (value && !flagged.includes(key)) {
      flagged.push(key)
    }
  }

  return {
    exceeded: flagged.length > 0,
    flaggedCategories: flagged,
  }
}

// Humor patterns that should bypass strict filtering
// IMPORTANT: These must be SPECIFIC known-safe topics, NOT generic formats
const HUMOR_PATTERNS = [
  /horse[- ]?sized\s+duck/i,
  /duck[- ]?sized\s+horse/i,
  /is\s+a?\s*hot\s?dog\s+a\s+sandwich/i,
  /is\s+cereal\s+a?\s*soup/i,
  /pineapple\s+(on|belongs?\s+on)\s+pizza/i,
  /is\s+water\s+wet/i,
  /milk\s+(before|first|or)\s+cereal/i,
  /toilet\s+seat\s+(up|down)/i,
  /gif\s+(pronounced|pronunciation)/i,
  /tabs?\s+(vs?|or|versus)\s+spaces?/i,
]

function isHumorousTopic(content: string): boolean {
  return HUMOR_PATTERNS.some((pattern) => pattern.test(content))
}

export async function moderateWithOpenAI(content: string): Promise<OpenAIModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  const startTime = Date.now()

  // Bypass for clearly humorous/absurdist topics
  if (isHumorousTopic(content)) {
    logger.info('OpenAI Moderation: Humorous topic detected, bypassing', {
      provider: 'openai',
      endpoint: 'moderation',
      contentPreview: content.slice(0, 50),
    })
    return {
      flagged: false,
      categories: [],
      scores: {},
    }
  }

  if (!apiKey) {
    logger.warn('OpenAI Moderation API: No API key configured, skipping', {
      provider: 'openai',
      endpoint: 'moderation',
    })
    return {
      flagged: false,
      categories: [],
      scores: {},
      error: 'API key not configured',
    }
  }

  // Log request initiation
  logger.debug('OpenAI Moderation API request initiated', {
    provider: 'openai',
    endpoint: 'moderation',
    model: 'omni-moderation-latest',
    contentLength: content.length,
    contentPreview: content.slice(0, 100),
  })

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: content,
        model: 'omni-moderation-latest',
      }),
    })

    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('OpenAI Moderation API error response', new Error(errorText), {
        provider: 'openai',
        endpoint: 'moderation',
        status: response.status,
        statusText: response.statusText,
        latencyMs,
        contentLength: content.length,
      })
      return {
        flagged: false,
        categories: [],
        scores: {},
        error: `API error: ${response.status}`,
      }
    }

    const data = (await response.json()) as ModerationResult
    const result = data.results[0]

    if (!result) {
      logger.warn('OpenAI Moderation API returned empty results', {
        provider: 'openai',
        endpoint: 'moderation',
        latencyMs,
        responseId: data.id,
      })
      return {
        flagged: false,
        categories: [],
        scores: {},
        error: 'No moderation result returned',
      }
    }

    // Check both OpenAI's flagged status AND our custom thresholds
    const thresholdCheck = checkScoreThresholds(result.category_scores, result.categories)
    const flaggedCategories = thresholdCheck.flaggedCategories
    const isFlagged = result.flagged || thresholdCheck.exceeded

    // Determine block reason from categories
    let blockReason: BlockReason | undefined
    if (isFlagged) {
      blockReason = mapCategoryToBlockReason(result.categories)

      // If OpenAI didn't flag but we did via thresholds, determine reason from scores
      if (!blockReason && thresholdCheck.exceeded) {
        if (flaggedCategories.some((c) => c.includes('minor') || c.includes('child'))) {
          blockReason = 'harmful_content'
        } else if (flaggedCategories.some((c) => c.includes('self-harm'))) {
          blockReason = 'harmful_content'
        } else if (flaggedCategories.some((c) => c.includes('threatening'))) {
          blockReason = 'harmful_content'
        } else if (flaggedCategories.some((c) => c.includes('hate') || c.includes('violence'))) {
          blockReason = 'sensitive_topic'
        } else {
          blockReason = 'content_policy'
        }
      }
    }

    // Get top scores for logging (scores above 0.1)
    const significantScores: Record<string, number> = {}
    for (const [category, score] of Object.entries(result.category_scores)) {
      if (score > 0.1) {
        significantScores[category] = Math.round(score * 1000) / 1000
      }
    }

    // Log moderation result - always log for monitoring
    logger.info('OpenAI Moderation API request completed', {
      provider: 'openai',
      endpoint: 'moderation',
      model: data.model,
      responseId: data.id,
      latencyMs,
      contentLength: content.length,
      flagged: isFlagged,
      flaggedByOpenAI: result.flagged,
      flaggedByThreshold: thresholdCheck.exceeded,
      categories: flaggedCategories.length > 0 ? flaggedCategories : undefined,
      blockReason: blockReason ?? undefined,
      significantScores: Object.keys(significantScores).length > 0 ? significantScores : undefined,
      contentPreview: isFlagged ? content.slice(0, 50) : undefined,
    })

    return {
      flagged: isFlagged,
      blockReason,
      categories: flaggedCategories,
      scores: result.category_scores as unknown as Record<string, number>,
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    logger.error('OpenAI Moderation API request failed', error instanceof Error ? error : null, {
      provider: 'openai',
      endpoint: 'moderation',
      latencyMs,
      contentLength: content.length,
      errorType: error instanceof Error ? error.name : 'Unknown',
    })
    return {
      flagged: false,
      categories: [],
      scores: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Check if OpenAI moderation is available
export function isOpenAIModerationEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}
