// src/lib/prompts/violation-detection.ts

import { logger } from '@/lib/logging'

import type { InterventionTrigger, ViolationDetectionResult } from '@/types/prompts'

/**
 * System prompt for violation detection
 */
export const VIOLATION_DETECTION_SYSTEM = `You are a debate rule compliance checker. Analyze debater responses for rule violations.

You must identify:
1. Personal attacks (comments about opponent rather than arguments)
2. Off-topic content (arguments not related to the stated topic)
3. New arguments in closing statements
4. Unsupported major claims
5. Disrespectful or unprofessional language
6. Excessive repetition without new substance
7. Strawman arguments (misrepresenting opponent's position)

Respond ONLY with valid JSON. Be conservative: only flag clear violations, not borderline cases.`

/**
 * Build violation check prompt for a turn
 */
export function buildViolationCheckPrompt(
  topic: string,
  turnType: string,
  content: string,
  customRules: string[]
): string {
  const isClosing = turnType === 'closing'

  return `## Debate Topic
"${topic}"

## Turn Type
${turnType}

## Custom Rules for This Debate
${customRules.length > 0 ? customRules.map((r) => `- ${r}`).join('\n') : 'None'}

## Content to Check
${content}

## Your Task
Analyze the above content for rule violations. Consider:
- Is there any personal attack on the opponent (vs their arguments)?
- Does the content stay on topic?
${isClosing ? '- Are there new arguments introduced (violation for closing)?\n' : ''}- Are major claims supported with reasoning?
- Is the language professional and respectful?
- Are any custom rules violated?
- Does the debater misrepresent their opponent's arguments (strawman)?

## Response Format (JSON only)
{
  "hasViolation": boolean,
  "violations": [
    {
      "type": "personal_attack" | "off_topic" | "new_argument_in_closing" | "unsupported_claim" | "disrespectful_language" | "strawman" | "custom_rule",
      "severity": "minor" | "moderate" | "severe",
      "description": "Brief description of the violation",
      "quote": "Relevant quote from the content (if applicable)"
    }
  ]
}

If no violations, respond with: {"hasViolation": false, "violations": []}`
}

/**
 * Parse violation detection response from LLM
 */
export function parseViolationResponse(response: string): InterventionTrigger[] {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0]) as ViolationDetectionResult

    if (!parsed.hasViolation || !parsed.violations) {
      return []
    }

    return parsed.violations.map((v) => ({
      type: normalizeViolationType(v.type),
      confidence: getConfidenceFromSeverity(v.severity),
      description: v.description,
      suggestedAction: getSuggestedAction(v.severity),
    }))
  } catch (error) {
    logger.error(
      'ViolationDetection failed to parse response',
      error instanceof Error ? error : null
    )
    return []
  }
}

/**
 * Normalize violation type to valid enum value
 */
function normalizeViolationType(type: string): InterventionTrigger['type'] {
  const validTypes: InterventionTrigger['type'][] = [
    'personal_attack',
    'off_topic',
    'rule_violation',
    'excessive_length',
    'factual_claim',
    'new_argument_in_closing',
    'unsupported_claim',
    'disrespectful_language',
    'custom_rule',
  ]

  if (validTypes.includes(type as InterventionTrigger['type'])) {
    return type as InterventionTrigger['type']
  }

  if (type === 'strawman') {
    return 'rule_violation'
  }

  return 'rule_violation'
}

/**
 * Get confidence score from severity
 */
function getConfidenceFromSeverity(severity: string): number {
  switch (severity) {
    case 'severe':
      return 0.9
    case 'moderate':
      return 0.7
    case 'minor':
      return 0.5
    default:
      return 0.5
  }
}

/**
 * Get suggested action from severity
 */
function getSuggestedAction(severity: string): InterventionTrigger['suggestedAction'] {
  switch (severity) {
    case 'severe':
      return 'correct'
    case 'moderate':
      return 'warn'
    case 'minor':
      return 'redirect'
    default:
      return 'redirect'
  }
}

/**
 * Check if violations warrant intervention
 */
export function shouldIntervene(triggers: InterventionTrigger[]): boolean {
  if (triggers.length === 0) return false

  const hasHighConfidence = triggers.some((t) => t.confidence >= 0.7)
  const hasSevereAction = triggers.some((t) => t.suggestedAction === 'correct')

  return hasHighConfidence || hasSevereAction
}

/**
 * Get most severe trigger for intervention
 */
export function getMostSevereTrigger(triggers: InterventionTrigger[]): InterventionTrigger | null {
  if (triggers.length === 0) return null

  return triggers.reduce((most, current) => (current.confidence > most.confidence ? current : most))
}
