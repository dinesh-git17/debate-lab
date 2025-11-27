// src/lib/logging/supabase-writer.ts
// Async log writer that persists logs to Supabase

import { createClient, SupabaseClient } from '@supabase/supabase-js'

import type { Alert, LogContext, LogLevel, SystemMetrics } from '@/types/logging'

interface LogRow {
  timestamp: string
  level: LogLevel
  message: string
  request_id: string | null
  debate_id: string | null
  session_id: string | null
  provider: string | null
  endpoint: string | null
  method: string | null
  context: Record<string, unknown>
  error_name: string | null
  error_message: string | null
  error_stack: string | null
}

interface LLMRequestRow {
  timestamp: string
  provider: string
  model: string | null
  debate_id: string | null
  turn_number: number | null
  latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  success: boolean
  error_message: string | null
  request_id: string | null
}

interface DebateEventRow {
  timestamp: string
  debate_id: string
  event_type: string
  details: Record<string, unknown>
  request_id: string | null
  session_id: string | null
}

interface AlertRow {
  alert_type: string
  severity: string
  message: string
  value: number
  threshold: number
  triggered_at: string
  resolved_at: string | null
  notified: boolean
  context: Record<string, unknown>
  environment: string
}

interface MetricsSnapshotRow {
  timestamp: string
  requests_total: number
  errors_total: number
  active_connections: number
  response_time_le_50: number
  response_time_le_100: number
  response_time_le_250: number
  response_time_le_500: number
  response_time_le_1000: number
  response_time_le_2500: number
  response_time_le_5000: number
  response_time_le_10000: number
  response_time_sum: number
  response_time_count: number
  debates_started: number
  debates_completed: number
  debates_errored: number
  full_metrics: Record<string, unknown>
}

class SupabaseLogWriter {
  private client: SupabaseClient | null = null
  private logQueue: LogRow[] = []
  private llmRequestQueue: LLMRequestRow[] = []
  private debateEventQueue: DebateEventRow[] = []
  private alertQueue: AlertRow[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null
  private isEnabled = false
  private batchSize = 50
  private flushIntervalMs = 5000

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      // Logging to Supabase is optional - silently disable if not configured
      this.isEnabled = false
      return
    }

    try {
      this.client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
      this.isEnabled = true
      this.startFlushInterval()
    } catch {
      this.isEnabled = false
    }
  }

  private startFlushInterval(): void {
    if (this.flushInterval) return

    this.flushInterval = setInterval(() => {
      void this.flush()
    }, this.flushIntervalMs)

    // Ensure flush on process exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => {
        void this.flush()
      })
    }
  }

  isActive(): boolean {
    return this.isEnabled && this.client !== null
  }

  writeLog(
    level: LogLevel,
    message: string,
    context: LogContext,
    error?: { name: string; message: string; stack?: string | undefined }
  ): void {
    if (!this.isEnabled) return

    const row: LogRow = {
      timestamp: new Date().toISOString(),
      level,
      message,
      request_id: (context.requestId as string) ?? null,
      debate_id: (context.debateId as string) ?? null,
      session_id: (context.sessionId as string) ?? null,
      provider: (context.provider as string) ?? null,
      endpoint: (context.endpoint as string) ?? null,
      method: (context.method as string) ?? null,
      context,
      error_name: error?.name ?? null,
      error_message: error?.message ?? null,
      error_stack: error?.stack ?? null,
    }

    this.logQueue.push(row)

    if (this.logQueue.length >= this.batchSize) {
      void this.flushLogs()
    }
  }

  writeLLMRequest(
    provider: string,
    debateId: string | undefined,
    turnNumber: number | undefined,
    latencyMs: number,
    tokens: { prompt: number; completion: number },
    success: boolean,
    errorMessage?: string,
    model?: string,
    requestId?: string
  ): void {
    if (!this.isEnabled) return

    const row: LLMRequestRow = {
      timestamp: new Date().toISOString(),
      provider,
      model: model ?? null,
      debate_id: debateId ?? null,
      turn_number: turnNumber ?? null,
      latency_ms: latencyMs,
      prompt_tokens: tokens.prompt,
      completion_tokens: tokens.completion,
      total_tokens: tokens.prompt + tokens.completion,
      success,
      error_message: errorMessage ?? null,
      request_id: requestId ?? null,
    }

    this.llmRequestQueue.push(row)

    if (this.llmRequestQueue.length >= this.batchSize) {
      void this.flushLLMRequests()
    }
  }

  writeDebateEvent(
    debateId: string,
    eventType: string,
    details: Record<string, unknown> = {},
    requestId?: string,
    sessionId?: string
  ): void {
    if (!this.isEnabled) return

    const row: DebateEventRow = {
      timestamp: new Date().toISOString(),
      debate_id: debateId,
      event_type: eventType,
      details,
      request_id: requestId ?? null,
      session_id: sessionId ?? null,
    }

    this.debateEventQueue.push(row)

    if (this.debateEventQueue.length >= this.batchSize) {
      void this.flushDebateEvents()
    }
  }

  writeAlert(alert: Alert): void {
    if (!this.isEnabled) return

    const row: AlertRow = {
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold,
      triggered_at: alert.triggeredAt.toISOString(),
      resolved_at: alert.resolvedAt?.toISOString() ?? null,
      notified: alert.notified,
      context: alert.context,
      environment: process.env.NODE_ENV ?? 'development',
    }

    this.alertQueue.push(row)

    // Alerts are important - flush immediately
    void this.flushAlerts()
  }

  async writeMetricsSnapshot(
    systemMetrics: SystemMetrics,
    debateMetrics: { started: number; completed: number; errored: number },
    fullMetrics: Record<string, unknown>
  ): Promise<void> {
    if (!this.isEnabled || !this.client) return

    const row: MetricsSnapshotRow = {
      timestamp: new Date().toISOString(),
      requests_total: systemMetrics.requestsTotal,
      errors_total: systemMetrics.errorsTotal,
      active_connections: systemMetrics.activeConnections,
      response_time_le_50: systemMetrics.responseTimeHistogram.le_50,
      response_time_le_100: systemMetrics.responseTimeHistogram.le_100,
      response_time_le_250: systemMetrics.responseTimeHistogram.le_250,
      response_time_le_500: systemMetrics.responseTimeHistogram.le_500,
      response_time_le_1000: systemMetrics.responseTimeHistogram.le_1000,
      response_time_le_2500: systemMetrics.responseTimeHistogram.le_2500,
      response_time_le_5000: systemMetrics.responseTimeHistogram.le_5000,
      response_time_le_10000: systemMetrics.responseTimeHistogram.le_10000,
      response_time_sum: systemMetrics.responseTimeHistogram.sum,
      response_time_count: systemMetrics.responseTimeHistogram.count,
      debates_started: debateMetrics.started,
      debates_completed: debateMetrics.completed,
      debates_errored: debateMetrics.errored,
      full_metrics: fullMetrics,
    }

    try {
      await this.client.from('metrics_snapshots').insert(row)
    } catch {
      // Silently fail - metrics persistence is best-effort
    }
  }

  private async flushLogs(): Promise<void> {
    if (!this.client || this.logQueue.length === 0) return

    const batch = this.logQueue.splice(0, this.batchSize)

    try {
      await this.client.from('logs').insert(batch)
    } catch {
      // Re-queue failed logs (with limit to prevent memory issues)
      if (this.logQueue.length < 1000) {
        this.logQueue.unshift(...batch)
      }
    }
  }

  private async flushLLMRequests(): Promise<void> {
    if (!this.client || this.llmRequestQueue.length === 0) return

    const batch = this.llmRequestQueue.splice(0, this.batchSize)

    try {
      await this.client.from('llm_requests').insert(batch)
    } catch {
      if (this.llmRequestQueue.length < 500) {
        this.llmRequestQueue.unshift(...batch)
      }
    }
  }

  private async flushDebateEvents(): Promise<void> {
    if (!this.client || this.debateEventQueue.length === 0) return

    const batch = this.debateEventQueue.splice(0, this.batchSize)

    try {
      await this.client.from('debate_events').insert(batch)
    } catch {
      if (this.debateEventQueue.length < 500) {
        this.debateEventQueue.unshift(...batch)
      }
    }
  }

  private async flushAlerts(): Promise<void> {
    if (!this.client || this.alertQueue.length === 0) return

    const batch = this.alertQueue.splice(0, this.alertQueue.length)

    try {
      await this.client.from('alerts').insert(batch)
    } catch {
      // Alerts are critical - log to console if Supabase fails
      console.error('[SupabaseLogWriter] Failed to persist alerts:', batch)
    }
  }

  async flush(): Promise<void> {
    await Promise.all([
      this.flushLogs(),
      this.flushLLMRequests(),
      this.flushDebateEvents(),
      this.flushAlerts(),
    ])
  }

  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    await this.flush()
  }

  getQueueStats(): {
    logs: number
    llmRequests: number
    debateEvents: number
    alerts: number
  } {
    return {
      logs: this.logQueue.length,
      llmRequests: this.llmRequestQueue.length,
      debateEvents: this.debateEventQueue.length,
      alerts: this.alertQueue.length,
    }
  }
}

// Singleton instance
export const supabaseLogWriter = new SupabaseLogWriter()
