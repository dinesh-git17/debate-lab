// src/types/index.ts

export type LLMProvider = 'openai' | 'anthropic' | 'xai'

export type DebateRole = 'debater' | 'moderator'

export type DebateStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export interface LLMConfig {
  provider: LLMProvider
  model: string
  temperature?: number
  maxTokens?: number
}

export interface DebateParticipant {
  id: string
  name: string
  role: DebateRole
  provider: LLMProvider
  config: LLMConfig
}

export interface DebateMessage {
  id: string
  participantId: string
  content: string
  timestamp: Date
  turnNumber: number
  tokenCount: number
}

export interface Debate {
  id: string
  topic: string
  status: DebateStatus
  participants: DebateParticipant[]
  messages: DebateMessage[]
  maxTurns: number
  tokenBudget: number
  tokensUsed: number
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export * from './budget'
export * from './debate'
export * from './debate-ui'
export * from './execution'
export * from './export'
export * from './judge'
export * from './llm'
export * from './prompts'
export * from './security'
export * from './share'
export * from './summary'
export * from './turn'
