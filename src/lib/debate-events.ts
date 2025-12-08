// src/lib/debate-events.ts

import { getNextSeq } from '@/lib/event-sequencer'
import { appendEvent } from '@/lib/event-store'
import { logger } from '@/lib/logging'
import { publishEvent } from '@/lib/pusher'

import type { SSEEvent, SSEEventType } from '@/types/execution'

type EventCallback = (event: SSEEvent) => void

/**
 * Feature flag for batched streaming optimization.
 * When enabled:
 * - Non-durable events skip Redis persistence
 * - Non-durable events skip sequence number generation
 * This reduces Redis commands by ~97% and improves performance.
 */
const BATCH_STREAMING_ENABLED = process.env.BATCH_STREAMING === 'true'

/**
 * Events that must be persisted to Redis for durability and replay.
 * These are critical state transitions that clients need to reconstruct debate state.
 * Non-durable events (like turn_streaming) are only sent via Pusher for real-time delivery.
 */
const DURABLE_EVENTS: SSEEventType[] = [
  'debate_started',
  'turn_started',
  'turn_completed',
  'debate_completed',
  'debate_error',
  'turn_error',
  'budget_warning',
]

/**
 * Check if an event type should be persisted to Redis.
 */
function isDurableEvent(type: SSEEventType): boolean {
  return DURABLE_EVENTS.includes(type)
}

interface DebateSubscription {
  id: string
  debateId: string
  callback: EventCallback
  createdAt: Date
}

class DebateEventEmitter {
  // Local subscriptions - still useful for SSE fallback and local development
  private subscriptions: Map<string, DebateSubscription[]> = new Map()
  // In-memory history - kept for SSE fallback only
  private eventHistory: Map<string, SSEEvent[]> = new Map()
  private maxHistorySize = 100

  /**
   * Subscribe to events for a specific debate (local/SSE fallback only)
   */
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

  /**
   * Unsubscribe from events
   */
  private unsubscribe(debateId: string, subscriptionId: string): void {
    const existing = this.subscriptions.get(debateId) ?? []
    const filtered = existing.filter((s) => s.id !== subscriptionId)

    if (filtered.length === 0) {
      this.subscriptions.delete(debateId)
    } else {
      this.subscriptions.set(debateId, filtered)
    }
  }

  /**
   * Emit an event to all subscribers for a debate.
   * This now:
   * 1. Persists to Redis Stream (for durability and catch-up) - ONLY for durable events when BATCH_STREAMING is enabled
   * 2. Publishes to Pusher (for real-time delivery) - ALWAYS
   * 3. Notifies local subscribers (for SSE fallback) - ALWAYS
   */
  emit(event: SSEEvent): void {
    // 1. Persist to Redis Stream (fire-and-forget, don't block)
    // When BATCH_STREAMING is enabled, only persist durable events to reduce Redis load
    const shouldPersist = !BATCH_STREAMING_ENABLED || isDurableEvent(event.type)

    if (shouldPersist) {
      appendEvent(event.debateId, event).catch((error) => {
        logger.error('Failed to persist event to Redis', error instanceof Error ? error : null, {
          debateId: event.debateId,
          eventType: event.type,
        })
      })
    }

    // 2. Publish to Pusher for real-time delivery (fire-and-forget)
    publishEvent(event.debateId, event).catch((error) => {
      logger.error('Failed to publish event to Pusher', error instanceof Error ? error : null, {
        debateId: event.debateId,
        eventType: event.type,
      })
    })

    // 3. Notify local subscribers (for SSE fallback)
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

    // Keep local history for SSE fallback
    this.addToHistory(event)
  }

  /**
   * Emit a typed event with automatic timestamp and sequence number.
   * This is the primary API used by the debate engine.
   *
   * IMPORTANT: This method is now async to support atomic sequence generation.
   * Callers should await or handle the promise appropriately.
   *
   * When BATCH_STREAMING is enabled:
   * - Durable events get atomic sequence numbers (for ordering and replay)
   * - Non-durable events (streaming) skip sequence generation (reduces Redis calls ~90%)
   */
  async emitEvent<T extends SSEEventType>(
    debateId: string,
    type: T,
    data: Omit<Extract<SSEEvent, { type: T }>, 'type' | 'timestamp' | 'debateId' | 'seq'>
  ): Promise<void> {
    // Determine if this event needs a sequence number
    // When BATCH_STREAMING is enabled, only durable events need seq numbers
    const needsSeq = !BATCH_STREAMING_ENABLED || isDurableEvent(type)
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

  /**
   * Get subscriber count for a debate
   */
  getSubscriberCount(debateId: string): number {
    return this.subscriptions.get(debateId)?.length ?? 0
  }

  /**
   * Get recent events for a debate (for SSE replay on reconnect - local fallback only)
   * For production, use event-store.ts functions instead.
   */
  getRecentEvents(debateId: string, since?: Date): SSEEvent[] {
    const history = this.eventHistory.get(debateId) ?? []

    if (!since) {
      return history
    }

    return history.filter((e) => new Date(e.timestamp) > since)
  }

  /**
   * Add event to local history
   */
  private addToHistory(event: SSEEvent): void {
    const history = this.eventHistory.get(event.debateId) ?? []
    history.push(event)

    if (history.length > this.maxHistorySize) {
      history.shift()
    }

    this.eventHistory.set(event.debateId, history)
  }

  /**
   * Clear history for a debate
   */
  clearHistory(debateId: string): void {
    this.eventHistory.delete(debateId)
  }

  /**
   * Clean up old subscriptions and history
   */
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

/**
 * Helper to create SSE formatted message
 */
export function formatSSEMessage(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}

/**
 * Helper to create SSE comment (for keep-alive)
 */
export function formatSSEComment(comment: string): string {
  return `: ${comment}\n\n`
}
