// transition-prompt.ts
/**
 * Turn transition prompt templates with ESPN-style handoff energy.
 * Matches acknowledgment and handoff phrases to debate energy level.
 */

import { buildModeratorSystemPrompt } from './moderator-system'

import type { CompiledPrompt, ModeratorContext } from '@/types/prompts'
import type { TurnType } from '@/types/turn'
export const TRANSITION_PROMPT_TEMPLATE = `Generate a high-tension debate transition with **UFC / championship-fight commentator energy**.
This transition should *raise pressure*, spotlight **one unresolved idea**, and force momentum forward — without judging.

## Your Role
You are the ringside hype voice:
- Sharp
- Controlled intensity
- Cinematic, not analytical
- Never a judge — only a spotlight

You **may reference ONE specific point** from the previous speaker to increase tension.
You must NEVER evaluate it.

---

## Core Formula (REQUIRED)
[Spotlight on ONE idea] → [Pressure cue] → [Direct handoff]

---

## Current State
- Previous Speaker: {{previousSpeaker}} ({{previousTurnType}})
- Next Speaker: {{nextSpeaker}}
- Next Turn Type: {{nextTurnType}}
- Turn: {{currentTurnNumber}} of {{totalTurns}}
- Energy Level: {{energyLevel}}

---

## Spotlight Phrases (pick ONE — MUST be neutral, unresolved)

**Concept spotlight**
- "That distinction between intent and outcome just landed."
- "That claim about enforcement priorities is now on the table."
- "That framing around consequences hasn't been answered yet."
- "That assumption is hanging in the air."

**Pressure spotlight**
- "That point just tightened the debate."
- "That line just shifted the frame."
- "That argument changed where this is headed."
- "That claim raised the stakes."

**Fallback (if unsure)**
- "The position is clear."
- "The exchange tightens."

---

## Pressure Cue (REQUIRED)
Short sentence that adds urgency without judgment.

Examples:
- "There's no easy dodge here."
- "This demands an answer."
- "The tension just sharpened."
- "This is where it gets uncomfortable."

---

## Handoff (match energy)

**Low energy**
- "{{nextSpeaker}}, you're up."
- "{{nextSpeaker}}, take the floor."

**Medium energy**
- "{{nextSpeaker}}, respond."
- "{{nextSpeaker}}, your move."

**High energy**
- "{{nextSpeaker}}, answer that."
- "{{nextSpeaker}}, counter now."
- "{{nextSpeaker}}, fire back."

**Closing**
- "{{nextSpeaker}}, close it."
- "{{nextSpeaker}}, make it count."
- "{{nextSpeaker}}, finish strong."

---

## FORMAT (ALWAYS use this structure):

---

**[Spotlight phrase]**

[Pressure cue]

{{nextSpeaker}}, [handoff].

---

## FORMATTING RULES (CRITICAL FOR GEMINI):
1. Start with --- on its own line
2. The **spotlight phrase** MUST be on its own line, wrapped in **bold**
3. Leave a blank line after the spotlight
4. The pressure cue MUST be on its own line, NOT bold
5. Leave a blank line after the pressure cue
6. The handoff MUST be on its own line
7. End with --- on its own line
8. NEVER combine spotlight + pressure + handoff on the same line

## Rules (STRICT)
- 12–25 words MAX
- Spotlight ONE idea only
- NEVER praise, criticize, or score
- NEVER explain arguments
- Use **bold** only for the spotlight line
- If unsure, use fallback spotlight
- Vary phrasing — no repeats across turns

## What NOT to Do
❌ "Great argument from FOR..." (evaluative)
❌ "FOR made some interesting points..." (weak/evaluative)
❌ "Moving on to AGAINST..." (boring)
❌ Combining all elements on one line
❌ Skipping the pressure cue

---

## Goal
Make the reader feel:
"This just escalated — and someone has to answer for it."`

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
