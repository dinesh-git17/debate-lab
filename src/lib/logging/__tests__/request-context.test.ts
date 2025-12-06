// src/lib/logging/__tests__/request-context.test.ts
// Unit tests for request context management

import { describe, it, expect } from 'vitest'

import {
  generateRequestId,
  runWithRequestContext,
  getRequestContext,
  getRequestId,
  setDebateId,
  setSessionId,
  startSpan,
  endSpan,
  withSpan,
  withSpanAsync,
  getRequestTrace,
  getElapsedTime,
} from '../request-context'

describe('request-context', () => {
  describe('generateRequestId', () => {
    it('should generate a nanoid', () => {
      const id = generateRequestId()

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBe(21)
    })

    it('should generate unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateRequestId())
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(100)
    })
  })

  describe('runWithRequestContext', () => {
    it('should create a context for synchronous function', () => {
      const result = runWithRequestContext('test-req-1', () => {
        const ctx = getRequestContext()
        return ctx?.requestId
      })

      expect(result).toBe('test-req-1')
    })

    it('should create a context for async function', async () => {
      const result = await runWithRequestContext('test-req-2', async () => {
        await Promise.resolve()
        const ctx = getRequestContext()
        return ctx?.requestId
      })

      expect(result).toBe('test-req-2')
    })

    it('should initialize spans as empty array', () => {
      runWithRequestContext('test-req-3', () => {
        const ctx = getRequestContext()
        expect(ctx?.spans).toEqual([])
      })
    })

    it('should set startTime', () => {
      runWithRequestContext('test-req-4', () => {
        const ctx = getRequestContext()
        expect(ctx?.startTime).toBeDefined()
        expect(typeof ctx?.startTime).toBe('number')
      })
    })
  })

  describe('getRequestContext', () => {
    it('should return undefined outside of context', () => {
      expect(getRequestContext()).toBeUndefined()
    })

    it('should return context within runWithRequestContext', () => {
      runWithRequestContext('test-ctx', () => {
        const ctx = getRequestContext()
        expect(ctx).toBeDefined()
        expect(ctx?.requestId).toBe('test-ctx')
      })
    })
  })

  describe('getRequestId', () => {
    it('should return undefined outside of context', () => {
      expect(getRequestId()).toBeUndefined()
    })

    it('should return requestId within context', () => {
      runWithRequestContext('req-id-test', () => {
        expect(getRequestId()).toBe('req-id-test')
      })
    })
  })

  describe('setDebateId', () => {
    it('should not throw outside of context', () => {
      expect(() => setDebateId('debate-1')).not.toThrow()
    })

    it('should set debateId within context', () => {
      runWithRequestContext('req-1', () => {
        setDebateId('debate-123')
        const ctx = getRequestContext()
        expect(ctx?.debateId).toBe('debate-123')
      })
    })
  })

  describe('setSessionId', () => {
    it('should not throw outside of context', () => {
      expect(() => setSessionId('session-1')).not.toThrow()
    })

    it('should set sessionId within context', () => {
      runWithRequestContext('req-2', () => {
        setSessionId('session-456')
        const ctx = getRequestContext()
        expect(ctx?.sessionId).toBe('session-456')
      })
    })
  })

  describe('startSpan', () => {
    it('should create a span with name', () => {
      const span = startSpan('test-span')

      expect(span.name).toBe('test-span')
      expect(span.status).toBe('ok')
      expect(span.startTime).toBeDefined()
    })

    it('should include attributes', () => {
      const span = startSpan('test-span', { key: 'value' })

      expect(span.attributes).toEqual({ key: 'value' })
    })

    it('should add span to context when within context', () => {
      runWithRequestContext('req-span', () => {
        const span = startSpan('my-span')
        const ctx = getRequestContext()

        expect(ctx?.spans).toContain(span)
      })
    })

    it('should work outside of context', () => {
      const span = startSpan('orphan-span')
      expect(span.name).toBe('orphan-span')
    })
  })

  describe('endSpan', () => {
    it('should set endTime', () => {
      const span = startSpan('test')
      endSpan(span)

      expect(span.endTime).toBeDefined()
    })

    it('should set status to ok by default', () => {
      const span = startSpan('test')
      endSpan(span)

      expect(span.status).toBe('ok')
    })

    it('should set status to error when specified', () => {
      const span = startSpan('test')
      endSpan(span, 'error', 'Something went wrong')

      expect(span.status).toBe('error')
      expect(span.error).toBe('Something went wrong')
    })

    it('should not set error when status is ok', () => {
      const span = startSpan('test')
      endSpan(span, 'ok')

      expect(span.error).toBeUndefined()
    })
  })

  describe('withSpan', () => {
    it('should execute function and return result', () => {
      const result = withSpan('test', () => 42)
      expect(result).toBe(42)
    })

    it('should end span with ok status on success', () => {
      runWithRequestContext('req-withspan', () => {
        withSpan('successful-span', () => 'success')
        const ctx = getRequestContext()
        const span = ctx?.spans[0]

        expect(span?.status).toBe('ok')
        expect(span?.endTime).toBeDefined()
      })
    })

    it('should end span with error status on throw', () => {
      runWithRequestContext('req-error', () => {
        expect(() =>
          withSpan('failing-span', () => {
            throw new Error('Test error')
          })
        ).toThrow('Test error')

        const ctx = getRequestContext()
        const span = ctx?.spans[0]

        expect(span?.status).toBe('error')
        expect(span?.error).toBe('Test error')
      })
    })

    it('should handle non-Error throws', () => {
      runWithRequestContext('req-string-error', () => {
        expect(() =>
          withSpan('string-throw', () => {
            throw 'string error'
          })
        ).toThrow('string error')

        const ctx = getRequestContext()
        const span = ctx?.spans[0]

        expect(span?.error).toBe('string error')
      })
    })

    it('should include attributes', () => {
      runWithRequestContext('req-attrs', () => {
        withSpan('span-with-attrs', () => 'result', { foo: 'bar' })
        const ctx = getRequestContext()
        const span = ctx?.spans[0]

        expect(span?.attributes).toEqual({ foo: 'bar' })
      })
    })
  })

  describe('withSpanAsync', () => {
    it('should execute async function and return result', async () => {
      const result = await withSpanAsync('test', async () => {
        await Promise.resolve()
        return 42
      })
      expect(result).toBe(42)
    })

    it('should end span with ok status on success', async () => {
      await runWithRequestContext('req-async', async () => {
        await withSpanAsync('async-span', async () => 'success')
        const ctx = getRequestContext()
        const span = ctx?.spans[0]

        expect(span?.status).toBe('ok')
        expect(span?.endTime).toBeDefined()
      })
    })

    it('should end span with error status on rejection', async () => {
      await runWithRequestContext('req-async-error', async () => {
        await expect(
          withSpanAsync('failing-async-span', async () => {
            throw new Error('Async error')
          })
        ).rejects.toThrow('Async error')

        const ctx = getRequestContext()
        const span = ctx?.spans[0]

        expect(span?.status).toBe('error')
        expect(span?.error).toBe('Async error')
      })
    })

    it('should handle non-Error async throws', async () => {
      await runWithRequestContext('req-async-string', async () => {
        await expect(
          withSpanAsync('string-async-throw', async () => {
            throw 'async string error'
          })
        ).rejects.toBe('async string error')

        const ctx = getRequestContext()
        const span = ctx?.spans[0]

        expect(span?.error).toBe('async string error')
      })
    })
  })

  describe('getRequestTrace', () => {
    it('should return null outside of context', () => {
      expect(getRequestTrace()).toBeNull()
    })

    it('should return trace within context', () => {
      runWithRequestContext('trace-req', () => {
        setDebateId('debate-trace')
        startSpan('span1')

        const trace = getRequestTrace()

        expect(trace).not.toBeNull()
        expect(trace?.requestId).toBe('trace-req')
        expect(trace?.debateId).toBe('debate-trace')
        expect(trace?.spans).toHaveLength(1)
      })
    })

    it('should have empty endpoint and method', () => {
      runWithRequestContext('req', () => {
        const trace = getRequestTrace()
        expect(trace?.endpoint).toBe('')
        expect(trace?.method).toBe('')
      })
    })
  })

  describe('getElapsedTime', () => {
    it('should return 0 outside of context', () => {
      expect(getElapsedTime()).toBe(0)
    })

    it('should return elapsed time within context', async () => {
      await runWithRequestContext('elapsed-req', async () => {
        // Use longer delay with lower threshold to avoid flaky tests in CI
        await new Promise((resolve) => setTimeout(resolve, 50))
        const elapsed = getElapsedTime()

        // Check elapsed > 0 and reasonably close to expected (timers aren't precise in CI)
        expect(elapsed).toBeGreaterThan(0)
        expect(elapsed).toBeLessThan(500) // Sanity check upper bound
      })
    })
  })
})
