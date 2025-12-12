// src/lib/short-code.ts

import { randomBytes } from 'crypto'

/**
 * Characters used for short codes (URL-safe, unambiguous)
 * Excludes: 0, O, I, l, 1 to avoid confusion
 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'

/**
 * Generate a random short code using unbiased rejection sampling.
 * Security: Avoids modulo bias by rejecting bytes outside the usable range.
 */
export function generateShortCode(length: number = 8): string {
  const alphabetLength = ALPHABET.length
  // Calculate the largest multiple of alphabetLength that fits in a byte (0-255)
  // This ensures uniform distribution by rejecting biased values
  const maxUsable = Math.floor(256 / alphabetLength) * alphabetLength

  let code = ''

  while (code.length < length) {
    // Request more bytes than needed to reduce iterations
    const bytes = randomBytes(length - code.length + 10)

    for (let i = 0; i < bytes.length && code.length < length; i++) {
      const byte = bytes[i]
      // Only use bytes in the unbiased range [0, maxUsable)
      if (byte !== undefined && byte < maxUsable) {
        code += ALPHABET[byte % alphabetLength]
      }
    }
  }

  return code
}

/**
 * Validate short code format
 */
export function isValidShortCode(code: string): boolean {
  if (code.length < 6 || code.length > 12) return false
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz]+$/.test(code)
}

/**
 * Generate share URL from short code
 */
export function getShareUrl(shortCode: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
  return `${base}/s/${shortCode}`
}

/**
 * Generate full debate URL
 */
export function getDebateUrl(debateId: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
  return `${base}/debate/${debateId}/summary`
}
