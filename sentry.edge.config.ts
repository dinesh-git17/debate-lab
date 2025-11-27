// sentry.edge.config.ts
// Sentry edge runtime configuration

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN
const release = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    ...(release ? { release } : {}),
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: false,
  })
}
