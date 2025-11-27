// src/__tests__/security/rate-limiter.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  checkRateLimit,
  isRateLimited,
  getRateLimitHeaders,
  getRateLimitConfig,
  updateRateLimitConfig,
  trackActiveDebate,
  releaseActiveDebate,
  getActiveDebateCount,
  clearActiveDebates,
} from '@/lib/security/rate-limiter'

describe('rate-limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await checkRateLimit('test-ip-1', 'ip')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99)
    })

    it('should track request counts', async () => {
      const ip = 'test-ip-2'

      for (let i = 0; i < 5; i++) {
        await checkRateLimit(ip, 'ip')
      }

      const result = await checkRateLimit(ip, 'ip')
      expect(result.remaining).toBe(94)
    })

    it('should block when limit exceeded', async () => {
      const ip = 'test-ip-3'
      const config = getRateLimitConfig('ip')

      // Exhaust the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await checkRateLimit(ip, 'ip')
      }

      const result = await checkRateLimit(ip, 'ip')
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfterMs).not.toBeNull()
    })

    it('should reset after window expires', async () => {
      const ip = 'test-ip-4'
      const config = getRateLimitConfig('ip')

      // Exhaust the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await checkRateLimit(ip, 'ip')
      }

      let result = await checkRateLimit(ip, 'ip')
      expect(result.allowed).toBe(false)

      // Advance time past window
      vi.advanceTimersByTime(config.windowMs + 1000)

      result = await checkRateLimit(ip, 'ip')
      expect(result.allowed).toBe(true)
    })

    it('should enforce debate creation limits', async () => {
      const ip = 'test-ip-5'
      const config = getRateLimitConfig('debate_creation')

      // Exhaust debate creation limit
      for (let i = 0; i < config.maxRequests; i++) {
        await checkRateLimit(ip, 'debate_creation')
      }

      const result = await checkRateLimit(ip, 'debate_creation')
      expect(result.allowed).toBe(false)
    })
  })

  describe('isRateLimited', () => {
    it('should return false when not limited', async () => {
      const result = await isRateLimited('test-ip-6', 'ip')
      expect(result).toBe(false)
    })

    it('should return true when limited', async () => {
      const ip = 'test-ip-7'
      const config = getRateLimitConfig('ip')

      for (let i = 0; i <= config.maxRequests; i++) {
        await checkRateLimit(ip, 'ip')
      }

      const result = await isRateLimited(ip, 'ip')
      expect(result).toBe(true)
    })
  })

  describe('getRateLimitHeaders', () => {
    it('should return rate limit headers', async () => {
      const headers = await getRateLimitHeaders('test-ip-8', 'ip')

      expect(headers['X-RateLimit-Limit']).toBeDefined()
      expect(headers['X-RateLimit-Remaining']).toBeDefined()
      expect(headers['X-RateLimit-Reset']).toBeDefined()
    })

    it('should include Retry-After when limited', async () => {
      const ip = 'test-ip-9'
      const config = getRateLimitConfig('ip')

      for (let i = 0; i <= config.maxRequests; i++) {
        await checkRateLimit(ip, 'ip')
      }

      const headers = await getRateLimitHeaders(ip, 'ip')
      expect(headers['Retry-After']).toBeDefined()
    })
  })

  describe('getRateLimitConfig', () => {
    it('should return config for ip type', () => {
      const config = getRateLimitConfig('ip')
      expect(config.maxRequests).toBe(100)
      expect(config.windowMs).toBe(60 * 1000)
    })

    it('should return config for debate_creation type', () => {
      const config = getRateLimitConfig('debate_creation')
      expect(config.maxRequests).toBe(10)
      expect(config.windowMs).toBe(60 * 60 * 1000)
    })
  })

  describe('updateRateLimitConfig', () => {
    it('should update maxRequests', () => {
      const original = getRateLimitConfig('api')
      updateRateLimitConfig('api', { maxRequests: 200 })
      const updated = getRateLimitConfig('api')

      expect(updated.maxRequests).toBe(200)

      // Reset
      updateRateLimitConfig('api', { maxRequests: original.maxRequests })
    })

    it('should update windowMs', () => {
      const original = getRateLimitConfig('api')
      updateRateLimitConfig('api', { windowMs: 120 * 1000 })
      const updated = getRateLimitConfig('api')

      expect(updated.windowMs).toBe(120 * 1000)

      // Reset
      updateRateLimitConfig('api', { windowMs: original.windowMs })
    })
  })

  describe('active debate tracking', () => {
    const sessionId = 'test-session-1'

    beforeEach(() => {
      clearActiveDebates(sessionId)
    })

    describe('trackActiveDebate', () => {
      it('should track a new debate', () => {
        const result = trackActiveDebate(sessionId, 'debate-1')
        expect(result).toBe(true)
        expect(getActiveDebateCount(sessionId)).toBe(1)
      })

      it('should allow tracking same debate twice', () => {
        trackActiveDebate(sessionId, 'debate-1')
        const result = trackActiveDebate(sessionId, 'debate-1')
        expect(result).toBe(true)
        expect(getActiveDebateCount(sessionId)).toBe(1)
      })

      it('should allow up to 5 debates', () => {
        for (let i = 1; i <= 5; i++) {
          const result = trackActiveDebate(sessionId, `debate-${i}`)
          expect(result).toBe(true)
        }
        expect(getActiveDebateCount(sessionId)).toBe(5)
      })

      it('should reject 6th debate', () => {
        for (let i = 1; i <= 5; i++) {
          trackActiveDebate(sessionId, `debate-${i}`)
        }
        const result = trackActiveDebate(sessionId, 'debate-6')
        expect(result).toBe(false)
        expect(getActiveDebateCount(sessionId)).toBe(5)
      })
    })

    describe('releaseActiveDebate', () => {
      it('should release a tracked debate', () => {
        trackActiveDebate(sessionId, 'debate-1')
        trackActiveDebate(sessionId, 'debate-2')
        expect(getActiveDebateCount(sessionId)).toBe(2)

        releaseActiveDebate(sessionId, 'debate-1')
        expect(getActiveDebateCount(sessionId)).toBe(1)
      })

      it('should handle releasing non-existent debate', () => {
        trackActiveDebate(sessionId, 'debate-1')
        releaseActiveDebate(sessionId, 'debate-nonexistent')
        expect(getActiveDebateCount(sessionId)).toBe(1)
      })
    })

    describe('getActiveDebateCount', () => {
      it('should return 0 for unknown session', () => {
        expect(getActiveDebateCount('unknown-session')).toBe(0)
      })
    })

    describe('clearActiveDebates', () => {
      it('should clear all debates for session', () => {
        trackActiveDebate(sessionId, 'debate-1')
        trackActiveDebate(sessionId, 'debate-2')
        clearActiveDebates(sessionId)
        expect(getActiveDebateCount(sessionId)).toBe(0)
      })
    })
  })
})
