// src/lib/judge-store.ts
/**
 * Encrypted persistence layer for judge analysis data.
 * Uses Redis with in-memory fallback; encrypts data with AES-256-GCM.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

import { Redis } from '@upstash/redis'

import type { JudgeAnalysis, QuickScore } from '@/types/judge'

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
  judgeQuickScoreStore: Map<string, string> | undefined
  judgeAnalysisStore: Map<string, string> | undefined
}
const quickScoreMemoryStore = globalForStore.judgeQuickScoreStore ?? new Map<string, string>()
const analysisMemoryStore = globalForStore.judgeAnalysisStore ?? new Map<string, string>()
if (process.env.NODE_ENV === 'development') {
  globalForStore.judgeQuickScoreStore = quickScoreMemoryStore
  globalForStore.judgeAnalysisStore = analysisMemoryStore
}

const REDIS_QUICK_SCORE_PREFIX = 'debate:judge:quick:'
const REDIS_ANALYSIS_PREFIX = 'debate:judge:full:'
const JUDGE_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days (longer than debate TTL for sharing)

const SALT = 'debate-lab-judge-salt'

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

interface SerializedQuickScore {
  forScores: QuickScore['forScores']
  againstScores: QuickScore['againstScores']
  generatedAt: string
}

function serializeQuickScore(score: QuickScore): string {
  const serialized: SerializedQuickScore = {
    forScores: score.forScores,
    againstScores: score.againstScores,
    generatedAt: score.generatedAt.toISOString(),
  }
  return JSON.stringify(serialized)
}

function deserializeQuickScore(json: string): QuickScore {
  const parsed = JSON.parse(json) as SerializedQuickScore
  return {
    forScores: parsed.forScores,
    againstScores: parsed.againstScores,
    generatedAt: new Date(parsed.generatedAt),
  }
}

interface SerializedJudgeAnalysis {
  debateId: string
  generatedAt: string
  overviewSummary: string
  debateQuality: JudgeAnalysis['debateQuality']
  debateQualityExplanation: string
  forAnalysis: JudgeAnalysis['forAnalysis']
  againstAnalysis: JudgeAnalysis['againstAnalysis']
  keyClashPoints: JudgeAnalysis['keyClashPoints']
  turningMoments: string[]
  missedOpportunities: string[]
  whatWorkedWell: string[]
  areasForImprovement: string[]
  lessonsForDebaters: string[]
  judgeNotes: string
  disclaimer: string
}

function serializeAnalysis(analysis: JudgeAnalysis): string {
  const serialized: SerializedJudgeAnalysis = {
    ...analysis,
    generatedAt: analysis.generatedAt.toISOString(),
  }
  return JSON.stringify(serialized)
}

function deserializeAnalysis(json: string): JudgeAnalysis {
  const parsed = JSON.parse(json) as SerializedJudgeAnalysis
  return {
    ...parsed,
    generatedAt: new Date(parsed.generatedAt),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Score Storage
// ─────────────────────────────────────────────────────────────────────────────

export async function storeQuickScore(debateId: string, score: QuickScore): Promise<void> {
  const serialized = serializeQuickScore(score)
  const encrypted = encrypt(serialized)
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_QUICK_SCORE_PREFIX}${debateId}`
    await redis.set(key, encrypted, { ex: JUDGE_TTL_SECONDS })
  } else {
    quickScoreMemoryStore.set(debateId, encrypted)
  }
}

export async function getStoredQuickScore(debateId: string): Promise<QuickScore | null> {
  const redis = getRedisClient()
  let encrypted: string | null = null

  if (redis) {
    const key = `${REDIS_QUICK_SCORE_PREFIX}${debateId}`
    encrypted = await redis.get<string>(key)
  } else {
    encrypted = quickScoreMemoryStore.get(debateId) ?? null
  }

  if (!encrypted) return null

  try {
    const decrypted = decrypt(encrypted)
    return deserializeQuickScore(decrypted)
  } catch {
    if (redis) {
      await redis.del(`${REDIS_QUICK_SCORE_PREFIX}${debateId}`)
    } else {
      quickScoreMemoryStore.delete(debateId)
    }
    return null
  }
}

export async function hasStoredQuickScore(debateId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_QUICK_SCORE_PREFIX}${debateId}`
    const exists = await redis.exists(key)
    return exists > 0
  } else {
    return quickScoreMemoryStore.has(debateId)
  }
}

export async function deleteQuickScore(debateId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_QUICK_SCORE_PREFIX}${debateId}`
    const deleted = await redis.del(key)
    return deleted > 0
  } else {
    return quickScoreMemoryStore.delete(debateId)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Analysis Storage
// ─────────────────────────────────────────────────────────────────────────────

export async function storeAnalysis(debateId: string, analysis: JudgeAnalysis): Promise<void> {
  const serialized = serializeAnalysis(analysis)
  const encrypted = encrypt(serialized)
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_ANALYSIS_PREFIX}${debateId}`
    await redis.set(key, encrypted, { ex: JUDGE_TTL_SECONDS })
  } else {
    analysisMemoryStore.set(debateId, encrypted)
  }
}

export async function getStoredAnalysis(debateId: string): Promise<JudgeAnalysis | null> {
  const redis = getRedisClient()
  let encrypted: string | null = null

  if (redis) {
    const key = `${REDIS_ANALYSIS_PREFIX}${debateId}`
    encrypted = await redis.get<string>(key)
  } else {
    encrypted = analysisMemoryStore.get(debateId) ?? null
  }

  if (!encrypted) return null

  try {
    const decrypted = decrypt(encrypted)
    return deserializeAnalysis(decrypted)
  } catch {
    if (redis) {
      await redis.del(`${REDIS_ANALYSIS_PREFIX}${debateId}`)
    } else {
      analysisMemoryStore.delete(debateId)
    }
    return null
  }
}

export async function hasStoredAnalysis(debateId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_ANALYSIS_PREFIX}${debateId}`
    const exists = await redis.exists(key)
    return exists > 0
  } else {
    return analysisMemoryStore.has(debateId)
  }
}

export async function deleteAnalysis(debateId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    const key = `${REDIS_ANALYSIS_PREFIX}${debateId}`
    const deleted = await redis.del(key)
    return deleted > 0
  } else {
    return analysisMemoryStore.delete(debateId)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteAllJudgeData(debateId: string): Promise<void> {
  await Promise.all([deleteQuickScore(debateId), deleteAnalysis(debateId)])
}

export function clearAllJudgeStores(): void {
  quickScoreMemoryStore.clear()
  analysisMemoryStore.clear()
}
