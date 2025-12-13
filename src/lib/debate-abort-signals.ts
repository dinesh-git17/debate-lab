// debate-abort-signals.ts
/**
 * Abort signals for immediate pause/cancel response.
 * Uses Redis for cross-route consistency in Next.js (different API routes may run in separate contexts).
 */

import { Redis } from '@upstash/redis'

type AbortReason = 'paused' | 'cancelled'

interface AbortSignal {
  aborted: boolean
  reason: AbortReason | null
}

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

// Fallback in-memory store for dev without Redis
const memorySignals = new Map<string, AbortSignal>()

const ABORT_KEY_PREFIX = 'debate:abort:'
const ABORT_TTL_SECONDS = 60 * 60 // 1 hour

// Debug: track check count per debate
const checkCounts = new Map<string, number>()

/**
 * Set abort signal for a debate (called by pause/cancel endpoints)
 */
export async function setAbortSignal(debateId: string, reason: AbortReason): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[AbortSignal] SET signal for ${debateId}: ${reason}`)

  const signal: AbortSignal = { aborted: true, reason }
  const redis = getRedisClient()

  if (redis) {
    await redis.set(`${ABORT_KEY_PREFIX}${debateId}`, JSON.stringify(signal), {
      ex: ABORT_TTL_SECONDS,
    })
  } else {
    memorySignals.set(debateId, signal)
  }
}

/**
 * Check if debate has an abort signal (called during streaming loop)
 */
export async function checkAbortSignal(debateId: string): Promise<AbortSignal> {
  const count = (checkCounts.get(debateId) ?? 0) + 1
  checkCounts.set(debateId, count)

  const redis = getRedisClient()
  let signal: AbortSignal = { aborted: false, reason: null }

  if (redis) {
    const data = await redis.get<string>(`${ABORT_KEY_PREFIX}${debateId}`)
    if (data) {
      try {
        signal = typeof data === 'string' ? JSON.parse(data) : data
      } catch {
        signal = { aborted: false, reason: null }
      }
    }
  } else {
    signal = memorySignals.get(debateId) ?? { aborted: false, reason: null }
  }

  // Log every 50 checks and when signal is found
  if (signal.aborted || count % 50 === 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[AbortSignal] CHECK #${count} for ${debateId}: aborted=${signal.aborted}, reason=${signal.reason}`
    )
  }

  return signal
}

/**
 * Clear abort signal (called when resuming or starting new debate)
 */
export async function clearAbortSignal(debateId: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[AbortSignal] CLEAR signal for ${debateId}`)

  const redis = getRedisClient()

  if (redis) {
    await redis.del(`${ABORT_KEY_PREFIX}${debateId}`)
  } else {
    memorySignals.delete(debateId)
  }

  checkCounts.delete(debateId)
}

/**
 * Check if debate is paused (convenience method)
 */
export async function isPaused(debateId: string): Promise<boolean> {
  const signal = await checkAbortSignal(debateId)
  return signal.aborted === true && signal.reason === 'paused'
}

/**
 * Check if debate is cancelled (convenience method)
 */
export async function isCancelled(debateId: string): Promise<boolean> {
  const signal = await checkAbortSignal(debateId)
  return signal.aborted === true && signal.reason === 'cancelled'
}
