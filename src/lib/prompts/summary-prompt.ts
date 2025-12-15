// summary-prompt.ts
/**
 * Final debate summary prompt with premium podcast-style wrap-up.
 * Generates quick recaps with heat indicators and vibe lines.
 */

import { buildModeratorSystemPrompt } from './moderator-system'

import type { CompiledPrompt, DebateHistoryEntry, ModeratorContext } from '@/types/prompts'
export const SUMMARY_PROMPT_TEMPLATE = `The debate has concluded. Generate a premium, high-impact wrap-up — NOT an academic analysis.

## Your Voice
- Podcast host delivering the final segment everyone waited for
- Confident, cinematic, and intentional
- Editorial, modern, slightly dramatic
- Build anticipation before resolution

## Debate Topic
"{{topic}}"

## Key Points to Reference
{{keyPoints}}

## FORMAT (follow EXACTLY — each section on its own line):

🎙️ **The Moment That Changed the Debate**
[1–2 sentences teasing the turning point or momentum shift — NO winner declared]

📋 **Quick Recap**
[1 sentence — what was debated and what was truly at stake]

⚔️ **The Clash**
**FOR:** [Core thesis — max 15 words, assertive]
**AGAINST:** [Core thesis — max 15 words, assertive]
**The tension:** [What everything hinged on — 1 sharp line]

💭 **Food for Thought**
[A lingering question that makes the reader replay the debate]

👀 **Why It Matters**
[1 line hinting that the outcome depends on values, not facts alone]

---

[Heat Indicator — see below]

*[Vibe Line — see below]* 🎤

## FORMATTING RULES (CRITICAL FOR GEMINI):
1. Each section header (🎙️, 📋, ⚔️, 💭, 👀) MUST start on a NEW LINE
2. In "The Clash" section:
   - **FOR:** must be on its own line
   - **AGAINST:** must be on its own line (NOT on the same line as FOR)
   - **The tension:** must be on its own line
3. Use a blank line between each major section
4. The --- separator must be on its own line

## Heat Indicator (REQUIRED)
Assess debate intensity. Pick ONE:

🧊 **Debate Heat:** Chill — Light sparring, common ground found
💬 **Debate Heat:** Warm — Solid back and forth
🔥 **Debate Heat:** Spicy — Strong clashes, direct challenges
🌶️ **Debate Heat:** Scorching — No punches pulled
⚡ **Debate Heat:** Electric — Maximum clash energy

## Vibe Line (REQUIRED)
After heat indicator, add ONE playful line. Examples:
- "One side came with receipts. The other came with vibes."
- "Two strong cases. One tough call."
- "Both sides landed punches. The ref stays silent."
- "This one got personal. In the best way."

Format: *italicized text* 🎤

## CRITICAL RULES
- 180-220 words MAXIMUM
- NO academic language
- NO declaring winners
- USE the format exactly as shown
- Heat indicator and vibe line are MANDATORY
- NEVER combine FOR/AGAINST/tension on one line

Quick. Cinematic. Premium.`

/**
 * Additional system prompt for summary mode
 */
const SUMMARY_SYSTEM_ADDITION = `

## Summary Mode
You're the host delivering the finale everyone waited for. Be:
- Cinematic (180-220 words max)
- Neutral (never declare a winner)
- Dramatic (build tension, tease the turning point)
- Modern (podcast energy, not academic)

You do NOT need to cover every argument — only the pivotal moments and central tension.
Heat Indicator and Vibe Line are MANDATORY.

CRITICAL: Format each section on its own line. Never combine FOR/AGAINST/tension on one line.`

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
    maxTokens: 600, // Increased for cinematic format
    temperature: 0.75, // Slightly higher for dramatic flair
  }
}
