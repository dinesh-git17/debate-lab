// src/services/topic-sanitizer.ts

import OpenAI from 'openai'

import { logger } from '@/lib/logging'

const TIMEOUT_MS = 5000

export interface SanitizeTopicResult {
  success: boolean
  sanitizedTopic: string
  originalTopic: string
  error?: string
}

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }
    openaiClient = new OpenAI({ apiKey, timeout: TIMEOUT_MS })
  }
  return openaiClient
}

/**
 * Lightly polishes a debate topic while preserving its original tone and personality.
 * Uses GPT-4o-mini for speed and cost efficiency.
 * Falls back to basic capitalization if the API fails.
 */
export async function sanitizeTopic(rawTopic: string): Promise<SanitizeTopicResult> {
  const originalTopic = rawTopic.trim()

  try {
    const client = getOpenAIClient()

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a debate topic editor. LIGHTLY polish user input while PRESERVING its original tone, meaning, and personality.

CRITICAL — PRESERVE:
- Original tone (playful, serious, provocative)
- Relationship words ("your partner", "your friend", "your mom")
- Intentional emphasis and word choices
- The core framing and context
- Humor and personality

DO NOT:
- Make playful topics sound formal/academic
- Remove personality or humor
- Change the debate premise
- Over-formalize casual language

ONLY FIX:
- Grammar errors
- Missing punctuation
- Unclear phrasing (while keeping tone)

OUTPUT:
- Return ONLY the polished topic as a plain sentence
- NO quotes around your response
- Maximum 20 words
- Keep it as close to original as possible
- If it's already good, return it with minimal changes

EXAMPLES:
Input: if your partner steals your hoodie does that make it theirs
Output: If your partner steals your hoodie, does that make it legally theirs?

Input: pineapple on pizza is a war crime
Output: Is pineapple on pizza a culinary war crime?

Input: should you tell your friend their breath stinks
Output: Should you tell your friend their breath stinks?`,
        },
        {
          role: 'user',
          content: `Lightly polish this debate topic (preserve tone and meaning): "${originalTopic}"`,
        },
      ],
      max_tokens: 75,
      temperature: 0.3,
    })

    let sanitizedTopic = response.choices[0]?.message?.content?.trim()

    if (!sanitizedTopic) {
      throw new Error('Empty response from API')
    }

    // Strip any quotes the model might have added
    sanitizedTopic = sanitizedTopic.replace(/^["']|["']$/g, '')

    logger.info('Topic sanitized successfully', {
      original: originalTopic.slice(0, 50),
      sanitized: sanitizedTopic.slice(0, 50),
    })

    return {
      success: true,
      sanitizedTopic,
      originalTopic,
    }
  } catch (error) {
    // Fallback: basic capitalization
    const fallbackTopic = originalTopic.charAt(0).toUpperCase() + originalTopic.slice(1)

    logger.warn('Topic sanitization failed, using fallback', {
      original: originalTopic.slice(0, 50),
      fallback: fallbackTopic.slice(0, 50),
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return {
      success: false,
      sanitizedTopic: fallbackTopic,
      originalTopic,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
