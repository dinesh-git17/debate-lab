// src/lib/batched-emitter.ts

import { logger } from '@/lib/logging'

/**
 * Options for configuring the BatchedStreamEmitter.
 */
export interface BatchedEmitterOptions {
  /** Unique identifier for the debate */
  debateId: string
  /** Unique identifier for the current turn */
  turnId: string
  /** Callback invoked when buffer is flushed with batched content */
  onFlush: (batchedChunk: string) => Promise<void>
  /** Interval in milliseconds between automatic flushes (default: 200) */
  batchIntervalMs?: number
  /** Maximum buffer size in characters before forcing a flush (default: 150) */
  maxBatchSize?: number
}

/**
 * BatchedStreamEmitter buffers streaming chunks and flushes them in batches.
 *
 * This reduces Pusher messages by ~90% by combining multiple LLM tokens
 * into single batched messages while maintaining smooth streaming UX.
 *
 * Flush triggers:
 * 1. Time-based: Every `batchIntervalMs` (default 200ms)
 * 2. Size-based: When buffer exceeds `maxBatchSize` (default 150 chars)
 * 3. Manual: Via `finalize()` when turn completes
 *
 * @example
 * ```ts
 * const batcher = new BatchedStreamEmitter({
 *   debateId,
 *   turnId,
 *   onFlush: async (chunk) => {
 *     await publishEvent(debateId, { type: 'turn_streaming', chunk })
 *   }
 * })
 *
 * for await (const token of llmStream) {
 *   await batcher.addChunk(token)
 * }
 *
 * await batcher.finalize()
 * ```
 */
export class BatchedStreamEmitter {
  private buffer: string = ''
  private accumulatedLength: number = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private isFlushing: boolean = false
  private isFinalized: boolean = false

  private readonly debateId: string
  private readonly turnId: string
  private readonly onFlush: (batchedChunk: string) => Promise<void>
  private readonly batchIntervalMs: number
  private readonly maxBatchSize: number

  constructor(options: BatchedEmitterOptions) {
    this.debateId = options.debateId
    this.turnId = options.turnId
    this.onFlush = options.onFlush
    this.batchIntervalMs = options.batchIntervalMs ?? 200
    this.maxBatchSize = options.maxBatchSize ?? 150
  }

  /**
   * Add a chunk to the buffer.
   * May trigger an immediate flush if buffer exceeds maxBatchSize.
   */
  async addChunk(chunk: string): Promise<void> {
    if (this.isFinalized) {
      logger.warn('BatchedStreamEmitter: addChunk called after finalize', {
        debateId: this.debateId,
        turnId: this.turnId,
      })
      return
    }

    this.buffer += chunk
    this.accumulatedLength += chunk.length

    // Start timer if not already running
    if (!this.timer) {
      this.scheduleFlush()
    }

    // Flush immediately if buffer exceeds max size
    if (this.buffer.length >= this.maxBatchSize) {
      await this.flush()
    }
  }

  /**
   * Get the current accumulated length (total chars added so far).
   */
  getAccumulatedLength(): number {
    return this.accumulatedLength
  }

  /**
   * Schedule a flush after batchIntervalMs.
   */
  private scheduleFlush(): void {
    if (this.timer) {
      return
    }

    this.timer = setTimeout(() => {
      this.timer = null
      // Fire-and-forget the flush, but log errors
      this.flush().catch((error) => {
        logger.error(
          'BatchedStreamEmitter: scheduled flush failed',
          error instanceof Error ? error : null,
          { debateId: this.debateId, turnId: this.turnId }
        )
      })
    }, this.batchIntervalMs)
  }

  /**
   * Flush the current buffer to the onFlush callback.
   */
  private async flush(): Promise<void> {
    // Prevent concurrent flushes
    if (this.isFlushing || this.buffer.length === 0) {
      return
    }

    this.isFlushing = true

    // Clear any pending timer
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    // Capture and clear buffer atomically
    const chunk = this.buffer
    this.buffer = ''

    try {
      await this.onFlush(chunk)

      logger.debug('BatchedStreamEmitter: flushed', {
        debateId: this.debateId,
        turnId: this.turnId,
        chunkSize: chunk.length,
        accumulatedLength: this.accumulatedLength,
      })
    } catch (error) {
      // Put the chunk back on failure so it's not lost
      this.buffer = chunk + this.buffer
      logger.error('BatchedStreamEmitter: flush failed', error instanceof Error ? error : null, {
        debateId: this.debateId,
        turnId: this.turnId,
      })
      throw error
    } finally {
      this.isFlushing = false
    }

    // If there's more content in buffer after flush, schedule another
    if (this.buffer.length > 0 && !this.isFinalized) {
      this.scheduleFlush()
    }
  }

  /**
   * Finalize the emitter: flush any remaining buffer and clean up.
   * Call this when the turn completes before emitting turn_completed.
   */
  async finalize(): Promise<void> {
    if (this.isFinalized) {
      return
    }

    this.isFinalized = true

    // Clear any pending timer
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    // Flush any remaining content
    if (this.buffer.length > 0) {
      await this.flush()
    }

    logger.debug('BatchedStreamEmitter: finalized', {
      debateId: this.debateId,
      turnId: this.turnId,
      totalLength: this.accumulatedLength,
    })
  }

  /**
   * Check if the emitter has been finalized.
   */
  isComplete(): boolean {
    return this.isFinalized
  }

  /**
   * Get current buffer size (for debugging/monitoring).
   */
  getBufferSize(): number {
    return this.buffer.length
  }
}
