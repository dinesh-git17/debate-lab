// src/types/prompts.ts

import type { DebateFormat } from './debate'
import type { TurnSpeaker, TurnType } from './turn'

/**
 * Entry in debate history for context
 */
export interface DebateHistoryEntry {
  speaker: TurnSpeaker
  speakerLabel: string
  turnType: TurnType
  content: string
  turnNumber: number
}

/**
 * Record of a rule violation
 */
export interface ViolationRecord {
  turnNumber: number
  speaker: TurnSpeaker
  ruleViolated: string
  severity: 'minor' | 'moderate' | 'severe'
  description: string
}

/**
 * Context provided to moderator prompts
 */
export interface ModeratorContext {
  topic: string
  format: DebateFormat
  totalTurns: number
  currentTurnNumber: number
  customRules: string[]
  debateHistory: DebateHistoryEntry[]
  currentSpeaker?: TurnSpeaker | undefined
  nextSpeaker?: TurnSpeaker | undefined
  nextTurnType?: TurnType | undefined
  previousTurnContent?: string | undefined
  previousTurnSpeaker?: TurnSpeaker | undefined
  previousTurnType?: TurnType | undefined
  violations?: ViolationRecord[] | undefined
}

/**
 * Compiled prompt ready for generation
 */
export interface CompiledPrompt {
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  temperature: number
}

/**
 * Prompt template metadata
 */
export interface PromptTemplate {
  id: string
  name: string
  description: string
  systemPrompt: string
  userPromptTemplate: string
  maxTokens: number
  temperature: number
  requiredContext: (keyof ModeratorContext)[]
}

/**
 * Intervention trigger conditions
 */
export interface InterventionTrigger {
  type:
    | 'personal_attack'
    | 'off_topic'
    | 'rule_violation'
    | 'excessive_length'
    | 'factual_claim'
    | 'new_argument_in_closing'
    | 'unsupported_claim'
    | 'disrespectful_language'
    | 'custom_rule'
  confidence: number
  description: string
  suggestedAction: 'warn' | 'redirect' | 'correct' | 'pause'
}

/**
 * Violation detection result from LLM
 */
export interface ViolationDetectionResult {
  hasViolation: boolean
  violations: {
    type: string
    severity: 'minor' | 'moderate' | 'severe'
    description: string
    quote?: string | undefined
  }[]
}

/**
 * Debater context for turn generation
 */
export interface DebaterContext {
  topic: string
  position: 'for' | 'against'
  turnType: TurnType
  turnNumber: number
  maxTokens: number
  debateHistory: DebateHistoryEntry[]
  customRules: string[]
}
