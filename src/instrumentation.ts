// src/instrumentation.ts
// Next.js instrumentation file for Sentry initialization

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { init } = await import('@sentry/nextjs')

    const dsn = process.env.SENTRY_DSN
    const release = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA

    if (dsn) {
      const { extraErrorDataIntegration } = await import('@sentry/nextjs')

      init({
        dsn,
        environment: process.env.NODE_ENV ?? 'development',
        ...(release ? { release } : {}),
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
        debug: false,
        integrations: [extraErrorDataIntegration({ depth: 5 })],
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
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { init } = await import('@sentry/nextjs')

    const dsn = process.env.SENTRY_DSN
    const release = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA

    if (dsn) {
      init({
        dsn,
        environment: process.env.NODE_ENV ?? 'development',
        ...(release ? { release } : {}),
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        debug: false,
      })
    }
  }
}
