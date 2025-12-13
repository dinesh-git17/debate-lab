// batched-emitter.ts
/**
 * Stream batching utility for reducing real-time message frequency.
 * Buffers LLM tokens and flushes at intervals to minimize Pusher traffic.
 */

import { logger } from '@/lib/logging'

export interface BatchedEmitterOptions {
  debateId: string
  turnId: string
  onFlush: (batchedChunk: string) => Promise<void>
  batchIntervalMs?: number
  maxBatchSize?: number
}
export class BatchedStreamEmitter {
  private buffer: string = ''
  private accumulatedLength: number = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private isFlushing: boolean = false
  private isFinalized: boolean = false
  private isAborted: boolean = false

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

  async addChunk(chunk: string): Promise<void> {
    if (this.isFinalized || this.isAborted) {
      logger.warn('BatchedStreamEmitter: addChunk called after finalize/abort', {
        debateId: this.debateId,
        turnId: this.turnId,
        isAborted: this.isAborted,
      })
      return
    }

    this.buffer += chunk
    this.accumulatedLength += chunk.length

    if (!this.timer) {
      this.scheduleFlush()
    }

    if (this.buffer.length >= this.maxBatchSize) {
      await this.flush()
    }
  }

  getAccumulatedLength(): number {
    return this.accumulatedLength
  }

  private scheduleFlush(): void {
    if (this.timer) {
      return
    }

    this.timer = setTimeout(() => {
      this.timer = null
      this.flush().catch((error) => {
        logger.error(
          'BatchedStreamEmitter: scheduled flush failed',
          error instanceof Error ? error : null,
          { debateId: this.debateId, turnId: this.turnId }
        )
      })
    }, this.batchIntervalMs)
  }

  private async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) {
      return
    }

    this.isFlushing = true

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

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
      this.buffer = chunk + this.buffer
      logger.error('BatchedStreamEmitter: flush failed', error instanceof Error ? error : null, {
        debateId: this.debateId,
        turnId: this.turnId,
      })
      throw error
    } finally {
      this.isFlushing = false
    }

    if (this.buffer.length > 0 && !this.isFinalized) {
      this.scheduleFlush()
    }
  }

  /** Flush remaining buffer and mark emitter as complete. */
  async finalize(): Promise<void> {
    if (this.isFinalized) {
      return
    }

    this.isFinalized = true

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.buffer.length > 0) {
      await this.flush()
    }

    logger.debug('BatchedStreamEmitter: finalized', {
      debateId: this.debateId,
      turnId: this.turnId,
      totalLength: this.accumulatedLength,
    })
  }

  isComplete(): boolean {
    return this.isFinalized
  }

  getBufferSize(): number {
    return this.buffer.length
  }

  /**
   * Abort streaming immediately. Clears timer and returns unflushed buffer.
   * Use for pause/cancel scenarios where we need to stop mid-stream.
   */
  abort(): string {
    if (this.isAborted || this.isFinalized) {
      return ''
    }

    this.isAborted = true

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    const remainingBuffer = this.buffer
    this.buffer = ''

    logger.debug('BatchedStreamEmitter: aborted', {
      debateId: this.debateId,
      turnId: this.turnId,
      remainingBufferSize: remainingBuffer.length,
      accumulatedLength: this.accumulatedLength,
    })

    return remainingBuffer
  }

  shouldAbort(): boolean {
    return this.isAborted
  }
}
