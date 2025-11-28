// src/lib/logging/__tests__/logger.test.ts
// Unit tests for structured logger

import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  logger,
  createRequestLogger,
  createDebateLogger,
  createProviderLogger,
  logRequest,
  logDebateEvent,
  logLLMRequest,
  logSecurityEvent,
} from '../logger'

// Mock the supabase writer to prevent actual DB writes
vi.mock('../supabase-writer', () => ({
  supabaseLogWriter: {
    writeLog: vi.fn(),
    writeDebateEvent: vi.fn(),
    writeLLMRequest: vi.fn(),
  },
}))

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('logger instance', () => {
    it('should create child logger with context', () => {
      const childLogger = logger.child({ requestId: 'test-123' })

      expect(childLogger).toBeDefined()
      expect(typeof childLogger.info).toBe('function')
      expect(typeof childLogger.error).toBe('function')
    })

    it('should log at different levels without throwing', () => {
      expect(() => logger.debug('Debug message')).not.toThrow()
      expect(() => logger.info('Info message')).not.toThrow()
      expect(() => logger.warn('Warning message')).not.toThrow()
      expect(() => logger.error('Error message')).not.toThrow()
    })

    it('should include context in logs', () => {
      expect(() => logger.info('Test message', { debateId: 'debate-123' })).not.toThrow()
    })

    it('should log errors with error object', () => {
      const error = new Error('Test error')

      expect(() => logger.error('Error occurred', error)).not.toThrow()
    })

    it('should handle null error gracefully', () => {
      expect(() => logger.error('Error occurred', null)).not.toThrow()
    })
  })

  describe('createRequestLogger', () => {
    it('should create logger with request context', () => {
      const requestLogger = createRequestLogger('req-123', '/api/debate', 'POST')

      expect(requestLogger).toBeDefined()
      expect(typeof requestLogger.info).toBe('function')
    })

    it('should chain context correctly', () => {
      const requestLogger = createRequestLogger('req-123', '/api/debate', 'POST')
      const childLogger = requestLogger.child({ additional: 'context' })

      expect(childLogger).toBeDefined()
    })
  })

  describe('createDebateLogger', () => {
    it('should create logger with debate context', () => {
      const debateLogger = createDebateLogger('debate-123', 'req-456')

      expect(debateLogger).toBeDefined()
    })

    it('should work without request ID', () => {
      const debateLogger = createDebateLogger('debate-123')

      expect(debateLogger).toBeDefined()
    })
  })

  describe('createProviderLogger', () => {
    it('should create logger with provider context', () => {
      const providerLogger = createProviderLogger('openai', 'debate-123')

      expect(providerLogger).toBeDefined()
    })

    it('should work without debate ID', () => {
      const providerLogger = createProviderLogger('openai')

      expect(providerLogger).toBeDefined()
    })
  })

  describe('logRequest', () => {
    it('should log successful request (2xx)', () => {
      expect(() => logRequest('req-123', 'GET', '/api/health', 200, 50)).not.toThrow()
    })

    it('should log client error request (4xx)', () => {
      expect(() => logRequest('req-123', 'POST', '/api/debate', 400, 100)).not.toThrow()
    })

    it('should log server error request (5xx)', () => {
      expect(() => logRequest('req-123', 'POST', '/api/debate', 500, 100)).not.toThrow()
    })

    it('should include additional context', () => {
      expect(() =>
        logRequest('req-123', 'POST', '/api/debate', 201, 150, {
          debateId: 'debate-123',
        })
      ).not.toThrow()
    })
  })

  describe('logDebateEvent', () => {
    it('should log debate events', () => {
      expect(() =>
        logDebateEvent('started', 'debate-123', { topic: 'AI Regulation' })
      ).not.toThrow()
    })

    it('should log events without additional context', () => {
      expect(() => logDebateEvent('completed', 'debate-123')).not.toThrow()
    })

    it('should handle various event types', () => {
      const events = ['started', 'paused', 'resumed', 'completed', 'error']

      for (const event of events) {
        expect(() => logDebateEvent(event, 'debate-123')).not.toThrow()
      }
    })
  })

  describe('logLLMRequest', () => {
    it('should log successful LLM request', () => {
      expect(() =>
        logLLMRequest('openai', 'debate-123', 1, 500, { prompt: 100, completion: 150 }, true)
      ).not.toThrow()
    })

    it('should log failed LLM request', () => {
      const error = new Error('API rate limited')

      expect(() =>
        logLLMRequest(
          'anthropic',
          'debate-123',
          2,
          1000,
          { prompt: 100, completion: 0 },
          false,
          error
        )
      ).not.toThrow()
    })

    it('should include model information when provided', () => {
      expect(() =>
        logLLMRequest(
          'openai',
          'debate-123',
          1,
          500,
          { prompt: 100, completion: 150 },
          true,
          undefined,
          'gpt-4',
          'req-123'
        )
      ).not.toThrow()
    })
  })

  describe('logSecurityEvent', () => {
    it('should log low severity security events', () => {
      expect(() =>
        logSecurityEvent('suspicious_activity', 'low', {
          ip: '192.168.1.1',
          endpoint: '/api/debate',
        })
      ).not.toThrow()
    })

    it('should log medium severity security events', () => {
      expect(() =>
        logSecurityEvent('rate_limit_warning', 'medium', {
          ip: '192.168.1.1',
          requestCount: 50,
        })
      ).not.toThrow()
    })

    it('should log high severity security events', () => {
      expect(() =>
        logSecurityEvent('rate_limit_exceeded', 'high', {
          ip: '192.168.1.1',
          endpoint: '/api/debate',
        })
      ).not.toThrow()
    })

    it('should log critical security events', () => {
      expect(() =>
        logSecurityEvent('injection_attempt', 'critical', {
          ip: '10.0.0.1',
          payload: 'Ignore instructions',
        })
      ).not.toThrow()
    })
  })
})
