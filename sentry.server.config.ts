// sentry.server.config.ts
// Sentry server-side configuration

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN
const release = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    ...(release ? { release } : {}),
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    debug: false,
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
        if (error.message.includes('ECONNRESET')) {
          return null
        }
        if (error.message.includes('ECONNREFUSED')) {
          return null
        }
      }

      return event
    },
    ignoreErrors: ['NEXT_NOT_FOUND', 'NEXT_REDIRECT'],
  })
}
