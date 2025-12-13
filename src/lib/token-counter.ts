// token-counter.ts
/**
 * Token counting utilities using provider-specific tokenizers.
 * Handles context limit checking and text truncation for LLM calls.
 */

import { getProvider } from '@/services/llm/provider-factory'

import type { LLMMessage, LLMProviderType } from '@/types/llm'

export function countTokens(text: string, provider: LLMProviderType = 'openai'): number {
  const providerInstance = getProvider(provider)
  return providerInstance.countTokens(text)
}

export function countMessagesTokens(
  systemPrompt: string,
  messages: LLMMessage[],
  provider: LLMProviderType = 'openai'
): number {
  const providerInstance = getProvider(provider)
  return providerInstance.countMessagesTokens(systemPrompt, messages)
}

export function estimateTurnInputTokens(
  systemPrompt: string,
  debateContext: string,
  turnInstructions: string,
  provider: LLMProviderType = 'openai'
): number {
  const totalText = systemPrompt + debateContext + turnInstructions
  return countTokens(totalText, provider)
}

export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
  provider: LLMProviderType = 'openai'
): string {
  const currentTokens = countTokens(text, provider)

  if (currentTokens <= maxTokens) {
    return text
  }

  let low = 0
  let high = text.length

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    const truncated = text.slice(0, mid)

    if (countTokens(truncated, provider) <= maxTokens) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  const truncated = text.slice(0, low)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > low * 0.8) {
    return truncated.slice(0, lastSpace) + '...'
  }

  return truncated + '...'
}

export function checkContextFits(
  systemPrompt: string,
  debateContext: string,
  maxOutputTokens: number,
  provider: LLMProviderType = 'openai'
): {
  fits: boolean
  inputTokens: number
  maxContextTokens: number
  overflow: number
} {
  const providerInstance = getProvider(provider)
  const maxContext = providerInstance.info.maxContextTokens

  const inputTokens = countTokens(systemPrompt + debateContext, provider)
  const totalNeeded = inputTokens + maxOutputTokens

  return {
    fits: totalNeeded <= maxContext,
    inputTokens,
    maxContextTokens: maxContext,
    overflow: Math.max(0, totalNeeded - maxContext),
  }
}

export function getMaxOutputTokens(provider: LLMProviderType = 'openai'): number {
  const providerInstance = getProvider(provider)
  return providerInstance.info.maxOutputTokens
}

export function getMaxContextTokens(provider: LLMProviderType = 'openai'): number {
  const providerInstance = getProvider(provider)
  return providerInstance.info.maxContextTokens
}

export function getAvailableOutputTokens(
  inputTokens: number,
  provider: LLMProviderType = 'openai'
): number {
  const providerInstance = getProvider(provider)
  const maxContext = providerInstance.info.maxContextTokens
  const maxOutput = providerInstance.info.maxOutputTokens

  const available = maxContext - inputTokens
  return Math.min(available, maxOutput)
}
