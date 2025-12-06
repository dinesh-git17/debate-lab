// src/types/debate.ts

export type DebatePhase =
  | 'idle'
  | 'configuring'
  | 'validating'
  | 'ready'
  | 'active'
  | 'paused'
  | 'completed'
  | 'error'

export type DebateFormat = 'standard' | 'oxford' | 'lincoln-douglas'

export type MessageRole = 'debater_for' | 'debater_against' | 'moderator' | 'system'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export type LLMProvider = 'chatgpt' | 'grok'

export type DebatePosition = 'for' | 'against'

export interface DebateAssignment {
  forPosition: LLMProvider
  againstPosition: LLMProvider
}

export interface Message {
  id: string
  debateId: string
  role: MessageRole
  content: string
  turnType?: string | undefined
  turnNumber?: number | undefined
  tokenCount?: number | undefined
  isStreaming?: boolean | undefined
  createdAt: Date
}

export interface Debate {
  id: string
  topic: string
  turns: number
  format: DebateFormat
  customRules: string[]
  status: DebatePhase
  createdAt: Date
  updatedAt: Date
}

export interface DebateSession {
  id: string
  topic: string
  originalTopic?: string | undefined
  turns: number
  format: DebateFormat
  customRules: string[]
  assignment: DebateAssignment
  status: DebatePhase
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

export interface DebateSessionPublic {
  id: string
  topic: string
  originalTopic?: string | undefined
  turns: number
  format: DebateFormat
  customRules: string[]
  status: DebatePhase
  createdAt: Date
}

export interface DebateFilters {
  status?: DebatePhase | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export interface CreateDebateInput {
  topic: string
  turns?: number | undefined
  format?: DebateFormat | undefined
  customRules?: string[] | undefined
}
