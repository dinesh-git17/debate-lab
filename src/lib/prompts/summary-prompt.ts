// summary-prompt.ts
/**
 * Final debate summary prompt with premium podcast-style wrap-up.
 * Generates quick recaps with heat indicators and vibe lines.
 */

import { buildModeratorSystemPrompt } from './moderator-system'

import type { CompiledPrompt, DebateHistoryEntry, ModeratorContext } from '@/types/prompts'
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

---

[Heat Indicator — see below]

*[Vibe Line — see below]* 🎤

## Heat Indicator (REQUIRED)
Assess how intense the debate was and add ONE of these:

🧊 **Debate Heat:** Chill — Light sparring, common ground found
💬 **Debate Heat:** Warm — Solid back and forth
🔥 **Debate Heat:** Spicy — Strong clashes, direct challenges
🌶️ **Debate Heat:** Scorching — No punches pulled
⚡ **Debate Heat:** Electric — Maximum clash energy

**How to assess:**
- Did they directly challenge each other? (Higher heat)
- Were there concessions? (Lower heat)
- Did it get personal/emotional? (Higher heat)
- Was it mostly theoretical? (Lower heat)

## Vibe Line (REQUIRED)
After the heat indicator, add ONE playful line about the debate dynamics.

**Options (pick what fits):**

When one side seemed more evidence-based:
- "One side came with receipts. The other came with vibes."
- "One brought data. One brought energy."

When both were strong:
- "Two strong cases. One tough call."
- "Both sides landed punches. The ref stays silent."
- "A split decision waiting to happen."

When it was fun/playful:
- "Less courtroom, more comedy roast."
- "They came for the debate, stayed for the drama."

When it got intense:
- "This one got personal. In the best way."
- "The clash was real."

**Rules:**
- NEVER declare a winner
- Keep it playful, not judgmental
- Format: *italicized* with 🎤 at end

## CRITICAL RULES
- 150-180 words MAXIMUM (slightly more to fit new sections)
- NO academic language
- NO declaring winners
- USE the format exactly
- Heat indicator and vibe line are MANDATORY

## Word Limit: 150-180 words MAX
Quick. Clean. Premium. Entertaining.`

/**
 * Additional system prompt for summary mode
 */
const SUMMARY_SYSTEM_ADDITION = `

## Summary Mode
You're the host wrapping up a debate show. Be:
- Brief (150-180 words max)
- Neutral (never declare a winner)
- Modern (podcast energy, not academic)
- Engaging (end with heat indicator + vibe line)

You do NOT need to cover every argument — only the core themes and central tension.
Always include the Heat Indicator and Vibe Line — these are MANDATORY.`

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
    maxTokens: 500, // Increased slightly for heat + vibe
    temperature: 0.7, // Slightly higher for vibe creativity
  }
}
