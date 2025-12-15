// src/services/llm/llm-service.ts

import {
  createProviderLogger,
  logLLMRequest,
  recordLLMRequest,
  recordLLMFailure,
  recordLLMSuccess,
} from '@/lib/logging'
import { consumeCapacity, waitForCapacity } from '@/lib/rate-limiter'
import { withRetry } from '@/lib/retry'
import { LLMError } from '@/types/llm'

import { getDebateProvider, getProvider } from './provider-factory'

import type { GenerateParams, GenerateResult, LLMProviderType, StreamChunk } from '@/types/llm'

export interface GenerateOptions {
  provider: LLMProviderType | 'chatgpt' | 'grok' | 'claude' | 'gemini'
  params: GenerateParams
  enableRetry?: boolean | undefined
  enableRateLimit?: boolean | undefined
}

/**
 * Generate a response from an LLM provider
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { provider: providerName, params, enableRetry = true, enableRateLimit = true } = options

  const provider = ['chatgpt', 'grok', 'claude', 'gemini'].includes(providerName)
    ? getDebateProvider(providerName as 'chatgpt' | 'grok' | 'claude' | 'gemini')
    : getProvider(providerName as LLMProviderType)

  if (!provider.isConfigured()) {
    throw new LLMError(
      `Provider ${providerName} is not configured`,
      'auth_error',
      provider.providerType
    )
  }

  const estimatedTokens =
    provider.countMessagesTokens(params.systemPrompt, params.messages) + params.maxTokens

  if (enableRateLimit) {
    await waitForCapacity(provider.providerType, estimatedTokens)
  }

  const log = createProviderLogger(provider.providerType)
  const startTime = Date.now()

  const generateFn = async () => {
    try {
      const result = await provider.generate(params)

      if (enableRateLimit) {
        consumeCapacity(provider.providerType, result.totalTokens)
      }

      // Record successful LLM request (metrics + Supabase)
      recordLLMRequest(
        provider.providerType,
        result.inputTokens,
        result.outputTokens,
        result.latencyMs,
        0, // costCents - calculated elsewhere
        true
      )
      logLLMRequest(
        provider.providerType,
        '', // debateId not available here
        0, // turnNumber not available here
        result.latencyMs,
        { prompt: result.inputTokens, completion: result.outputTokens },
        true,
        undefined,
        result.model
      )
      recordLLMSuccess(provider.providerType)

      return result
    } catch (error) {
      const latencyMs = Date.now() - startTime
      log.error('LLM request failed', error instanceof Error ? error : null, {
        errorType: error instanceof LLMError ? error.type : 'unknown',
      })
      recordLLMRequest(provider.providerType, 0, 0, latencyMs, 0, false)
      logLLMRequest(
        provider.providerType,
        '',
        0,
        latencyMs,
        { prompt: 0, completion: 0 },
        false,
        error instanceof Error ? error : undefined
      )
      recordLLMFailure(provider.providerType)
      throw error
    }
  }

  if (enableRetry) {
    return withRetry(generateFn, { maxRetries: 3 })
  }

  return generateFn()
}

/**
 * Generate a streaming response
 */
export async function* generateStream(
  options: GenerateOptions
): AsyncGenerator<StreamChunk, GenerateResult, unknown> {
  const { provider: providerName, params, enableRateLimit = true } = options

  const provider = ['chatgpt', 'grok', 'claude', 'gemini'].includes(providerName)
    ? getDebateProvider(providerName as 'chatgpt' | 'grok' | 'claude' | 'gemini')
    : getProvider(providerName as LLMProviderType)

  if (!provider.isConfigured()) {
    throw new LLMError(
      `Provider ${providerName} is not configured`,
      'auth_error',
      provider.providerType
    )
  }

  const estimatedTokens =
    provider.countMessagesTokens(params.systemPrompt, params.messages) + params.maxTokens

  if (enableRateLimit) {
    await waitForCapacity(provider.providerType, estimatedTokens)
  }

  const log = createProviderLogger(provider.providerType)
  const startTime = Date.now()
  let fullContent = ''
  let outputTokens = 0

  try {
    for await (const chunk of provider.generateStream(params)) {
      fullContent += chunk.content
      outputTokens = provider.countTokens(fullContent)
      yield chunk
    }

    const inputTokens = provider.countMessagesTokens(params.systemPrompt, params.messages)
    const latencyMs = Date.now() - startTime

    if (enableRateLimit) {
      consumeCapacity(provider.providerType, inputTokens + outputTokens)
    }

    // Record successful streaming request (metrics + Supabase)
    recordLLMRequest(provider.providerType, inputTokens, outputTokens, latencyMs, 0, true)
    logLLMRequest(
      provider.providerType,
      '', // debateId not available here
      0, // turnNumber not available here
      latencyMs,
      { prompt: inputTokens, completion: outputTokens },
      true,
      undefined,
      provider.info.model
    )
    recordLLMSuccess(provider.providerType)

    return {
      content: fullContent,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      finishReason: 'stop',
      latencyMs,
      provider: provider.providerType,
      model: provider.info.model,
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    log.error('LLM stream request failed', error instanceof Error ? error : null)
    recordLLMRequest(provider.providerType, 0, 0, latencyMs, 0, false)
    logLLMRequest(
      provider.providerType,
      '',
      0,
      latencyMs,
      { prompt: 0, completion: 0 },
      false,
      error instanceof Error ? error : undefined
    )
    recordLLMFailure(provider.providerType)
    throw error
  }
}

/**
 * Estimate tokens for a generation request
 */
export function estimateTokens(
  providerName: LLMProviderType | 'chatgpt' | 'grok' | 'claude',
  systemPrompt: string,
  messages: { role: string; content: string }[],
  maxOutputTokens: number
): number {
  const provider = ['chatgpt', 'grok', 'claude', 'gemini'].includes(providerName)
    ? getDebateProvider(providerName as 'chatgpt' | 'grok' | 'claude' | 'gemini')
    : getProvider(providerName as LLMProviderType)

  return provider.countMessagesTokens(systemPrompt, messages) + maxOutputTokens
}
