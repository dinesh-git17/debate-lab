// session-store.ts
/**
 * Encrypted debate session storage with Redis/memory fallback.
 * Uses AES-256-GCM encryption and automatic TTL-based expiration.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

import { Redis } from '@upstash/redis'

import type { DebateSession, DebateSessionPublic } from '@/types/debate'

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
  sessionStore: Map<string, string> | undefined
}
const memoryStore = globalForStore.sessionStore ?? new Map<string, string>()
if (process.env.NODE_ENV === 'development') {
  globalForStore.sessionStore = memoryStore
}

const REDIS_KEY_PREFIX = 'debate:session:'

const SALT = 'llm-debate-arena-session-salt'

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required')
  }
  return scryptSync(secret, SALT, 32)
}

function serializeSession(session: DebateSession): string {
  return JSON.stringify({
    ...session,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  })
}

function deserializeSession(json: string): DebateSession {
  const parsed = JSON.parse(json) as {
    id: string
    topic: string
    originalTopic?: string
    turns: number
    format: DebateSession['format']
    customRules: string[]
    assignment: DebateSession['assignment']
    status: DebateSession['status']
    createdAt: string
    updatedAt: string
    expiresAt: string
    backgroundCategory?: string
  }
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
    expiresAt: new Date(parsed.expiresAt),
  }
}

function encryptSession(session: DebateSession): string {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const jsonData = serializeSession(session)
  const encrypted = Buffer.concat([cipher.update(jsonData, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  const combined = Buffer.concat([iv, authTag, encrypted])
  return combined.toString('base64')
}

function decryptSession(encryptedData: string): DebateSession {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedData, 'base64')

  const iv = combined.subarray(0, 16)
  const authTag = combined.subarray(16, 32)
  const encrypted = combined.subarray(32)

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

  return deserializeSession(decrypted.toString('utf8'))
}

function getTTLSeconds(session: DebateSession): number {
  const now = Date.now()
  const expiresAt = session.expiresAt.getTime()
  return Math.max(1, Math.floor((expiresAt - now) / 1000))
}

export async function storeSession(session: DebateSession): Promise<void> {
  const encrypted = encryptSession(session)
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_KEY_PREFIX}${session.id}`
    const ttl = getTTLSeconds(session)
    await redis.set(key, encrypted, { ex: ttl })
    // eslint-disable-next-line no-console
    console.log(
      `[session-store] storeSession ${session.id}: stored in redis, key=${key}, ttl=${ttl}`
    )
  } else {
    memoryStore.set(session.id, encrypted)
    // eslint-disable-next-line no-console
    console.log(`[session-store] storeSession ${session.id}: stored in memoryStore`)
  }
}

export async function getSession(id: string): Promise<DebateSession | null> {
  const redis = getRedisClient()
  let encrypted: string | null = null

  if (redis) {
    const key = `${REDIS_KEY_PREFIX}${id}`
    encrypted = await redis.get<string>(key)
    // eslint-disable-next-line no-console
    console.log(
      `[session-store] getSession ${id}: redis=${!!redis}, key=${key}, found=${!!encrypted}`
    )
  } else {
    encrypted = memoryStore.get(id) ?? null
    // eslint-disable-next-line no-console
    console.log(`[session-store] getSession ${id}: using memoryStore, found=${!!encrypted}`)
  }

  if (!encrypted) return null

  try {
    const session = decryptSession(encrypted)

    if (!redis && session.expiresAt < new Date()) {
      memoryStore.delete(id)
      return null
    }

    return session
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[session-store] getSession ${id}: decryption failed`, error)
    if (redis) {
      await redis.del(`${REDIS_KEY_PREFIX}${id}`)
    } else {
      memoryStore.delete(id)
    }
    return null
  }
}

export async function updateSession(
  id: string,
  updates: Partial<Omit<DebateSession, 'id' | 'createdAt'>>
): Promise<DebateSession | null> {
  const existing = await getSession(id)
  if (!existing) return null

  const updated: DebateSession = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  }

  await storeSession(updated)
  return updated
}

export async function deleteSession(id: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_KEY_PREFIX}${id}`
    const deleted = await redis.del(key)
    return deleted > 0
  } else {
    return memoryStore.delete(id)
  }
}

/** Strips model assignment to prevent client from knowing which AI argues which side. */
export function toPublicSession(session: DebateSession): DebateSessionPublic {
  return {
    id: session.id,
    topic: session.topic,
    originalTopic: session.originalTopic,
    turns: session.turns,
    format: session.format,
    customRules: session.customRules,
    status: session.status,
    createdAt: session.createdAt,
    backgroundCategory: session.backgroundCategory,
  }
}

export function cleanExpiredSessions(): void {
  const redis = getRedisClient()
  if (redis) {
    return
  }

  const now = new Date()
  for (const [id] of memoryStore) {
    const encrypted = memoryStore.get(id)
    if (!encrypted) continue

    try {
      const session = decryptSession(encrypted)
      if (session.expiresAt < now) {
        memoryStore.delete(id)
      }
    } catch {
      memoryStore.delete(id)
    }
  }
}

export function getSessionCount(): number {
  const redis = getRedisClient()
  if (redis) {
    return -1
  }
  return memoryStore.size
}
