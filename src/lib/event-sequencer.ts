// event-sequencer.ts
/**
 * Atomic sequence number generator for event ordering.
 * Uses Redis INCR for distributed consistency with in-memory fallback.
 */

import { Redis } from '@upstash/redis'

import { logger } from '@/lib/logging'

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

const globalForSeq = globalThis as unknown as {
  seqCounters: Map<string, number> | undefined
}
const memorySeqCounters = globalForSeq.seqCounters ?? new Map<string, number>()
if (process.env.NODE_ENV === 'development') {
  globalForSeq.seqCounters = memorySeqCounters
}

const SEQ_KEY_PREFIX = 'debate:seq:'

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
      const current = memorySeqCounters.get(debateId) ?? 0
      const next = current + 1
      memorySeqCounters.set(debateId, next)
      return next
    }
  } else {
    const current = memorySeqCounters.get(debateId) ?? 0
    const next = current + 1
    memorySeqCounters.set(debateId, next)
    return next
  }
}

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

export function clearAllSeqCounters(): void {
  memorySeqCounters.clear()
}
