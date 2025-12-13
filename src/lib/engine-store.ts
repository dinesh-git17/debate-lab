// engine-store.ts
/**
 * Encrypted persistence layer for debate engine state.
 * Uses Redis with in-memory fallback; encrypts state with AES-256-GCM.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

import { Redis } from '@upstash/redis'

import type { DebateEngineState, SerializedEngineState, Turn } from '@/types/turn'

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
  engineStore: Map<string, string> | undefined
}
const memoryStore = globalForStore.engineStore ?? new Map<string, string>()
if (process.env.NODE_ENV === 'development') {
  globalForStore.engineStore = memoryStore
}

const REDIS_KEY_PREFIX = 'debate:engine:'
const ENGINE_TTL_SECONDS = 24 * 60 * 60 // 24 hours

const SALT = 'debate-lab-engine-salt'

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required')
  }
  return scryptSync(secret, SALT, 32)
}

function serializeState(state: DebateEngineState): string {
  const serialized: SerializedEngineState = {
    debateId: state.debateId,
    currentTurnIndex: state.currentTurnIndex,
    totalTurns: state.totalTurns,
    turnSequence: state.turnSequence,
    status: state.status,
    error: state.error,
    completedTurns: state.completedTurns.map((turn) => ({
      ...turn,
      startedAt: turn.startedAt.toISOString(),
      completedAt: turn.completedAt.toISOString(),
    })),
  }

  if (state.startedAt) {
    serialized.startedAt = state.startedAt.toISOString()
  }
  if (state.completedAt) {
    serialized.completedAt = state.completedAt.toISOString()
  }
  if (state.partialTurnContent) {
    serialized.partialTurnContent = state.partialTurnContent
  }

  return JSON.stringify(serialized)
}

function deserializeState(json: string): DebateEngineState {
  const parsed = JSON.parse(json) as SerializedEngineState

  const state: DebateEngineState = {
    debateId: parsed.debateId,
    currentTurnIndex: parsed.currentTurnIndex,
    totalTurns: parsed.totalTurns,
    turnSequence: parsed.turnSequence,
    status: parsed.status,
    completedTurns: parsed.completedTurns.map(
      (turn): Turn => ({
        ...turn,
        startedAt: new Date(turn.startedAt),
        completedAt: new Date(turn.completedAt),
      })
    ),
  }

  if (parsed.error) {
    state.error = parsed.error
  }
  if (parsed.startedAt) {
    state.startedAt = new Date(parsed.startedAt)
  }
  if (parsed.completedAt) {
    state.completedAt = new Date(parsed.completedAt)
  }
  if (parsed.partialTurnContent) {
    state.partialTurnContent = parsed.partialTurnContent
  }

  return state
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

export async function storeEngineState(debateId: string, state: DebateEngineState): Promise<void> {
  const serialized = serializeState(state)
  const encrypted = encrypt(serialized)
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_KEY_PREFIX}${debateId}`
    await redis.set(key, encrypted, { ex: ENGINE_TTL_SECONDS })
  } else {
    memoryStore.set(debateId, encrypted)
  }
}

export async function getEngineState(debateId: string): Promise<DebateEngineState | null> {
  const redis = getRedisClient()
  let encrypted: string | null = null

  if (redis) {
    const key = `${REDIS_KEY_PREFIX}${debateId}`
    encrypted = await redis.get<string>(key)
  } else {
    encrypted = memoryStore.get(debateId) ?? null
  }

  if (!encrypted) return null

  try {
    const decrypted = decrypt(encrypted)
    return deserializeState(decrypted)
  } catch {
    if (redis) {
      await redis.del(`${REDIS_KEY_PREFIX}${debateId}`)
    } else {
      memoryStore.delete(debateId)
    }
    return null
  }
}

export async function deleteEngineState(debateId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_KEY_PREFIX}${debateId}`
    const deleted = await redis.del(key)
    return deleted > 0
  } else {
    return memoryStore.delete(debateId)
  }
}

export async function hasEngineState(debateId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_KEY_PREFIX}${debateId}`
    const exists = await redis.exists(key)
    return exists > 0
  } else {
    return memoryStore.has(debateId)
  }
}

export async function updateEngineState(
  debateId: string,
  updater: (state: DebateEngineState) => DebateEngineState
): Promise<DebateEngineState | null> {
  const existing = await getEngineState(debateId)
  if (!existing) return null

  const updated = updater(existing)
  await storeEngineState(debateId, updated)
  return updated
}

/** Returns active debate IDs from memory store only (Redis requires SCAN). */
export function getActiveDebateIds(): string[] {
  const redis = getRedisClient()
  if (redis) {
    return []
  }
  return Array.from(memoryStore.keys())
}

/** Returns engine count from memory store only (-1 when using Redis). */
export function getEngineCount(): number {
  const redis = getRedisClient()
  if (redis) {
    return -1
  }
  return memoryStore.size
}

export function clearAllEngineStates(): void {
  memoryStore.clear()
}
