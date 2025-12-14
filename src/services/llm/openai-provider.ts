// src/services/llm/openai-provider.ts

import OpenAI from 'openai'
import { encoding_for_model } from 'tiktoken'

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
import type { TiktokenModel } from 'tiktoken'

export const OPENAI_MODEL = 'gpt-5.1'
const TIKTOKEN_MODEL: TiktokenModel = 'gpt-4'

export class OpenAIProvider extends BaseLLMProvider {
  readonly providerType: LLMProviderType = 'openai'
  readonly info: ProviderInfo = {
    name: 'ChatGPT',
    provider: 'openai',
    model: OPENAI_MODEL,
    maxContextTokens: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  }

  private client: OpenAI | null = null
  private encoder: ReturnType<typeof encoding_for_model> | null = null

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new LLMError('OPENAI_API_KEY not configured', 'auth_error', 'openai')
      }
      this.client = new OpenAI({ apiKey })
    }
    return this.client
  }

  private getEncoder() {
    if (!this.encoder) {
      this.encoder = encoding_for_model(TIKTOKEN_MODEL)
    }
    return this.encoder
  }

  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY
  }

  countTokens(text: string): number {
    try {
      const encoder = this.getEncoder()
      return encoder.encode(text).length
    } catch {
      return Math.ceil(text.length / 4)
    }
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
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: params.systemPrompt },
          ...params.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_completion_tokens: params.maxTokens,
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
        provider: 'openai',
        model: OPENAI_MODEL,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async *generateStream(params: GenerateParams): AsyncGenerator<StreamChunk, void, unknown> {
    const client = this.getClient()

    try {
      const stream = await client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: params.systemPrompt },
          ...params.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_completion_tokens: params.maxTokens,
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
      await client.models.retrieve(OPENAI_MODEL)

      return {
        provider: 'openai',
        isHealthy: true,
        lastCheck: new Date(),
        latencyMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        provider: 'openai',
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
      const retryAfterHeader = error.headers?.['retry-after']
      const retryAfter =
        typeof retryAfterHeader === 'string' ? parseInt(retryAfterHeader) * 1000 : undefined

      return new LLMError(error.message, type, 'openai', error.status, retryable, retryAfter)
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return new LLMError(error.message, 'timeout', 'openai', undefined, true)
      }
      if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        return new LLMError(error.message, 'network_error', 'openai', undefined, true)
      }
    }

    return new LLMError(
      error instanceof Error ? error.message : 'Unknown error',
      'unknown',
      'openai'
    )
  }

  private mapErrorType(status?: number, code?: string | null): LLMErrorType {
    if (status === 401) return 'auth_error'
    if (status === 429) return 'rate_limit'
    if (status === 400) {
      if (code === 'context_length_exceeded') return 'context_length'
      if (code === 'content_filter') return 'content_filter'
      return 'invalid_request'
    }
    if (status !== undefined && status >= 500) return 'server_error'
    return 'unknown'
  }
}
