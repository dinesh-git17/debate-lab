// src/lib/logging/__tests__/metrics.test.ts
// Unit tests for metrics collection

import { describe, it, expect, beforeEach } from 'vitest'

import {
  metrics,
  recordDebateStarted,
  recordDebateCompleted,
  recordDebateAbandoned,
  recordDebateError,
  recordLLMRequest,
  recordRequest,
  incrementConnections,
  decrementConnections,
} from '../metrics'

describe('metrics', () => {
  beforeEach(() => {
    metrics.reset()
  })

  describe('debate metrics', () => {
    it('should record debate started', () => {
      recordDebateStarted()

      const debateMetrics = metrics.getDebateMetrics()

      expect(debateMetrics.started).toBe(1)
    })

    it('should record multiple debate starts', () => {
      recordDebateStarted()
      recordDebateStarted()
      recordDebateStarted()

      const debateMetrics = metrics.getDebateMetrics()

      expect(debateMetrics.started).toBe(3)
    })

    it('should record debate completed with turns and duration', () => {
      recordDebateCompleted(4, 120000)

      const debateMetrics = metrics.getDebateMetrics()

      expect(debateMetrics.completed).toBe(1)
      expect(debateMetrics.totalTurns).toBe(4)
      expect(debateMetrics.totalDurationMs).toBe(120000)
    })

    it('should aggregate completed debates', () => {
      recordDebateCompleted(4, 100000)
      recordDebateCompleted(6, 150000)

      const debateMetrics = metrics.getDebateMetrics()

      expect(debateMetrics.completed).toBe(2)
      expect(debateMetrics.totalTurns).toBe(10)
      expect(debateMetrics.totalDurationMs).toBe(250000)
    })

    it('should record debate abandoned', () => {
      recordDebateAbandoned()

      const debateMetrics = metrics.getDebateMetrics()

      expect(debateMetrics.abandoned).toBe(1)
    })

    it('should record debate error', () => {
      recordDebateError()

      const debateMetrics = metrics.getDebateMetrics()

      expect(debateMetrics.errored).toBe(1)
    })

    it('should track all debate states independently', () => {
      recordDebateStarted()
      recordDebateStarted()
      recordDebateCompleted(4, 100000)
      recordDebateAbandoned()
      recordDebateError()

      const debateMetrics = metrics.getDebateMetrics()

      expect(debateMetrics.started).toBe(2)
      expect(debateMetrics.completed).toBe(1)
      expect(debateMetrics.abandoned).toBe(1)
      expect(debateMetrics.errored).toBe(1)
    })
  })

  describe('LLM metrics', () => {
    it('should record successful LLM request', () => {
      recordLLMRequest('openai', 100, 150, 500, 5, true)

      const llmMetrics = metrics.getLLMMetrics()
      const openaiMetrics = llmMetrics.openai

      expect(openaiMetrics).toBeDefined()
      expect(openaiMetrics?.requestCount).toBe(1)
      expect(openaiMetrics?.promptTokens).toBe(100)
      expect(openaiMetrics?.completionTokens).toBe(150)
      expect(openaiMetrics?.totalTokens).toBe(250)
      expect(openaiMetrics?.totalLatencyMs).toBe(500)
      expect(openaiMetrics?.totalCostCents).toBe(5)
      expect(openaiMetrics?.errorCount).toBe(0)
    })

    it('should record failed LLM request', () => {
      recordLLMRequest('anthropic', 100, 0, 1000, 0, false)

      const llmMetrics = metrics.getLLMMetrics()
      const anthropicMetrics = llmMetrics.anthropic

      expect(anthropicMetrics?.errorCount).toBe(1)
      expect(anthropicMetrics?.requestCount).toBe(1)
    })

    it('should aggregate metrics by provider', () => {
      recordLLMRequest('openai', 100, 100, 500, 5, true)
      recordLLMRequest('anthropic', 150, 200, 600, 8, true)
      recordLLMRequest('openai', 200, 250, 700, 10, true)

      const llmMetrics = metrics.getLLMMetrics()

      expect(llmMetrics.openai?.requestCount).toBe(2)
      expect(llmMetrics.anthropic?.requestCount).toBe(1)
      expect(llmMetrics.openai?.totalTokens).toBe(650) // (100+100) + (200+250)
      expect(llmMetrics.anthropic?.totalTokens).toBe(350) // 150+200
    })

    it('should track error rate per provider', () => {
      recordLLMRequest('openai', 100, 100, 500, 5, true)
      recordLLMRequest('openai', 100, 0, 1000, 0, false)
      recordLLMRequest('openai', 100, 100, 500, 5, true)

      const llmMetrics = metrics.getLLMMetrics()

      expect(llmMetrics.openai?.requestCount).toBe(3)
      expect(llmMetrics.openai?.errorCount).toBe(1)
    })
  })

  describe('system metrics', () => {
    it('should record HTTP request without throwing', () => {
      // The recordRequest function uses labels which creates keyed counters/histograms
      // Just verify it doesn't throw
      expect(() => recordRequest(100, 200, '/api/debate')).not.toThrow()
    })

    it('should allow recording multiple requests', () => {
      expect(() => {
        recordRequest(50, 200, '/api/health')
        recordRequest(150, 200, '/api/debate')
        recordRequest(500, 200, '/api/debate')
        recordRequest(2000, 200, '/api/debate')
      }).not.toThrow()
    })

    it('should track active connections', () => {
      incrementConnections()
      incrementConnections()

      let systemMetrics = metrics.getSystemMetrics()
      expect(systemMetrics.activeConnections).toBe(2)

      decrementConnections()

      systemMetrics = metrics.getSystemMetrics()
      expect(systemMetrics.activeConnections).toBe(1)
    })

    it('should not go below zero connections', () => {
      decrementConnections()
      decrementConnections()

      const systemMetrics = metrics.getSystemMetrics()

      expect(systemMetrics.activeConnections).toBe(0)
    })

    it('should track memory usage', () => {
      const systemMetrics = metrics.getSystemMetrics()

      expect(systemMetrics.memoryUsageMb).toBeGreaterThan(0)
    })

    it('should track uptime', () => {
      const systemMetrics = metrics.getSystemMetrics()

      expect(systemMetrics.uptimeSeconds).toBeGreaterThanOrEqual(0)
    })
  })

  describe('aggregated metrics', () => {
    it('should return aggregated metrics with 5m window', () => {
      recordDebateStarted()
      recordLLMRequest('openai', 100, 100, 500, 5, true)
      recordRequest(100, 200, '/api/debate')

      const aggregated = metrics.getAggregatedMetrics('5m')

      expect(aggregated.timestamp).toBeDefined()
      expect(aggregated.window).toBe('5m')
      expect(aggregated.debates).toBeDefined()
      expect(aggregated.llmProviders).toBeDefined()
      expect(aggregated.system).toBeDefined()
    })

    it('should return aggregated metrics with 1m window', () => {
      const aggregated = metrics.getAggregatedMetrics('1m')

      expect(aggregated.window).toBe('1m')
    })

    it('should return aggregated metrics with 1h window', () => {
      const aggregated = metrics.getAggregatedMetrics('1h')

      expect(aggregated.window).toBe('1h')
    })
  })

  describe('prometheus format', () => {
    it('should output prometheus format', () => {
      recordDebateStarted()
      recordLLMRequest('openai', 100, 100, 500, 5, true)

      const prometheus = metrics.getPrometheusMetrics()

      expect(prometheus).toContain('# HELP')
      expect(prometheus).toContain('# TYPE')
      expect(prometheus).toContain('debates_total')
      expect(prometheus).toContain('llm_requests_total')
    })

    it('should include active connections gauge', () => {
      incrementConnections()

      const prometheus = metrics.getPrometheusMetrics()

      expect(prometheus).toContain('active_sse_connections')
    })

    it('should include memory usage gauge', () => {
      const prometheus = metrics.getPrometheusMetrics()

      expect(prometheus).toContain('memory_usage_mb')
    })
  })

  describe('reset', () => {
    it('should reset all metrics', () => {
      recordDebateStarted()
      recordLLMRequest('openai', 100, 100, 500, 5, true)
      incrementConnections()

      metrics.reset()

      const debateMetrics = metrics.getDebateMetrics()
      const llmMetrics = metrics.getLLMMetrics()
      const systemMetrics = metrics.getSystemMetrics()

      expect(debateMetrics.started).toBe(0)
      expect(Object.keys(llmMetrics)).toHaveLength(0)
      expect(systemMetrics.activeConnections).toBe(0)
    })
  })
})
