// src/types/summary.ts

import type { JudgeAnalysis } from './judge'
import type { JuryDeliberation, JuryPhase } from './jury'
import type { LLMProviderType } from './llm'
import type { TurnSpeaker, TurnType } from './turn'

/**
 * Model assignment reveal state
 */
export type RevealState = 'hidden' | 'revealing' | 'revealed'

/**
 * Model identity for reveal
 */
export interface ModelIdentity {
  provider: LLMProviderType
  displayName: string
  model: string
  icon: string
  color: string
}

/**
 * Revealed assignment mapping
 */
export interface RevealedAssignment {
  for: ModelIdentity
  against: ModelIdentity
}

/**
 * Turn summary for transcript display
 */
export interface TurnSummary {
  id: string
  turnNumber: number
  speaker: TurnSpeaker
  speakerLabel: string
  turnType: TurnType
  content: string
  tokenCount: number
  timestamp: string
}

/**
 * Debate statistics for dashboard
 */
export interface DebateStatistics {
  totalTurns: number
  totalTokens: number
  totalCost: number
  durationMs: number
  avgTokensPerTurn: number
  avgResponseTimeMs: number
  tokensByParticipant: {
    for: number
    against: number
    moderator: number
  }
  costByProvider: {
    provider: string
    cost: number
  }[]
}

/**
 * Summary API response
 */
export interface SummaryResponse {
  debateId: string
  topic: string
  format: string
  status: 'completed' | 'cancelled'
  completedAt: string
  turns: TurnSummary[]
  statistics: DebateStatistics
  assignment: {
    forModel: string
    againstModel: string
  } | null
}

/**
 * Summary page state
 */
export interface SummaryState {
  debateId: string
  topic: string
  format: string
  status: 'loading' | 'ready' | 'error'
  error: string | null
  turns: TurnSummary[]
  statistics: DebateStatistics | null
  revealState: RevealState
  assignment: RevealedAssignment | null
  judgeAnalysis: JudgeAnalysis | null
  isAnalysisLoading: boolean
  juryDeliberation: JuryDeliberation | null
  isJuryLoading: boolean
  juryError: string | null
  juryPhase: JuryPhase
}

/**
 * Share data for social/clipboard
 */
export interface ShareData {
  title: string
  text: string
  url: string
}

/**
 * Model provider configurations for reveal cards
 */
export const MODEL_CONFIGS: Record<LLMProviderType, Omit<ModelIdentity, 'model'>> = {
  openai: {
    provider: 'openai',
    displayName: 'ChatGPT',
    icon: '🤖',
    color: 'emerald',
  },
  anthropic: {
    provider: 'anthropic',
    displayName: 'Claude',
    icon: '🎭',
    color: 'violet',
  },
  xai: {
    provider: 'xai',
    displayName: 'Grok',
    icon: '⚡',
    color: 'amber',
  },
  gemini: {
    provider: 'gemini',
    displayName: 'Gemini',
    icon: '✨',
    color: 'blue',
  },
  deepseek: {
    provider: 'deepseek',
    displayName: 'DeepSeek',
    icon: '🔍',
    color: 'teal',
  },
}

/**
 * Get model identity from provider string
 */
export function getModelIdentity(providerModel: string): ModelIdentity {
  const [provider, model] = providerModel.split(':') as [LLMProviderType, string]
  const config = MODEL_CONFIGS[provider] ?? MODEL_CONFIGS.openai

  return {
    ...config,
    model: model ?? providerModel,
  }
}
