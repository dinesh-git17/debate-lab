// src/lib/prompts/transition-prompt.ts

import { buildModeratorSystemPrompt } from './moderator-system'

import type { CompiledPrompt, ModeratorContext } from '@/types/prompts'
import type { TurnType } from '@/types/turn'

/**
 * Template for turn transitions - punchy, ESPN-style handoffs
 */
export const TRANSITION_PROMPT_TEMPLATE = `Generate a quick, punchy transition between speakers. You're a show host keeping things moving.

## Current State
- Next Speaker: {{nextSpeaker}}
- Next Turn Type: {{nextTurnType}}
- Turn: {{currentTurnNumber}} of {{totalTurns}}

## Style
- ESPN commentator energy
- 15-25 words MAX
- No evaluation of previous turn
- Just hand off to the next speaker

## Transition Templates (vary these — don't repeat the same one):

**For openings:**
- "{{nextSpeaker}}, let's hear your case."
- "{{nextSpeaker}}, the floor is yours."
- "{{nextSpeaker}}, make your opening."

**After an opening (to second opener):**
- "Strong start. {{nextSpeaker}}, your turn to lay it out."
- "Points on the board. {{nextSpeaker}}, let's hear your side."
- "{{nextSpeaker}}, time to make your case."

**For rebuttals:**
- "{{nextSpeaker}}, your response."
- "Time to clash. {{nextSpeaker}}, counter."
- "{{nextSpeaker}}, take it apart."

**For closings:**
- "Final statements. {{nextSpeaker}}, close it out."
- "Last word incoming. {{nextSpeaker}}, bring it home."
- "{{nextSpeaker}}, closing time."

## Rules
- 15-25 words MAXIMUM
- NO summarizing the previous turn
- NO evaluating quality ("Great argument...")
- NO explaining what comes next in detail
- Just energy + handoff

## Format
Write ONE line. That's it. Example:

"Points made. {{nextSpeaker}}, your response."

## Word Limit: 15-25 words
Quick. Clean. Keep it moving.`

/**
 * Get display name for turn type
 */
function getTurnTypeDisplay(turnType: TurnType | undefined): string {
  if (!turnType) return 'turn'

  const displays: Record<string, string> = {
    opening: 'opening statement',
    constructive: 'constructive argument',
    rebuttal: 'rebuttal',
    cross_examination: 'cross-examination',
    closing: 'closing statement',
    moderator_intro: 'introduction',
    moderator_transition: 'transition',
    moderator_intervention: 'intervention',
    moderator_summary: 'summary',
  }
  return displays[turnType] ?? 'turn'
}

/**
 * Compile transition prompt with context
 */
export function compileTransitionPrompt(context: ModeratorContext): CompiledPrompt {
  const systemPrompt = buildModeratorSystemPrompt(context.format)

  const nextSpeakerLabel = context.nextSpeaker === 'for' ? 'FOR' : 'AGAINST'
  const nextTurnType = getTurnTypeDisplay(context.nextTurnType)

  const userPrompt = TRANSITION_PROMPT_TEMPLATE.replace(/\{\{nextSpeaker\}\}/g, nextSpeakerLabel)
    .replace('{{nextTurnType}}', nextTurnType)
    .replace('{{currentTurnNumber}}', String(context.currentTurnNumber))
    .replace('{{totalTurns}}', String(context.totalTurns))

  return {
    systemPrompt,
    userPrompt,
    maxTokens: 75, // Reduced from 150
    temperature: 0.7,
  }
}
