// src/types/export.ts

/**
 * Available export formats
 */
export type ExportFormat = 'markdown' | 'text' | 'json'

/**
 * Export configuration
 */
export interface ExportConfig {
  format: ExportFormat
  includeMetadata: boolean
  includeTimestamps: boolean
  includeModeratorTurns: boolean
}

/**
 * Exported transcript structure (for JSON)
 */
export interface ExportedTranscript {
  metadata: {
    debateId: string
    topic: string
    format: string
    status: string
    exportedAt: string
    totalTurns: number
    totalTokens: number
  }
  turns: ExportedTurn[]
  summary?: string | undefined
}

/**
 * Single turn in export
 */
export interface ExportedTurn {
  turnNumber: number
  speaker: string
  speakerLabel: string
  turnType: string
  content: string
  tokenCount?: number
  timestamp?: string
}

/**
 * Modal configuration
 */
export interface ConfirmModalConfig {
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  variant: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
}
