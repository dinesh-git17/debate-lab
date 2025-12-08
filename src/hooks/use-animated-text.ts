// src/hooks/use-animated-text.ts

'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Options for configuring the animated text hook.
 */
export interface UseAnimatedTextOptions {
  /** Whether animation is enabled (default: true). When false, returns targetText immediately. */
  enabled?: boolean
  /** Number of characters to reveal per animation frame (default: 3) */
  charsPerFrame?: number
  /** Target frame rate in ms (default: 16.67ms = ~60fps) */
  frameIntervalMs?: number
}

/**
 * Hook that animates text character by character for smooth streaming display.
 *
 * Takes incoming text (which may arrive in batches) and returns a progressively
 * revealed version of that text, creating a smooth typewriter effect.
 *
 * Features:
 * - Runs at ~60fps using requestAnimationFrame
 * - Reveals 2-3 characters per frame for natural reading speed (~180-270 chars/sec)
 * - Catches up smoothly when new batches arrive (target text grows)
 * - Respects prefers-reduced-motion media query
 * - Properly cleans up on unmount
 *
 * @param targetText - The full text to animate towards (can grow as new batches arrive)
 * @param options - Configuration options
 * @returns The currently displayed text (animated portion of targetText)
 *
 * @example
 * ```tsx
 * function StreamingMessage({ content, isStreaming }: Props) {
 *   const displayedText = useAnimatedText(content, {
 *     enabled: isStreaming,
 *     charsPerFrame: 3
 *   })
 *
 *   return <p>{displayedText}</p>
 * }
 * ```
 */
export function useAnimatedText(targetText: string, options: UseAnimatedTextOptions = {}): string {
  const { enabled = true, charsPerFrame = 3, frameIntervalMs = 16.67 } = options

  const [displayedText, setDisplayedText] = useState('')
  const displayedLengthRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const prefersReducedMotion = useRef(false)

  // Check for prefers-reduced-motion on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotion.current = mediaQuery.matches

      const handler = (e: MediaQueryListEvent) => {
        prefersReducedMotion.current = e.matches
      }

      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  // Reset when target text is cleared (new message)
  const isTextEmpty = targetText.length === 0
  useEffect(() => {
    if (isTextEmpty) {
      displayedLengthRef.current = 0
      setDisplayedText('')
    }
  }, [isTextEmpty])

  // Main animation loop
  useEffect(() => {
    // If disabled or reduced motion, show all text immediately
    if (!enabled || prefersReducedMotion.current) {
      if (displayedLengthRef.current !== targetText.length) {
        displayedLengthRef.current = targetText.length
        setDisplayedText(targetText)
      }
      return
    }

    // Already caught up - nothing to animate
    if (displayedLengthRef.current >= targetText.length) {
      return
    }

    const animate = (timestamp: number) => {
      // Throttle to target frame rate
      if (timestamp - lastFrameTimeRef.current < frameIntervalMs) {
        rafIdRef.current = requestAnimationFrame(animate)
        return
      }

      lastFrameTimeRef.current = timestamp

      const currentLength = displayedLengthRef.current
      const targetLength = targetText.length

      // Already caught up
      if (currentLength >= targetLength) {
        rafIdRef.current = null
        return
      }

      // Calculate how many characters to reveal this frame
      // Speed up slightly when buffer is large to catch up smoothly
      const bufferSize = targetLength - currentLength
      let charsThisFrame = charsPerFrame

      // Adaptive speed: reveal faster when buffer is large
      if (bufferSize > 100) {
        charsThisFrame = Math.min(charsPerFrame * 2, 6) // Cap at 6 chars/frame
      } else if (bufferSize > 200) {
        charsThisFrame = Math.min(charsPerFrame * 3, 9) // Cap at 9 chars/frame
      }

      const newLength = Math.min(currentLength + charsThisFrame, targetLength)
      displayedLengthRef.current = newLength
      setDisplayedText(targetText.slice(0, newLength))

      // Continue animation if more to reveal
      if (newLength < targetLength) {
        rafIdRef.current = requestAnimationFrame(animate)
      } else {
        rafIdRef.current = null
      }
    }

    // Start animation
    rafIdRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [targetText, enabled, charsPerFrame, frameIntervalMs])

  // When disabled, always return full text
  if (!enabled) {
    return targetText
  }

  return displayedText
}

/**
 * Returns whether text animation is still in progress.
 * Useful for showing typing indicators or controlling other UI elements.
 */
export function useIsAnimating(
  targetText: string,
  displayedText: string,
  enabled: boolean = true
): boolean {
  if (!enabled) return false
  return displayedText.length < targetText.length
}
