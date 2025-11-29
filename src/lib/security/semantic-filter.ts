// src/lib/security/semantic-filter.ts
// Semantic safety layer using embeddings to catch euphemistic harmful content
// This catches content that evades regex patterns and OpenAI moderation

import { logger } from '@/lib/logging'

import type { BlockReason } from './validate-input'

// Dangerous semantic concepts - these represent harmful ideologies and rhetoric
// The embedding model will match semantically similar content
const DANGEROUS_CONCEPTS = [
  // Genocide / Ethnic cleansing euphemisms - statements
  'ethnic cleansing justification',
  'societal cleansing',
  'cultural cleansing',
  'moral cleansing',
  'ideological purification',
  'societal purity',
  'racial hygiene',
  'racial purity',
  'undesirable elements',
  'removing undesirables',
  'eradicate undesirable groups',
  'eliminate corrupting influences',
  'remove corrupting influences',
  'purge society of undesirables',
  'cleanse society',
  'purify the nation',
  'final solution to social problems',

  // Question-format variations (catches "Is X ever justified?" phrasing)
  'is societal cleansing ever justified',
  'is ethnic cleansing ever justified',
  'is cultural cleansing ever justified',
  'is cleansing society justified',
  'when is cleansing justified',
  'justifying societal cleansing',
  'justifying ethnic cleansing',
  'cases where cleansing is acceptable',

  // Ideological corruption euphemisms
  'ideological corruption',
  'corrupting ideologies',
  'ideologically corrupt',
  'purging ideological corruption',
  'cleansing ideological corruption',
  'eliminating ideological threats',
  'removing ideological enemies',

  // Extremist ideology
  'white nationalist ideology is valid',
  'racial supremacy is justified',
  'genocide can be justified',
  'mass murder for social good',
  'extermination of a group',
  'elimination of a race',
  'forced removal of ethnic groups',

  // Political violence
  'political violence is sometimes necessary',
  'revolution through bloodshed',
  'violent overthrow is justified',
  'terrorism can be justified',
  'assassinating political opponents',

  // Authoritarian philosophy
  'dictatorship is better than democracy',
  'totalitarian control is necessary',
  'forced conformity is good',
  'suppressing dissent is justified',

  // Dehumanization
  'certain groups are subhuman',
  'some people deserve to die',
  'inferior races should be eliminated',
  'disabled people are a burden',
  'homeless should be removed',

  // Child safety
  'lowering age of consent is good',
  'children can consent to adults',
  'pedophilia is a valid orientation',
  'should pedophiles be allowed',
  'pedophiles should be accepted',
  'accepting pedophiles in society',
  'normalizing pedophilia',
  'pedophilia should be legal',
  'minor attracted persons are valid',

  // Self-harm promotion
  'suicide is a good option',
  'encouraging self-harm',
  'anorexia is healthy',
  'starving yourself is good',
]

// Reference embeddings cache - computed on first use
let referenceEmbeddings: Map<string, number[]> | null = null
let embeddingsInitialized = false

export interface SemanticFilterResult {
  flagged: boolean
  blockReason?: BlockReason | undefined
  matchedConcepts: string[]
  maxSimilarity: number
  error?: string | undefined
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0
    const bVal = b[i] ?? 0
    dotProduct += aVal * bVal
    normA += aVal * aVal
    normB += bVal * bVal
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

// Get embedding from OpenAI
async function getEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('OpenAI Embeddings API error', new Error(errorText), {
        provider: 'openai',
        endpoint: 'embeddings',
        status: response.status,
      })
      return null
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>
    }

    return data.data[0]?.embedding ?? null
  } catch (error) {
    logger.error('OpenAI Embeddings API request failed', error instanceof Error ? error : null, {
      provider: 'openai',
      endpoint: 'embeddings',
    })
    return null
  }
}

// Get embeddings for multiple texts in a batch
async function getBatchEmbeddings(
  texts: string[],
  apiKey: string
): Promise<Map<string, number[]> | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: 'text-embedding-3-small',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('OpenAI Embeddings API batch error', new Error(errorText), {
        provider: 'openai',
        endpoint: 'embeddings',
        status: response.status,
      })
      return null
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[]; index: number }>
    }

    const embeddings = new Map<string, number[]>()
    for (const item of data.data) {
      const text = texts[item.index]
      if (text) {
        embeddings.set(text, item.embedding)
      }
    }

    return embeddings
  } catch (error) {
    logger.error(
      'OpenAI Embeddings API batch request failed',
      error instanceof Error ? error : null,
      {
        provider: 'openai',
        endpoint: 'embeddings',
      }
    )
    return null
  }
}

// Initialize reference embeddings for dangerous concepts
async function initializeReferenceEmbeddings(apiKey: string): Promise<boolean> {
  if (embeddingsInitialized && referenceEmbeddings) {
    return true
  }

  logger.info('Initializing semantic filter reference embeddings', {
    conceptCount: DANGEROUS_CONCEPTS.length,
  })

  const startTime = Date.now()
  referenceEmbeddings = await getBatchEmbeddings(DANGEROUS_CONCEPTS, apiKey)

  if (!referenceEmbeddings) {
    logger.error('Failed to initialize reference embeddings', null, {})
    return false
  }

  embeddingsInitialized = true
  logger.info('Semantic filter reference embeddings initialized', {
    conceptCount: referenceEmbeddings.size,
    latencyMs: Date.now() - startTime,
  })

  return true
}

// Similarity threshold for flagging content
// 0.70+ = very similar (likely harmful)
// 0.60-0.70 = moderately similar (review)
// Below 0.60 = probably safe
const SIMILARITY_THRESHOLD = 0.68

// Main semantic filter function
export async function semanticFilter(content: string): Promise<SemanticFilterResult> {
  const apiKey = process.env.OPENAI_API_KEY
  const startTime = Date.now()

  if (!apiKey) {
    logger.warn('Semantic filter: No API key configured, skipping', {
      provider: 'openai',
      endpoint: 'embeddings',
    })
    return {
      flagged: false,
      matchedConcepts: [],
      maxSimilarity: 0,
      error: 'API key not configured',
    }
  }

  // Initialize reference embeddings if needed
  const initialized = await initializeReferenceEmbeddings(apiKey)
  if (!initialized || !referenceEmbeddings) {
    return {
      flagged: false,
      matchedConcepts: [],
      maxSimilarity: 0,
      error: 'Failed to initialize reference embeddings',
    }
  }

  // Get embedding for the input content
  const contentEmbedding = await getEmbedding(content, apiKey)
  if (!contentEmbedding) {
    return {
      flagged: false,
      matchedConcepts: [],
      maxSimilarity: 0,
      error: 'Failed to get content embedding',
    }
  }

  // Compare against all dangerous concepts
  const matchedConcepts: Array<{ concept: string; similarity: number }> = []
  let maxSimilarity = 0

  for (const [concept, refEmbedding] of referenceEmbeddings.entries()) {
    const similarity = cosineSimilarity(contentEmbedding, refEmbedding)

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity
    }

    if (similarity >= SIMILARITY_THRESHOLD) {
      matchedConcepts.push({ concept, similarity })
    }
  }

  // Sort by similarity (highest first)
  matchedConcepts.sort((a, b) => b.similarity - a.similarity)

  const flagged = matchedConcepts.length > 0
  const latencyMs = Date.now() - startTime

  // Determine block reason based on matched concepts
  let blockReason: BlockReason | undefined
  const topMatch = matchedConcepts[0]
  if (flagged && topMatch) {
    const topConcept = topMatch.concept.toLowerCase()

    if (
      topConcept.includes('child') ||
      topConcept.includes('consent') ||
      topConcept.includes('pedophil')
    ) {
      blockReason = 'harmful_content'
    } else if (
      topConcept.includes('self-harm') ||
      topConcept.includes('suicide') ||
      topConcept.includes('anorexia')
    ) {
      blockReason = 'harmful_content'
    } else if (
      topConcept.includes('genocide') ||
      topConcept.includes('cleansing') ||
      topConcept.includes('extermination') ||
      topConcept.includes('elimination') ||
      topConcept.includes('purge') ||
      topConcept.includes('purification')
    ) {
      blockReason = 'sensitive_topic'
    } else {
      blockReason = 'sensitive_topic'
    }
  }

  // Log the result
  logger.info('Semantic filter check completed', {
    provider: 'openai',
    endpoint: 'embeddings',
    latencyMs,
    contentLength: content.length,
    flagged,
    maxSimilarity: Math.round(maxSimilarity * 1000) / 1000,
    matchedConceptsCount: matchedConcepts.length,
    topMatches: matchedConcepts.slice(0, 3).map((m) => ({
      concept: m.concept,
      similarity: Math.round(m.similarity * 1000) / 1000,
    })),
    blockReason: blockReason ?? undefined,
    contentPreview: flagged ? content.slice(0, 50) : undefined,
  })

  return {
    flagged,
    blockReason,
    matchedConcepts: matchedConcepts.map((m) => m.concept),
    maxSimilarity,
  }
}

// Check if semantic filter is available
export function isSemanticFilterEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

// Export for testing
export const _testing = {
  DANGEROUS_CONCEPTS,
  SIMILARITY_THRESHOLD,
  cosineSimilarity,
}
