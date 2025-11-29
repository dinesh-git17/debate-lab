// src/lib/security/ip-hash.ts
// IP hashing utilities for privacy-preserving tracking
// Uses Web Crypto API for Edge Runtime compatibility

const IP_HASH_SALT = process.env.IP_HASH_SALT

if (!IP_HASH_SALT && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.error('IP_HASH_SALT is not set in production. This is a security risk.')
}

const SALT = IP_HASH_SALT ?? 'debate-lab-default-salt-change-in-production'

export async function hashIP(ip: string): Promise<string> {
  const normalized = normalizeIP(ip)
  const data = new TextEncoder().encode(`${SALT}:${normalized}`)

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function normalizeIP(ip: string): string {
  const trimmed = ip.trim().toLowerCase()

  // Handle IPv4-mapped IPv6 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice(7)
  }

  return trimmed
}

export function getClientIP(request: Request): string {
  // Check x-forwarded-for first (most common proxy header)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',')
    const firstIP = ips[0]
    if (firstIP) {
      return firstIP.trim()
    }
  }

  // Check x-real-ip (nginx)
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Check cf-connecting-ip (Cloudflare)
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }

  // Fallback for local development
  return '127.0.0.1'
}

export function getClientMetadata(request: Request): {
  userAgent?: string | undefined
  country?: string | undefined
} {
  const userAgent = request.headers.get('user-agent')
  const country = request.headers.get('cf-ipcountry')
  return {
    userAgent: userAgent ?? undefined,
    country: country ?? undefined,
  }
}

export function isValidIPHash(hash: string): boolean {
  // SHA-256 produces a 64-character hex string
  return /^[a-f0-9]{64}$/.test(hash)
}
