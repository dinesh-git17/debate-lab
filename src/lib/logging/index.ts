// index.ts
/**
 * Logging module exports including structured logging, metrics, and Sentry integration.
 */

export {
  logger,
  createRequestLogger,
  createDebateLogger,
  createProviderLogger,
  logRequest,
  logDebateEvent,
  logLLMRequest,
  logSecurityEvent,
} from './logger'

export {
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
} from './request-context'

export {
  metrics,
  recordDebateStarted,
  recordDebateCompleted,
  recordDebateAbandoned,
  recordDebateError,
  recordLLMRequest,
  recordRequest,
  incrementConnections,
  decrementConnections,
} from './metrics'

export {
  alertManager,
  startAlertChecks,
  stopAlertChecks,
  recordLLMFailure,
  recordLLMSuccess,
} from './alerts'

export {
  initSentry,
  setDebateContext,
  clearDebateContext,
  captureException,
  captureMessage,
  addBreadcrumb,
  startTransaction,
  startSpan as startSentrySpan,
  startSpanAsync as startSentrySpanAsync,
  recordPerformance,
  setUser,
  clearUser,
  flush,
  Sentry,
} from './sentry'

export { supabaseLogWriter } from './supabase-writer'

export type {
  LogLevel,
  LogContext,
  LogEntry,
  RequestTrace,
  TraceSpan,
  MetricType,
  MetricDefinition,
  MetricValue,
  HistogramBuckets,
  DebateMetrics,
  LLMProviderMetrics,
  SystemMetrics,
  AggregatedMetrics,
  AlertSeverity,
  AlertType,
  AlertDefinition,
  Alert,
  AlertWebhookPayload,
  WebhookConfig,
  SentryContext,
  PerformanceMetrics,
} from '@/types/logging'
