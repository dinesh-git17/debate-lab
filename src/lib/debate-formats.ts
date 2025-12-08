// src/lib/debate-formats.ts

import type { TurnConfig, TurnType, TurnSpeaker } from '@/types/turn'

/**
 * Base token limits by turn type
 * Note: These are OUTPUT token limits sent to the API. Set HIGH to prevent mid-sentence cutoffs.
 * The actual "target" word count is communicated via the prompt (see debater-prompt.ts).
 * This gives buffer room for LLMs that don't follow word limits precisely.
 * Rough conversion: 1 token ≈ 0.75 words
 */
export const TOKEN_LIMITS: Record<TurnType, { min: number; max: number }> = {
  opening: { min: 150, max: 600 },
  constructive: { min: 125, max: 500 },
  rebuttal: { min: 75, max: 300 },
  cross_examination: { min: 40, max: 150 },
  closing: { min: 90, max: 350 },
  moderator_intro: { min: 40, max: 200 },
  moderator_transition: { min: 15, max: 75 }, // Reduced for punchy handoffs
  moderator_intervention: { min: 50, max: 200 },
  moderator_summary: { min: 75, max: 400 }, // Reduced for premium recap
}

/**
 * Target word counts for debater prompts.
 * These guide the LLM to structure properly; actual API token limits are higher for buffer.
 */
export const TARGET_WORD_COUNTS: Record<TurnType, number> = {
  opening: 300,
  constructive: 250,
  rebuttal: 150,
  cross_examination: 75,
  closing: 175,
  moderator_intro: 80,
  moderator_transition: 25, // Reduced for punchy handoffs
  moderator_intervention: 100,
  moderator_summary: 150, // Reduced for premium recap
}

/**
 * Timeout limits by turn type (seconds)
 */
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

/**
 * Generates a turn configuration
 */
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

/**
 * Standard format turn sequences by turn count.
 * Turn count refers to debater turns (excluding moderator).
 *
 * Structure:
 * - 4 turns: Opening, Opening, Closing, Closing
 * - 6 turns: Opening, Opening, Rebuttal, Rebuttal, Closing, Closing
 * - 8 turns: Opening, Opening, Constructive, Constructive, Rebuttal, Rebuttal, Closing, Closing
 * - 10+ turns: Adds additional rebuttal rounds
 */
export function getStandardSequence(turnCount: number): TurnConfig[] {
  const sequence: TurnConfig[] = []
  let order = 0

  // Always start with moderator intro
  sequence.push(createTurn(order++, 'moderator_intro', 'moderator'))

  // Opening statements (always present)
  sequence.push(createTurn(order++, 'opening', 'for'))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'opening', 'against'))

  // Constructive arguments only for 8+ turns
  if (turnCount >= 8) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'constructive', 'for'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'constructive', 'against'))
  }

  // First rebuttal round for 6+ turns
  if (turnCount >= 6) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'for'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'against'))
  }

  // Additional rebuttal round for 10+ turns
  if (turnCount >= 10) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'against'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'for'))
  }

  // Closing statements (always present)
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'against'))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'for'))

  // Moderator summary
  sequence.push(createTurn(order++, 'moderator_summary', 'moderator'))

  return sequence
}

/**
 * Oxford format turn sequences.
 * Features cross-examination rounds.
 */
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

/**
 * Lincoln-Douglas format (value-focused).
 * Traditional LD structure with longer constructives.
 *
 * Structure:
 * - 4 turns: Constructive, Constructive, Closing, Closing
 * - 6 turns: Constructive, Cross-exam, Constructive, Cross-exam, Closing, Closing
 * - 8+ turns: Constructive, Cross-exam, Constructive, Cross-exam, Rebuttal, Rebuttal, Closing, Closing
 */
export function getLincolnDouglasSequence(turnCount: number): TurnConfig[] {
  const sequence: TurnConfig[] = []
  let order = 0

  // Always start with moderator intro
  sequence.push(createTurn(order++, 'moderator_intro', 'moderator'))

  // Constructive arguments (always present, with longer token limit for LD)
  sequence.push(createTurn(order++, 'constructive', 'for', { maxTokens: 700 }))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))

  // Cross-examination after first constructive for 6+ turns
  if (turnCount >= 6) {
    sequence.push(createTurn(order++, 'cross_examination', 'against'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  }

  sequence.push(createTurn(order++, 'constructive', 'against', { maxTokens: 700 }))

  // Cross-examination after second constructive for 6+ turns
  if (turnCount >= 6) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'cross_examination', 'for'))
  }

  // Rebuttals for 8+ turns
  if (turnCount >= 8) {
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'for'))
    sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
    sequence.push(createTurn(order++, 'rebuttal', 'against'))
  }

  // Closing statements (always present)
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'against'))
  sequence.push(createTurn(order++, 'moderator_transition', 'moderator'))
  sequence.push(createTurn(order++, 'closing', 'for'))

  // Moderator summary
  sequence.push(createTurn(order++, 'moderator_summary', 'moderator'))

  return sequence
}

/**
 * Get turn sequence for a debate format and turn count
 */
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

/**
 * Get only debater turns (excluding moderator)
 */
export function getDebaterTurns(sequence: TurnConfig[]): TurnConfig[] {
  return sequence.filter((t) => t.speaker !== 'moderator')
}

/**
 * Count debater turns in a sequence
 */
export function countDebaterTurns(sequence: TurnConfig[]): number {
  return getDebaterTurns(sequence).length
}

/**
 * Get turns for a specific speaker
 */
export function getTurnsForSpeaker(sequence: TurnConfig[], speaker: TurnSpeaker): TurnConfig[] {
  return sequence.filter((t) => t.speaker === speaker)
}

/**
 * Calculate total max tokens for a sequence
 */
export function getTotalMaxTokens(sequence: TurnConfig[]): number {
  return sequence.reduce((sum, turn) => sum + turn.maxTokens, 0)
}

/**
 * Calculate estimated debate duration in seconds
 */
export function getEstimatedDuration(sequence: TurnConfig[]): number {
  return sequence.reduce((sum, turn) => sum + turn.timeoutSeconds, 0)
}
