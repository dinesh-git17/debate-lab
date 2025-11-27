// src/lib/logging/sentry.ts
// Sentry integration utilities for error tracking and performance monitoring

import * as Sentry from '@sentry/nextjs'

import type { SentryContext, PerformanceMetrics } from '@/types/logging'

let initialized = false

export function initSentry(): void {
  if (initialized) return

  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    console.warn('Sentry DSN not configured, skipping initialization')
    return
  }

  const release = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    ...(release ? { release } : {}),
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    debug: process.env.NODE_ENV === 'development',
    integrations: [Sentry.extraErrorDataIntegration({ depth: 5 })],
    beforeSend(event, hint) {
      const error = hint.originalException

      if (error instanceof Error) {
        if (error.message.includes('NEXT_NOT_FOUND')) {
          return null
        }
        if (error.message.includes('NEXT_REDIRECT')) {
          return null
        }
      }

      return event
    },
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
  })

  initialized = true
}

export function setDebateContext(context: SentryContext): void {
  Sentry.setContext('debate', {
    debateId: context.debateId,
    phase: context.debatePhase,
    format: context.format,
    tokenBudget: context.tokenBudget,
    tokensUsed: context.tokensUsed,
  })

  if (context.debateId) {
    Sentry.setTag('debate_id', context.debateId)
  }
  if (context.debatePhase) {
    Sentry.setTag('debate_phase', context.debatePhase)
  }
  if (context.provider) {
    Sentry.setTag('llm_provider', context.provider)
  }
  if (context.turnNumber !== undefined) {
    Sentry.setTag('turn_number', String(context.turnNumber))
  }
  if (context.format) {
    Sentry.setTag('debate_format', context.format)
  }
}

export function clearDebateContext(): void {
  Sentry.setContext('debate', null)
}

export function captureException(error: Error, context?: SentryContext): string {
  if (context) {
    setDebateContext(context)
  }

  const tags: Record<string, string> = {}
  if (context?.debateId) {
    tags.debate_id = context.debateId
  }
  if (context?.provider) {
    tags.llm_provider = context.provider
  }
  if (context?.turnNumber !== undefined) {
    tags.turn_number = context.turnNumber.toString()
  }

  const eventId = Sentry.captureException(error, {
    ...(Object.keys(tags).length > 0 ? { tags } : {}),
  })

  return eventId
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: SentryContext
): string {
  if (context) {
    setDebateContext(context)
  }

  return Sentry.captureMessage(message, level)
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    ...(data ? { data } : {}),
    timestamp: Date.now() / 1000,
  })
}

export function startTransaction(
  name: string,
  op: string
): ReturnType<typeof Sentry.startInactiveSpan> {
  return Sentry.startInactiveSpan({
    name,
    op,
    forceTransaction: true,
  })
}

export function startSpan<T>(name: string, op: string, callback: () => T): T {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    callback
  )
}

export async function startSpanAsync<T>(
  name: string,
  op: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    callback
  )
}

export function recordPerformance(perfMetrics: PerformanceMetrics): void {
  Sentry.startSpan(
    {
      name: perfMetrics.transactionName,
      op: 'custom',
      attributes: perfMetrics.tags,
    },
    (span) => {
      for (const [key, value] of Object.entries(perfMetrics.measurements)) {
        span.setAttribute(key, value)
      }
    }
  )
}

export function setUser(id: string, data?: Record<string, unknown>): void {
  Sentry.setUser({
    id,
    ...data,
  })
}

export function clearUser(): void {
  Sentry.setUser(null)
}

export function flush(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout)
}

export { Sentry }
