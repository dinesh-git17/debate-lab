// src/hooks/use-smooth-reveal.ts

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ANIMATION_CONFIG } from '@/lib/animation-config'

interface UseSmoothRevealOptions {
  /** Unique identifier for this message */
  messageId: string
  /** Full content accumulated from API */
  rawContent: string
  /** Is API still sending tokens? */
  isStreaming: boolean
  /** Has turn_completed fired? */
  isComplete: boolean
  /** Callback when all content is revealed */
  onRevealComplete?: () => void
  /** Skip animation entirely - show all content immediately (for hydrated/historical messages) */
  skipAnimation?: boolean
  /** Initial delay before starting to reveal (for debater "thinking" effect) */
  initialDelayMs?: number
}

interface UseSmoothRevealReturn {
  /** Content to display (revealed portion) */
  displayContent: string
  /** True if actively revealing characters */
  isRevealing: boolean
  /** True if API is streaming but no content to show yet */
  isTyping: boolean
  /** 0-100 progress percentage */
  progress: number
  /** Skip animation, show everything immediately */
  revealAll: () => void
  /** Index where new content begins (for animation targeting) */
  newContentStartIndex: number
}

/**
 * Calculates adaptive reveal speed based on buffer size.
 * Speeds up when buffer is large. Slows down when buffer is low.
 * Target: 120-150 WPM natural reading speed.
 */
function getAdaptiveCharsPerSecond(bufferSize: number, isComplete: boolean): number {
  const {
    HIGH_BUFFER_THRESHOLD,
    LOW_BUFFER_THRESHOLD,
    MAX_CHARS_PER_SECOND,
    MIN_CHARS_PER_SECOND,
    CHARS_PER_SECOND,
  } = ANIMATION_CONFIG

  // If streaming is complete, reveal at normal or faster speed to drain buffer
  if (isComplete) {
    if (bufferSize > HIGH_BUFFER_THRESHOLD) {
      return MAX_CHARS_PER_SECOND
    }
    return CHARS_PER_SECOND
  }

  // Slow down when buffer is low to avoid catching up to network
  if (bufferSize < LOW_BUFFER_THRESHOLD) {
    // Gradual slowdown as buffer decreases
    const ratio = bufferSize / LOW_BUFFER_THRESHOLD
    return MIN_CHARS_PER_SECOND + ratio * (CHARS_PER_SECOND - MIN_CHARS_PER_SECOND)
  }

  if (bufferSize > HIGH_BUFFER_THRESHOLD) {
    // Buffer is high - speed up to catch up
    const excess = bufferSize - HIGH_BUFFER_THRESHOLD
    const maxExcess = 200 // Cap the speedup
    const ratio = Math.min(excess / maxExcess, 1)
    return CHARS_PER_SECOND + ratio * (MAX_CHARS_PER_SECOND - CHARS_PER_SECOND)
  }

  // Normal speed
  return CHARS_PER_SECOND
}

/**
 * Hook for smooth, RAF-based character reveal with adaptive speed.
 * Decouples network timing from visual timing for a premium streaming experience.
 */
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

  // If skipAnimation is true, show everything immediately
  const [revealedLength, setRevealedLength] = useState(skipAnimation ? rawContent.length : 0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [newContentStartIndex, setNewContentStartIndex] = useState(0)
  const [isDelayComplete, setIsDelayComplete] = useState(skipAnimation || initialDelayMs === 0)

  // Refs for RAF callback to avoid stale closures
  const rafRef = useRef<number | null>(null)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTimeRef = useRef<number>(0)
  const revealedLengthRef = useRef(0)
  const fractionalCharsRef = useRef(0) // Accumulates fractional characters between frames
  const rawContentRef = useRef(rawContent)
  const isCompleteRef = useRef(isComplete)
  const onRevealCompleteRef = useRef(onRevealComplete)
  const hasCalledCompleteRef = useRef(false)
  const lastMessageIdRef = useRef<string | null>(null)
  const previousRevealedRef = useRef(0)

  // Keep refs in sync
  useEffect(() => {
    rawContentRef.current = rawContent
  }, [rawContent])

  useEffect(() => {
    isCompleteRef.current = isComplete
  }, [isComplete])

  useEffect(() => {
    onRevealCompleteRef.current = onRevealComplete
  }, [onRevealComplete])

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
      // If reduced motion is enabled mid-stream, reveal all
      if (e.matches) {
        setRevealedLength(rawContentRef.current.length)
        revealedLengthRef.current = rawContentRef.current.length
      }
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Reset when message changes
  useEffect(() => {
    if (messageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = messageId

      // Clear any pending delay timer
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }

      // If skipping animation, start fully revealed
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
        // Reset delay state - will be set to true after delay
        setIsDelayComplete(initialDelayMs === 0)
      }
      setNewContentStartIndex(0)
      previousRevealedRef.current = 0
      lastTimeRef.current = 0
      fractionalCharsRef.current = 0
    }
  }, [messageId, skipAnimation, initialDelayMs])

  // Handle initial delay before starting reveal
  useEffect(() => {
    if (skipAnimation || prefersReducedMotion || initialDelayMs === 0) return

    // Start delay timer when we have content to reveal
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

  // Reveal all immediately
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

  // Handle reduced motion - reveal immediately
  useEffect(() => {
    if (prefersReducedMotion && rawContent.length > 0) {
      revealAll()
    }
  }, [prefersReducedMotion, rawContent, revealAll])

  // Handle skipAnimation - call complete callback immediately
  useEffect(() => {
    if (skipAnimation && !hasCalledCompleteRef.current) {
      hasCalledCompleteRef.current = true
      onRevealComplete?.()
    }
  }, [skipAnimation, onRevealComplete])

  // Main RAF loop
  useEffect(() => {
    // Skip animation entirely for hydrated/historical messages
    if (skipAnimation || prefersReducedMotion) return

    // Wait for initial delay to complete before starting animation
    if (!isDelayComplete) return

    const animate = (timestamp: number) => {
      // If already completed, stop the loop
      if (hasCalledCompleteRef.current) {
        rafRef.current = null
        return
      }

      // Handle first frame - use a small initial delta to start revealing immediately
      let deltaTime: number
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
        deltaTime = 16 // Assume ~60fps for first frame to avoid 0 delta
      } else {
        deltaTime = timestamp - lastTimeRef.current
        lastTimeRef.current = timestamp
      }

      const currentRaw = rawContentRef.current
      const currentRevealed = revealedLengthRef.current

      // Calculate buffer size
      const bufferSize = currentRaw.length - currentRevealed

      // If nothing to reveal, check if we should complete
      if (bufferSize <= 0) {
        if (isCompleteRef.current && !hasCalledCompleteRef.current) {
          hasCalledCompleteRef.current = true
          setIsRevealing(false)
          onRevealCompleteRef.current?.()
          rafRef.current = null
          return
        }
        // Still waiting for isComplete - keep checking
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      // Calculate how many characters to reveal this frame
      const charsPerSecond = getAdaptiveCharsPerSecond(bufferSize, isCompleteRef.current)
      const charsThisFrame = (charsPerSecond * deltaTime) / 1000

      // Accumulate fractional characters - only reveal whole characters
      fractionalCharsRef.current += charsThisFrame
      const wholeCharsToReveal = Math.floor(fractionalCharsRef.current)

      // Only update if we have at least 1 whole character to reveal
      if (wholeCharsToReveal < 1) {
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      // Subtract the whole chars we're revealing, keep the fraction for next frame
      fractionalCharsRef.current -= wholeCharsToReveal

      // Update revealed length
      const newRevealed = Math.min(currentRevealed + wholeCharsToReveal, currentRaw.length)

      if (newRevealed > currentRevealed) {
        // Track where new content starts for animation
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

    // Start the loop
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [prefersReducedMotion, skipAnimation, isDelayComplete])

  // Handle visibility change (tab backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause animation by resetting lastTime
        // This prevents a huge delta when returning
        lastTimeRef.current = 0
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Derived state
  const displayContent = rawContent.slice(0, revealedLength)
  // Show typing indicator during initial delay OR when streaming but no content to display yet
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
