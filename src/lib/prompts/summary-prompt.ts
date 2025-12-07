// src/lib/prompts/summary-prompt.ts

import { buildModeratorSystemPrompt, getFormatDisplayName } from './moderator-system'

import type { CompiledPrompt, DebateHistoryEntry, ModeratorContext } from '@/types/prompts'
import type { TurnType } from '@/types/turn'

/**
 * Template for final debate summary
 */
export const SUMMARY_PROMPT_TEMPLATE = `The debate has concluded. Generate a neutral, comprehensive summary that helps the audience understand both positions without declaring a winner.

## Debate Information
- Topic: "{{topic}}"
- Format: {{format}}
- Total Turns Completed: {{turnsCompleted}}

## Complete Debate Transcript
{{debateTranscript}}

{{violationsSection}}

## Your Summary Must Include:

### 1. Topic Recap (1-2 sentences)
Restate what was being debated.

### 2. FOR Position Summary (2-3 sentences)
- Main arguments presented
- Key evidence or reasoning offered
- How they responded to challenges

### 3. AGAINST Position Summary (2-3 sentences)
- Main arguments presented
- Key evidence or reasoning offered
- How they responded to challenges

### 4. Key Points of Clash (2-3 sentences)
Where did the debaters most directly engage with each other's arguments?

### 5. Closing Note (1-2 sentences)
Thank participants, invite audience reflection. Do NOT declare a winner or state which side was more convincing.

## Critical Rules for Summary
- NEVER declare a winner or loser
- NEVER say one side was "more convincing" or "stronger"
- NEVER express your opinion on the topic
- Give EQUAL word count and attention to both sides
- Use neutral language: "argued that" not "correctly pointed out"
- If one side had violations, mention factually without editorializing

## Response Format
Write a summary of 250-350 words. Use the section headers provided.`

/**
 * Additional system prompt for summary mode
 */
const SUMMARY_SYSTEM_ADDITION = `

## Summary Mode Instructions
You are now in summary mode. Your ONLY job is to provide a balanced, neutral recap. Any hint of favoritism will undermine the entire debate's credibility. Treat this as a journalistic summary, not an evaluation.`

/**
 * Get turn type label for transcript
 */
function getTurnTypeLabel(turnType: TurnType): string {
  const labels: Record<string, string> = {
    opening: 'Opening Statement',
    constructive: 'Constructive Argument',
    rebuttal: 'Rebuttal',
    cross_examination: 'Cross-Examination',
    closing: 'Closing Statement',
    moderator_intervention: 'Moderator Intervention',
  }
  return labels[turnType] ?? 'Response'
}

/**
 * Get speaker label for transcript
 */
function getSpeakerLabel(speaker: string): string {
  return speaker === 'for' ? 'FOR' : speaker === 'against' ? 'AGAINST' : 'MODERATOR'
}

/**
 * Build debate transcript from history
 */
function buildDebateTranscript(history: DebateHistoryEntry[]): string {
  return history
    .filter((entry) => entry.speaker !== 'moderator' || entry.turnType === 'moderator_intervention')
    .map((entry) => {
      const label =
        entry.speaker === 'moderator'
          ? '[MODERATOR INTERVENTION]'
          : `[${getSpeakerLabel(entry.speaker)}] ${getTurnTypeLabel(entry.turnType)}`
      return `${label}\n${entry.content}`
    })
    .join('\n\n---\n\n')
}

/**
 * Build violations section for summary
 */
function buildViolationsSection(context: ModeratorContext): string {
  if (!context.violations || context.violations.length === 0) {
    return ''
  }

  const violationsList = context.violations
    .map((v) => `- Turn ${v.turnNumber}: ${getSpeakerLabel(v.speaker)} - ${v.ruleViolated}`)
    .join('\n')

  return `## Rule Violations During Debate
${violationsList}

`
}

/**
 * Compile summary prompt with full debate context
 */
export function compileSummaryPrompt(context: ModeratorContext): CompiledPrompt {
  const baseSystemPrompt = buildModeratorSystemPrompt(context.format)
  const systemPrompt = baseSystemPrompt + SUMMARY_SYSTEM_ADDITION

  const debaterTurnsCompleted = context.debateHistory.filter(
    (h) => h.speaker !== 'moderator'
  ).length

  const debateTranscript = buildDebateTranscript(context.debateHistory)
  const violationsSection = buildViolationsSection(context)

  const userPrompt = SUMMARY_PROMPT_TEMPLATE.replace('{{topic}}', context.topic)
    .replace('{{format}}', getFormatDisplayName(context.format))
    .replace('{{turnsCompleted}}', String(debaterTurnsCompleted))
    .replace('{{debateTranscript}}', debateTranscript)
    .replace('{{violationsSection}}', violationsSection)

  return {
    systemPrompt,
    userPrompt,
    maxTokens: 1200, // Increased from 500 - summary needs room for all sections
    temperature: 0.5,
  }
}
