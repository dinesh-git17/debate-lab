// next.config.ts
// Next.js configuration with Sentry integration

import { withSentryConfig } from '@sentry/nextjs'

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverExternalPackages: ['tiktoken', 'pino', 'pino-pretty'],
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    if (isServer) {
      config.output.webassemblyModuleFilename = './../static/wasm/[modulehash].wasm'
    } else {
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm'
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
      }
    }

    return config
  },
}

const sentryOrg = process.env.SENTRY_ORG
const sentryProject = process.env.SENTRY_PROJECT

const sentryConfig = {
  ...(sentryOrg ? { org: sentryOrg } : {}),
  ...(sentryProject ? { project: sentryProject } : {}),
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
}

export default withSentryConfig(nextConfig, sentryConfig)
