// src/lib/security/headers.ts
// Security headers configuration for Next.js middleware

import type { SecurityHeaders } from '@/types/security'

const isDev = process.env.NODE_ENV === 'development'

function buildCsp(): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // Next.js requires 'unsafe-inline' for hydration scripts
    // 'unsafe-eval' needed for some vendor dependencies that use eval() at runtime
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://vercel.live',
      'https://*.vercel-scripts.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'https://api.openai.com',
      'https://api.anthropic.com',
      'https://api.x.ai',
      ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : []),
      'https://vercel.live',
      'https://*.vercel.com',
      'https://*.sentry.io',
    ],
    'frame-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': [],
  }

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key
      }
      return `${key} ${values.join(' ')}`
    })
    .join('; ')
}

function buildPermissionsPolicy(): string {
  const policies: Record<string, string[]> = {
    accelerometer: [],
    'ambient-light-sensor': [],
    autoplay: [],
    battery: [],
    camera: [],
    'display-capture': [],
    'document-domain': [],
    'encrypted-media': [],
    fullscreen: ['self'],
    geolocation: [],
    gyroscope: [],
    'layout-animations': ['self'],
    'legacy-image-formats': ['self'],
    magnetometer: [],
    microphone: [],
    midi: [],
    'oversized-images': ['self'],
    payment: [],
    'picture-in-picture': [],
    'publickey-credentials-get': [],
    'screen-wake-lock': [],
    'sync-xhr': [],
    usb: [],
    'web-share': ['self'],
    'xr-spatial-tracking': [],
  }

  return Object.entries(policies)
    .map(([key, values]) => {
      if (values.length === 0) {
        return `${key}=()`
      }
      return `${key}=(${values.join(' ')})`
    })
    .join(', ')
}

export function getSecurityHeaders(): SecurityHeaders {
  return {
    'Content-Security-Policy': buildCsp(),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': buildPermissionsPolicy(),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block',
  }
}

export function applySecurityHeaders(headers: Headers): void {
  const securityHeaders = getSecurityHeaders()
  for (const [key, value] of Object.entries(securityHeaders)) {
    headers.set(key, value)
  }
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean)

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  }

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

export function validateOrigin(origin: string | null, referer: string | null): boolean {
  if (!origin && !referer) {
    return true
  }

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[]

  const checkOrigin = origin ?? (referer ? new URL(referer).origin : null)

  if (!checkOrigin) {
    return true
  }

  return allowedOrigins.some(
    (allowed) => checkOrigin === allowed || checkOrigin.endsWith('.vercel.app')
  )
}
