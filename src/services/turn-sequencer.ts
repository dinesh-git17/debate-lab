// src/services/turn-sequencer.ts

import { getDebaterTurns, getTurnSequence } from '@/lib/debate-formats'

import type { DebateFormat } from '@/types/debate'
import type {
  DebateEngineState,
  DebateEngineStatus,
  DebateProgress,
  SerializedEngineState,
  SerializedTurn,
  Turn,
  TurnConfig,
} from '@/types/turn'

export interface TurnSequencerOptions {
  debateId: string
  format: DebateFormat
  turnCount: number
  customRules?: string[]
}

/**
 * Manages debate turn sequencing and state transitions.
 * Acts as a finite state machine for debate flow control.
 */
export class TurnSequencer {
  private state: DebateEngineState

  constructor(options: TurnSequencerOptions) {
    const sequence = getTurnSequence(options.format, options.turnCount)

    this.state = {
      debateId: options.debateId,
      currentTurnIndex: 0,
      totalTurns: sequence.length,
      turnSequence: sequence,
      completedTurns: [],
      status: 'initialized',
    }
  }

  /**
   * Initialize from existing state (for resumption)
   */
  static fromState(state: DebateEngineState): TurnSequencer {
    const sequencer = new TurnSequencer({
      debateId: state.debateId,
      format: 'standard',
      turnCount: 4,
    })
    sequencer.state = state
    return sequencer
  }

  /**
   * Get current engine state (immutable copy)
   */
  getState(): DebateEngineState {
    return {
      ...this.state,
      turnSequence: [...this.state.turnSequence],
      completedTurns: [...this.state.completedTurns],
    }
  }

  /**
   * Get current status
   */
  getStatus(): DebateEngineStatus {
    return this.state.status
  }

  /**
   * Start the debate
   */
  start(): void {
    if (this.state.status !== 'initialized') {
      throw new Error(`Cannot start debate in status: ${this.state.status}`)
    }
    this.state.status = 'in_progress'
    this.state.startedAt = new Date()
  }

  /**
   * Get current turn configuration
   */
  getCurrentTurn(): TurnConfig | null {
    if (this.state.currentTurnIndex >= this.state.turnSequence.length) {
      return null
    }
    const turn = this.state.turnSequence[this.state.currentTurnIndex]
    return turn ?? null
  }

  /**
   * Get next turn configuration (preview)
   */
  getNextTurn(): TurnConfig | null {
    const nextIndex = this.state.currentTurnIndex + 1
    if (nextIndex >= this.state.turnSequence.length) {
      return null
    }
    const turn = this.state.turnSequence[nextIndex]
    return turn ?? null
  }

  /**
   * Get previous completed turns for context
   */
  getCompletedTurns(): Turn[] {
    return [...this.state.completedTurns]
  }

  /**
   * Get the last completed turn
   */
  getLastCompletedTurn(): Turn | null {
    const lastTurn = this.state.completedTurns[this.state.completedTurns.length - 1]
    return lastTurn ?? null
  }

  /**
   * Get debate history formatted for LLM context
   */
  getDebateContext(): string {
    return this.state.completedTurns
      .filter((t) => t.config.speaker !== 'moderator' || t.config.type === 'moderator_intervention')
      .map((t) => {
        const label = t.speaker === 'moderator' ? 'MODERATOR' : t.speaker.toUpperCase()
        return `[${label}] ${t.config.label}:\n${t.content}`
      })
      .join('\n\n---\n\n')
  }

  /**
   * Get full debate transcript including all turns
   */
  getFullTranscript(): string {
    return this.state.completedTurns
      .map((t) => {
        const label = t.speaker === 'moderator' ? 'MODERATOR' : t.speaker.toUpperCase()
        return `[${label}] ${t.config.label}:\n${t.content}`
      })
      .join('\n\n---\n\n')
  }

  /**
   * Check if current turn can be advanced
   */
  canAdvance(): boolean {
    return (
      this.state.status === 'in_progress' &&
      this.state.currentTurnIndex < this.state.turnSequence.length
    )
  }

  /**
   * Check if debate is complete
   */
  isComplete(): boolean {
    return this.state.status === 'completed'
  }

  /**
   * Check if debate is in an error or cancelled state
   */
  isTerminated(): boolean {
    return this.state.status === 'error' || this.state.status === 'cancelled'
  }

  /**
   * Record a completed turn and advance
   */
  recordTurn(turn: Omit<Turn, 'id' | 'debateId' | 'config'>): Turn {
    const currentConfig = this.getCurrentTurn()
    if (!currentConfig) {
      throw new Error('No current turn to record')
    }

    if (turn.speaker !== currentConfig.speaker) {
      throw new Error(
        `Turn speaker mismatch: expected ${currentConfig.speaker}, got ${turn.speaker}`
      )
    }

    const completedTurn: Turn = {
      id: `${this.state.debateId}_turn_${this.state.currentTurnIndex}`,
      debateId: this.state.debateId,
      config: currentConfig,
      ...turn,
    }

    if (turn.tokenCount > currentConfig.maxTokens) {
      completedTurn.metadata = {
        ...completedTurn.metadata,
        violations: [
          ...(completedTurn.metadata?.violations ?? []),
          `Exceeded token limit: ${turn.tokenCount}/${currentConfig.maxTokens}`,
        ],
      }
    }

    if (currentConfig.minTokens && turn.tokenCount < currentConfig.minTokens) {
      completedTurn.metadata = {
        ...completedTurn.metadata,
        violations: [
          ...(completedTurn.metadata?.violations ?? []),
          `Below minimum tokens: ${turn.tokenCount}/${currentConfig.minTokens}`,
        ],
      }
    }

    this.state.completedTurns.push(completedTurn)
    this.state.currentTurnIndex++

    if (this.state.currentTurnIndex >= this.state.turnSequence.length) {
      this.state.status = 'completed'
      this.state.completedAt = new Date()
    }

    return completedTurn
  }

  /**
   * Insert a moderator intervention (doesn't advance turn)
   */
  insertIntervention(content: string, reason: string): Turn {
    const intervention: Turn = {
      id: `${this.state.debateId}_intervention_${Date.now()}`,
      debateId: this.state.debateId,
      config: {
        id: 'intervention',
        type: 'moderator_intervention',
        speaker: 'moderator',
        label: 'Moderator Intervention',
        description: reason,
        maxTokens: 150,
        timeoutSeconds: 30,
        allowsNewArguments: false,
        requiresRebuttal: false,
        order: -1,
      },
      speaker: 'moderator',
      provider: 'claude',
      content,
      tokenCount: Math.ceil(content.length / 4),
      startedAt: new Date(),
      completedAt: new Date(),
      metadata: { moderatorNotes: reason },
    }

    this.state.completedTurns.push(intervention)

    return intervention
  }

  /**
   * Pause the debate
   */
  pause(): void {
    if (this.state.status === 'in_progress') {
      this.state.status = 'paused'
    }
  }

  /**
   * Resume the debate
   */
  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'in_progress'
    }
  }

  /**
   * Cancel the debate
   */
  cancel(reason?: string): void {
    this.state.status = 'cancelled'
    if (reason) {
      this.state.error = reason
    }
    this.state.completedAt = new Date()
  }

  /**
   * Set error state
   */
  setError(error: string): void {
    this.state.status = 'error'
    this.state.error = error
  }

  /**
   * Store partial content from interrupted turn (paused mid-stream)
   */
  setPartialContent(content: string): void {
    this.state.partialTurnContent = content
  }

  /**
   * Get partial content from interrupted turn
   */
  getPartialContent(): string | undefined {
    return this.state.partialTurnContent
  }

  /**
   * Clear partial content (after resuming and completing the turn)
   */
  clearPartialContent(): void {
    this.state.partialTurnContent = undefined
  }

  /**
   * Get progress information
   */
  getProgress(): DebateProgress {
    const debaterTurns = getDebaterTurns(this.state.turnSequence)
    const completedDebaterTurns = this.state.completedTurns.filter(
      (t) => t.config.speaker !== 'moderator'
    )

    return {
      currentTurn: this.state.currentTurnIndex + 1,
      totalTurns: this.state.totalTurns,
      debaterTurnsCompleted: completedDebaterTurns.length,
      debaterTurnsTotal: debaterTurns.length,
      percentComplete: Math.round((this.state.currentTurnIndex / this.state.totalTurns) * 100),
    }
  }

  /**
   * Serialize state for storage
   */
  serialize(): string {
    const serialized: SerializedEngineState = {
      debateId: this.state.debateId,
      currentTurnIndex: this.state.currentTurnIndex,
      totalTurns: this.state.totalTurns,
      turnSequence: this.state.turnSequence,
      status: this.state.status,
      completedTurns: this.state.completedTurns.map(
        (turn): SerializedTurn => ({
          id: turn.id,
          debateId: turn.debateId,
          config: turn.config,
          speaker: turn.speaker,
          provider: turn.provider,
          content: turn.content,
          tokenCount: turn.tokenCount,
          startedAt: turn.startedAt.toISOString(),
          completedAt: turn.completedAt.toISOString(),
          metadata: turn.metadata,
        })
      ),
    }

    if (this.state.error) {
      serialized.error = this.state.error
    }
    if (this.state.startedAt) {
      serialized.startedAt = this.state.startedAt.toISOString()
    }
    if (this.state.completedAt) {
      serialized.completedAt = this.state.completedAt.toISOString()
    }
    if (this.state.partialTurnContent) {
      serialized.partialTurnContent = this.state.partialTurnContent
    }

    return JSON.stringify(serialized)
  }

  /**
   * Deserialize state from storage
   */
  static deserialize(data: string): TurnSequencer {
    const parsed = JSON.parse(data) as SerializedEngineState

    const state: DebateEngineState = {
      debateId: parsed.debateId,
      currentTurnIndex: parsed.currentTurnIndex,
      totalTurns: parsed.totalTurns,
      turnSequence: parsed.turnSequence,
      status: parsed.status,
      completedTurns: parsed.completedTurns.map(
        (turn): Turn => ({
          id: turn.id,
          debateId: turn.debateId,
          config: turn.config,
          speaker: turn.speaker,
          provider: turn.provider,
          content: turn.content,
          tokenCount: turn.tokenCount,
          startedAt: new Date(turn.startedAt),
          completedAt: new Date(turn.completedAt),
          metadata: turn.metadata,
        })
      ),
    }

    if (parsed.error) {
      state.error = parsed.error
    }
    if (parsed.startedAt) {
      state.startedAt = new Date(parsed.startedAt)
    }
    if (parsed.completedAt) {
      state.completedAt = new Date(parsed.completedAt)
    }
    if (parsed.partialTurnContent) {
      state.partialTurnContent = parsed.partialTurnContent
    }

    return TurnSequencer.fromState(state)
  }
}
