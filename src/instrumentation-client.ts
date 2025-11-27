// src/instrumentation-client.ts
// Next.js client-side instrumentation for Sentry
// This replaces sentry.client.config.ts for Turbopack compatibility
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const release =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    ...(release ? { release } : {}),

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    debug: false,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Filter out common non-actionable errors
    beforeSend(event, hint) {
      const error = hint.originalException

      if (error instanceof Error) {
        // Network errors that are usually transient
        if (error.message.includes('Failed to fetch')) {
          return null
        }
        if (error.message.includes('Load failed')) {
          return null
        }
        if (error.message.includes('NetworkError')) {
          return null
        }
      }

      return event
    },

    // Ignore common browser errors that aren't actionable
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'ChunkLoadError',
      'Loading chunk',
    ],
  })
}

// Export router transition hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
