// src/hooks/use-chunked-display.ts

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { calculateProgress, getFinalContent, getNextChunk } from '@/lib/chunk-parser'

interface UseChunkedDisplayOptions {
  /** Unique identifier for this message */
  messageId: string
  /** Full content accumulated from API */
  rawContent: string
  /** Is API still sending tokens? */
  isStreaming: boolean
  /** Has turn_completed fired? */
  isComplete: boolean
  /** Delay between chunks in ms (default: 400ms) */
  chunkDelayMs?: number
  /** Minimum chunk size (default: 20) */
  minChunkSize?: number
  /** Maximum chunk size (default: 300) */
  maxChunkSize?: number
  /** Callback when new chunk is revealed */
  onChunkRevealed?: () => void
}

interface UseChunkedDisplayReturn {
  /** Content safe to render (markdown-complete chunks) */
  displayContent: string
  /** True if we have unrevealed content in buffer */
  isBuffering: boolean
  /** True if API is streaming but no content to show yet */
  isTyping: boolean
  /** Skip animation, show everything */
  revealAll: () => void
  /** 0-100, how much of rawContent is revealed */
  progress: number
}

const DEFAULT_CHUNK_DELAY_MS = 400

export function useChunkedDisplay(options: UseChunkedDisplayOptions): UseChunkedDisplayReturn {
  const {
    messageId,
    rawContent,
    isStreaming,
    isComplete,
    chunkDelayMs = DEFAULT_CHUNK_DELAY_MS,
    minChunkSize,
    maxChunkSize,
    onChunkRevealed,
  } = options

  const [displayContent, setDisplayContent] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const rawContentRef = useRef(rawContent)
  const isCompleteRef = useRef(isComplete)
  const onChunkRevealedRef = useRef(onChunkRevealed)

  // Keep refs up to date
  useEffect(() => {
    rawContentRef.current = rawContent
  }, [rawContent])

  useEffect(() => {
    isCompleteRef.current = isComplete
  }, [isComplete])

  useEffect(() => {
    onChunkRevealedRef.current = onChunkRevealed
  }, [onChunkRevealed])

  // Reset display content when message ID changes (new message)
  useEffect(() => {
    if (messageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = messageId
      setDisplayContent('')
    }
  }, [messageId])

  // Reveal all remaining content
  const revealAll = useCallback(() => {
    setDisplayContent(rawContentRef.current)
  }, [])

  // Main chunking logic - runs on interval
  const processNextChunk = useCallback(() => {
    setDisplayContent((currentDisplay) => {
      const currentRaw = rawContentRef.current

      // If display matches raw, nothing to do
      if (currentDisplay === currentRaw) {
        return currentDisplay
      }

      // Try to find next safe chunk
      const nextChunk = getNextChunk(currentRaw, currentDisplay, {
        minChunkSize,
        maxChunkSize,
      })

      if (nextChunk !== null) {
        // Found a safe boundary, reveal it
        onChunkRevealedRef.current?.()
        return nextChunk
      }

      // No safe boundary found
      // If streaming is complete, reveal everything remaining
      if (isCompleteRef.current && currentDisplay !== currentRaw) {
        onChunkRevealedRef.current?.()
        return getFinalContent(currentRaw)
      }

      // Keep waiting for more content
      return currentDisplay
    })
  }, [minChunkSize, maxChunkSize])

  // Set up the interval for chunk processing
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Start processing chunks
    intervalRef.current = setInterval(processNextChunk, chunkDelayMs)

    // Also process immediately on mount and when content changes
    processNextChunk()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [chunkDelayMs, processNextChunk])

  // When streaming completes, process any remaining content
  useEffect(() => {
    if (isComplete) {
      // Give one final tick to process remaining content
      const timeout = setTimeout(() => {
        setDisplayContent((currentDisplay) => {
          if (currentDisplay !== rawContent) {
            return rawContent
          }
          return currentDisplay
        })
      }, chunkDelayMs)

      return () => clearTimeout(timeout)
    }
  }, [isComplete, rawContent, chunkDelayMs])

  // Calculate derived state
  const isBuffering = rawContent.length > displayContent.length
  const isTyping = isStreaming && displayContent.length === 0
  const progress = calculateProgress(rawContent, displayContent)

  return {
    displayContent,
    isBuffering,
    isTyping,
    revealAll,
    progress,
  }
}
