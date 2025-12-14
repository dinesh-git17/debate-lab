// rate-limiter.ts
/**
 * Token bucket rate limiter for LLM API calls.
 * Enforces per-provider request and token limits with automatic refill.
 */

import type { LLMProviderType } from '@/types/llm'

interface RateLimitConfig {
  tokensPerMinute: number
  requestsPerMinute: number
}

interface RateLimitBucket {
  tokens: number
  requests: number
  lastRefill: number
}

const PROVIDER_LIMITS: Record<LLMProviderType, RateLimitConfig> = {
  openai: {
    tokensPerMinute: 90000,
    requestsPerMinute: 500,
  },
  anthropic: {
    tokensPerMinute: 100000,
    requestsPerMinute: 1000,
  },
  xai: {
    tokensPerMinute: 60000,
    requestsPerMinute: 300,
  },
  gemini: {
    tokensPerMinute: 1000000,
    requestsPerMinute: 1000,
  },
  deepseek: {
    tokensPerMinute: 60000,
    requestsPerMinute: 300,
  },
}

const buckets = new Map<LLMProviderType, RateLimitBucket>()

function getBucket(provider: LLMProviderType): RateLimitBucket {
  const existing = buckets.get(provider)
  if (existing) {
    return existing
  }

  const limits = PROVIDER_LIMITS[provider]
  const bucket: RateLimitBucket = {
    tokens: limits.tokensPerMinute,
    requests: limits.requestsPerMinute,
    lastRefill: Date.now(),
  }
  buckets.set(provider, bucket)
  return bucket
}

function refillBucket(provider: LLMProviderType): void {
  const bucket = getBucket(provider)
  const limits = PROVIDER_LIMITS[provider]
  const now = Date.now()
  const elapsed = now - bucket.lastRefill

  if (elapsed >= 60000) {
    bucket.tokens = limits.tokensPerMinute
    bucket.requests = limits.requestsPerMinute
    bucket.lastRefill = now
  } else {
    const refillRatio = elapsed / 60000
    bucket.tokens = Math.min(
      limits.tokensPerMinute,
      bucket.tokens + limits.tokensPerMinute * refillRatio
    )
    bucket.requests = Math.min(
      limits.requestsPerMinute,
      bucket.requests + limits.requestsPerMinute * refillRatio
    )
    bucket.lastRefill = now
  }
}

export function canMakeRequest(provider: LLMProviderType, estimatedTokens: number): boolean {
  refillBucket(provider)
  const bucket = getBucket(provider)

  return bucket.requests >= 1 && bucket.tokens >= estimatedTokens
}

export function consumeCapacity(provider: LLMProviderType, tokens: number): void {
  const bucket = getBucket(provider)
  bucket.requests -= 1
  bucket.tokens -= tokens
}

export function getResetTime(provider: LLMProviderType): number {
  const bucket = getBucket(provider)
  const elapsed = Date.now() - bucket.lastRefill
  return Math.max(0, 60000 - elapsed)
}

export function getRateLimitState(provider: LLMProviderType) {
  refillBucket(provider)
  const bucket = getBucket(provider)
  const limits = PROVIDER_LIMITS[provider]

  return {
    tokensRemaining: Math.floor(bucket.tokens),
    tokensLimit: limits.tokensPerMinute,
    requestsRemaining: Math.floor(bucket.requests),
    requestsLimit: limits.requestsPerMinute,
    resetInMs: getResetTime(provider),
  }
}

export async function waitForCapacity(
  provider: LLMProviderType,
  estimatedTokens: number
): Promise<void> {
  while (!canMakeRequest(provider, estimatedTokens)) {
    const resetTime = getResetTime(provider)
    const waitTime = Math.min(resetTime + 100, 5000)

    await new Promise((resolve) => setTimeout(resolve, waitTime))
  }
}

export function resetRateLimits(): void {
  buckets.clear()
}
