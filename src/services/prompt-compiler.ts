// src/services/prompt-compiler.ts

import {
  buildDebaterSystemPrompt,
  buildDebaterTurnPrompt,
  compileIntroPrompt,
  compileInterventionPrompt,
  compileSummaryPrompt,
  compileTransitionPrompt,
  getDebaterTemperature,
} from '@/lib/prompts'

import type { DebateSession } from '@/types/debate'
import type {
  CompiledPrompt,
  DebateHistoryEntry,
  ModeratorContext,
  ViolationRecord,
} from '@/types/prompts'
import type { Turn, TurnConfig } from '@/types/turn'

/**
 * Build moderator context from debate state
 */
export function buildModeratorContext(
  session: DebateSession,
  completedTurns: Turn[],
  currentTurnConfig: TurnConfig,
  violations: ViolationRecord[] = [],
  nextTurnConfig?: TurnConfig
): ModeratorContext {
  const debateHistory: DebateHistoryEntry[] = completedTurns.map((turn, index) => ({
    speaker: turn.speaker,
    speakerLabel: turn.speaker === 'moderator' ? 'MODERATOR' : turn.speaker.toUpperCase(),
    turnType: turn.config.type,
    content: turn.content,
    turnNumber: index + 1,
  }))

  const previousTurn = completedTurns.at(-1)

  const debaterTurns = completedTurns.filter((t) => t.speaker !== 'moderator')

  // For moderator turns (intro/transition), nextSpeaker should be from the NEXT turn in sequence
  // For debater turns, nextSpeaker is the current speaker
  let nextSpeaker: 'for' | 'against' | undefined
  if (currentTurnConfig.speaker === 'moderator') {
    // Use the next turn's speaker if available
    nextSpeaker =
      nextTurnConfig?.speaker !== 'moderator'
        ? (nextTurnConfig?.speaker as 'for' | 'against')
        : undefined
  } else {
    nextSpeaker = currentTurnConfig.speaker as 'for' | 'against'
  }

  return {
    topic: session.topic,
    format: session.format,
    totalTurns: session.turns,
    currentTurnNumber: debaterTurns.length + 1,
    customRules: session.customRules,
    debateHistory,
    currentSpeaker: currentTurnConfig.speaker,
    nextSpeaker,
    nextTurnType: nextTurnConfig?.type,
    previousTurnContent: previousTurn?.content,
    previousTurnSpeaker: previousTurn?.speaker,
    previousTurnType: previousTurn?.config.type,
    violations,
  }
}

/**
 * Compile prompt for any moderator turn type
 */
export function compileModeratorPrompt(
  turnType: string,
  context: ModeratorContext,
  violation?: ViolationRecord
): CompiledPrompt {
  switch (turnType) {
    case 'moderator_intro':
      return compileIntroPrompt(context)

    case 'moderator_transition':
      return compileTransitionPrompt(context)

    case 'moderator_intervention':
      if (!violation) {
        throw new Error('Intervention requires a violation record')
      }
      return compileInterventionPrompt(context, violation)

    case 'moderator_summary':
      return compileSummaryPrompt(context)

    default:
      throw new Error(`Unknown moderator turn type: ${turnType}`)
  }
}

/**
 * Compile prompt for debater turn
 */
export function compileDebaterPrompt(
  session: DebateSession,
  turnConfig: TurnConfig,
  completedTurns: Turn[]
): { systemPrompt: string; userPrompt: string; maxTokens: number; temperature: number } {
  const position = turnConfig.speaker as 'for' | 'against'

  const history: DebateHistoryEntry[] = completedTurns
    .filter((t) => t.speaker !== 'moderator' || t.config.type === 'moderator_intervention')
    .map((turn, index) => ({
      speaker: turn.speaker,
      speakerLabel: turn.speaker === 'moderator' ? 'MODERATOR' : turn.speaker.toUpperCase(),
      turnType: turn.config.type,
      content: turn.content,
      turnNumber: index + 1,
    }))

  const systemPrompt = buildDebaterSystemPrompt(position, session.topic)
  const userPrompt = buildDebaterTurnPrompt(
    turnConfig.type,
    position,
    session.topic,
    history,
    turnConfig.maxTokens,
    session.customRules
  )

  return {
    systemPrompt,
    userPrompt,
    maxTokens: turnConfig.maxTokens,
    temperature: getDebaterTemperature(turnConfig.type),
  }
}

/**
 * Get temperature for turn type
 */
export function getTemperatureForTurn(turnType: string): number {
  const temperatures: Record<string, number> = {
    moderator_intro: 0.7,
    moderator_transition: 0.5,
    moderator_intervention: 0.4,
    moderator_summary: 0.5,
    opening: 0.8,
    constructive: 0.8,
    rebuttal: 0.7,
    cross_examination: 0.7,
    closing: 0.7,
  }
  return temperatures[turnType] ?? 0.7
}

/**
 * Check if turn type is a moderator turn
 */
export function isModeratorTurn(turnType: string): boolean {
  return turnType.startsWith('moderator_')
}

/**
 * Get max tokens for turn type
 */
export function getMaxTokensForTurn(turnType: string): number {
  const maxTokens: Record<string, number> = {
    moderator_intro: 200,
    moderator_transition: 80,
    moderator_intervention: 120,
    moderator_summary: 1200, // Increased from 500 - summary needs room for all sections
    opening: 500,
    constructive: 600,
    rebuttal: 500,
    cross_examination: 300,
    closing: 400,
  }
  return maxTokens[turnType] ?? 400
}

/**
 * Build context for next speaker preview
 */
export function buildNextSpeakerContext(
  session: DebateSession,
  completedTurns: Turn[],
  nextTurnConfig: TurnConfig
): { speaker: string; turnType: string; description: string } {
  const speaker =
    nextTurnConfig.speaker === 'moderator'
      ? 'Moderator'
      : nextTurnConfig.speaker === 'for'
        ? 'FOR Position'
        : 'AGAINST Position'

  return {
    speaker,
    turnType: nextTurnConfig.type,
    description: nextTurnConfig.description,
  }
}
