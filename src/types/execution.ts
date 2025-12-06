// src/types/execution.ts

import type { TurnSpeaker, TurnType } from './turn'

/**
 * SSE event types emitted during debate execution
 */
export type SSEEventType =
  | 'debate_started'
  | 'turn_started'
  | 'turn_streaming'
  | 'turn_completed'
  | 'turn_error'
  | 'violation_detected'
  | 'intervention'
  | 'progress_update'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'debate_paused'
  | 'debate_resumed'
  | 'debate_completed'
  | 'debate_cancelled'
  | 'debate_error'
  | 'heartbeat'

/**
 * Base SSE event structure
 */
export interface SSEEventBase {
  type: SSEEventType
  timestamp: string
  debateId: string
  /** Monotonically increasing sequence number per debate for ordering */
  seq: number
}

/**
 * Debate started event
 */
export interface DebateStartedEvent extends SSEEventBase {
  type: 'debate_started'
  totalTurns: number
  format: string
}

/**
 * Turn started event
 */
export interface TurnStartedEvent extends SSEEventBase {
  type: 'turn_started'
  turnId: string
  turnNumber: number
  speaker: TurnSpeaker
  speakerLabel: string
  turnType: TurnType
  provider: string
}

/**
 * Turn streaming event (content chunk)
 */
export interface TurnStreamingEvent extends SSEEventBase {
  type: 'turn_streaming'
  turnId: string
  chunk: string
  accumulatedLength: number
}

/**
 * Turn completed event
 */
export interface TurnCompletedEvent extends SSEEventBase {
  type: 'turn_completed'
  turnId: string
  content: string
  tokenCount: number
  durationMs: number
}

/**
 * Turn error event
 */
export interface TurnErrorEvent extends SSEEventBase {
  type: 'turn_error'
  turnId: string
  error: string
  recoverable: boolean
}

/**
 * Violation detected event
 */
export interface ViolationDetectedEvent extends SSEEventBase {
  type: 'violation_detected'
  turnId: string
  violation: {
    ruleViolated: string
    severity: 'warning' | 'error'
    description: string
  }
}

/**
 * Moderator intervention event
 */
export interface InterventionEvent extends SSEEventBase {
  type: 'intervention'
  interventionId: string
  reason: string
  content: string
  targetTurnId?: string
}

/**
 * Progress update event
 */
export interface ProgressUpdateEvent extends SSEEventBase {
  type: 'progress_update'
  currentTurn: number
  totalTurns: number
  percentComplete: number
  debaterTurnsCompleted: number
  debaterTurnsTotal: number
}

/**
 * Budget warning event
 */
export interface BudgetWarningEvent extends SSEEventBase {
  type: 'budget_warning'
  budgetUsedPercent: number
  remainingTokens: number
  remainingCost: number
  message: string
}

/**
 * Budget exceeded event
 */
export interface BudgetExceededEvent extends SSEEventBase {
  type: 'budget_exceeded'
  budgetType: 'tokens' | 'cost'
  limit: number
  current: number
}

/**
 * Debate paused event
 */
export interface DebatePausedEvent extends SSEEventBase {
  type: 'debate_paused'
  reason?: string
  pausedAtTurn: number
}

/**
 * Debate resumed event
 */
export interface DebateResumedEvent extends SSEEventBase {
  type: 'debate_resumed'
  resumingAtTurn: number
}

/**
 * Debate completed event
 */
export interface DebateCompletedEvent extends SSEEventBase {
  type: 'debate_completed'
  totalTurns: number
  totalTokens: number
  totalCost: number
  durationMs: number
}

/**
 * Debate cancelled event
 */
export interface DebateCancelledEvent extends SSEEventBase {
  type: 'debate_cancelled'
  reason: string
  completedTurns: number
}

/**
 * Debate error event
 */
export interface DebateErrorEvent extends SSEEventBase {
  type: 'debate_error'
  error: string
  fatal: boolean
}

/**
 * Heartbeat event for connection keep-alive
 */
export interface HeartbeatEvent extends SSEEventBase {
  type: 'heartbeat'
  serverTime: string
}

/**
 * Union type of all SSE events
 */
export type SSEEvent =
  | DebateStartedEvent
  | TurnStartedEvent
  | TurnStreamingEvent
  | TurnCompletedEvent
  | TurnErrorEvent
  | ViolationDetectedEvent
  | InterventionEvent
  | ProgressUpdateEvent
  | BudgetWarningEvent
  | BudgetExceededEvent
  | DebatePausedEvent
  | DebateResumedEvent
  | DebateCompletedEvent
  | DebateCancelledEvent
  | DebateErrorEvent
  | HeartbeatEvent

/**
 * Execution state for tracking debate progress
 */
export type ExecutionStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'completing'
  | 'completed'
  | 'error'
  | 'cancelled'

/**
 * Execution context passed to event handlers
 */
export interface ExecutionContext {
  debateId: string
  status: ExecutionStatus
  currentTurnId: string | null
  turnsCompleted: number
  totalTurns: number
  startedAt: Date | null
  error: string | null
}
