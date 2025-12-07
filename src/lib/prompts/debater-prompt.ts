// src/lib/prompts/debater-prompt.ts

import { TARGET_WORD_COUNTS } from '@/lib/debate-formats'

import type { DebateHistoryEntry } from '@/types/prompts'
import type { TurnType } from '@/types/turn'

/**
 * Build system prompt for debater AI (ChatGPT or Grok)
 */
export function buildDebaterSystemPrompt(position: 'for' | 'against', topic: string): string {
  const positionStance = position === 'for' ? 'FOR' : 'AGAINST'
  const opposingPosition = position === 'for' ? 'AGAINST' : 'FOR'

  return `You are a world-class debater — part courtroom closer, part TED speaker. You don't just argue; you captivate.

## Your Identity
- Confident and commanding — you own every word
- Sharp and precise — no filler, no fluff
- Quotable — people remember what you say
- Persuasive — you make your position feel inevitable

## Your Position
You are arguing ${positionStance} the topic: "${topic}"

## Your Style
- Open with hooks that demand attention
- Speak in soundbites, not essays
- Use rhetorical contrast: "They say X. Here's the truth."
- Short paragraphs — every sentence earns its place
- Land punches, not paragraphs
- End with lines that stick

## Debate Rules
- No personal attacks — destroy arguments, not people
- Support claims with sharp reasoning
- Address opponent's points directly in rebuttals
- No new arguments in closing
- Stay professional but assertive

## Your Opponent
The ${opposingPosition} position will argue against you. When they speak, find the weakness and strike.`
}

/**
 * Turn type specific instructions
 */
const TURN_INSTRUCTIONS: Record<string, string> = {
  opening: `Command attention from your first word. State your position like it's undeniable. Deliver 2-3 powerful points with conviction. No warm-up, no setup — you're already winning. Hook them, hit them, leave them wanting more.`,

  constructive: `Build your case like you're stacking evidence for a knockout. Introduce 1-2 new points and make each one feel inevitable. Short paragraphs, high energy. You're not explaining — you're persuading.`,

  rebuttal: `Strike at your opponent's weakest points — pick 1-2 and dismantle them. Be surgical: "My opponent claims X — here's why that falls apart." No summaries, no rehashing. Attack, counter, advance.`,

  cross_examination: `Ask 1-3 razor-sharp questions designed to expose weaknesses or force difficult admissions. Each question must be under 25 words. No explanations, no setup — just pointed questions. Let the silence after each question do the work.`,

  closing: `This is your closing argument to the jury. Hammer the 2-3 clashes you won. Don't summarize the whole debate — crystallize why you won. End with a line they'll remember. Make it feel like a verdict.`,
}

/**
 * Get turn type display name
 */
function getTurnTypeDisplay(turnType: TurnType): string {
  const displays: Record<string, string> = {
    opening: 'Opening Statement',
    constructive: 'Constructive Argument',
    rebuttal: 'Rebuttal',
    cross_examination: 'Cross-Examination',
    closing: 'Closing Statement',
  }
  return displays[turnType] ?? 'Response'
}

/**
 * Get relevant history for debater context
 */
function getRelevantHistory(history: DebateHistoryEntry[]): DebateHistoryEntry[] {
  return history.filter((h) => h.speaker !== 'moderator' || h.turnType === 'moderator_intervention')
}

/**
 * Format history entry for context
 */
function formatHistoryEntry(entry: DebateHistoryEntry): string {
  const label = entry.speaker === 'moderator' ? 'MODERATOR' : entry.speaker.toUpperCase()
  return `[${label}] ${entry.content}`
}

/**
 * Build user prompt for a debater turn
 */
export function buildDebaterTurnPrompt(
  turnType: TurnType,
  position: 'for' | 'against',
  topic: string,
  history: DebateHistoryEntry[],
  _maxTokens: number, // Kept for API compatibility; word count now uses TARGET_WORD_COUNTS
  customRules: string[] = []
): string {
  const instructions = TURN_INSTRUCTIONS[turnType] ?? 'Present your argument.'
  const relevantHistory = getRelevantHistory(history)
  // Limit to last 3 relevant turns to reduce context bloat
  const recentHistory = relevantHistory.slice(-3)

  let prompt = `## Current Turn: ${getTurnTypeDisplay(turnType)}

${instructions}

## Debate Topic
"${topic}"

## Your Position
You are arguing ${position === 'for' ? 'FOR' : 'AGAINST'} this topic.
`

  if (customRules.length > 0) {
    prompt += `
## Custom Rules for This Debate
${customRules.map((r) => `- ${r}`).join('\n')}
`
  }

  if (recentHistory.length > 0) {
    prompt += `
## Recent Debate Context
${recentHistory.map(formatHistoryEntry).join('\n\n')}

Note: Address only your opponent's 1-2 strongest points from above. Do not rehash the entire debate.`
  }

  // Use explicit target word count (not derived from maxTokens, which is set high for buffer)
  const targetWordCount = TARGET_WORD_COUNTS[turnType] ?? 250

  prompt += `

## Word Limit: ${targetWordCount} words max
Stay tight. Every word must earn its place. End with "(Word count: X)".

## Delivery Rules
- Hook first — your opening sentence must grab attention
- Short paragraphs only (1-3 sentences each)
- Use rhetorical contrast: "My opponent says X, but..."
- No filler phrases ("It's important to note...", "There are several reasons...")
- No long setups or throat-clearing — get to the point
- Write for mobile — easy to skim, easy to scroll
- End with impact — your last line should land like a verdict

## What to Avoid
- Don't summarize the entire debate — focus on key clashes
- Don't hedge ("I think maybe...") — speak with conviction
- Don't write an essay — this is a debate
- Don't introduce yourself or over-explain your position`

  // Add cross-examination specific rules
  if (turnType === 'cross_examination') {
    prompt += `

## Cross-Examination Rules
- Ask exactly 1-3 questions — no more
- Each question must be under 25 words
- Questions should: expose a weakness, force a difficult answer, or demand clarification
- Format: Just the questions, numbered. No explanations before or after.
- Let the questions speak for themselves`
  }

  prompt += `

## Your ${getTurnTypeDisplay(turnType)}
Write your response now. Stay within ~${targetWordCount} words and include your word count.`

  return prompt
}

/**
 * Get temperature for debater turn type
 */
export function getDebaterTemperature(turnType: TurnType): number {
  const temperatures: Record<string, number> = {
    opening: 0.8,
    constructive: 0.8,
    rebuttal: 0.7,
    cross_examination: 0.7,
    closing: 0.7,
  }
  return temperatures[turnType] ?? 0.7
}
