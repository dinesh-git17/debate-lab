// src/services/topic-sanitizer.ts
/**
 * Topic polish service using Gemini 2.0-flash-lite for cost-efficient text refinement.
 * Falls back to basic capitalization if the API fails.
 */

import { logger } from '@/lib/logging'

const TIMEOUT_MS = 5000

export interface SanitizeTopicResult {
  success: boolean
  sanitizedTopic: string
  originalTopic: string
  error?: string
}

const POLISH_PROMPT = `You are a debate topic editor. LIGHTLY polish user input while PRESERVING its original tone, meaning, and personality.

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
Output: Should you tell your friend their breath stinks?`

/**
 * Lightly polishes a debate topic while preserving its original tone and personality.
 * Uses Gemini 2.0-flash-lite for speed and cost efficiency.
 * Falls back to basic capitalization if the API fails.
 */
export async function sanitizeTopic(rawTopic: string): Promise<SanitizeTopicResult> {
  const originalTopic = rawTopic.trim()
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    logger.warn('No Google API key, using fallback')
    return {
      success: false,
      sanitizedTopic: originalTopic.charAt(0).toUpperCase() + originalTopic.slice(1),
      originalTopic,
      error: 'GOOGLE_API_KEY not configured',
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${POLISH_PROMPT}\n\nPolish this debate topic (preserve tone and meaning): "${originalTopic}"`,
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 100, temperature: 0.2 },
        }),
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    let sanitizedTopic = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!sanitizedTopic) {
      throw new Error('Empty response from Gemini')
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
