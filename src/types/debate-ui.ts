// src/types/debate-ui.ts

import type { TurnSpeaker, TurnType } from './turn'

/**
 * Message display state for UI rendering
 */
export interface DebateMessage {
  id: string
  speaker: TurnSpeaker
  speakerLabel: string
  turnType: TurnType
  content: string
  isStreaming: boolean
  isComplete: boolean
  tokenCount?: number
  timestamp: Date
  violations?: string[]
}

/**
 * Debate page connection state
 */
export type ViewConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

/**
 * Debate viewing status
 * - 'ended' represents premature termination by user (distinct from natural 'completed')
 */
export type DebateViewStatus = 'ready' | 'active' | 'completed' | 'ended' | 'error'

/**
 * Debate viewing state for the UI store
 */
export interface DebateViewState {
  debateId: string
  topic: string
  format: string
  status: DebateViewStatus
  messages: DebateMessage[]
  currentTurnId: string | null
  progress: ViewProgress
  connection: ViewConnectionStatus
  error: string | null
  /** Background category for ambient gradient - computed at debate creation */
  backgroundCategory?: string | undefined
}

/**
 * Progress tracking for debate UI (simplified view)
 */
export interface ViewProgress {
  currentTurn: number
  totalTurns: number
  percentComplete: number
}

/**
 * Speaker visual configuration for styling
 */
export interface SpeakerConfig {
  label: string
  shortLabel: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
  position: 'left' | 'right' | 'center'
  // Chip styling for data chip headers
  chipBorder: string
  chipBg: string
  // Accent color for active glow
  glowColor: string
}

/**
 * Debate control button states
 */
export interface DebateControls {
  canStart: boolean
  canCancel: boolean
  isLoading: boolean
}

/**
 * Options for the debate stream hook
 */
export interface UseDebateStreamOptions {
  debateId: string
  autoConnect?: boolean
  onDebateComplete?: () => void
  onError?: (error: string) => void
}

/**
 * Return type for the debate stream hook
 */
export interface UseDebateStreamReturn {
  connect: () => void
  disconnect: () => void
  isConnected: boolean
}
