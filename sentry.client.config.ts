// sentry.client.config.ts
// Sentry client-side configuration

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const release =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    ...(release ? { release } : {}),
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
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
    beforeSend(event, hint) {
      const error = hint.originalException

      if (error instanceof Error) {
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
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'ChunkLoadError',
      'Loading chunk',
    ],
  })
}
