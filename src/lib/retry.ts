// retry.ts
/**
 * Exponential backoff retry utility for LLM API calls.
 * Supports configurable delays, jitter, and provider-specific retry hints.
 */

import { LLMError } from '@/types/llm'

export interface RetryOptions {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableErrors: string[]
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['rate_limit', 'server_error', 'network_error', 'timeout'],
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function calculateDelay(attempt: number, options: RetryOptions, retryAfterMs?: number): number {
  if (retryAfterMs) {
    return Math.min(retryAfterMs, options.maxDelayMs)
  }

  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt)
  const jitter = delay * 0.2 * (Math.random() * 2 - 1)

  return Math.min(delay + jitter, options.maxDelayMs)
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      const isRetryable =
        error instanceof LLMError
          ? error.retryable || opts.retryableErrors.includes(error.type)
          : false

      if (attempt >= opts.maxRetries || !isRetryable) {
        throw error
      }

      const retryAfterMs = error instanceof LLMError ? error.retryAfterMs : undefined
      const delay = calculateDelay(attempt, opts, retryAfterMs)

      await sleep(delay)
    }
  }

  throw lastError
}

export function createRetryWrapper(options: Partial<RetryOptions> = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  return <T>(fn: () => Promise<T>) => withRetry(fn, opts)
}
