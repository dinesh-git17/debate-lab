// src/lib/event-sequencer.ts

/**
 * Atomic sequence number generator using Redis INCR.
 * Each debate gets its own monotonically increasing sequence.
 */

import { Redis } from '@upstash/redis'

import { logger } from '@/lib/logging'

// Redis client - initialized lazily
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

// In-memory fallback for local development (with HMR-safe global)
const globalForSeq = globalThis as unknown as {
  seqCounters: Map<string, number> | undefined
}
const memorySeqCounters = globalForSeq.seqCounters ?? new Map<string, number>()
if (process.env.NODE_ENV === 'development') {
  globalForSeq.seqCounters = memorySeqCounters
}

const SEQ_KEY_PREFIX = 'debate:seq:'

/**
 * Get next sequence number for a debate (atomic increment).
 * This is guaranteed to be unique and monotonically increasing.
 */
export async function getNextSeq(debateId: string): Promise<number> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const key = `${SEQ_KEY_PREFIX}${debateId}`
      const seq = await redis.incr(key)

      logger.debug('Generated sequence number', { debateId, seq })

      return seq
    } catch (error) {
      logger.error(
        'Failed to generate sequence number from Redis',
        error instanceof Error ? error : null,
        { debateId }
      )
      // Fall back to memory counter on error
      const current = memorySeqCounters.get(debateId) ?? 0
      const next = current + 1
      memorySeqCounters.set(debateId, next)
      return next
    }
  } else {
    // Memory fallback for local development
    const current = memorySeqCounters.get(debateId) ?? 0
    const next = current + 1
    memorySeqCounters.set(debateId, next)
    return next
  }
}

/**
 * Get current sequence number without incrementing.
 * Useful for clients to know the latest seq for gap detection.
 */
export async function getCurrentSeq(debateId: string): Promise<number> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const key = `${SEQ_KEY_PREFIX}${debateId}`
      const val = await redis.get<number>(key)
      return val ?? 0
    } catch (error) {
      logger.error(
        'Failed to get current sequence from Redis',
        error instanceof Error ? error : null,
        { debateId }
      )
      return memorySeqCounters.get(debateId) ?? 0
    }
  } else {
    return memorySeqCounters.get(debateId) ?? 0
  }
}

/**
 * Reset sequence for a debate (use only for cleanup/testing).
 */
export async function resetSeq(debateId: string): Promise<void> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const key = `${SEQ_KEY_PREFIX}${debateId}`
      await redis.del(key)
    } catch (error) {
      logger.error('Failed to reset sequence in Redis', error instanceof Error ? error : null, {
        debateId,
      })
    }
  }

  memorySeqCounters.delete(debateId)
}

/**
 * Clear all sequence counters (for testing only).
 * Note: Only clears memory store. Does not clear Redis.
 */
export function clearAllSeqCounters(): void {
  memorySeqCounters.clear()
}
