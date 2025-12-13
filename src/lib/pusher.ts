// pusher.ts
/**
 * Server-side Pusher client for publishing real-time events.
 * Handles channel management and batch event publishing.
 */

import Pusher from 'pusher'

import { logger } from '@/lib/logging'

import type { SSEEvent } from '@/types/execution'

let pusherClient: Pusher | null = null

export function isPusherConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  )
}

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

export function getDebateChannelName(debateId: string): string {
  return `debate-${debateId}`
}

export async function publishEvent(debateId: string, event: SSEEvent): Promise<boolean> {
  const pusher = getPusherClient()

  if (!pusher) {
    if (process.env.NODE_ENV === 'development') {
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

export async function publishEvents(debateId: string, events: SSEEvent[]): Promise<number> {
  const pusher = getPusherClient()

  if (!pusher || events.length === 0) {
    return 0
  }

  try {
    const channel = getDebateChannelName(debateId)

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

export function getPusherPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_PUSHER_KEY ?? null
}

export function getPusherCluster(): string | null {
  return process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? null
}
