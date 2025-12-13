// event-store.ts
/**
 * Persistent event storage using Redis Streams.
 * Enables replay, catch-up sync, and gap filling for debate events.
 */

import { Redis } from '@upstash/redis'

import { logger } from '@/lib/logging'

import type { SSEEvent } from '@/types/execution'

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
  eventStore: Map<string, SSEEvent[]> | undefined
}
const memoryStore = globalForStore.eventStore ?? new Map<string, SSEEvent[]>()
if (process.env.NODE_ENV === 'development') {
  globalForStore.eventStore = memoryStore
}

const REDIS_STREAM_PREFIX = 'debate:events:'
const EVENT_TTL_SECONDS = 24 * 60 * 60

export interface StoredEvent {
  id: string
  event: SSEEvent
}

function parseStreamEntries(entries: unknown): StoredEvent[] {
  if (!entries) {
    return []
  }

  if (Array.isArray(entries) && entries.length === 0) {
    return []
  }

  if (
    typeof entries === 'object' &&
    entries !== null &&
    !Array.isArray(entries) &&
    Object.keys(entries as object).length === 0
  ) {
    return []
  }

  logger.debug('parseStreamEntries input', {
    type: typeof entries,
    isArray: Array.isArray(entries),
    sample: JSON.stringify(entries).slice(0, 500),
  })

  const results: StoredEvent[] = []

  if (Array.isArray(entries)) {
    for (const entry of entries) {
      const parsed = parseSingleEntry(entry)
      if (parsed) results.push(parsed)
    }
    return results
  }

  if (typeof entries === 'object' && entries !== null) {
    const entriesObj = entries as Record<string, unknown>

    if ('id' in entriesObj) {
      const parsed = parseSingleEntry(entriesObj)
      if (parsed) results.push(parsed)
      return results
    }

    for (const [key, value] of Object.entries(entriesObj)) {
      logger.debug('Processing entry', {
        key,
        valueType: typeof value,
        valueIsArray: Array.isArray(value),
        valueSample: JSON.stringify(value).slice(0, 300),
      })

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const valueObj = value as Record<string, unknown>
        if ('data' in valueObj) {
          try {
            const eventData =
              typeof valueObj.data === 'string'
                ? (JSON.parse(valueObj.data) as SSEEvent)
                : (valueObj.data as SSEEvent)

            results.push({
              id: key,
              event: eventData,
            })
            continue
          } catch (e) {
            logger.warn('Failed to parse entry data', { key, error: String(e) })
          }
        }
      }

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length - 1; i += 2) {
          if (value[i] === 'data' && typeof value[i + 1] === 'string') {
            try {
              results.push({
                id: key,
                event: JSON.parse(value[i + 1]) as SSEEvent,
              })
            } catch (e) {
              logger.warn('Failed to parse array entry data', { key, error: String(e) })
            }
            break
          }
        }
      }
    }

    if (results.length > 0) return results

    logger.warn('Could not parse Redis stream entries object', {
      keys: Object.keys(entriesObj).slice(0, 5),
      firstValue: JSON.stringify(Object.values(entriesObj)[0] ?? null).slice(0, 500),
    })
  }

  logger.warn('Redis stream entries has unexpected format', { type: typeof entries })
  return results
}

function parseSingleEntry(entry: unknown): StoredEvent | null {
  if (!entry || typeof entry !== 'object') return null

  try {
    const entryObj = entry as Record<string, unknown>

    if ('id' in entryObj && 'data' in entryObj) {
      const id = String(entryObj.id)
      const data = entryObj.data

      if (typeof data === 'string') {
        return {
          id,
          event: JSON.parse(data) as SSEEvent,
        }
      }
    }

    if (Array.isArray(entry) && entry.length === 2) {
      const [id, fields] = entry
      if (typeof id === 'string' && Array.isArray(fields)) {
        for (let i = 0; i < fields.length - 1; i += 2) {
          if (fields[i] === 'data' && typeof fields[i + 1] === 'string') {
            return {
              id,
              event: JSON.parse(fields[i + 1]) as SSEEvent,
            }
          }
        }
      }
    }

    if ('id' in entryObj) {
      const id = String(entryObj.id)
      for (const [key, value] of Object.entries(entryObj)) {
        if (key === 'data' && typeof value === 'string') {
          return {
            id,
            event: JSON.parse(value) as SSEEvent,
          }
        }
      }
    }

    logger.debug('Could not parse single entry', { entry: JSON.stringify(entry).slice(0, 200) })
  } catch (error) {
    logger.error('Failed to parse Redis stream entry', error instanceof Error ? error : null, {
      entry: JSON.stringify(entry).slice(0, 200),
    })
  }

  return null
}

const streamsWithTTL = new Set<string>()

export async function appendEvent(debateId: string, event: SSEEvent): Promise<string | null> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`

      const eventId = await redis.xadd(streamKey, '*', {
        type: event.type,
        data: JSON.stringify(event),
      })

      if (!streamsWithTTL.has(streamKey)) {
        await redis.expire(streamKey, EVENT_TTL_SECONDS)
        streamsWithTTL.add(streamKey)

        logger.debug('Set TTL on Redis Stream', {
          debateId,
          ttlSeconds: EVENT_TTL_SECONDS,
        })
      }

      logger.debug('Event appended to Redis Stream', {
        debateId,
        eventType: event.type,
        eventId,
      })

      return eventId
    } catch (error) {
      logger.error(
        'Failed to append event to Redis Stream',
        error instanceof Error ? error : null,
        {
          debateId,
          eventType: event.type,
        }
      )
      return null
    }
  } else {
    const events = memoryStore.get(debateId) ?? []
    events.push(event)
    memoryStore.set(debateId, events)
    return `memory-${Date.now()}-${events.length}`
  }
}

export async function getAllEvents(debateId: string): Promise<StoredEvent[]> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`

      const entries = await redis.xrange(streamKey, '-', '+')

      const parsed = parseStreamEntries(entries)

      logger.debug('Fetched events from Redis Stream', {
        debateId,
        rawCount: Array.isArray(entries) ? entries.length : 0,
        parsedCount: parsed.length,
      })

      return parsed
    } catch (error) {
      logger.error(
        'Failed to get events from Redis Stream',
        error instanceof Error ? error : null,
        {
          debateId,
        }
      )
      return []
    }
  } else {
    // Memory fallback
    const events = memoryStore.get(debateId) ?? []
    return events.map((event, index) => ({
      id: `memory-${index}`,
      event,
    }))
  }
}

export async function getEventsSince(debateId: string, sinceId: string): Promise<StoredEvent[]> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`

      const entries = await redis.xrange(streamKey, `(${sinceId}`, '+')

      return parseStreamEntries(entries)
    } catch (error) {
      logger.error(
        'Failed to get events since ID from Redis Stream',
        error instanceof Error ? error : null,
        {
          debateId,
          sinceId,
        }
      )
      return []
    }
  } else {
    const events = memoryStore.get(debateId) ?? []
    const parts = sinceId.split('-')
    const lastPart = parts[parts.length - 1]
    const sinceIndex = lastPart !== undefined ? parseInt(lastPart, 10) : NaN

    if (isNaN(sinceIndex)) {
      return events.map((event, index) => ({
        id: `memory-${index}`,
        event,
      }))
    }

    return events.slice(sinceIndex + 1).map((event, index) => ({
      id: `memory-${sinceIndex + 1 + index}`,
      event,
    }))
  }
}

export async function getEventsAfterTimestamp(
  debateId: string,
  afterTimestamp: string
): Promise<StoredEvent[]> {
  const allEvents = await getAllEvents(debateId)
  const afterDate = new Date(afterTimestamp)

  return allEvents.filter((stored) => new Date(stored.event.timestamp) > afterDate)
}

export async function getLastEvents(debateId: string, count: number): Promise<StoredEvent[]> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`

      const entries = await redis.xrevrange(streamKey, '+', '-', count)

      const parsed = parseStreamEntries(entries)
      return parsed.reverse()
    } catch (error) {
      logger.error(
        'Failed to get last events from Redis Stream',
        error instanceof Error ? error : null,
        {
          debateId,
          count,
        }
      )
      return []
    }
  } else {
    const events = memoryStore.get(debateId) ?? []
    const lastEvents = events.slice(-count)
    const startIndex = Math.max(0, events.length - count)

    return lastEvents.map((event, index) => ({
      id: `memory-${startIndex + index}`,
      event,
    }))
  }
}

export async function getEventCount(debateId: string): Promise<number> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`
      const length = await redis.xlen(streamKey)
      return length
    } catch (error) {
      logger.error(
        'Failed to get event count from Redis Stream',
        error instanceof Error ? error : null,
        {
          debateId,
        }
      )
      return 0
    }
  } else {
    const events = memoryStore.get(debateId) ?? []
    return events.length
  }
}

export async function deleteEvents(debateId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`
      await redis.del(streamKey)
      return true
    } catch (error) {
      logger.error(
        'Failed to delete events from Redis Stream',
        error instanceof Error ? error : null,
        {
          debateId,
        }
      )
      return false
    }
  } else {
    memoryStore.delete(debateId)
    return true
  }
}

export async function hasEvents(debateId: string): Promise<boolean> {
  const count = await getEventCount(debateId)
  return count > 0
}

export async function getLastEventId(debateId: string): Promise<string | null> {
  const lastEvents = await getLastEvents(debateId, 1)
  if (lastEvents.length > 0 && lastEvents[0]) {
    return lastEvents[0].id
  }
  return null
}

export function clearAllEventStores(): void {
  memoryStore.clear()
}

export async function getEventsAfterSeq(
  debateId: string,
  afterSeq: number,
  limit: number = 100
): Promise<StoredEvent[]> {
  const allEvents = await getAllEvents(debateId)

  const filtered = allEvents
    .filter(({ event }) => {
      const eventSeq = (event as SSEEvent & { seq?: number }).seq
      return eventSeq !== undefined && eventSeq > afterSeq
    })
    .sort((a, b) => {
      const seqA = (a.event as SSEEvent & { seq?: number }).seq ?? 0
      const seqB = (b.event as SSEEvent & { seq?: number }).seq ?? 0
      return seqA - seqB
    })
    .slice(0, limit)

  return filtered
}
