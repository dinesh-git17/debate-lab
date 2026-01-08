// next.config.ts
// Next.js configuration with performance optimizations

import bundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'

import type { NextConfig } from 'next'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
  analyzerMode: 'static',
})

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns', 'lodash-es'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  serverExternalPackages: ['tiktoken', 'pino', 'pino-pretty', 'openai', '@anthropic-ai/sdk'],

  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Content-Security-Policy',
          value:
            "frame-ancestors 'self' https://dineshd.dev https://*.dineshd.dev http://localhost:3000 http://localhost:3001",
        },
      ],
    },
    {
      source: '/fonts/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
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
        fs: false,
        path: false,
        crypto: false,
      }

      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            ...((
              config.optimization?.splitChunks as {
                cacheGroups?: Record<string, unknown>
              }
            )?.cacheGroups ?? {}),
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    return config
  },

  compress: true,
  poweredByHeader: false,
  generateEtags: true,
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

export default withSentryConfig(withBundleAnalyzer(nextConfig), sentryConfig)
