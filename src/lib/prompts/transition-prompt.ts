// src/lib/prompts/transition-prompt.ts

import { buildModeratorSystemPrompt } from './moderator-system'

import type { CompiledPrompt, ModeratorContext } from '@/types/prompts'
import type { TurnType } from '@/types/turn'

/**
 * Template for turn transitions - punchy, ESPN-style handoffs
 */
export const TRANSITION_PROMPT_TEMPLATE = `Generate a punchy, formatted transition with sports-announcer energy.

## Formula
[Neutral acknowledgment] + [Punchy handoff]

## Current State
- Previous Speaker: {{previousSpeaker}} ({{previousTurnType}})
- Next Speaker: {{nextSpeaker}}
- Next Turn Type: {{nextTurnType}}
- Turn: {{currentTurnNumber}} of {{totalTurns}}
- Energy Level: {{energyLevel}}

## Acknowledgment Phrases (pick ONE — must be NEUTRAL, no evaluation):

**For bold/declarative turns:**
- "Bold claims on the table."
- "That was direct."
- "Points stacked."
- "Clear stance."

**For analytical/scrutiny turns:**
- "Sharp analysis."
- "The logic is laid out."
- "Framework challenged."
- "Assumptions questioned."

**For clash/rebuttal turns:**
- "Shots fired."
- "Direct hit."
- "The counter lands."
- "Clash engaged."

**For any turn (safe defaults):**
- "Points made."
- "Case presented."
- "Arguments delivered."

## Handoff Phrases (match to energy level):

**Low energy (early openings):**
- "{{nextSpeaker}}, your turn."
- "{{nextSpeaker}}, the floor is yours."

**Medium energy (mid-debate):**
- "{{nextSpeaker}}, respond."
- "{{nextSpeaker}}, your move."
- "{{nextSpeaker}}, counter."

**High energy (rebuttals):**
- "{{nextSpeaker}}, fire back."
- "{{nextSpeaker}}, your response."
- "{{nextSpeaker}}, take it apart."

**Closing energy (final statements):**
- "{{nextSpeaker}}, close it out."
- "{{nextSpeaker}}, make it count."
- "{{nextSpeaker}}, bring it home."

## FORMAT (use markdown for premium feel):

**[Acknowledgment phrase]** [Handoff phrase]

OR for more energy:

---

**[Acknowledgment phrase]**

{{nextSpeaker}}, [handoff phrase].

## Examples

**Simple (low-medium energy):**
**Points made.** AGAINST, your response.

**With divider (high energy):**
---

**Shots fired.**

FOR, fire back.

**Closing energy:**
---

**The clash winds down.**

AGAINST, close it out. Make it count.

## Rules
- 15-30 words MAX
- Acknowledgment must be NEUTRAL (no "great", "weak", "strong")
- Use **bold** for the acknowledgment phrase
- Optionally use --- divider for high-energy moments
- Match energy to the moment
- Vary your choices — don't repeat

## What NOT to Do
❌ "Great argument from FOR..." (evaluative)
❌ "FOR made some interesting points..." (weak/evaluative)
❌ "Moving on to AGAINST..." (boring)

## Word Limit: 15-30 words
Punchy. Formatted. Premium.`

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
 * Determine energy level based on turn context
 */
function getEnergyLevel(context: ModeratorContext): string {
  const turnNum = context.currentTurnNumber
  const totalTurns = context.totalTurns
  const nextType = context.nextTurnType

  // Closing statements get closing energy
  if (nextType === 'closing') {
    return 'closing'
  }

  // Rebuttals get high energy
  if (nextType === 'rebuttal') {
    return 'high'
  }

  // Early turns (first 25%) get low energy
  if (turnNum <= totalTurns * 0.25) {
    return 'low'
  }

  // Mid-debate gets medium energy
  return 'medium'
}

/**
 * Compile transition prompt with context
 */
export function compileTransitionPrompt(context: ModeratorContext): CompiledPrompt {
  const systemPrompt = buildModeratorSystemPrompt(context.format)

  const previousSpeakerLabel = context.previousTurnSpeaker === 'for' ? 'FOR' : 'AGAINST'
  const nextSpeakerLabel = context.nextSpeaker === 'for' ? 'FOR' : 'AGAINST'
  const previousTurnType = getTurnTypeDisplay(context.previousTurnType)
  const nextTurnType = getTurnTypeDisplay(context.nextTurnType)
  const energyLevel = getEnergyLevel(context)

  const userPrompt = TRANSITION_PROMPT_TEMPLATE.replace(
    /\{\{previousSpeaker\}\}/g,
    previousSpeakerLabel
  )
    .replace(/\{\{previousTurnType\}\}/g, previousTurnType)
    .replace(/\{\{nextSpeaker\}\}/g, nextSpeakerLabel)
    .replace(/\{\{nextTurnType\}\}/g, nextTurnType)
    .replace('{{currentTurnNumber}}', String(context.currentTurnNumber))
    .replace('{{totalTurns}}', String(context.totalTurns))
    .replace('{{energyLevel}}', energyLevel)

  return {
    systemPrompt,
    userPrompt,
    maxTokens: 100, // Slightly increased for formatting
    temperature: 0.8, // Higher for variety
  }
}
