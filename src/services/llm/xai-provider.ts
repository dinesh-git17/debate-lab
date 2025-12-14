// src/services/llm/xai-provider.ts

import OpenAI from 'openai'

import { LLMError } from '@/types/llm'

import { BaseLLMProvider } from './base-provider'

import type {
  GenerateParams,
  GenerateResult,
  LLMErrorType,
  LLMProviderType,
  ProviderHealth,
  ProviderInfo,
  StreamChunk,
} from '@/types/llm'

export const XAI_MODEL = 'grok-4-1-fast-reasoning'
const BASE_URL = 'https://api.x.ai/v1'

export class XAIProvider extends BaseLLMProvider {
  readonly providerType: LLMProviderType = 'xai'
  readonly info: ProviderInfo = {
    name: 'Grok',
    provider: 'xai',
    model: XAI_MODEL,
    maxContextTokens: 131072,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
  }

  private client: OpenAI | null = null

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.XAI_API_KEY
      if (!apiKey) {
        throw new LLMError('XAI_API_KEY not configured', 'auth_error', 'xai')
      }
      this.client = new OpenAI({
        apiKey,
        baseURL: BASE_URL,
      })
    }
    return this.client
  }

  isConfigured(): boolean {
    return !!process.env.XAI_API_KEY
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  countMessagesTokens(systemPrompt: string, messages: { role: string; content: string }[]): number {
    let total = this.countTokens(systemPrompt) + 4

    for (const msg of messages) {
      total += this.countTokens(msg.content) + 4
    }

    total += 2
    return total
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const client = this.getClient()
    const startTime = Date.now()

    try {
      const response = await client.chat.completions.create({
        model: XAI_MODEL,
        messages: [
          { role: 'system', content: params.systemPrompt },
          ...params.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens: params.maxTokens,
        temperature: params.temperature ?? 0.7,
        ...(params.stopSequences ? { stop: params.stopSequences } : {}),
      })

      const choice = response.choices[0]
      const content = choice?.message?.content ?? ''
      const finishReason = choice?.finish_reason === 'stop' ? 'stop' : 'max_tokens'

      return {
        content,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
        finishReason,
        latencyMs: Date.now() - startTime,
        provider: 'xai',
        model: XAI_MODEL,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async *generateStream(params: GenerateParams): AsyncGenerator<StreamChunk, void, unknown> {
    const client = this.getClient()

    try {
      const stream = await client.chat.completions.create({
        model: XAI_MODEL,
        messages: [
          { role: 'system', content: params.systemPrompt },
          ...params.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens: params.maxTokens,
        temperature: params.temperature ?? 0.7,
        ...(params.stopSequences ? { stop: params.stopSequences } : {}),
        stream: true,
      })

      for await (const chunk of stream) {
        const choice = chunk.choices[0]
        const delta = choice?.delta?.content ?? ''
        const finishReason = choice?.finish_reason

        yield {
          content: delta,
          isComplete: !!finishReason,
          finishReason:
            finishReason === 'stop' ? 'stop' : finishReason === 'length' ? 'max_tokens' : undefined,
        }
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    const startTime = Date.now()

    try {
      const client = this.getClient()
      await client.models.list()

      return {
        provider: 'xai',
        isHealthy: true,
        lastCheck: new Date(),
        latencyMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        provider: 'xai',
        isHealthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private handleError(error: unknown): LLMError {
    if (error instanceof OpenAI.APIError) {
      const type = this.mapErrorType(error.status, error.code)
      const retryable = error.status === 429 || (error.status !== undefined && error.status >= 500)

      return new LLMError(error.message, type, 'xai', error.status, retryable)
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return new LLMError(error.message, 'timeout', 'xai', undefined, true)
      }
      if (error.message.includes('network')) {
        return new LLMError(error.message, 'network_error', 'xai', undefined, true)
      }
    }

    return new LLMError(error instanceof Error ? error.message : 'Unknown error', 'unknown', 'xai')
  }

  private mapErrorType(status?: number, code?: string | null): LLMErrorType {
    if (status === 401) return 'auth_error'
    if (status === 429) return 'rate_limit'
    if (status === 400) {
      if (code === 'context_length_exceeded') return 'context_length'
      return 'invalid_request'
    }
    if (status !== undefined && status >= 500) return 'server_error'
    return 'unknown'
  }
}
