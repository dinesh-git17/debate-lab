// short-code.ts
/**
 * Cryptographically secure short code generation for shareable URLs.
 * Uses unbiased rejection sampling and URL-safe character set.
 */

import { randomBytes } from 'crypto'

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'

export function generateShortCode(length: number = 8): string {
  const alphabetLength = ALPHABET.length
  // Rejection sampling to avoid modulo bias
  const maxUsable = Math.floor(256 / alphabetLength) * alphabetLength

  let code = ''

  while (code.length < length) {
    const bytes = randomBytes(length - code.length + 10)

    for (let i = 0; i < bytes.length && code.length < length; i++) {
      const byte = bytes[i]
      if (byte !== undefined && byte < maxUsable) {
        code += ALPHABET[byte % alphabetLength]
      }
    }
  }

  return code
}

export function isValidShortCode(code: string): boolean {
  if (code.length < 6 || code.length > 12) return false
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz]+$/.test(code)
}

export function getShareUrl(shortCode: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
  return `${base}/s/${shortCode}`
}

export function getDebateUrl(debateId: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
  return `${base}/debate/${debateId}/summary`
}
