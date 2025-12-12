// use-smooth-text.ts
/**
 * Controlled-rate text display for streaming content.
 * Buffers incoming text and releases at human-readable speed.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSmoothTextOptions {
  charsPerSecond?: number
  isComplete?: boolean
  skipAnimationWhenComplete?: boolean
  onAnimationComplete?: (() => void) | undefined
}

interface UseSmoothTextReturn {
  displayText: string
  isAnimating: boolean
  skipAnimation: () => void
}

export function useSmoothText(
  content: string,
  options: UseSmoothTextOptions = {}
): UseSmoothTextReturn {
  const {
    charsPerSecond = 60,
    isComplete = false,
    skipAnimationWhenComplete = true,
    onAnimationComplete,
  } = options

  const onAnimationCompleteRef = useRef(onAnimationComplete)
  onAnimationCompleteRef.current = onAnimationComplete
  const hasCalledCompleteRef = useRef(false)

  const [displayText, setDisplayText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  const displayIndexRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const skippedRef = useRef(false)

  const msPerChar = 1000 / charsPerSecond

  const markComplete = useCallback(() => {
    if (!hasCalledCompleteRef.current) {
      hasCalledCompleteRef.current = true
      setIsAnimating(false)
      onAnimationCompleteRef.current?.()
    }
  }, [])

  const skipAnimation = useCallback(() => {
    skippedRef.current = true
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setDisplayText(content)
    displayIndexRef.current = content.length
    markComplete()
  }, [content, markComplete])

  useEffect(() => {
    if (
      skipAnimationWhenComplete &&
      isComplete &&
      displayIndexRef.current === 0 &&
      content.length > 0
    ) {
      skipAnimation()
    }
  }, [skipAnimationWhenComplete, isComplete, content.length, skipAnimation])

  useEffect(() => {
    if (skippedRef.current) {
      return
    }

    const currentIndex = displayIndexRef.current
    const targetLength = content.length

    if (currentIndex >= targetLength) {
      if (isComplete && targetLength > 0) {
        markComplete()
      } else {
        setIsAnimating(false)
      }
      return
    }

    setIsAnimating(true)

    const animate = (timestamp: number) => {
      if (skippedRef.current) return

      const elapsed = timestamp - lastUpdateRef.current

      if (elapsed >= msPerChar) {
        const charsToAdd = Math.min(
          Math.floor(elapsed / msPerChar),
          targetLength - displayIndexRef.current
        )

        if (charsToAdd > 0) {
          displayIndexRef.current += charsToAdd
          setDisplayText(content.slice(0, displayIndexRef.current))
          lastUpdateRef.current = timestamp
        }
      }

      if (displayIndexRef.current < content.length) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else if (isComplete) {
        markComplete()
      } else {
        setIsAnimating(false)
      }
    }

    if (lastUpdateRef.current === 0) {
      lastUpdateRef.current = performance.now()
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [content, msPerChar, isComplete, markComplete])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    displayText,
    isAnimating,
    skipAnimation,
  }
}
