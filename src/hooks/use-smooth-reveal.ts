// use-smooth-reveal.ts
/**
 * RAF-based character reveal with adaptive speed for streaming content.
 * Decouples network timing from visual timing for premium streaming UX.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ANIMATION_CONFIG } from '@/lib/animation-config'

interface UseSmoothRevealOptions {
  messageId: string
  rawContent: string
  isStreaming: boolean
  isComplete: boolean
  onRevealComplete?: () => void
  skipAnimation?: boolean
  initialDelayMs?: number
}

interface UseSmoothRevealReturn {
  displayContent: string
  isRevealing: boolean
  isTyping: boolean
  progress: number
  revealAll: () => void
  newContentStartIndex: number
}

/**
 * Calculates reveal speed based on buffer size.
 * Accelerates when behind, decelerates when catching up to network.
 */
function getAdaptiveCharsPerSecond(bufferSize: number, isComplete: boolean): number {
  const {
    HIGH_BUFFER_THRESHOLD,
    LOW_BUFFER_THRESHOLD,
    MAX_CHARS_PER_SECOND,
    MIN_CHARS_PER_SECOND,
    CHARS_PER_SECOND,
  } = ANIMATION_CONFIG

  if (isComplete) {
    if (bufferSize > HIGH_BUFFER_THRESHOLD) {
      return MAX_CHARS_PER_SECOND
    }
    return CHARS_PER_SECOND
  }

  if (bufferSize < LOW_BUFFER_THRESHOLD) {
    const ratio = bufferSize / LOW_BUFFER_THRESHOLD
    return MIN_CHARS_PER_SECOND + ratio * (CHARS_PER_SECOND - MIN_CHARS_PER_SECOND)
  }

  if (bufferSize > HIGH_BUFFER_THRESHOLD) {
    const excess = bufferSize - HIGH_BUFFER_THRESHOLD
    const maxExcess = 200
    const ratio = Math.min(excess / maxExcess, 1)
    return CHARS_PER_SECOND + ratio * (MAX_CHARS_PER_SECOND - CHARS_PER_SECOND)
  }

  return CHARS_PER_SECOND
}

export function useSmoothReveal(options: UseSmoothRevealOptions): UseSmoothRevealReturn {
  const {
    messageId,
    rawContent,
    isStreaming,
    isComplete,
    onRevealComplete,
    skipAnimation,
    initialDelayMs = 0,
  } = options

  const [revealedLength, setRevealedLength] = useState(skipAnimation ? rawContent.length : 0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [newContentStartIndex, setNewContentStartIndex] = useState(0)
  const [isDelayComplete, setIsDelayComplete] = useState(skipAnimation || initialDelayMs === 0)

  const rafRef = useRef<number | null>(null)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTimeRef = useRef<number>(0)
  const revealedLengthRef = useRef(0)
  const fractionalCharsRef = useRef(0)
  const rawContentRef = useRef(rawContent)
  const isCompleteRef = useRef(isComplete)
  const onRevealCompleteRef = useRef(onRevealComplete)
  const hasCalledCompleteRef = useRef(false)
  const lastMessageIdRef = useRef<string | null>(null)
  const previousRevealedRef = useRef(0)

  useEffect(() => {
    rawContentRef.current = rawContent
  }, [rawContent])

  useEffect(() => {
    isCompleteRef.current = isComplete
  }, [isComplete])

  useEffect(() => {
    onRevealCompleteRef.current = onRevealComplete
  }, [onRevealComplete])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
      if (e.matches) {
        setRevealedLength(rawContentRef.current.length)
        revealedLengthRef.current = rawContentRef.current.length
      }
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (messageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = messageId

      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }

      if (skipAnimation) {
        const currentLength = rawContentRef.current.length
        setRevealedLength(currentLength)
        revealedLengthRef.current = currentLength
        hasCalledCompleteRef.current = true
        setIsDelayComplete(true)
      } else {
        setRevealedLength(0)
        revealedLengthRef.current = 0
        hasCalledCompleteRef.current = false
        setIsDelayComplete(initialDelayMs === 0)
      }
      setNewContentStartIndex(0)
      previousRevealedRef.current = 0
      lastTimeRef.current = 0
      fractionalCharsRef.current = 0
    }
  }, [messageId, skipAnimation, initialDelayMs])

  useEffect(() => {
    if (skipAnimation || prefersReducedMotion || initialDelayMs === 0) return

    if (rawContent.length > 0 && !delayTimerRef.current) {
      delayTimerRef.current = setTimeout(() => {
        setIsDelayComplete(true)
        delayTimerRef.current = null
      }, initialDelayMs)
    }

    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
    }
  }, [rawContent.length, skipAnimation, prefersReducedMotion, initialDelayMs])

  const revealAll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const targetLength = rawContentRef.current.length
    setRevealedLength(targetLength)
    revealedLengthRef.current = targetLength
    setIsRevealing(false)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion && rawContent.length > 0) {
      revealAll()
    }
  }, [prefersReducedMotion, rawContent, revealAll])

  useEffect(() => {
    if (skipAnimation && !hasCalledCompleteRef.current) {
      hasCalledCompleteRef.current = true
      onRevealComplete?.()
    }
  }, [skipAnimation, onRevealComplete])

  useEffect(() => {
    if (skipAnimation || prefersReducedMotion) return
    if (!isDelayComplete) return

    const animate = (timestamp: number) => {
      if (hasCalledCompleteRef.current) {
        rafRef.current = null
        return
      }

      let deltaTime: number
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
        deltaTime = 16
      } else {
        deltaTime = timestamp - lastTimeRef.current
        lastTimeRef.current = timestamp
      }

      const currentRaw = rawContentRef.current
      const currentRevealed = revealedLengthRef.current
      const bufferSize = currentRaw.length - currentRevealed

      if (bufferSize <= 0) {
        if (isCompleteRef.current && !hasCalledCompleteRef.current) {
          hasCalledCompleteRef.current = true
          setIsRevealing(false)
          onRevealCompleteRef.current?.()
          rafRef.current = null
          return
        }
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      const charsPerSecond = getAdaptiveCharsPerSecond(bufferSize, isCompleteRef.current)
      const charsThisFrame = (charsPerSecond * deltaTime) / 1000

      fractionalCharsRef.current += charsThisFrame
      const wholeCharsToReveal = Math.floor(fractionalCharsRef.current)

      if (wholeCharsToReveal < 1) {
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      fractionalCharsRef.current -= wholeCharsToReveal
      const newRevealed = Math.min(currentRevealed + wholeCharsToReveal, currentRaw.length)

      if (newRevealed > currentRevealed) {
        if (previousRevealedRef.current !== currentRevealed) {
          setNewContentStartIndex(currentRevealed)
          previousRevealedRef.current = currentRevealed
        }

        revealedLengthRef.current = newRevealed
        setRevealedLength(newRevealed)
        setIsRevealing(true)
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [prefersReducedMotion, skipAnimation, isDelayComplete])

  // Reset timing on tab visibility change to prevent large delta on return
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastTimeRef.current = 0
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const displayContent = rawContent.slice(0, revealedLength)
  const isTyping =
    (!isDelayComplete && rawContent.length > 0) || (isStreaming && displayContent.length === 0)
  const progress =
    rawContent.length > 0 ? Math.round((revealedLength / rawContent.length) * 100) : 0

  return {
    displayContent,
    isRevealing: isRevealing && revealedLength < rawContent.length,
    isTyping,
    progress,
    revealAll,
    newContentStartIndex,
  }
}
