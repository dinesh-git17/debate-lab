// src/lib/jury-store.ts
/**
 * Encrypted persistence layer for jury deliberation data.
 * Uses Redis with in-memory fallback; encrypts data with AES-256-GCM.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

import { Redis } from '@upstash/redis'

import type {
  ArbiterResolution,
  DeliberationExchange,
  ExtractedClaim,
  JurorEvaluation,
  JuryDeliberation,
  JuryPhase,
  ScoreDisagreement,
} from '@/types/jury'

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    redisClient = new Redis({ url, token })
    return redisClient
  }

  return null
}

const globalForStore = globalThis as unknown as {
  juryDeliberationStore: Map<string, string> | undefined
}
const deliberationMemoryStore = globalForStore.juryDeliberationStore ?? new Map<string, string>()
if (process.env.NODE_ENV === 'development') {
  globalForStore.juryDeliberationStore = deliberationMemoryStore
}

const REDIS_DELIBERATION_PREFIX = 'debate:jury:'
const JURY_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

const SALT = 'debate-lab-jury-salt'

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required')
  }
  return scryptSync(secret, SALT, 32)
}

function encrypt(data: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

function decrypt(encryptedData: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedData, 'base64')

  const iv = combined.subarray(0, 16)
  const authTag = combined.subarray(16, 32)
  const encrypted = combined.subarray(32)

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

interface SerializedJuryDeliberation {
  debateId: string
  phase: JuryPhase
  extractedClaims: ExtractedClaim[]
  geminiEvaluation: SerializedJurorEvaluation | null
  deepseekEvaluation: SerializedJurorEvaluation | null
  disagreements: ScoreDisagreement[]
  deliberationLog: SerializedDeliberationExchange[]
  arbiterResolution: ArbiterResolution | null
  generatedAt: string
  processingTimeMs: number
}

interface SerializedJurorEvaluation extends Omit<JurorEvaluation, 'evaluatedAt'> {
  evaluatedAt: string
}

interface SerializedDeliberationExchange extends Omit<DeliberationExchange, 'timestamp'> {
  timestamp: string
}

function serializeDeliberation(deliberation: JuryDeliberation): string {
  const serialized: SerializedJuryDeliberation = {
    debateId: deliberation.debateId,
    phase: deliberation.phase,
    extractedClaims: deliberation.extractedClaims,
    geminiEvaluation: deliberation.geminiEvaluation
      ? {
          ...deliberation.geminiEvaluation,
          evaluatedAt: deliberation.geminiEvaluation.evaluatedAt.toISOString(),
        }
      : null,
    deepseekEvaluation: deliberation.deepseekEvaluation
      ? {
          ...deliberation.deepseekEvaluation,
          evaluatedAt: deliberation.deepseekEvaluation.evaluatedAt.toISOString(),
        }
      : null,
    disagreements: deliberation.disagreements,
    deliberationLog: deliberation.deliberationLog.map((exchange) => ({
      ...exchange,
      timestamp: exchange.timestamp.toISOString(),
    })),
    arbiterResolution: deliberation.arbiterResolution,
    generatedAt: deliberation.generatedAt.toISOString(),
    processingTimeMs: deliberation.processingTimeMs,
  }
  return JSON.stringify(serialized)
}

function deserializeDeliberation(json: string): JuryDeliberation {
  const parsed = JSON.parse(json) as SerializedJuryDeliberation
  return {
    debateId: parsed.debateId,
    phase: parsed.phase,
    extractedClaims: parsed.extractedClaims,
    geminiEvaluation: parsed.geminiEvaluation
      ? {
          ...parsed.geminiEvaluation,
          evaluatedAt: new Date(parsed.geminiEvaluation.evaluatedAt),
        }
      : null,
    deepseekEvaluation: parsed.deepseekEvaluation
      ? {
          ...parsed.deepseekEvaluation,
          evaluatedAt: new Date(parsed.deepseekEvaluation.evaluatedAt),
        }
      : null,
    disagreements: parsed.disagreements,
    deliberationLog: parsed.deliberationLog.map((exchange) => ({
      ...exchange,
      timestamp: new Date(exchange.timestamp),
    })),
    arbiterResolution: parsed.arbiterResolution,
    generatedAt: new Date(parsed.generatedAt),
    processingTimeMs: parsed.processingTimeMs,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Deliberation Storage
// ─────────────────────────────────────────────────────────────────────────────

export async function storeDeliberation(
  debateId: string,
  deliberation: JuryDeliberation
): Promise<void> {
  const serialized = serializeDeliberation(deliberation)
  const encrypted = encrypt(serialized)
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_DELIBERATION_PREFIX}${debateId}`
    await redis.set(key, encrypted, { ex: JURY_TTL_SECONDS })
  } else {
    deliberationMemoryStore.set(debateId, encrypted)
  }
}

export async function getStoredDeliberation(debateId: string): Promise<JuryDeliberation | null> {
  const redis = getRedisClient()
  let encrypted: string | null = null

  if (redis) {
    const key = `${REDIS_DELIBERATION_PREFIX}${debateId}`
    encrypted = await redis.get<string>(key)
  } else {
    encrypted = deliberationMemoryStore.get(debateId) ?? null
  }

  if (!encrypted) return null

  try {
    const decrypted = decrypt(encrypted)
    return deserializeDeliberation(decrypted)
  } catch {
    if (redis) {
      await redis.del(`${REDIS_DELIBERATION_PREFIX}${debateId}`)
    } else {
      deliberationMemoryStore.delete(debateId)
    }
    return null
  }
}

export async function hasStoredDeliberation(debateId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_DELIBERATION_PREFIX}${debateId}`
    const exists = await redis.exists(key)
    return exists > 0
  } else {
    return deliberationMemoryStore.has(debateId)
  }
}

export async function deleteDeliberation(debateId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_DELIBERATION_PREFIX}${debateId}`
    const deleted = await redis.del(key)
    return deleted > 0
  } else {
    return deliberationMemoryStore.delete(debateId)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

export function clearJuryStore(): void {
  deliberationMemoryStore.clear()
}
