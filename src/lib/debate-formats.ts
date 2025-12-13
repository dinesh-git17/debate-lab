// debate-formats.ts
/**
 * Debate format definitions and turn sequence generation.
 * Configures token limits, timing, and turn structure for Standard, Oxford, and Lincoln-Douglas formats.
 */

import type { TurnConfig, TurnType, TurnSpeaker } from '@/types/turn'

// Output token limits - set high to prevent mid-sentence cutoffs (actual targets in prompts)
export const TOKEN_LIMITS: Record<TurnType, { min: number; max: number }> = {
  opening: { min: 150, max: 600 },
  constructive: { min: 125, max: 500 },
  rebuttal: { min: 75, max: 300 },
  cross_examination: { min: 40, max: 150 },
  closing: { min: 90, max: 350 },
  moderator_intro: { min: 40, max: 200 },
  moderator_transition: { min: 20, max: 100 },
  moderator_intervention: { min: 50, max: 200 },
  moderator_summary: { min: 75, max: 400 },
}

export const TARGET_WORD_COUNTS: Record<TurnType, number> = {
  opening: 300,
  constructive: 250,
  rebuttal: 150,
  cross_examination: 75,
  closing: 175,
  moderator_intro: 80,
  moderator_transition: 30,
  moderator_intervention: 100,
  moderator_summary: 150,
}

export const TIMEOUT_LIMITS: Record<TurnType, number> = {
  opening: 60,
  constructive: 60,
  rebuttal: 60,
  cross_examination: 45,
  closing: 60,
  moderator_intro: 30,
  moderator_transition: 15,
  moderator_intervention: 30,
  moderator_summary: 90,
}

const TURN_LABELS: Record<TurnType, string> = {
  opening: 'Opening Statement',
  constructive: 'Constructive Argument',
  rebuttal: 'Rebuttal',
  cross_examination: 'Cross-Examination',
  closing: 'Closing Statement',
  moderator_intro: 'Moderator Introduction',
  moderator_transition: 'Turn Transition',
  moderator_intervention: 'Moderator Intervention',
  moderator_summary: 'Debate Summary',
}

const TURN_DESCRIPTIONS: Record<TurnType, string> = {
  opening: 'Present your initial position and main arguments',
  constructive: 'Develop and expand your arguments with evidence',
  rebuttal: "Address and counter your opponent's arguments",
  cross_examination: 'Direct questions to your opponent',
  closing: 'Summarize your case and make final appeal',
  moderator_intro: 'Welcome and set the stage for debate',
  moderator_transition: 'Announce the next speaker',
  moderator_intervention: 'Address rule violations or redirect',
  moderator_summary: 'Neutral summary of the debate',
}

function createTurn(
  order: number,
  type: TurnType,
  speaker: TurnSpeaker,
  overrides?: Partial<TurnConfig>
): TurnConfig {
  const limits = TOKEN_LIMITS[type]
  const timeout = TIMEOUT_LIMITS[type]

  return {
    id: `turn_${order}`,
    type,
    speaker,
    label: `${TURN_LABELS[type]}${speaker !== 'moderator' ? ` (${speaker.toUpperCase()})` : ''}`,
    description: TURN_DESCRIPTIONS[type],
    maxTokens: limits.max,
    minTokens: limits.min,
    timeoutSeconds: timeout,
    allowsNewArguments: type === 'opening' || type === 'constructive',
    requiresRebuttal: type === 'rebuttal',
    order,
    ...overrides,
  }
}

export function getStandardSequence(turnCount: number): TurnConfig[] {
  const sequence: TurnConfig[] = []
  let order = 0

  sequence.push(createTurn(order++, 'moderator_intro', 'moderator'))

  sequence.push(createTurn(order++, 'opening', 'for'))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'opening', 'against'))

  if (turnCount >= 8) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'constructive', 'for'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'constructive', 'against'))
  }

  if (turnCount >= 6) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'for'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'against'))
  }

  if (turnCount >= 10) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'against'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'for'))
  }

  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'against'))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'for'))

  sequence.push(createTurn(order++, 'moderator_summary', 'moderator'))

  return sequence
}

export function getOxfordSequence(turnCount: number): TurnConfig[] {
  const sequence: TurnConfig[] = []
  let order = 0

  sequence.push(createTurn(order++, 'moderator_intro', 'moderator'))

  sequence.push(createTurn(order++, 'opening', 'for'))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'opening', 'against'))

  if (turnCount >= 4) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'cross_examination', 'against'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'cross_examination', 'for'))
  }

  if (turnCount >= 6) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'for'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'against'))
  }

  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'against'))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'for'))

  sequence.push(createTurn(order++, 'moderator_summary', 'moderator'))

  return sequence
}

export function getLincolnDouglasSequence(turnCount: number): TurnConfig[] {
  const sequence: TurnConfig[] = []
  let order = 0

  sequence.push(createTurn(order++, 'moderator_intro', 'moderator'))

  sequence.push(createTurn(order++, 'constructive', 'for', { maxTokens: 700 }))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))

  if (turnCount >= 6) {
    sequence.push(createTurn(order++, 'cross_examination', 'against'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  }

  sequence.push(createTurn(order++, 'constructive', 'against', { maxTokens: 700 }))

  if (turnCount >= 6) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'cross_examination', 'for'))
  }

  if (turnCount >= 8) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'for'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'against'))
  }

  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'against'))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'for'))

  sequence.push(createTurn(order++, 'moderator_summary', 'moderator'))

  return sequence
}

export function getTurnSequence(
  format: 'standard' | 'oxford' | 'lincoln-douglas',
  turnCount: number
): TurnConfig[] {
  switch (format) {
    case 'oxford':
      return getOxfordSequence(turnCount)
    case 'lincoln-douglas':
      return getLincolnDouglasSequence(turnCount)
    case 'standard':
    default:
      return getStandardSequence(turnCount)
  }
}

export function getDebaterTurns(sequence: TurnConfig[]): TurnConfig[] {
  return sequence.filter((t) => t.speaker !== 'moderator')
}

export function countDebaterTurns(sequence: TurnConfig[]): number {
  return getDebaterTurns(sequence).length
}

export function getTurnsForSpeaker(sequence: TurnConfig[], speaker: TurnSpeaker): TurnConfig[] {
  return sequence.filter((t) => t.speaker === speaker)
}

export function getTotalMaxTokens(sequence: TurnConfig[]): number {
  return sequence.reduce((sum, turn) => sum + turn.maxTokens, 0)
}

export function getEstimatedDuration(sequence: TurnConfig[]): number {
  return sequence.reduce((sum, turn) => sum + turn.timeoutSeconds, 0)
}
