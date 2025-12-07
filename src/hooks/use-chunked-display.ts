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
  /** Delay between chunks in ms (default: 1000ms for ~120-150 WPM) */
  chunkDelayMs?: number
  /** Minimum chunk size (default: 8) */
  minChunkSize?: number
  /** Maximum chunk size (default: 20) */
  maxChunkSize?: number
  /** Initial delay before starting to reveal text (default: 800ms) */
  initialDelayMs?: number
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

// Target: 120-150 WPM (natural reading speed)
// 120 WPM ≈ 10 chars/second, 150 WPM ≈ 12.5 chars/second
// With chunks of 8-20 chars at 1000ms intervals = 8-20 chars/sec ≈ 80-200 WPM average ~120-150 WPM
const DEFAULT_CHUNK_DELAY_MS = 1000
const DEFAULT_MIN_CHUNK_SIZE = 8
const DEFAULT_MAX_CHUNK_SIZE = 20
const DEFAULT_INITIAL_DELAY_MS = 800 // Natural pause before speaker starts

export function useChunkedDisplay(options: UseChunkedDisplayOptions): UseChunkedDisplayReturn {
  const {
    messageId,
    rawContent,
    isStreaming,
    isComplete,
    chunkDelayMs = DEFAULT_CHUNK_DELAY_MS,
    minChunkSize = DEFAULT_MIN_CHUNK_SIZE,
    maxChunkSize = DEFAULT_MAX_CHUNK_SIZE,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    onChunkRevealed,
  } = options

  const [displayContent, setDisplayContent] = useState('')
  const [isInitialDelayComplete, setIsInitialDelayComplete] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initialDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // Reset display content and initial delay when message ID changes (new message)
  useEffect(() => {
    if (messageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = messageId
      setDisplayContent('')

      // Clear any existing initial delay timer
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current)
        initialDelayRef.current = null
      }

      // For hydrated messages (already complete), skip the delay entirely
      if (isComplete && rawContent.length > 0) {
        setIsInitialDelayComplete(true)
        return
      }

      // For streaming messages, apply initial delay (natural pause before speaker starts)
      setIsInitialDelayComplete(false)
      initialDelayRef.current = setTimeout(() => {
        setIsInitialDelayComplete(true)
      }, initialDelayMs)
    }

    return () => {
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current)
        initialDelayRef.current = null
      }
    }
  }, [messageId, initialDelayMs, isComplete, rawContent.length])

  // Reveal all remaining content (also skips initial delay)
  const revealAll = useCallback(() => {
    setIsInitialDelayComplete(true)
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

  // Set up the interval for chunk processing (only after initial delay)
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Don't start processing until initial delay is complete
    if (!isInitialDelayComplete) {
      return
    }

    // Start processing chunks
    intervalRef.current = setInterval(processNextChunk, chunkDelayMs)

    // Also process immediately when delay completes
    processNextChunk()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [chunkDelayMs, processNextChunk, isInitialDelayComplete])

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
  // isTyping is true during initial delay OR when streaming with no content yet
  const isTyping =
    (!isInitialDelayComplete && rawContent.length > 0) ||
    (isStreaming && displayContent.length === 0)
  const progress = calculateProgress(rawContent, displayContent)

  return {
    displayContent,
    isBuffering,
    isTyping,
    revealAll,
    progress,
  }
}
