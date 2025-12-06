// src/lib/pusher.ts

import Pusher from 'pusher'

import { logger } from '@/lib/logging'

import type { SSEEvent } from '@/types/execution'

// Pusher server-side client - initialized lazily
let pusherClient: Pusher | null = null

/**
 * Check if Pusher is configured with required environment variables.
 */
export function isPusherConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  )
}

/**
 * Get the Pusher server-side client.
 * Returns null if Pusher is not configured.
 */
function getPusherClient(): Pusher | null {
  if (pusherClient) return pusherClient

  if (!isPusherConfigured()) {
    return null
  }

  pusherClient = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  })

  return pusherClient
}

/**
 * Get the channel name for a debate.
 */
export function getDebateChannelName(debateId: string): string {
  return `debate-${debateId}`
}

/**
 * Publish an event to a debate's Pusher channel.
 * Returns true if the event was published successfully.
 */
export async function publishEvent(debateId: string, event: SSEEvent): Promise<boolean> {
  const pusher = getPusherClient()

  if (!pusher) {
    // Pusher not configured - log and continue (allows local dev without Pusher)
    if (process.env.NODE_ENV === 'development') {
      // Silent in dev without Pusher
      return false
    }
    logger.warn('Pusher not configured, skipping event publish', {
      debateId,
      eventType: event.type,
    })
    return false
  }

  try {
    const channel = getDebateChannelName(debateId)

    // Pusher event names match the SSE event types
    await pusher.trigger(channel, event.type, event)

    return true
  } catch (error) {
    logger.error('Failed to publish event to Pusher', error instanceof Error ? error : null, {
      debateId,
      eventType: event.type,
    })
    return false
  }
}

/**
 * Batch publish multiple events to a debate's Pusher channel.
 * Uses Pusher's batch trigger for efficiency.
 * Returns the number of events successfully published.
 */
export async function publishEvents(debateId: string, events: SSEEvent[]): Promise<number> {
  const pusher = getPusherClient()

  if (!pusher || events.length === 0) {
    return 0
  }

  try {
    const channel = getDebateChannelName(debateId)

    // Pusher batch API supports up to 10 events at a time
    const batchSize = 10
    let publishedCount = 0

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize)

      const batchEvents = batch.map((event) => ({
        channel,
        name: event.type,
        data: event,
      }))

      await pusher.triggerBatch(batchEvents)
      publishedCount += batch.length
    }

    return publishedCount
  } catch (error) {
    logger.error(
      'Failed to batch publish events to Pusher',
      error instanceof Error ? error : null,
      {
        debateId,
        eventCount: events.length,
      }
    )
    return 0
  }
}

/**
 * Get the public Pusher key for client-side use.
 */
export function getPusherPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_PUSHER_KEY ?? null
}

/**
 * Get the Pusher cluster for client-side use.
 */
export function getPusherCluster(): string | null {
  return process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? null
}
