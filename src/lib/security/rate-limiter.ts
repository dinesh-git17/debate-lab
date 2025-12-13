// rate-limiter.ts
/**
 * Rate limiting with pluggable store interface.
 * Provides IP, session, debate creation, and API rate limits with active debate tracking.
 */

import type {
  RateLimitConfig,
  RateLimitResult,
  SecurityRateLimitState,
  SecurityRateLimitStore,
  RateLimitType,
} from '@/types/security'

const RATE_LIMIT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
  ip: {
    type: 'ip',
    maxRequests: 100,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:ip:',
  },
  session: {
    type: 'session',
    maxRequests: 200,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:session:',
  },
  debate_creation: {
    type: 'debate_creation',
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'rl:debate:',
  },
  api: {
    type: 'api',
    maxRequests: 50,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:api:',
  },
}

class MemoryRateLimitStore implements SecurityRateLimitStore {
  private store = new Map<string, SecurityRateLimitState>()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.startCleanup()
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, state] of this.store.entries()) {
        if (state.resetAt < now) {
          this.store.delete(key)
        }
      }
    }, 60 * 1000)
  }

  async get(key: string): Promise<SecurityRateLimitState | null> {
    const state = this.store.get(key)
    if (!state) {
      return null
    }
    if (state.resetAt < Date.now()) {
      this.store.delete(key)
      return null
    }
    return state
  }

  async set(key: string, state: SecurityRateLimitState, _ttlMs: number): Promise<void> {
    this.store.set(key, state)
  }

  async increment(key: string, windowMs: number): Promise<SecurityRateLimitState> {
    const now = Date.now()
    const existing = await this.get(key)

    if (existing && existing.resetAt > now) {
      existing.count++
      this.store.set(key, existing)
      return existing
    }

    const newState: SecurityRateLimitState = {
      count: 1,
      resetAt: now + windowMs,
    }
    this.store.set(key, newState)
    return newState
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

let storeInstance: SecurityRateLimitStore | null = null

export function getRateLimitStore(): SecurityRateLimitStore {
  if (!storeInstance) {
    storeInstance = new MemoryRateLimitStore()
  }
  return storeInstance
}

export function setRateLimitStore(store: SecurityRateLimitStore): void {
  storeInstance = store
}

export async function checkRateLimit(
  identifier: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[type]
  const store = getRateLimitStore()
  const key = `${config.keyPrefix}${identifier}`

  const state = await store.increment(key, config.windowMs)
  const remaining = Math.max(0, config.maxRequests - state.count)
  const allowed = state.count <= config.maxRequests

  return {
    allowed,
    remaining,
    resetAt: new Date(state.resetAt),
    retryAfterMs: allowed ? null : state.resetAt - Date.now(),
  }
}

export async function isRateLimited(identifier: string, type: RateLimitType): Promise<boolean> {
  const result = await checkRateLimit(identifier, type)
  return !result.allowed
}

export async function getRateLimitHeaders(
  identifier: string,
  type: RateLimitType
): Promise<Record<string, string>> {
  const result = await checkRateLimit(identifier, type)
  const config = RATE_LIMIT_CONFIGS[type]

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt.getTime() / 1000).toString(),
  }

  if (!result.allowed && result.retryAfterMs) {
    headers['Retry-After'] = Math.ceil(result.retryAfterMs / 1000).toString()
  }

  return headers
}

export function getRateLimitConfig(type: RateLimitType): RateLimitConfig {
  return { ...RATE_LIMIT_CONFIGS[type] }
}

export function updateRateLimitConfig(
  type: RateLimitType,
  updates: Partial<Omit<RateLimitConfig, 'type' | 'keyPrefix'>>
): void {
  const config = RATE_LIMIT_CONFIGS[type]
  if (updates.maxRequests !== undefined) {
    config.maxRequests = updates.maxRequests
  }
  if (updates.windowMs !== undefined) {
    config.windowMs = updates.windowMs
  }
}

const activeDebates = new Map<string, Set<string>>()

export function trackActiveDebate(sessionId: string, debateId: string): boolean {
  let debates = activeDebates.get(sessionId)
  if (!debates) {
    debates = new Set()
    activeDebates.set(sessionId, debates)
  }

  const maxActiveDebates = 5
  if (debates.size >= maxActiveDebates && !debates.has(debateId)) {
    return false
  }

  debates.add(debateId)
  return true
}

export function releaseActiveDebate(sessionId: string, debateId: string): void {
  const debates = activeDebates.get(sessionId)
  if (debates) {
    debates.delete(debateId)
    if (debates.size === 0) {
      activeDebates.delete(sessionId)
    }
  }
}

export function getActiveDebateCount(sessionId: string): number {
  return activeDebates.get(sessionId)?.size ?? 0
}

export function clearActiveDebates(sessionId: string): void {
  activeDebates.delete(sessionId)
}
