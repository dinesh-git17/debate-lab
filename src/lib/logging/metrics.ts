// metrics.ts
/**
 * In-memory metrics collection with Prometheus-compatible export.
 * Tracks debates, LLM requests, and HTTP performance with histogram support.
 */

import type {
  HistogramBuckets,
  DebateMetrics,
  LLMProviderMetrics,
  SystemMetrics,
  AggregatedMetrics,
} from '@/types/logging'

class MetricsCollector {
  private counters = new Map<string, number>()
  private gauges = new Map<string, number>()
  private histograms = new Map<string, number[]>()
  private startTime = Date.now()

  private debateMetrics: DebateMetrics = {
    started: 0,
    completed: 0,
    abandoned: 0,
    errored: 0,
    totalTurns: 0,
    totalDurationMs: 0,
  }

  private llmMetrics = new Map<string, LLMProviderMetrics>()
  private activeConnections = 0

  private getKey(name: string, labels: Record<string, string> = {}): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')
    return labelStr ? `${name}{${labelStr}}` : name
  }

  increment(name: string, labels: Record<string, string> = {}, value = 1): void {
    const key = this.getKey(name, labels)
    this.counters.set(key, (this.counters.get(key) ?? 0) + value)
  }

  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getKey(name, labels)
    this.gauges.set(key, value)
  }

  histogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getKey(name, labels)
    const values = this.histograms.get(key) ?? []
    values.push(value)
    if (values.length > 10000) {
      values.shift()
    }
    this.histograms.set(key, values)
  }

  private computeHistogramBuckets(values: number[]): HistogramBuckets {
    const buckets: HistogramBuckets = {
      le_50: 0,
      le_100: 0,
      le_250: 0,
      le_500: 0,
      le_1000: 0,
      le_2500: 0,
      le_5000: 0,
      le_10000: 0,
      le_inf: 0,
      sum: 0,
      count: values.length,
    }

    for (const v of values) {
      buckets.sum += v
      buckets.le_inf++
      if (v <= 50) buckets.le_50++
      if (v <= 100) buckets.le_100++
      if (v <= 250) buckets.le_250++
      if (v <= 500) buckets.le_500++
      if (v <= 1000) buckets.le_1000++
      if (v <= 2500) buckets.le_2500++
      if (v <= 5000) buckets.le_5000++
      if (v <= 10000) buckets.le_10000++
    }

    return buckets
  }

  recordDebateStarted(): void {
    this.debateMetrics.started++
    this.increment('debates_total', { status: 'started' })
  }

  recordDebateCompleted(turns: number, durationMs: number): void {
    this.debateMetrics.completed++
    this.debateMetrics.totalTurns += turns
    this.debateMetrics.totalDurationMs += durationMs
    this.increment('debates_total', { status: 'completed' })
    this.histogram('debate_duration_ms', durationMs)
    this.histogram('debate_turns', turns)
  }

  recordDebateAbandoned(): void {
    this.debateMetrics.abandoned++
    this.increment('debates_total', { status: 'abandoned' })
  }

  recordDebateError(): void {
    this.debateMetrics.errored++
    this.increment('debates_total', { status: 'errored' })
  }

  recordLLMRequest(
    provider: string,
    promptTokens: number,
    completionTokens: number,
    latencyMs: number,
    costCents: number,
    success: boolean
  ): void {
    let providerMetrics = this.llmMetrics.get(provider)
    if (!providerMetrics) {
      providerMetrics = {
        provider,
        requestCount: 0,
        errorCount: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalLatencyMs: 0,
        totalCostCents: 0,
      }
      this.llmMetrics.set(provider, providerMetrics)
    }

    providerMetrics.requestCount++
    providerMetrics.promptTokens += promptTokens
    providerMetrics.completionTokens += completionTokens
    providerMetrics.totalTokens += promptTokens + completionTokens
    providerMetrics.totalLatencyMs += latencyMs
    providerMetrics.totalCostCents += costCents

    if (!success) {
      providerMetrics.errorCount++
    }

    this.increment('llm_requests_total', { provider, status: success ? 'success' : 'error' })
    this.histogram('llm_latency_ms', latencyMs, { provider })
    this.increment('llm_tokens_total', { provider, type: 'prompt' }, promptTokens)
    this.increment('llm_tokens_total', { provider, type: 'completion' }, completionTokens)
  }

  recordRequest(latencyMs: number, statusCode: number, endpoint: string): void {
    this.increment('http_requests_total', {
      status: String(statusCode),
      endpoint: this.normalizeEndpoint(endpoint),
    })
    this.histogram('http_request_duration_ms', latencyMs, {
      endpoint: this.normalizeEndpoint(endpoint),
    })

    if (statusCode >= 500) {
      this.increment('http_errors_total', { type: 'server' })
    } else if (statusCode >= 400) {
      this.increment('http_errors_total', { type: 'client' })
    }
  }

  private normalizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/\/debate\/[a-zA-Z0-9-]+/, '/debate/:id')
      .replace(/\/share\/[a-zA-Z0-9-]+/, '/share/:id')
  }

  incrementConnections(): void {
    this.activeConnections++
    this.gauge('active_sse_connections', this.activeConnections)
  }

  decrementConnections(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1)
    this.gauge('active_sse_connections', this.activeConnections)
  }

  getDebateMetrics(): DebateMetrics {
    return { ...this.debateMetrics }
  }

  getLLMMetrics(): Record<string, LLMProviderMetrics> {
    const result: Record<string, LLMProviderMetrics> = {}
    for (const [provider, providerMetrics] of this.llmMetrics) {
      result[provider] = { ...providerMetrics }
    }
    return result
  }

  getSystemMetrics(): SystemMetrics {
    const responseTimeValues = this.histograms.get('http_request_duration_ms') ?? []

    return {
      activeConnections: this.activeConnections,
      requestsTotal: this.counters.get('http_requests_total') ?? 0,
      errorsTotal:
        (this.counters.get(this.getKey('http_errors_total', { type: 'server' })) ?? 0) +
        (this.counters.get(this.getKey('http_errors_total', { type: 'client' })) ?? 0),
      responseTimeHistogram: this.computeHistogramBuckets(responseTimeValues),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    }
  }

  getAggregatedMetrics(window: '1m' | '5m' | '1h' = '5m'): AggregatedMetrics {
    return {
      timestamp: Date.now(),
      window,
      debates: this.getDebateMetrics(),
      llmProviders: this.getLLMMetrics(),
      system: this.getSystemMetrics(),
    }
  }

  getPrometheusMetrics(): string {
    const lines: string[] = []

    lines.push('# HELP debates_total Total number of debates by status')
    lines.push('# TYPE debates_total counter')
    for (const [key, value] of this.counters) {
      if (key.startsWith('debates_total')) {
        lines.push(`${key} ${value}`)
      }
    }

    lines.push('# HELP llm_requests_total Total LLM requests by provider and status')
    lines.push('# TYPE llm_requests_total counter')
    for (const [key, value] of this.counters) {
      if (key.startsWith('llm_requests_total')) {
        lines.push(`${key} ${value}`)
      }
    }

    lines.push('# HELP http_requests_total Total HTTP requests')
    lines.push('# TYPE http_requests_total counter')
    for (const [key, value] of this.counters) {
      if (key.startsWith('http_requests_total')) {
        lines.push(`${key} ${value}`)
      }
    }

    lines.push('# HELP active_sse_connections Current active SSE connections')
    lines.push('# TYPE active_sse_connections gauge')
    lines.push(`active_sse_connections ${this.activeConnections}`)

    const memoryMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    lines.push('# HELP memory_usage_mb Current memory usage in MB')
    lines.push('# TYPE memory_usage_mb gauge')
    lines.push(`memory_usage_mb ${memoryMb}`)

    return lines.join('\n')
  }

  reset(): void {
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
    this.debateMetrics = {
      started: 0,
      completed: 0,
      abandoned: 0,
      errored: 0,
      totalTurns: 0,
      totalDurationMs: 0,
    }
    this.llmMetrics.clear()
    this.activeConnections = 0
  }
}

export const metrics = new MetricsCollector()

export function recordDebateStarted(): void {
  metrics.recordDebateStarted()
}

export function recordDebateCompleted(turns: number, durationMs: number): void {
  metrics.recordDebateCompleted(turns, durationMs)
}

export function recordDebateAbandoned(): void {
  metrics.recordDebateAbandoned()
}

export function recordDebateError(): void {
  metrics.recordDebateError()
}

export function recordLLMRequest(
  provider: string,
  promptTokens: number,
  completionTokens: number,
  latencyMs: number,
  costCents: number,
  success: boolean
): void {
  metrics.recordLLMRequest(provider, promptTokens, completionTokens, latencyMs, costCents, success)
}

export function recordRequest(latencyMs: number, statusCode: number, endpoint: string): void {
  metrics.recordRequest(latencyMs, statusCode, endpoint)
}

export function incrementConnections(): void {
  metrics.incrementConnections()
}

export function decrementConnections(): void {
  metrics.decrementConnections()
}
