// use-chunked-display.ts
/**
 * Markdown-aware chunked text display for streaming content.
 * Reveals content at natural reading speed while preserving markdown integrity.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { calculateProgress, getFinalContent, getNextChunk } from '@/lib/chunk-parser'

interface UseChunkedDisplayOptions {
  messageId: string
  rawContent: string
  isStreaming: boolean
  isComplete: boolean
  chunkDelayMs?: number
  minChunkSize?: number
  maxChunkSize?: number
  initialDelayMs?: number
  onChunkRevealed?: () => void
}

interface UseChunkedDisplayReturn {
  displayContent: string
  isBuffering: boolean
  isTyping: boolean
  revealAll: () => void
  progress: number
}

// Chunk timing calibrated for 120-150 WPM natural reading speed
const DEFAULT_CHUNK_DELAY_MS = 1000
const DEFAULT_MIN_CHUNK_SIZE = 8
const DEFAULT_MAX_CHUNK_SIZE = 20
const DEFAULT_INITIAL_DELAY_MS = 800

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

  useEffect(() => {
    rawContentRef.current = rawContent
  }, [rawContent])

  useEffect(() => {
    isCompleteRef.current = isComplete
  }, [isComplete])

  useEffect(() => {
    onChunkRevealedRef.current = onChunkRevealed
  }, [onChunkRevealed])

  useEffect(() => {
    if (messageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = messageId
      setDisplayContent('')

      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current)
        initialDelayRef.current = null
      }

      // Skip delay for hydrated messages that are already complete
      if (isComplete && rawContent.length > 0) {
        setIsInitialDelayComplete(true)
        return
      }

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

  const revealAll = useCallback(() => {
    setIsInitialDelayComplete(true)
    setDisplayContent(rawContentRef.current)
  }, [])

  const processNextChunk = useCallback(() => {
    setDisplayContent((currentDisplay) => {
      const currentRaw = rawContentRef.current

      if (currentDisplay === currentRaw) {
        return currentDisplay
      }

      const nextChunk = getNextChunk(currentRaw, currentDisplay, {
        minChunkSize,
        maxChunkSize,
      })

      if (nextChunk !== null) {
        onChunkRevealedRef.current?.()
        return nextChunk
      }

      if (isCompleteRef.current && currentDisplay !== currentRaw) {
        onChunkRevealedRef.current?.()
        return getFinalContent(currentRaw)
      }

      return currentDisplay
    })
  }, [minChunkSize, maxChunkSize])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!isInitialDelayComplete) {
      return
    }

    intervalRef.current = setInterval(processNextChunk, chunkDelayMs)
    processNextChunk()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [chunkDelayMs, processNextChunk, isInitialDelayComplete])

  useEffect(() => {
    if (isComplete) {
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

  const isBuffering = rawContent.length > displayContent.length
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
