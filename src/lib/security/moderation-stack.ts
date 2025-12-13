// moderation-stack.ts
/**
 * 5-layer safety stack orchestrating keyword scanning, semantic classification,
 * embedding similarity, OpenAI moderation, and business rules for content filtering.
 */

import { logger } from '@/lib/logging'

import { moderateWithOpenAI } from './openai-moderation'
import { semanticFilter } from './semantic-filter'

// ============================================
// TYPES
// ============================================

export type ContentCategory =
  | 'safe'
  | 'humor'
  | 'political'
  | 'controversial'
  | 'extremist'
  | 'sexual'
  | 'violent'
  | 'self_harm'
  | 'hate'
  | 'illegal'
  | 'child_safety'

export type SeverityLevel = 'none' | 'low' | 'medium' | 'high' | 'critical'

export type TargetType = 'none' | 'human' | 'group' | 'object' | 'animal' | 'fictional'

export interface ModerationResult {
  allowed: boolean
  category: ContentCategory
  severity: SeverityLevel
  target: TargetType
  riskScore: number
  blockReason?: string
  layer: 'keyword' | 'semantic' | 'openai' | 'business_rules'
  details?: Record<string, unknown>
}

// ============================================
// LAYER 1: KEYWORD SCANNER
// Returns risk score (0-1), does NOT block on its own
// ============================================

const CRITICAL_KEYWORDS = [
  // Child safety - always high risk
  /\b(child|minor|underage)\s*(porn|sex|abuse|exploitation)/gi,
  /\b(csam|pedophil\w*|paedophil\w*)\b/gi,

  // Slurs - always high risk
  /\b(nigger|nigga|faggot|retard|kike|spic|chink)\b/gi,

  // Explicit violence instructions
  /\bhow\s+to\s+(kill|murder|assassinate)\s+(someone|a\s+person|people)\b/gi,
  /\b(bomb|explosive)\s+(making|instructions?|recipe)\b/gi,

  // Self-harm instructions
  /\b(suicide|self[- ]?harm)\s+(methods?|instructions?|how\s+to)\b/gi,

  // Drug manufacturing
  /\bhow\s+to\s+(make|cook|synthesize)\s+(meth|heroin|fentanyl)\b/gi,
]

const HIGH_RISK_KEYWORDS = [
  // Violence-related (but may be contextual)
  /\b(genocide|ethnic\s+cleansing|mass\s+murder)\b/gi,
  /\b(terrorist|terrorism|extremist)\b/gi,

  // Hate-related
  /\b(white\s+supremacy|racial\s+superiority)\b/gi,
  /\b(holocaust\s+denial)\b/gi,

  // Sexual content
  /\b(rape|sexual\s+assault|molestation)\b/gi,
]

const MEDIUM_RISK_KEYWORDS = [
  // May be legitimate debate topics
  /\b(abortion|euthanasia|death\s+penalty)\b/gi,
  /\b(gun\s+control|immigration|border)\b/gi,
  /\b(religion|atheism|god)\b/gi,
]

function calculateKeywordRisk(content: string): {
  riskScore: number
  matchedPatterns: string[]
} {
  const normalizedContent = content.toLowerCase()
  const matchedPatterns: string[] = []
  let riskScore = 0

  // Check critical keywords (0.8-1.0 risk)
  for (const pattern of CRITICAL_KEYWORDS) {
    if (pattern.test(normalizedContent)) {
      riskScore = Math.max(riskScore, 0.9)
      matchedPatterns.push(pattern.source)
    }
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0
  }

  // Check high risk keywords (0.5-0.7 risk)
  for (const pattern of HIGH_RISK_KEYWORDS) {
    if (pattern.test(normalizedContent)) {
      riskScore = Math.max(riskScore, 0.6)
      matchedPatterns.push(pattern.source)
    }
    pattern.lastIndex = 0
  }

  // Check medium risk keywords (0.2-0.4 risk)
  for (const pattern of MEDIUM_RISK_KEYWORDS) {
    if (pattern.test(normalizedContent)) {
      riskScore = Math.max(riskScore, 0.3)
      matchedPatterns.push(pattern.source)
    }
    pattern.lastIndex = 0
  }

  return { riskScore, matchedPatterns }
}

// ============================================
// LAYER 2: SEMANTIC CATEGORY CLASSIFIER
// Uses GPT to understand intent, tone, target
// ============================================

interface SemanticClassification {
  category: ContentCategory
  severity: SeverityLevel
  target: TargetType
  isHumor: boolean
  isFictional: boolean
  reasoning: string
}

async function classifySemanticContent(content: string): Promise<SemanticClassification> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    logger.warn('Semantic classifier: No API key, defaulting to safe')
    return {
      category: 'safe',
      severity: 'none',
      target: 'none',
      isHumor: false,
      isFictional: false,
      reasoning: 'No API key available',
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a content classifier for a debate platform. Analyze the given debate topic and classify it.

Return a JSON object with these fields:
- category: one of "safe", "humor", "political", "controversial", "extremist", "sexual", "violent", "self_harm", "hate", "illegal", "child_safety"
- severity: one of "none", "low", "medium", "high", "critical"
- target: who/what is targeted - "none", "human", "group", "object", "animal", "fictional"
- isHumor: boolean - is this clearly a joke/absurdist topic?
- isFictional: boolean - is this about fictional scenarios?
- reasoning: brief explanation

Classification guidelines:
- "humor": Absurdist debates like "is a hotdog a sandwich", "would you rather fight X-sized Y"
- "political": Standard political topics (elections, policies, etc.) - generally allowed
- "controversial": Sensitive but legitimate debates (abortion, death penalty) - allowed with care
- "extremist": Promotes extremist ideologies - not allowed
- "hate": Targets groups for discrimination - not allowed
- "child_safety": Involves harm to minors - never allowed
- "self_harm": Promotes suicide/self-harm - never allowed

Important: Debates with "fight" or "battle" in hypothetical/humorous contexts (like fighting animals) are HUMOR, not violence.`,
          },
          {
            role: 'user',
            content: `Classify this debate topic: "${content}"`,
          },
        ],
        max_tokens: 200,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      logger.warn('Semantic classifier API error', { status: response.status })
      return {
        category: 'safe',
        severity: 'none',
        target: 'none',
        isHumor: false,
        isFictional: false,
        reasoning: 'API error, defaulting to safe',
      }
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const responseContent = data.choices?.[0]?.message?.content

    if (!responseContent) {
      return {
        category: 'safe',
        severity: 'none',
        target: 'none',
        isHumor: false,
        isFictional: false,
        reasoning: 'Empty response',
      }
    }

    const parsed = JSON.parse(responseContent) as SemanticClassification
    logger.info('Semantic classification result', {
      topic: content.slice(0, 50),
      category: parsed.category,
      severity: parsed.severity,
      isHumor: parsed.isHumor,
    })

    return parsed
  } catch (error) {
    logger.error(
      'Semantic classifier error',
      error instanceof Error ? error : new Error(String(error))
    )
    return {
      category: 'safe',
      severity: 'none',
      target: 'none',
      isHumor: false,
      isFictional: false,
      reasoning: 'Error during classification',
    }
  }
}

// ============================================
// LAYER 4: CUSTOM BUSINESS RULES
// Platform-specific policies
// ============================================

interface BusinessRuleResult {
  allowed: boolean
  reason?: string
}

function applyBusinessRules(
  category: ContentCategory,
  severity: SeverityLevel,
  _target: TargetType,
  isHumor: boolean
): BusinessRuleResult {
  // Humor is always allowed (unless it's actually harmful)
  if (isHumor && category === 'humor') {
    return { allowed: true }
  }

  // ALWAYS BLOCK - no exceptions
  if (category === 'child_safety') {
    return { allowed: false, reason: 'Content involving minors is not allowed' }
  }

  if (category === 'self_harm' && severity !== 'none') {
    return { allowed: false, reason: 'Self-harm content is not allowed' }
  }

  if (category === 'extremist') {
    return { allowed: false, reason: 'Extremist content is not allowed' }
  }

  if (category === 'illegal' && severity === 'critical') {
    return { allowed: false, reason: 'Illegal activity instructions are not allowed' }
  }

  // BLOCK based on severity
  if (category === 'hate' && severity !== 'none' && severity !== 'low') {
    return { allowed: false, reason: 'Hate speech is not allowed' }
  }

  if (category === 'violent' && severity === 'critical') {
    return { allowed: false, reason: 'Graphic violence advocacy is not allowed' }
  }

  if (category === 'sexual' && severity !== 'none') {
    return { allowed: false, reason: 'Sexual content is not appropriate for this platform' }
  }

  // ALLOWED categories
  if (category === 'safe' || category === 'humor') {
    return { allowed: true }
  }

  if (category === 'political' || category === 'controversial') {
    // Political and controversial debates are allowed - that's what debate platforms are for
    return { allowed: true }
  }

  // Default: allow if severity is low or none
  if (severity === 'none' || severity === 'low') {
    return { allowed: true }
  }

  // Medium severity - allow but could be monitored
  if (severity === 'medium') {
    return { allowed: true }
  }

  // High/critical severity without specific category - block
  return { allowed: false, reason: 'Content flagged as potentially harmful' }
}

// ============================================
// MAIN MODERATION FUNCTION
// Runs all 4 layers in order
// ============================================

export async function moderateContent(content: string): Promise<ModerationResult> {
  const startTime = Date.now()

  logger.info('Starting 4-layer moderation', { contentPreview: content.slice(0, 50) })

  // ----------------------------------------
  // LAYER 1: Keyword Scanner
  // ----------------------------------------
  const { riskScore, matchedPatterns } = calculateKeywordRisk(content)

  logger.info('Layer 1 (Keywords) complete', {
    riskScore,
    matchedPatternsCount: matchedPatterns.length,
  })

  // If risk score is very high (0.9+), still check semantics but flag it
  // Keywords alone don't block - they inform the decision

  // ----------------------------------------
  // LAYER 2: Semantic Classifier
  // ----------------------------------------
  const semantic = await classifySemanticContent(content)

  logger.info('Layer 2 (Semantic) complete', {
    category: semantic.category,
    severity: semantic.severity,
    isHumor: semantic.isHumor,
    target: semantic.target,
  })

  // If semantic says it's humor, trust it (even if keywords flagged "fight")
  if (semantic.isHumor && semantic.category === 'humor') {
    logger.info('Content classified as humor, skipping further checks', {
      latencyMs: Date.now() - startTime,
    })
    return {
      allowed: true,
      category: 'humor',
      severity: 'none',
      target: semantic.target,
      riskScore: 0,
      layer: 'semantic',
      details: { reasoning: semantic.reasoning },
    }
  }

  // ----------------------------------------
  // LAYER 3: Embedding Similarity Filter
  // Catches euphemistic harmful content like "purify the nation"
  // Always runs to catch content that evades keyword and GPT checks
  // ----------------------------------------
  const embeddingResult = await semanticFilter(content)

  logger.info('Layer 3 (Embeddings) complete', {
    flagged: embeddingResult.flagged,
    maxSimilarity: embeddingResult.maxSimilarity,
    matchedConceptsCount: embeddingResult.matchedConcepts.length,
    latencyMs: Date.now() - startTime,
  })

  if (embeddingResult.flagged) {
    // Map embedding block reason to our category system
    let category: ContentCategory = 'extremist'
    if (embeddingResult.blockReason === 'harmful_content') {
      category = 'violent' // Could be child_safety, self_harm, etc.
    }

    logger.info('Blocked by embedding similarity filter', {
      category,
      matchedConcepts: embeddingResult.matchedConcepts.slice(0, 3),
      maxSimilarity: embeddingResult.maxSimilarity,
      latencyMs: Date.now() - startTime,
    })

    return {
      allowed: false,
      category,
      severity: 'high',
      target: semantic.target,
      riskScore: Math.max(riskScore, embeddingResult.maxSimilarity),
      blockReason: 'Content matches patterns associated with harmful ideologies',
      layer: 'semantic', // Using 'semantic' as closest match to embedding filter
      details: {
        matchedConcepts: embeddingResult.matchedConcepts,
        similarity: embeddingResult.maxSimilarity,
      },
    }
  }

  // ----------------------------------------
  // LAYER 5: Business Rules (before OpenAI for efficiency)
  // ----------------------------------------
  const businessResult = applyBusinessRules(
    semantic.category,
    semantic.severity,
    semantic.target,
    semantic.isHumor
  )

  if (!businessResult.allowed) {
    logger.info('Blocked by business rules', {
      category: semantic.category,
      reason: businessResult.reason,
      latencyMs: Date.now() - startTime,
    })
    const result: ModerationResult = {
      allowed: false,
      category: semantic.category,
      severity: semantic.severity,
      target: semantic.target,
      riskScore,
      layer: 'business_rules',
    }
    if (businessResult.reason) {
      result.blockReason = businessResult.reason
    }
    return result
  }

  // ----------------------------------------
  // LAYER 4: OpenAI Moderation API (Final Gate)
  // Only run if semantic didn't give clear "safe" + business rules passed
  // ----------------------------------------
  // Skip OpenAI for clearly safe content to save costs
  if (semantic.category === 'safe' && riskScore < 0.3) {
    logger.info('Content is safe, skipping OpenAI moderation', {
      latencyMs: Date.now() - startTime,
    })
    return {
      allowed: true,
      category: semantic.category,
      severity: semantic.severity,
      target: semantic.target,
      riskScore,
      layer: 'semantic',
    }
  }

  const openaiResult = await moderateWithOpenAI(content)

  logger.info('Layer 3 (OpenAI) complete', {
    flagged: openaiResult.flagged,
    categories: openaiResult.categories,
    latencyMs: Date.now() - startTime,
  })

  if (openaiResult.flagged) {
    return {
      allowed: false,
      category: semantic.category,
      severity: 'high',
      target: semantic.target,
      riskScore: Math.max(riskScore, 0.8),
      blockReason: `Flagged by content safety: ${openaiResult.categories.join(', ')}`,
      layer: 'openai',
      details: { openaiCategories: openaiResult.categories },
    }
  }

  // All layers passed
  logger.info('Content approved by all layers', {
    category: semantic.category,
    latencyMs: Date.now() - startTime,
  })

  return {
    allowed: true,
    category: semantic.category,
    severity: semantic.severity,
    target: semantic.target,
    riskScore,
    layer: 'openai',
  }
}

// Export for testing
export const _testing = {
  calculateKeywordRisk,
  classifySemanticContent,
  applyBusinessRules,
}
