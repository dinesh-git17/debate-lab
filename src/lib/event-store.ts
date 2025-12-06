// src/lib/event-store.ts

import { Redis } from '@upstash/redis'

import { logger } from '@/lib/logging'

import type { SSEEvent } from '@/types/execution'

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
const globalForStore = globalThis as unknown as {
  eventStore: Map<string, SSEEvent[]> | undefined
}
const memoryStore = globalForStore.eventStore ?? new Map<string, SSEEvent[]>()
if (process.env.NODE_ENV === 'development') {
  globalForStore.eventStore = memoryStore
}

const REDIS_STREAM_PREFIX = 'debate:events:'
const EVENT_TTL_SECONDS = 24 * 60 * 60 // 24 hours

/**
 * Stored event with Redis Stream ID
 */
export interface StoredEvent {
  id: string // Redis Stream ID (e.g., "1234567890123-0")
  event: SSEEvent
}

/**
 * Parse Redis stream entries to StoredEvent array.
 * Handles various formats that Upstash Redis might return.
 */
function parseStreamEntries(entries: unknown): StoredEvent[] {
  if (!entries) {
    return []
  }

  logger.debug('parseStreamEntries input', {
    type: typeof entries,
    isArray: Array.isArray(entries),
    sample: JSON.stringify(entries).slice(0, 500),
  })

  const results: StoredEvent[] = []

  // Handle array format (expected from XRANGE)
  if (Array.isArray(entries)) {
    for (const entry of entries) {
      const parsed = parseSingleEntry(entry)
      if (parsed) results.push(parsed)
    }
    return results
  }

  // Handle object format - Upstash might return { id: fields } or similar
  if (typeof entries === 'object' && entries !== null) {
    const entriesObj = entries as Record<string, unknown>

    // Check if it's a single entry with 'id' field
    if ('id' in entriesObj) {
      const parsed = parseSingleEntry(entriesObj)
      if (parsed) results.push(parsed)
      return results
    }

    // Check if it's a map of id -> fields
    for (const [key, value] of Object.entries(entriesObj)) {
      logger.debug('Processing entry', {
        key,
        valueType: typeof value,
        valueIsArray: Array.isArray(value),
        valueSample: JSON.stringify(value).slice(0, 300),
      })

      // Format: { "stream-id": { type: "...", data: "..." or {...} } }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const valueObj = value as Record<string, unknown>
        if ('data' in valueObj) {
          try {
            // Handle both string (needs parsing) and object (already parsed by Upstash)
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

      // Format: { "stream-id": ["field1", "value1", "field2", "value2"] }
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
      firstValue: JSON.stringify(Object.values(entriesObj)[0]).slice(0, 500),
    })
  }

  logger.warn('Redis stream entries has unexpected format', { type: typeof entries })
  return results
}

/**
 * Parse a single stream entry in various possible formats.
 */
function parseSingleEntry(entry: unknown): StoredEvent | null {
  if (!entry || typeof entry !== 'object') return null

  try {
    const entryObj = entry as Record<string, unknown>

    // Format 1: { id: string, data: string }
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

    // Format 2: [id, [field1, value1, field2, value2, ...]] (raw Redis format)
    if (Array.isArray(entry) && entry.length === 2) {
      const [id, fields] = entry
      if (typeof id === 'string' && Array.isArray(fields)) {
        // Find 'data' field in the array
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

    // Format 3: { id: string, fieldName: value, ... } where we need to find data
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

/**
 * Append an event to the Redis Stream for a debate.
 * Returns the event ID assigned by Redis.
 */
export async function appendEvent(debateId: string, event: SSEEvent): Promise<string | null> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`

      // XADD to append event to stream
      // Use * for auto-generated ID
      const eventId = await redis.xadd(streamKey, '*', {
        type: event.type,
        data: JSON.stringify(event),
      })

      // Set TTL on the stream if it's a new stream
      // Use EXPIRE to ensure cleanup after 24 hours
      await redis.expire(streamKey, EVENT_TTL_SECONDS)

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
    // Memory fallback for local development
    const events = memoryStore.get(debateId) ?? []
    events.push(event)
    memoryStore.set(debateId, events)
    return `memory-${Date.now()}-${events.length}`
  }
}

/**
 * Get all events for a debate from Redis Stream.
 */
export async function getAllEvents(debateId: string): Promise<StoredEvent[]> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`

      // XRANGE to get all events from beginning to end
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

/**
 * Get events since a specific event ID (exclusive).
 * Useful for catching up after reconnection.
 */
export async function getEventsSince(debateId: string, sinceId: string): Promise<StoredEvent[]> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`

      // XRANGE from (sinceId, +inf]
      // We use the exclusive range by using (sinceId
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
    // Memory fallback - parse index from memory ID
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

/**
 * Get events after a specific timestamp.
 * Useful for hydration when only timestamp is known.
 */
export async function getEventsAfterTimestamp(
  debateId: string,
  afterTimestamp: string
): Promise<StoredEvent[]> {
  const allEvents = await getAllEvents(debateId)
  const afterDate = new Date(afterTimestamp)

  return allEvents.filter((stored) => new Date(stored.event.timestamp) > afterDate)
}

/**
 * Get the last N events for a debate.
 */
export async function getLastEvents(debateId: string, count: number): Promise<StoredEvent[]> {
  const redis = getRedisClient()

  if (redis) {
    try {
      const streamKey = `${REDIS_STREAM_PREFIX}${debateId}`

      // XREVRANGE to get last N events (in reverse order)
      const entries = await redis.xrevrange(streamKey, '+', '-', count)

      // Reverse back to chronological order
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
    // Memory fallback
    const events = memoryStore.get(debateId) ?? []
    const lastEvents = events.slice(-count)
    const startIndex = Math.max(0, events.length - count)

    return lastEvents.map((event, index) => ({
      id: `memory-${startIndex + index}`,
      event,
    }))
  }
}

/**
 * Get event count for a debate.
 */
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

/**
 * Delete all events for a debate.
 * Useful for cleanup or testing.
 */
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

/**
 * Check if events exist for a debate.
 */
export async function hasEvents(debateId: string): Promise<boolean> {
  const count = await getEventCount(debateId)
  return count > 0
}

/**
 * Get the last event ID for a debate.
 * Useful for clients to track their position in the stream.
 */
export async function getLastEventId(debateId: string): Promise<string | null> {
  const lastEvents = await getLastEvents(debateId, 1)
  if (lastEvents.length > 0 && lastEvents[0]) {
    return lastEvents[0].id
  }
  return null
}

/**
 * Clear all event stores (for testing only).
 * Note: Only clears memory store. Does not clear Redis.
 */
export function clearAllEventStores(): void {
  memoryStore.clear()
}
