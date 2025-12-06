// src/middleware.ts
// Next.js middleware for security headers, rate limiting, ban checking, and request validation

import { NextResponse } from 'next/server'

import { checkBan, trackVisit, recordRateLimitHit } from '@/lib/security/abuse-tracker'
import { hashIP, getClientIP } from '@/lib/security/ip-hash'
import { isSupabaseConfigured } from '@/lib/supabase/server'

import type { NextRequest } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

// Edge-compatible structured logging for middleware
/* eslint-disable no-console */
function logSecurityEvent(
  level: 'error' | 'warn' | 'info',
  event: string,
  context: Record<string, unknown>
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    type: 'security_event',
    event,
    ...context,
  }
  if (level === 'error') {
    console.error(JSON.stringify(logData))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logData))
  } else {
    console.info(JSON.stringify(logData))
  }
}

// For CSP, we also need to check if running on localhost (for production builds tested locally)
function isDevEnvironment(request: NextRequest): boolean {
  if (isDev) return true
  const host = request.headers.get('host') || ''
  return host.includes('localhost') || host.includes('127.0.0.1')
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 100
const DEBATE_CREATION_WINDOW_MS = 60 * 60 * 1000
const DEBATE_CREATION_MAX_REQUESTS = 10

const ipRequestCounts = new Map<string, { count: number; resetAt: number }>()
const debateCreationCounts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimitLocal(
  ip: string,
  store: Map<string, { count: number; resetAt: number }>,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const existing = store.get(ip)

  if (!existing || existing.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  existing.count++
  const remaining = Math.max(0, maxRequests - existing.count)
  return {
    allowed: existing.count <= maxRequests,
    remaining,
    resetAt: existing.resetAt,
  }
}

function buildCsp(request: NextRequest): string {
  const isLocal = isDevEnvironment(request)
  const directives: string[] = [
    "default-src 'self'",
    // Next.js requires 'unsafe-inline' for hydration scripts
    isLocal
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel-scripts.com"
      : "script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.x.ai wss://*.pusher.com https://*.pusher.com https://vercel.live https://*.vercel.com https://*.sentry.io${isLocal ? ' ws://localhost:* http://localhost:*' : ''}`,
    "frame-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ]

  if (!isLocal) {
    directives.push('upgrade-insecure-requests')
  }

  return directives.join('; ')
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): void {
  const isLocal = isDevEnvironment(request)
  response.headers.set('Content-Security-Policy', buildCsp(request))
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  )

  if (!isLocal) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
}

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (!origin && !referer) {
    return true
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const allowedOrigins = [appUrl, 'http://localhost:3000', 'http://localhost:3001']

  const checkOrigin = origin ?? (referer ? new URL(referer).origin : null)

  if (!checkOrigin) {
    return true
  }

  // Allow exact matches, Vercel preview deployments, and custom domains
  if (allowedOrigins.includes(checkOrigin)) {
    return true
  }

  // Allow Vercel preview deployments
  if (checkOrigin.endsWith('.vercel.app')) {
    return true
  }

  // Allow custom domains - check if origin matches the request host
  const requestHost = request.headers.get('host')
  if (requestHost) {
    const originHost = new URL(checkOrigin).host
    if (originHost === requestHost) {
      return true
    }
  }

  return false
}

const PROTECTED_ROUTES = ['/api/debate', '/api/share']

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const ip = getClientIP(request)

  // Check IP ban status for protected routes
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && isSupabaseConfigured()) {
    try {
      const ipHash = await hashIP(ip)
      const banCheck = await checkBan(ipHash)

      if (banCheck.isBanned) {
        const ban = banCheck.ban

        // Handle shadow bans - allow request but mark it
        if (ban?.banType === 'shadow') {
          const response = NextResponse.next()
          response.headers.set('X-Shadow-Banned', 'true')
          applySecurityHeaders(response, request)
          return response
        }

        logSecurityEvent('warn', 'banned_ip_access_attempt', {
          ipHash,
          banReason: ban?.reason,
          pathname,
        })

        const response = NextResponse.json(
          {
            error: 'Access denied',
            message: 'Your access has been restricted due to policy violations.',
            expiresIn: banCheck.remainingTime
              ? Math.ceil(banCheck.remainingTime / 1000 / 60)
              : undefined,
          },
          {
            status: 403,
            headers: {
              'X-Ban-Reason': ban?.reason ?? 'unknown',
              'Retry-After': banCheck.remainingTime
                ? String(Math.ceil(banCheck.remainingTime / 1000))
                : '86400',
            },
          }
        )
        applySecurityHeaders(response, request)
        return response
      }

      // Track visit for non-banned IPs on protected routes
      await trackVisit(request)
    } catch (error) {
      // Log error but don't block request if ban check fails
      logSecurityEvent('error', 'ban_check_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pathname,
      })
    }
  }

  if (pathname.startsWith('/api/')) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (!validateOrigin(request)) {
        logSecurityEvent('error', 'csrf_violation', {
          ip,
          origin: request.headers.get('origin'),
          referer: request.headers.get('referer'),
          pathname,
        })
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
      }
    }

    const rateLimit = checkRateLimitLocal(
      ip,
      ipRequestCounts,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS
    )

    if (!rateLimit.allowed) {
      logSecurityEvent('warn', 'rate_limit_exceeded', { ip, pathname })

      // Record rate limit hit for abuse tracking
      if (isSupabaseConfigured()) {
        try {
          const ipHash = await hashIP(ip)
          await recordRateLimitHit(ipHash, pathname)
        } catch {
          // Silently fail - don't block request
        }
      }

      const response = NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      response.headers.set(
        'Retry-After',
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString()
      )
      response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt / 1000).toString())
      applySecurityHeaders(response, request)
      return response
    }

    if (pathname === '/api/debate' && request.method === 'POST') {
      const debateLimit = checkRateLimitLocal(
        ip,
        debateCreationCounts,
        DEBATE_CREATION_MAX_REQUESTS,
        DEBATE_CREATION_WINDOW_MS
      )

      if (!debateLimit.allowed) {
        logSecurityEvent('warn', 'debate_creation_limit_exceeded', { ip })

        // Record rate limit hit for abuse tracking
        if (isSupabaseConfigured()) {
          try {
            const ipHash = await hashIP(ip)
            await recordRateLimitHit(ipHash, pathname)
          } catch {
            // Silently fail - don't block request
          }
        }

        const response = NextResponse.json(
          { error: 'Debate creation limit exceeded. Try again later.' },
          { status: 429 }
        )
        response.headers.set(
          'Retry-After',
          Math.ceil((debateLimit.resetAt - Date.now()) / 1000).toString()
        )
        applySecurityHeaders(response, request)
        return response
      }
    }
  }

  const response = NextResponse.next()
  applySecurityHeaders(response, request)

  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
  response.headers.set(
    'X-RateLimit-Remaining',
    Math.max(0, RATE_LIMIT_MAX_REQUESTS - (ipRequestCounts.get(ip)?.count ?? 0)).toString()
  )

  // Add IP hash header for downstream use (e.g., in API routes)
  if (isSupabaseConfigured() && isProtectedRoute) {
    try {
      const ipHash = await hashIP(ip)
      response.headers.set('X-IP-Hash', ipHash)
    } catch {
      // Silently fail
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
