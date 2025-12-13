// id-generator.ts
/**
 * Cryptographically secure ID generation for debate sessions.
 * Produces URL-safe identifiers with collision-resistant randomness.
 */

import { randomBytes } from 'crypto'

export function generateDebateId(): string {
  const bytes = randomBytes(12)
  const id = bytes.toString('base64url')
  return `db_${id}`
}

export function isValidDebateId(id: string): boolean {
  return /^db_[A-Za-z0-9_-]{16}$/.test(id)
}
