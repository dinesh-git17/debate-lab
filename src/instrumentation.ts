// src/instrumentation.ts
// Next.js instrumentation file for server-side initialization and error handling
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

import * as Sentry from '@sentry/nextjs'

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    await import('../sentry.edge.config')
  }
}

// Capture errors from React Server Components and other server-side errors
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#errors-from-nested-react-server-components
export function onRequestError(
  error: { digest: string } & Error,
  request: {
    path: string
    method: string
    headers: { [key: string]: string }
  },
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
    renderSource?: 'react-server-components' | 'react-client-components'
    revalidateReason?: 'on-demand' | 'stale' | undefined
    renderType?: 'dynamic' | 'dynamic-resume' | undefined
  }
): void {
  // Skip expected Next.js errors
  if (error.message?.includes('NEXT_NOT_FOUND') || error.message?.includes('NEXT_REDIRECT')) {
    return
  }

  Sentry.withScope((scope) => {
    scope.setTag('routerKind', context.routerKind)
    scope.setTag('routePath', context.routePath)
    scope.setTag('routeType', context.routeType)
    if (context.renderSource) {
      scope.setTag('renderSource', context.renderSource)
    }
    if (context.revalidateReason) {
      scope.setTag('revalidateReason', context.revalidateReason)
    }
    if (context.renderType) {
      scope.setTag('renderType', context.renderType)
    }

    scope.setExtra('digest', error.digest)
    scope.setExtra('path', request.path)
    scope.setExtra('method', request.method)

    Sentry.captureException(error)
  })
}
