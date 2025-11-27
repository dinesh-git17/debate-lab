// src/lib/logging/logger.ts
// Structured JSON logger using pino with redaction and context support

import crypto from 'crypto'

import pino from 'pino'

import { supabaseLogWriter } from './supabase-writer'

import type { LogContext, LogLevel } from '@/types/logging'

const isDev = process.env.NODE_ENV === 'development'
const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? (isDev ? 'debug' : 'info')

const redactPaths = [
  'context.apiKey',
  'context.token',
  'context.authorization',
  'context.password',
  'context.secret',
  'context.cookie',
  'context.sessionToken',
  '*.apiKey',
  '*.token',
  '*.authorization',
  '*.password',
  '*.secret',
  '*.headers.authorization',
  '*.headers.cookie',
]

const baseLogger = pino({
  level: logLevel,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),
})

function hashSensitiveId(id: string | undefined): string | undefined {
  if (!id) return undefined
  return crypto.createHash('sha256').update(id).digest('hex').slice(0, 16)
}

function sanitizeContext(context: LogContext): LogContext {
  const sanitized: LogContext = {}

  for (const [key, value] of Object.entries(context)) {
    if (key === 'sessionId' && typeof value === 'string') {
      sanitized[key] = hashSensitiveId(value) ?? value
    } else if (key === 'userId' && typeof value === 'string') {
      sanitized[key] = hashSensitiveId(value) ?? value
    } else if (value !== undefined) {
      sanitized[key] = value
    }
  }

  return sanitized
}

class Logger {
  private context: LogContext = {}

  child(context: LogContext): Logger {
    const childLogger = new Logger()
    childLogger.context = { ...this.context, ...sanitizeContext(context) }
    return childLogger
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const mergedContext = {
      ...this.context,
      ...(context ? sanitizeContext(context) : {}),
    }

    const logObject: Record<string, unknown> = {
      context: mergedContext,
    }

    const errorData = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined

    if (errorData) {
      logObject.error = errorData
    }

    baseLogger[level](logObject, message)

    // Also write to Supabase for persistence
    supabaseLogWriter.writeLog(level, message, mergedContext, errorData)
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | null, context?: LogContext): void {
    this.log('error', message, context, error ?? undefined)
  }

  fatal(message: string, error?: Error | null, context?: LogContext): void {
    this.log('fatal', message, context, error ?? undefined)
  }

  withRequestId(requestId: string): Logger {
    return this.child({ requestId })
  }

  withDebateId(debateId: string): Logger {
    return this.child({ debateId })
  }

  withProvider(provider: string): Logger {
    return this.child({ provider })
  }
}

export const logger = new Logger()

export function createRequestLogger(requestId: string, endpoint: string, method: string): Logger {
  return logger.child({ requestId, endpoint, method })
}

export function createDebateLogger(debateId: string, requestId?: string): Logger {
  return logger.child({ debateId, requestId })
}

export function createProviderLogger(provider: string, debateId?: string): Logger {
  return logger.child({ provider, debateId })
}

export function logRequest(
  requestId: string,
  method: string,
  endpoint: string,
  statusCode: number,
  latencyMs: number,
  context?: LogContext
): void {
  const logContext: LogContext = {
    requestId,
    method,
    endpoint,
    statusCode,
    latencyMs,
    ...context,
  }
  const message = `${method} ${endpoint} ${statusCode}`

  if (statusCode >= 500) {
    logger.error(message, null, logContext)
  } else if (statusCode >= 400) {
    logger.warn(message, logContext)
  } else {
    logger.info(message, logContext)
  }
}

export function logDebateEvent(event: string, debateId: string, context?: LogContext): void {
  logger.info(`Debate event: ${event}`, {
    debateId,
    event,
    ...context,
  })

  // Also write to debate_events table
  supabaseLogWriter.writeDebateEvent(
    debateId,
    event,
    context ?? {},
    context?.requestId as string | undefined,
    context?.sessionId as string | undefined
  )
}

export function logLLMRequest(
  provider: string,
  debateId: string,
  turnNumber: number,
  latencyMs: number,
  tokens: { prompt: number; completion: number },
  success: boolean,
  error?: Error,
  model?: string,
  requestId?: string
): void {
  const context: LogContext = {
    provider,
    debateId,
    turnNumber,
    latencyMs,
    promptTokens: tokens.prompt,
    completionTokens: tokens.completion,
    totalTokens: tokens.prompt + tokens.completion,
    success,
  }

  if (success) {
    logger.info(`LLM request completed`, context)
  } else {
    logger.error(`LLM request failed`, error, context)
  }

  // Also write to llm_requests table
  supabaseLogWriter.writeLLMRequest(
    provider,
    debateId,
    turnNumber,
    latencyMs,
    tokens,
    success,
    error?.message,
    model,
    requestId
  )
}

export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: LogContext
): void {
  const logContext: LogContext = { ...context, severity, securityEvent: event }
  const message = `Security event: ${event}`

  if (severity === 'critical' || severity === 'high') {
    logger.error(message, null, logContext)
  } else {
    logger.warn(message, logContext)
  }
}
