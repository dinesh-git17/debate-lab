// src/lib/debate-events.ts

import { logger } from '@/lib/logging'

import type { SSEEvent, SSEEventType } from '@/types/execution'

type EventCallback = (event: SSEEvent) => void

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

  /**
   * Subscribe to events for a specific debate
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
   * Emit an event to all subscribers for a debate
   */
  emit(event: SSEEvent): void {
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
   * Emit a typed event with automatic timestamp
   */
  emitEvent<T extends SSEEventType>(
    debateId: string,
    type: T,
    data: Omit<Extract<SSEEvent, { type: T }>, 'type' | 'timestamp' | 'debateId'>
  ): void {
    const event = {
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
   * Get recent events for a debate (for replay on reconnect)
   */
  getRecentEvents(debateId: string, since?: Date): SSEEvent[] {
    const history = this.eventHistory.get(debateId) ?? []

    if (!since) {
      return history
    }

    return history.filter((e) => new Date(e.timestamp) > since)
  }

  /**
   * Add event to history
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
