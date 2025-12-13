// intervention-prompt.ts
/**
 * Moderator intervention prompt templates for rule violations.
 * Provides severity-based guidance and violation type descriptions.
 */

import { buildModeratorSystemPrompt } from './moderator-system'

import type { CompiledPrompt, ModeratorContext, ViolationRecord } from '@/types/prompts'
export const INTERVENTION_PROMPT_TEMPLATE = `You must intervene in the debate due to a rule violation or issue that needs addressing.

## Intervention Context
- Debate Topic: "{{topic}}"
- Violating Speaker: {{violatingSpeaker}}
- Violation Type: {{violationType}}
- Severity: {{severity}}
- Description: {{violationDescription}}

{{previousViolationsSection}}

## Your Intervention Must:
1. Clearly but respectfully identify the issue
2. Reference the specific rule being violated
3. Redirect the debater back to proper conduct
4. NOT take sides on the substantive argument
5. Maintain professional tone

## Severity Guidelines
- Minor: Gentle reminder, allow debate to continue
- Moderate: Clear warning, note that repeated violations have consequences
- Severe: Firm correction, may note impact on debate evaluation

## Response Format
Write an intervention of 40-80 words. Be firm but fair. Do not be condescending.`

/**
 * Violation type descriptions for context
 */
export const VIOLATION_DESCRIPTIONS: Record<string, string> = {
  personal_attack:
    'The debater directed comments at their opponent personally rather than addressing the arguments. This violates the rule against personal attacks.',

  off_topic:
    'The debater strayed significantly from the stated topic, introducing arguments that are not relevant to the motion being debated.',

  new_argument_in_closing:
    'The debater introduced a new argument during their closing statement. Closing statements should summarize and synthesize existing arguments, not introduce new ones.',

  unsupported_claim:
    'The debater made a significant factual claim without providing supporting reasoning or evidence.',

  excessive_length: 'The debater significantly exceeded the expected length for this turn type.',

  disrespectful_language:
    'The debater used language that does not meet the standard of professional discourse expected in this debate.',

  strawman:
    "The debater misrepresented their opponent's argument to make it easier to attack, rather than addressing the actual position.",

  custom_rule: 'The debater violated a custom rule specific to this debate.',
}

/**
 * Get speaker label for display
 */
function getSpeakerLabel(speaker: string): string {
  return speaker === 'for' ? 'FOR' : speaker === 'against' ? 'AGAINST' : 'MODERATOR'
}

/**
 * Build previous violations section
 */
function buildPreviousViolationsSection(violations: ViolationRecord[] | undefined): string {
  if (!violations || violations.length === 0) {
    return `## Previous Violations This Debate
No previous violations recorded.

`
  }

  const violationsList = violations
    .map(
      (v) =>
        `- Turn ${v.turnNumber}: ${getSpeakerLabel(v.speaker)} - ${v.ruleViolated} (${v.severity})`
    )
    .join('\n')

  return `## Previous Violations This Debate
${violationsList}

`
}

/**
 * Compile intervention prompt with context
 */
export function compileInterventionPrompt(
  context: ModeratorContext,
  violation: ViolationRecord
): CompiledPrompt {
  const systemPrompt = buildModeratorSystemPrompt(context.format)

  const previousViolationsSection = buildPreviousViolationsSection(context.violations)

  const userPrompt = INTERVENTION_PROMPT_TEMPLATE.replace('{{topic}}', context.topic)
    .replace('{{violatingSpeaker}}', getSpeakerLabel(violation.speaker))
    .replace('{{violationType}}', violation.ruleViolated)
    .replace('{{severity}}', violation.severity)
    .replace('{{violationDescription}}', violation.description)
    .replace('{{previousViolationsSection}}', previousViolationsSection)

  return {
    systemPrompt,
    userPrompt,
    maxTokens: 120,
    temperature: 0.4,
  }
}

/**
 * Get violation description by type
 */
export function getViolationDescription(type: string): string {
  return VIOLATION_DESCRIPTIONS[type] ?? 'A rule violation was detected.'
}
