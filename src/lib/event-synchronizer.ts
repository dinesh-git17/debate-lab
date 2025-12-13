// event-synchronizer.ts
/**
 * Client-side event synchronization for real-time debate state.
 * Buffers events, detects gaps, and maintains strict sequence ordering.
 */

'use client'

import { clientLogger } from '@/lib/client-logger'

import type { SSEEvent } from '@/types/execution'

export type SequencedEvent = SSEEvent & { seq: number }

interface SyncState {
  lastAppliedSeq: number
  buffer: Map<number, SequencedEvent>
  isInitialSyncComplete: boolean
  isSyncing: boolean
}

interface EventSynchronizerOptions {
  debateId: string
  applyEvent: (event: SSEEvent) => void
  onSyncStateChange?: (state: 'syncing' | 'synced' | 'error') => void
  startFromSeq?: number
}

export class EventSynchronizer {
  private state: SyncState
  private debateId: string
  private applyEvent: (event: SSEEvent) => void
  private onSyncStateChange: ((state: 'syncing' | 'synced' | 'error') => void) | undefined
  private gapFillTimeout: ReturnType<typeof setTimeout> | null = null
  private readonly GAP_FILL_DELAY_MS = 100

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

  bufferEvent(event: SSEEvent): void {
    const seqEvent = event as SequencedEvent

    // Debug log for interrupt/resume events
    if (event.type === 'turn_interrupted' || event.type === 'turn_resumed') {
      // eslint-disable-next-line no-console
      console.log(`[EventSync] bufferEvent ${event.type}`, {
        seq: seqEvent.seq,
        lastApplied: this.state.lastAppliedSeq,
      })
    }

    // seq === undefined or seq === 0 means "no sequencing, apply immediately"
    // This handles non-durable events when BATCH_STREAMING is enabled
    if (seqEvent.seq === undefined || seqEvent.seq === 0) {
      this.applyEvent(event)
      return
    }

    if (seqEvent.seq <= this.state.lastAppliedSeq || this.state.buffer.has(seqEvent.seq)) {
      return
    }

    this.state.buffer.set(seqEvent.seq, seqEvent)

    if (this.state.isInitialSyncComplete) {
      this.flushBuffer()
    }
  }

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

      const response = await fetch(
        `/api/debate/${this.debateId}/events?after=${this.state.lastAppliedSeq}&limit=500`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`)
      }

      const { events, currentSeq } = (await response.json()) as {
        events: Array<{ id: string; event: SSEEvent }>
        currentSeq: number
      }

      clientLogger.info('[Sync] Fetched events from server', {
        count: events.length,
        currentSeq,
      })

      for (const { event } of events) {
        const seqEvent = event as SequencedEvent
        if (seqEvent.seq !== undefined && seqEvent.seq > this.state.lastAppliedSeq) {
          this.state.buffer.set(seqEvent.seq, seqEvent)
        }
      }

      // Adjust lastAppliedSeq if seq doesn't start at 1 to avoid false gap detection
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

      this.state.isInitialSyncComplete = true
      this.state.isSyncing = false

      this.flushBuffer()

      await this.detectAndFillGaps(currentSeq)

      this.onSyncStateChange?.('synced')

      clientLogger.info('[Sync] Initial sync complete', {
        lastAppliedSeq: this.state.lastAppliedSeq,
        remainingBuffer: this.state.buffer.size,
      })
    } catch (error) {
      this.state.isSyncing = false
      this.state.isInitialSyncComplete = true
      this.onSyncStateChange?.('error')
      clientLogger.error('[Sync] Initial sync failed, will process buffered events', error)

      if (this.state.buffer.size > 0) {
        const minSeq = Math.min(...this.state.buffer.keys())
        if (this.state.lastAppliedSeq === 0 && minSeq > 1) {
          this.state.lastAppliedSeq = minSeq - 1
        }
        this.flushBuffer()
      }
    }
  }

  private flushBuffer(): void {
    const sortedSeqs = [...this.state.buffer.keys()].sort((a, b) => a - b)

    let gapDetected = false

    for (const seq of sortedSeqs) {
      const expectedSeq = this.state.lastAppliedSeq + 1

      if (seq === expectedSeq) {
        const event = this.state.buffer.get(seq)!

        try {
          this.applyEvent(event)
          this.state.lastAppliedSeq = seq
          this.state.buffer.delete(seq)
        } catch (error) {
          clientLogger.error('[Sync] Error applying event', { seq, error })
          break
        }
      } else if (seq < expectedSeq) {
        this.state.buffer.delete(seq)
      } else {
        gapDetected = true
        break
      }
    }

    if (gapDetected && this.state.isInitialSyncComplete) {
      this.scheduleGapFill()
    }
  }

  private scheduleGapFill(): void {
    if (this.gapFillTimeout) {
      return
    }

    this.gapFillTimeout = setTimeout(async () => {
      this.gapFillTimeout = null

      const maxBufferedSeq = Math.max(...this.state.buffer.keys(), this.state.lastAppliedSeq)
      await this.detectAndFillGaps(maxBufferedSeq)
    }, this.GAP_FILL_DELAY_MS)
  }

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

    try {
      const fetchAfter = Math.min(...missingSeqs) - 1
      const response = await fetch(
        `/api/debate/${this.debateId}/events?after=${fetchAfter}&limit=${missingSeqs.length + 50}`
      )

      if (!response.ok) {
        throw new Error(`Gap fill failed: ${response.status}`)
      }

      const { events } = (await response.json()) as {
        events: Array<{ id: string; event: SSEEvent }>
      }

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

      this.flushBuffer()
    } catch (error) {
      clientLogger.error('[Sync] Gap fill failed', error)
    }
  }

  async handleReconnect(): Promise<void> {
    clientLogger.info('[Sync] Handling reconnect', { lastAppliedSeq: this.state.lastAppliedSeq })

    try {
      const response = await fetch(
        `/api/debate/${this.debateId}/events?after=${this.state.lastAppliedSeq}&limit=500`
      )

      if (!response.ok) {
        throw new Error(`Reconnect fetch failed: ${response.status}`)
      }

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

  getState(): Readonly<SyncState> {
    return { ...this.state, buffer: new Map(this.state.buffer) }
  }

  getLastAppliedSeq(): number {
    return this.state.lastAppliedSeq
  }

  isReady(): boolean {
    return this.state.isInitialSyncComplete
  }

  destroy(): void {
    if (this.gapFillTimeout) {
      clearTimeout(this.gapFillTimeout)
      this.gapFillTimeout = null
    }
    this.state.buffer.clear()
  }
}
