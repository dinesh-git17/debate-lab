// src/lib/event-synchronizer.ts

'use client'

import { clientLogger } from '@/lib/client-logger'

import type { SSEEvent } from '@/types/execution'

/** Event with sequence number */
export type SequencedEvent = SSEEvent & { seq: number }

interface SyncState {
  /** Last successfully applied sequence number */
  lastAppliedSeq: number
  /** Buffer of events waiting to be applied (keyed by seq) */
  buffer: Map<number, SequencedEvent>
  /** Whether initial sync has completed */
  isInitialSyncComplete: boolean
  /** Whether sync is currently in progress */
  isSyncing: boolean
}

interface EventSynchronizerOptions {
  /** Debate ID to sync */
  debateId: string
  /** Function to apply an event to the store */
  applyEvent: (event: SSEEvent) => void
  /** Called when sync state changes */
  onSyncStateChange?: (state: 'syncing' | 'synced' | 'error') => void
  /** Starting sequence number (0 for new connections, or restored from storage) */
  startFromSeq?: number
}

export class EventSynchronizer {
  private state: SyncState
  private debateId: string
  private applyEvent: (event: SSEEvent) => void
  private onSyncStateChange: ((state: 'syncing' | 'synced' | 'error') => void) | undefined
  private gapFillTimeout: ReturnType<typeof setTimeout> | null = null
  private readonly GAP_FILL_DELAY_MS = 100 // Wait briefly before filling gaps

  constructor(options: EventSynchronizerOptions) {
    this.debateId = options.debateId
    this.applyEvent = options.applyEvent
    this.onSyncStateChange = options.onSyncStateChange

    this.state = {
      lastAppliedSeq: options.startFromSeq ?? 0,
      buffer: new Map(),
      isInitialSyncComplete: false,
      isSyncing: false,
    }
  }

  /**
   * Buffer an incoming event from Pusher.
   * Events are held until initial sync completes, then applied in order.
   */
  bufferEvent(event: SSEEvent): void {
    // Check if event has seq (backwards compatibility with old events)
    const seqEvent = event as SequencedEvent
    if (seqEvent.seq === undefined) {
      // Old event without seq - apply directly (backwards compatibility)
      clientLogger.debug('[Sync] Event without seq, applying directly', { type: event.type })
      this.applyEvent(event)
      return
    }

    // Skip if already applied
    if (seqEvent.seq <= this.state.lastAppliedSeq) {
      clientLogger.debug('[Sync] Skipping already-applied event', { seq: seqEvent.seq })
      return
    }

    // Skip if already buffered
    if (this.state.buffer.has(seqEvent.seq)) {
      clientLogger.debug('[Sync] Skipping already-buffered event', { seq: seqEvent.seq })
      return
    }

    // Add to buffer
    this.state.buffer.set(seqEvent.seq, seqEvent)
    clientLogger.debug('[Sync] Buffered event', {
      seq: seqEvent.seq,
      type: event.type,
      bufferSize: this.state.buffer.size,
    })

    // Try to flush if initial sync is complete
    if (this.state.isInitialSyncComplete) {
      this.flushBuffer()
    }
  }

  /**
   * Perform initial sync: fetch history, merge with buffer, apply in order.
   * Call this AFTER subscribing to Pusher.
   */
  async performInitialSync(): Promise<void> {
    if (this.state.isSyncing) {
      clientLogger.warn('[Sync] Initial sync already in progress')
      return
    }

    this.state.isSyncing = true
    this.onSyncStateChange?.('syncing')

    try {
      clientLogger.info('[Sync] Starting initial sync', {
        debateId: this.debateId,
        startFromSeq: this.state.lastAppliedSeq,
      })

      // Fetch all events after our starting point
      const response = await fetch(
        `/api/debate/${this.debateId}/events?after=${this.state.lastAppliedSeq}&limit=500`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`)
      }

      // API returns { events: [{ id, event }], currentSeq } - destructure inner event
      const { events, currentSeq } = (await response.json()) as {
        events: Array<{ id: string; event: SSEEvent }>
        currentSeq: number
      }

      clientLogger.info('[Sync] Fetched events from server', {
        count: events.length,
        currentSeq,
      })

      // Add fetched events to buffer (Map dedupes by seq automatically)
      for (const { event } of events) {
        const seqEvent = event as SequencedEvent
        if (seqEvent.seq !== undefined && seqEvent.seq > this.state.lastAppliedSeq) {
          this.state.buffer.set(seqEvent.seq, seqEvent)
        }
      }

      // Bug #3 fix: If seq doesn't start at 1, adjust lastAppliedSeq to avoid false gap
      if (this.state.lastAppliedSeq === 0 && this.state.buffer.size > 0) {
        const minSeq = Math.min(...this.state.buffer.keys())
        if (minSeq > 1) {
          clientLogger.info('[Sync] Adjusting lastAppliedSeq to match first event', {
            minSeq,
            adjustedTo: minSeq - 1,
          })
          this.state.lastAppliedSeq = minSeq - 1
        }
      }

      // Mark sync complete
      this.state.isInitialSyncComplete = true
      this.state.isSyncing = false

      // Flush buffer (applies events in order)
      this.flushBuffer()

      // Check for gaps and fill them
      await this.detectAndFillGaps(currentSeq)

      this.onSyncStateChange?.('synced')

      clientLogger.info('[Sync] Initial sync complete', {
        lastAppliedSeq: this.state.lastAppliedSeq,
        remainingBuffer: this.state.buffer.size,
      })
    } catch (error) {
      // Bug #4 fix: Still mark sync complete so buffered Pusher events can be processed
      this.state.isSyncing = false
      this.state.isInitialSyncComplete = true
      this.onSyncStateChange?.('error')
      clientLogger.error('[Sync] Initial sync failed, will process buffered events', error)

      // Try to flush any buffered events we received via Pusher
      if (this.state.buffer.size > 0) {
        // Adjust lastAppliedSeq if needed
        const minSeq = Math.min(...this.state.buffer.keys())
        if (this.state.lastAppliedSeq === 0 && minSeq > 1) {
          this.state.lastAppliedSeq = minSeq - 1
        }
        this.flushBuffer()
      }
      // Don't rethrow - allow the app to continue with Pusher events
    }
  }

  /**
   * Apply events from buffer in strict sequence order.
   */
  private flushBuffer(): void {
    // Get all buffered seqs and sort them
    const sortedSeqs = [...this.state.buffer.keys()].sort((a, b) => a - b)

    let appliedCount = 0
    let gapDetected = false

    for (const seq of sortedSeqs) {
      const expectedSeq = this.state.lastAppliedSeq + 1

      if (seq === expectedSeq) {
        // This is the next expected event - apply it
        const event = this.state.buffer.get(seq)!

        try {
          this.applyEvent(event)
          this.state.lastAppliedSeq = seq
          this.state.buffer.delete(seq)
          appliedCount++
        } catch (error) {
          clientLogger.error('[Sync] Error applying event', { seq, error })
          // Don't advance lastAppliedSeq, will retry on next flush
          break
        }
      } else if (seq < expectedSeq) {
        // Already applied - remove from buffer
        this.state.buffer.delete(seq)
      } else {
        // Gap detected: seq > expectedSeq
        // Stop flushing - need to fetch missing events
        gapDetected = true
        clientLogger.warn('[Sync] Gap detected', {
          expectedSeq,
          gotSeq: seq,
          gap: seq - expectedSeq,
        })
        break
      }
    }

    if (appliedCount > 0) {
      clientLogger.debug('[Sync] Flushed events', {
        appliedCount,
        lastAppliedSeq: this.state.lastAppliedSeq,
        remainingBuffer: this.state.buffer.size,
      })
    }

    // Schedule gap fill if needed (debounced)
    if (gapDetected && this.state.isInitialSyncComplete) {
      this.scheduleGapFill()
    }
  }

  /**
   * Schedule gap filling with debounce to batch multiple gap detections.
   */
  private scheduleGapFill(): void {
    if (this.gapFillTimeout) {
      return // Already scheduled
    }

    this.gapFillTimeout = setTimeout(async () => {
      this.gapFillTimeout = null

      // Get the max seq we know about
      const maxBufferedSeq = Math.max(...this.state.buffer.keys(), this.state.lastAppliedSeq)
      await this.detectAndFillGaps(maxBufferedSeq)
    }, this.GAP_FILL_DELAY_MS)
  }

  /**
   * Detect gaps between lastAppliedSeq and targetSeq, fetch missing events.
   */
  private async detectAndFillGaps(targetSeq: number): Promise<void> {
    const missingSeqs: number[] = []

    for (let seq = this.state.lastAppliedSeq + 1; seq <= targetSeq; seq++) {
      if (!this.state.buffer.has(seq)) {
        missingSeqs.push(seq)
      }
    }

    if (missingSeqs.length === 0) {
      return
    }

    clientLogger.info('[Sync] Filling gaps', {
      count: missingSeqs.length,
      range: `${missingSeqs[0]}-${missingSeqs[missingSeqs.length - 1]}`,
    })

    try {
      // Fetch from just before the first missing seq
      const fetchAfter = Math.min(...missingSeqs) - 1
      const response = await fetch(
        `/api/debate/${this.debateId}/events?after=${fetchAfter}&limit=${missingSeqs.length + 50}`
      )

      if (!response.ok) {
        throw new Error(`Gap fill failed: ${response.status}`)
      }

      // API returns { events: [{ id, event }] } - destructure inner event
      const { events } = (await response.json()) as {
        events: Array<{ id: string; event: SSEEvent }>
      }

      // Add to buffer
      for (const { event } of events) {
        const seqEvent = event as SequencedEvent
        if (
          seqEvent.seq !== undefined &&
          seqEvent.seq > this.state.lastAppliedSeq &&
          !this.state.buffer.has(seqEvent.seq)
        ) {
          this.state.buffer.set(seqEvent.seq, seqEvent)
        }
      }

      // Flush again with the new events
      this.flushBuffer()
    } catch (error) {
      clientLogger.error('[Sync] Gap fill failed', error)
      // Will retry on next gap detection
    }
  }

  /**
   * Handle Pusher reconnection - fetch any events missed during disconnect.
   */
  async handleReconnect(): Promise<void> {
    clientLogger.info('[Sync] Handling reconnect', { lastAppliedSeq: this.state.lastAppliedSeq })

    try {
      const response = await fetch(
        `/api/debate/${this.debateId}/events?after=${this.state.lastAppliedSeq}&limit=500`
      )

      if (!response.ok) {
        throw new Error(`Reconnect fetch failed: ${response.status}`)
      }

      // API returns { events: [{ id, event }] } - destructure inner event
      const { events, currentSeq } = (await response.json()) as {
        events: Array<{ id: string; event: SSEEvent }>
        currentSeq: number
      }

      for (const { event } of events) {
        const seqEvent = event as SequencedEvent
        if (seqEvent.seq !== undefined && seqEvent.seq > this.state.lastAppliedSeq) {
          this.state.buffer.set(seqEvent.seq, seqEvent)
        }
      }

      this.flushBuffer()
      await this.detectAndFillGaps(currentSeq)
    } catch (error) {
      clientLogger.error('[Sync] Reconnect sync failed', error)
    }
  }

  /**
   * Get current sync state for debugging/monitoring.
   */
  getState(): Readonly<SyncState> {
    return { ...this.state, buffer: new Map(this.state.buffer) }
  }

  /**
   * Get last applied sequence number (for persistence/restoration).
   */
  getLastAppliedSeq(): number {
    return this.state.lastAppliedSeq
  }

  /**
   * Check if initial sync is complete.
   */
  isReady(): boolean {
    return this.state.isInitialSyncComplete
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    if (this.gapFillTimeout) {
      clearTimeout(this.gapFillTimeout)
      this.gapFillTimeout = null
    }
    this.state.buffer.clear()
  }
}
