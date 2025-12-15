// src/types/turn.ts

/**
 * Types of turns in a debate
 */
export type TurnType =
  | 'opening'
  | 'constructive'
  | 'rebuttal'
  | 'cross_examination'
  | 'closing'
  | 'moderator_intro'
  | 'moderator_transition'
  | 'moderator_intervention'
  | 'moderator_summary'

/**
 * Who is speaking in this turn
 */
export type TurnSpeaker = 'for' | 'against' | 'moderator'

/**
 * Configuration for a single turn in the sequence
 */
export interface TurnConfig {
  id: string
  type: TurnType
  speaker: TurnSpeaker
  label: string
  description: string
  maxTokens: number
  minTokens?: number
  timeoutSeconds: number
  allowsNewArguments: boolean
  requiresRebuttal: boolean
  order: number
}

/**
 * A completed turn with content
 */
export interface Turn {
  id: string
  debateId: string
  config: TurnConfig
  speaker: TurnSpeaker
  provider: TurnProvider
  content: string
  tokenCount: number
  startedAt: Date
  completedAt: Date
  metadata?:
    | {
        violations?: string[] | undefined
        moderatorNotes?: string | undefined
      }
    | undefined
}

/**
 * Current state of the debate engine
 */
export interface DebateEngineState {
  debateId: string
  currentTurnIndex: number
  totalTurns: number
  turnSequence: TurnConfig[]
  completedTurns: Turn[]
  status: DebateEngineStatus
  startedAt?: Date | undefined
  completedAt?: Date | undefined
  error?: string | undefined
  /** Partial content from interrupted turn (paused mid-stream) */
  partialTurnContent?: string | undefined
}

/**
 * Possible states of the debate engine
 */
export type DebateEngineStatus =
  | 'initialized'
  | 'in_progress'
  | 'paused'
  | 'awaiting_turn'
  | 'generating'
  | 'moderator_review'
  | 'completed'
  | 'error'
  | 'cancelled'

/**
 * Provider type for turns (extends LLMProvider with claude for moderator)
 */
export type TurnProvider = 'chatgpt' | 'grok' | 'claude' | 'gemini'

/**
 * Progress information for a debate
 */
export interface DebateProgress {
  currentTurn: number
  totalTurns: number
  debaterTurnsCompleted: number
  debaterTurnsTotal: number
  percentComplete: number
}

/**
 * Serialized turn for storage (dates as ISO strings)
 */
export interface SerializedTurn {
  id: string
  debateId: string
  config: TurnConfig
  speaker: TurnSpeaker
  provider: TurnProvider
  content: string
  tokenCount: number
  startedAt: string
  completedAt: string
  metadata?:
    | {
        violations?: string[] | undefined
        moderatorNotes?: string | undefined
      }
    | undefined
}

/**
 * Serialized engine state for storage
 */
export interface SerializedEngineState {
  debateId: string
  currentTurnIndex: number
  totalTurns: number
  turnSequence: TurnConfig[]
  completedTurns: SerializedTurn[]
  status: DebateEngineStatus
  startedAt?: string | undefined
  completedAt?: string | undefined
  error?: string | undefined
  partialTurnContent?: string | undefined
}
