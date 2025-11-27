// src/types/logging.ts
// Logging, metrics, and observability type definitions

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  requestId?: string | undefined
  debateId?: string | undefined
  sessionId?: string | undefined
  userId?: string | undefined
  provider?: string | undefined
  turnNumber?: number | undefined
  phase?: string | undefined
  endpoint?: string | undefined
  method?: string | undefined
  statusCode?: number | undefined
  latencyMs?: number | undefined
  [key: string]: unknown
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context: LogContext
  error?:
    | {
        name: string
        message: string
        stack?: string | undefined
      }
    | undefined
}

export interface RequestTrace {
  requestId: string
  startTime: number
  endTime?: number | undefined
  endpoint: string
  method: string
  statusCode?: number | undefined
  debateId?: string | undefined
  userId?: string | undefined
  spans: TraceSpan[]
}

export interface TraceSpan {
  name: string
  startTime: number
  endTime?: number | undefined
  attributes: Record<string, unknown>
  status: 'ok' | 'error'
  error?: string | undefined
}

export type MetricType = 'counter' | 'gauge' | 'histogram'

export interface MetricDefinition {
  name: string
  type: MetricType
  description: string
  labels: string[]
}

export interface MetricValue {
  name: string
  value: number
  labels: Record<string, string>
  timestamp: number
}

export interface HistogramBuckets {
  le_50: number
  le_100: number
  le_250: number
  le_500: number
  le_1000: number
  le_2500: number
  le_5000: number
  le_10000: number
  le_inf: number
  sum: number
  count: number
}

export interface DebateMetrics {
  started: number
  completed: number
  abandoned: number
  errored: number
  totalTurns: number
  totalDurationMs: number
}

export interface LLMProviderMetrics {
  provider: string
  requestCount: number
  errorCount: number
  totalTokens: number
  promptTokens: number
  completionTokens: number
  totalLatencyMs: number
  totalCostCents: number
}

export interface SystemMetrics {
  activeConnections: number
  requestsTotal: number
  errorsTotal: number
  responseTimeHistogram: HistogramBuckets
  memoryUsageMb: number
  uptimeSeconds: number
}

export interface AggregatedMetrics {
  timestamp: number
  window: '1m' | '5m' | '1h'
  debates: DebateMetrics
  llmProviders: Record<string, LLMProviderMetrics>
  system: SystemMetrics
}

export type AlertSeverity = 'warning' | 'critical'

export type AlertType =
  | 'error_rate_spike'
  | 'llm_api_failure'
  | 'high_latency'
  | 'budget_exceeded'
  | 'connection_spike'

export interface AlertDefinition {
  type: AlertType
  name: string
  description: string
  severity: AlertSeverity
  threshold: number
  windowMs: number
  cooldownMs: number
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  value: number
  threshold: number
  triggeredAt: Date
  resolvedAt?: Date | undefined
  notified: boolean
  context: Record<string, unknown>
}

export interface AlertWebhookPayload {
  alert: Alert
  environment: string
  appName: string
  timestamp: string
}

export interface WebhookConfig {
  url: string
  type: 'slack' | 'discord' | 'generic'
  enabled: boolean
  minSeverity: AlertSeverity
}

export interface SentryContext {
  debateId?: string | undefined
  debatePhase?: string | undefined
  provider?: string | undefined
  turnNumber?: number | undefined
  format?: string | undefined
  tokenBudget?: number | undefined
  tokensUsed?: number | undefined
}

export interface PerformanceMetrics {
  transactionName: string
  duration: number
  status: 'ok' | 'error' | 'timeout'
  tags: Record<string, string>
  measurements: Record<string, number>
}
