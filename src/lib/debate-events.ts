// debate-events.ts
/**
 * Event emission and subscription system for debate state changes.
 * Handles persistence to Redis, real-time delivery via Pusher, and SSE fallback.
 */

import { getNextSeq } from '@/lib/event-sequencer'
import { appendEvent } from '@/lib/event-store'
import { logger } from '@/lib/logging'
import { publishEvent } from '@/lib/pusher'

import type { SSEEvent, SSEEventType } from '@/types/execution'

type EventCallback = (event: SSEEvent) => void

const BATCH_STREAMING_ENABLED = process.env.BATCH_STREAMING === 'true'

// Events requiring Redis persistence for state reconstruction
const DURABLE_EVENTS: SSEEventType[] = [
  'debate_started',
  'turn_started',
  'turn_completed',
  'turn_interrupted',
  'turn_resumed',
  'debate_completed',
  'debate_error',
  'turn_error',
  'budget_warning',
]

// Events that should be persisted but NOT sequenced (applied immediately)
// These are control events that need to bypass the buffer to take effect immediately
const IMMEDIATE_EVENTS: SSEEventType[] = ['turn_interrupted', 'turn_resumed']

function isDurableEvent(type: SSEEventType): boolean {
  return DURABLE_EVENTS.includes(type)
}

function isImmediateEvent(type: SSEEventType): boolean {
  return IMMEDIATE_EVENTS.includes(type)
}

interface DebateSubscription {
  id: string
  debateId: string
  callback: EventCallback
  createdAt: Date
}

class DebateEventEmitter {
  private subscriptions: Map<string, DebateSubscription[]> = new Map()
  private eventHistory: Map<string, SSEEvent[]> = new Map()
  private maxHistorySize = 100

  subscribe(debateId: string, callback: EventCallback): () => void {
    const subscriptionId = `${debateId}_${Date.now()}_${Math.random().toString(36).slice(2)}`

    const subscription: DebateSubscription = {
      id: subscriptionId,
      debateId,
      callback,
      createdAt: new Date(),
    }

    const existing = this.subscriptions.get(debateId) ?? []
    this.subscriptions.set(debateId, [...existing, subscription])

    return () => {
      this.unsubscribe(debateId, subscriptionId)
    }
  }

  private unsubscribe(debateId: string, subscriptionId: string): void {
    const existing = this.subscriptions.get(debateId) ?? []
    const filtered = existing.filter((s) => s.id !== subscriptionId)

    if (filtered.length === 0) {
      this.subscriptions.delete(debateId)
    } else {
      this.subscriptions.set(debateId, filtered)
    }
  }

  emit(event: SSEEvent): void {
    const shouldPersist = !BATCH_STREAMING_ENABLED || isDurableEvent(event.type)

    // Debug log for interrupt/resume events
    if (event.type === 'turn_interrupted' || event.type === 'turn_resumed') {
      // eslint-disable-next-line no-console
      console.log(`[DebateEvents] emit ${event.type}`, {
        debateId: event.debateId,
        seq: (event as { seq?: number }).seq,
        shouldPersist,
      })
    }

    if (shouldPersist) {
      appendEvent(event.debateId, event).catch((error) => {
        logger.error('Failed to persist event to Redis', error instanceof Error ? error : null, {
          debateId: event.debateId,
          eventType: event.type,
        })
      })
    }

    publishEvent(event.debateId, event).catch((error) => {
      logger.error('Failed to publish event to Pusher', error instanceof Error ? error : null, {
        debateId: event.debateId,
        eventType: event.type,
      })
    })

    const subscribers = this.subscriptions.get(event.debateId) ?? []

    for (const subscriber of subscribers) {
      try {
        subscriber.callback(event)
      } catch (error) {
        logger.error(
          'DebateEvents error in subscriber callback',
          error instanceof Error ? error : null,
          {
            debateId: event.debateId,
            eventType: event.type,
          }
        )
      }
    }

    this.addToHistory(event)
  }

  /**
   * Primary event emission API for the debate engine.
   * Assigns sequence numbers only to durable events when batch streaming is enabled.
   * Immediate events (turn_interrupted, turn_resumed) get seq: 0 to bypass client buffering.
   */
  async emitEvent<T extends SSEEventType>(
    debateId: string,
    type: T,
    data: Omit<Extract<SSEEvent, { type: T }>, 'type' | 'timestamp' | 'debateId' | 'seq'>
  ): Promise<void> {
    // Immediate events bypass sequencing to be applied right away on client
    // They're still persisted (isDurableEvent) but don't need ordering guarantees
    const needsSeq = !BATCH_STREAMING_ENABLED || (isDurableEvent(type) && !isImmediateEvent(type))
    const seq = needsSeq ? await getNextSeq(debateId) : 0

    const event = {
      seq,
      type,
      timestamp: new Date().toISOString(),
      debateId,
      ...data,
    } as unknown as SSEEvent

    this.emit(event)
  }

  getSubscriberCount(debateId: string): number {
    return this.subscriptions.get(debateId)?.length ?? 0
  }

  getRecentEvents(debateId: string, since?: Date): SSEEvent[] {
    const history = this.eventHistory.get(debateId) ?? []

    if (!since) {
      return history
    }

    return history.filter((e) => new Date(e.timestamp) > since)
  }

  private addToHistory(event: SSEEvent): void {
    const history = this.eventHistory.get(event.debateId) ?? []
    history.push(event)

    if (history.length > this.maxHistorySize) {
      history.shift()
    }

    this.eventHistory.set(event.debateId, history)
  }

  clearHistory(debateId: string): void {
    this.eventHistory.delete(debateId)
  }

  cleanup(maxAge: number = 3600000): void {
    const now = Date.now()

    for (const [debateId, subs] of this.subscriptions.entries()) {
      const active = subs.filter((s) => now - s.createdAt.getTime() < maxAge)
      if (active.length === 0) {
        this.subscriptions.delete(debateId)
        this.eventHistory.delete(debateId)
      } else {
        this.subscriptions.set(debateId, active)
      }
    }
  }
}

export const debateEvents = new DebateEventEmitter()

export function formatSSEMessage(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}

export function formatSSEComment(comment: string): string {
  return `: ${comment}\n\n`
}
