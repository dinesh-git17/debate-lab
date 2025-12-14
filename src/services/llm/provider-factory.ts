// src/services/llm/provider-factory.ts

import { AnthropicProvider } from './anthropic-provider'
import { BaseLLMProvider } from './base-provider'
import { DeepSeekProvider } from './deepseek-provider'
import { GeminiProvider } from './gemini-provider'
import { OpenAIProvider } from './openai-provider'
import { XAIProvider } from './xai-provider'

import type { LLMProviderType, ProviderHealth } from '@/types/llm'

let openaiProvider: OpenAIProvider | null = null
let anthropicProvider: AnthropicProvider | null = null
let xaiProvider: XAIProvider | null = null
let geminiProvider: GeminiProvider | null = null
let deepseekProvider: DeepSeekProvider | null = null

/**
 * Get a provider instance by type
 */
export function getProvider(type: LLMProviderType): BaseLLMProvider {
  switch (type) {
    case 'openai':
      if (!openaiProvider) {
        openaiProvider = new OpenAIProvider()
      }
      return openaiProvider

    case 'anthropic':
      if (!anthropicProvider) {
        anthropicProvider = new AnthropicProvider()
      }
      return anthropicProvider

    case 'xai':
      if (!xaiProvider) {
        xaiProvider = new XAIProvider()
      }
      return xaiProvider

    case 'gemini':
      if (!geminiProvider) {
        geminiProvider = new GeminiProvider()
      }
      return geminiProvider

    case 'deepseek':
      if (!deepseekProvider) {
        deepseekProvider = new DeepSeekProvider()
      }
      return deepseekProvider

    default: {
      const exhaustiveCheck: never = type
      throw new Error(`Unknown provider type: ${exhaustiveCheck}`)
    }
  }
}

/**
 * Get provider for jury deliberation roles
 */
export function getJurorProvider(role: 'gemini' | 'deepseek'): BaseLLMProvider {
  return getProvider(role)
}

/**
 * Get provider for a debate role
 */
export function getDebateProvider(role: 'chatgpt' | 'grok' | 'claude'): BaseLLMProvider {
  switch (role) {
    case 'chatgpt':
      return getProvider('openai')
    case 'grok':
      return getProvider('xai')
    case 'claude':
      return getProvider('anthropic')
  }
}

/**
 * Check which providers are configured
 */
export function getConfiguredProviders(): LLMProviderType[] {
  const configured: LLMProviderType[] = []

  if (process.env.OPENAI_API_KEY) configured.push('openai')
  if (process.env.ANTHROPIC_API_KEY) configured.push('anthropic')
  if (process.env.XAI_API_KEY) configured.push('xai')
  if (process.env.GOOGLE_API_KEY) configured.push('gemini')
  if (process.env.DEEPSEEK_API_KEY) configured.push('deepseek')

  return configured
}

/**
 * Check health of all configured providers
 */
export async function checkAllProvidersHealth(): Promise<ProviderHealth[]> {
  const configured = getConfiguredProviders()
  const results: ProviderHealth[] = []

  for (const type of configured) {
    const provider = getProvider(type)
    const health = await provider.checkHealth()
    results.push(health)
  }

  return results
}

/**
 * Get info for all providers
 */
export function getAllProviderInfo() {
  return {
    openai: new OpenAIProvider().info,
    anthropic: new AnthropicProvider().info,
    xai: new XAIProvider().info,
    gemini: new GeminiProvider().info,
    deepseek: new DeepSeekProvider().info,
  }
}

/**
 * Reset provider instances (for testing)
 */
export function resetProviders(): void {
  openaiProvider = null
  anthropicProvider = null
  xaiProvider = null
  geminiProvider = null
  deepseekProvider = null
}
