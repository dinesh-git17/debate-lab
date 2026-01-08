// src/types/llm.ts

/**
 * Supported LLM providers
 */
export type LLMProviderType = 'openai' | 'anthropic' | 'xai' | 'gemini' | 'deepseek'

/**
 * Role in conversation
 */
export type LLMMessageRole = 'system' | 'user' | 'assistant'

/**
 * Message format for LLM context
 */
export interface LLMMessage {
  role: LLMMessageRole
  content: string
}

/**
 * Parameters for generating a response
 */
export interface GenerateParams {
  systemPrompt: string
  messages: LLMMessage[]
  maxTokens: number
  temperature?: number | undefined
  stopSequences?: string[] | undefined
  stream?: boolean | undefined
  model?: string | undefined
}

/**
 * Result from generation (non-streaming)
 */
export interface GenerateResult {
  content: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  finishReason: 'stop' | 'max_tokens' | 'error'
  latencyMs: number
  provider: LLMProviderType
  model: string
}

/**
 * Streaming chunk
 */
export interface StreamChunk {
  content: string
  isComplete: boolean
  finishReason?: 'stop' | 'max_tokens' | undefined
}

/**
 * Provider capabilities and info
 */
export interface ProviderInfo {
  name: string
  provider: LLMProviderType
  model: string
  maxContextTokens: number
  maxOutputTokens: number
  supportsStreaming: boolean
  costPer1kInput: number
  costPer1kOutput: number
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  provider: LLMProviderType
  isHealthy: boolean
  lastCheck: Date
  latencyMs?: number | undefined
  error?: string | undefined
}

/**
 * Rate limit state
 */
export interface RateLimitState {
  tokensRemaining: number
  requestsRemaining: number
  resetAt: Date
}

/**
 * LLM API error types
 */
export type LLMErrorType =
  | 'rate_limit'
  | 'auth_error'
  | 'invalid_request'
  | 'context_length'
  | 'content_filter'
  | 'server_error'
  | 'network_error'
  | 'timeout'
  | 'unknown'

/**
 * Custom LLM error class
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public type: LLMErrorType,
    public provider: LLMProviderType,
    public statusCode?: number | undefined,
    public retryable: boolean = false,
    public retryAfterMs?: number | undefined
  ) {
    super(message)
    this.name = 'LLMError'
  }
}
