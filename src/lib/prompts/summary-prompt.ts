// src/lib/prompts/summary-prompt.ts

import { buildModeratorSystemPrompt } from './moderator-system'

import type { CompiledPrompt, DebateHistoryEntry, ModeratorContext } from '@/types/prompts'

/**
 * Template for final debate summary - premium podcast-style wrap-up
 */
export const SUMMARY_PROMPT_TEMPLATE = `The debate has concluded. Generate a quick, premium recap — NOT an academic analysis.

## Your Voice
- Podcast host wrapping up an episode
- Quick, insightful, leaves them thinking
- Modern editorial tone — NYT briefing, not dissertation
- Warm-neutral, never robotic

## Debate Topic
"{{topic}}"

## Key Points to Reference
{{keyPoints}}

## FORMAT (follow exactly):

📋 **Quick Recap**
[1 sentence — what was debated and why it matters]

⚔️ **The Clash**
• **FOR:** [Their core argument in 1 line — max 15 words]
• **AGAINST:** [Their core argument in 1 line — max 15 words]
• **The tension:** [What this debate really came down to — 1 line]

💭 **Food for Thought**
[1 engaging closing line — a question or reflection that lingers]

## CRITICAL RULES
- 120-150 words MAXIMUM — this is a recap, not a transcript
- NO academic language ("The debate explored...", "Arguments were presented...")
- NO declaring winners or saying one side was stronger
- NO restating every argument — themes only
- NO long paragraphs — max 2 lines each
- NO meta-language ("Both sides argued...", "The FOR position stated...")
- USE the format above exactly — inline bold labels, not ### headers
- END with something engaging — a question or thought-provoking line

## Banned Phrases
- "The debate examined..."
- "Both sides presented arguments..."
- "It remains to be seen..."
- "In conclusion..."
- "The audience is invited to reflect..."
- "Arguments were made regarding..."

## Good Examples
✅ "FOR argued boundaries require disconnection. AGAINST pushed back: real boundaries don't need absence."
✅ "Where do you stand?"
✅ "Connection vs. protection — that's what this came down to."

## Bad Examples (DON'T DO THIS)
❌ "The FOR side presented multiple arguments regarding the benefits of disconnection..."
❌ "Both debaters made compelling points about the nature of relationships..."
❌ "The audience is encouraged to consider both perspectives..."

## Word Limit: 120-150 words MAX
Quick. Clean. Premium. Leave them thinking, not reading.`

/**
 * Additional system prompt for summary mode
 */
const SUMMARY_SYSTEM_ADDITION = `

## Summary Mode
You're the host wrapping up a debate show. Be:
- Brief (120-150 words max)
- Neutral (never declare a winner)
- Modern (podcast energy, not academic)
- Engaging (end with a question or thought)

You do NOT need to cover every argument — only the core themes and central tension.`

/**
 * Extract key points from debate history (not full transcript)
 * Only includes the thesis/opening line from each major turn
 */
function buildKeyPoints(history: DebateHistoryEntry[]): string {
  const forTurns = history.filter((h) => h.speaker === 'for')
  const againstTurns = history.filter((h) => h.speaker === 'against')

  // Get first sentence from opening and closing for each side
  const extractFirstSentence = (content: string): string => {
    const match = content.match(/[^.!?]+[.!?]+/)
    return match ? match[0].trim() : content.slice(0, 100) + '...'
  }

  const forOpening = forTurns.find((t) => t.turnType === 'opening')
  const forClosing = forTurns.find((t) => t.turnType === 'closing')
  const againstOpening = againstTurns.find((t) => t.turnType === 'opening')
  const againstClosing = againstTurns.find((t) => t.turnType === 'closing')

  let keyPoints = '**FOR Position:**\n'
  if (forOpening) keyPoints += `- Opening: ${extractFirstSentence(forOpening.content)}\n`
  if (forClosing) keyPoints += `- Closing: ${extractFirstSentence(forClosing.content)}\n`

  keyPoints += '\n**AGAINST Position:**\n'
  if (againstOpening) keyPoints += `- Opening: ${extractFirstSentence(againstOpening.content)}\n`
  if (againstClosing) keyPoints += `- Closing: ${extractFirstSentence(againstClosing.content)}\n`

  return keyPoints
}

/**
 * Compile summary prompt with key points only (not full transcript)
 */
export function compileSummaryPrompt(context: ModeratorContext): CompiledPrompt {
  const baseSystemPrompt = buildModeratorSystemPrompt(context.format)
  const systemPrompt = baseSystemPrompt + SUMMARY_SYSTEM_ADDITION

  // Only pass key points, not full transcript (reduces verbosity)
  const keyPoints = buildKeyPoints(context.debateHistory)

  const userPrompt = SUMMARY_PROMPT_TEMPLATE.replace('{{topic}}', context.topic).replace(
    '{{keyPoints}}',
    keyPoints
  )

  return {
    systemPrompt,
    userPrompt,
    maxTokens: 400, // Reduced from 1200
    temperature: 0.6,
  }
}
