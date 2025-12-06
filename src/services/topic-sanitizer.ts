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
 * Sanitizes a raw debate topic into a well-formed, neutral debate question.
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
          content: `You are a debate topic editor. Transform user input into a clear, neutral, grammatically correct debate question.

Rules:
- Output ONLY the reformulated topic, nothing else
- Maximum 15 words
- Use proper capitalization and punctuation
- Frame as a question when appropriate (use "Should...", "Is...", "Does...", etc.)
- Keep it neutral - don't bias toward either side
- If input is already well-formed, return it with minor polish
- Expand vague inputs into specific debatable propositions`,
        },
        {
          role: 'user',
          content: `Transform this into a debate topic: "${originalTopic}"`,
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    })

    const sanitizedTopic = response.choices[0]?.message?.content?.trim()

    if (!sanitizedTopic) {
      throw new Error('Empty response from API')
    }

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
