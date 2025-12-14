/**
 * Gemini LLM provider for Google's Generative AI.
 * Used as an independent juror in the evidence review system.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

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

export const GEMINI_MODEL = 'gemini-2.0-flash'

export class GeminiProvider extends BaseLLMProvider {
  readonly providerType: LLMProviderType = 'gemini'
  readonly info: ProviderInfo = {
    name: 'Gemini',
    provider: 'gemini',
    model: GEMINI_MODEL,
    maxContextTokens: 1048576,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    costPer1kInput: 0.075,
    costPer1kOutput: 0.3,
  }

  private client: GoogleGenerativeAI | null = null

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      const apiKey = process.env.GOOGLE_API_KEY
      if (!apiKey) {
        throw new LLMError('GOOGLE_API_KEY not configured', 'auth_error', 'gemini')
      }
      this.client = new GoogleGenerativeAI(apiKey)
    }
    return this.client
  }

  isConfigured(): boolean {
    return !!process.env.GOOGLE_API_KEY
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
      const model = client.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: params.systemPrompt,
      })

      const contents = params.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      const response = await model.generateContent({
        contents,
        generationConfig: {
          maxOutputTokens: params.maxTokens,
          temperature: params.temperature ?? 0.7,
          ...(params.stopSequences && { stopSequences: params.stopSequences }),
        },
      })

      const result = response.response
      const content = result.text()
      const finishReason = result.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : 'max_tokens'

      const inputTokens = this.countMessagesTokens(params.systemPrompt, params.messages)
      const outputTokens = this.countTokens(content)

      return {
        content,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        finishReason,
        latencyMs: Date.now() - startTime,
        provider: 'gemini',
        model: GEMINI_MODEL,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async *generateStream(params: GenerateParams): AsyncGenerator<StreamChunk, void, unknown> {
    const client = this.getClient()

    try {
      const model = client.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: params.systemPrompt,
      })

      const contents = params.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      const stream = await model.generateContentStream({
        contents,
        generationConfig: {
          maxOutputTokens: params.maxTokens,
          temperature: params.temperature ?? 0.7,
          ...(params.stopSequences && { stopSequences: params.stopSequences }),
        },
      })

      for await (const chunk of stream.stream) {
        const text = chunk.text()
        const finishReason = chunk.candidates?.[0]?.finishReason

        yield {
          content: text,
          isComplete: !!finishReason,
          finishReason:
            finishReason === 'STOP'
              ? 'stop'
              : finishReason === 'MAX_TOKENS'
                ? 'max_tokens'
                : undefined,
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
      const model = client.getGenerativeModel({ model: GEMINI_MODEL })
      await model.generateContent('Hi')

      return {
        provider: 'gemini',
        isHealthy: true,
        lastCheck: new Date(),
        latencyMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        provider: 'gemini',
        isHealthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private handleError(error: unknown): LLMError {
    if (error instanceof Error) {
      const type = this.mapErrorType(error.message)
      const retryable = type === 'rate_limit' || type === 'server_error'

      return new LLMError(error.message, type, 'gemini', undefined, retryable)
    }

    return new LLMError('Unknown error', 'unknown', 'gemini')
  }

  private mapErrorType(message: string): LLMErrorType {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('resource_exhausted') || lowerMessage.includes('quota')) {
      return 'rate_limit'
    }
    if (lowerMessage.includes('unauthenticated') || lowerMessage.includes('api key')) {
      return 'auth_error'
    }
    if (lowerMessage.includes('invalid_argument') || lowerMessage.includes('invalid')) {
      return 'invalid_request'
    }
    if (lowerMessage.includes('internal') || lowerMessage.includes('unavailable')) {
      return 'server_error'
    }
    if (lowerMessage.includes('timeout')) {
      return 'timeout'
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'network_error'
    }

    return 'unknown'
  }
}
