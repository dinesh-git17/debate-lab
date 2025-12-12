// use-animated-text.ts
/**
 * Character-by-character text animation for streaming content display.
 * Provides smooth typewriter effects with adaptive speed and accessibility support.
 */

'use client'

import { useEffect, useRef, useState } from 'react'

export interface UseAnimatedTextOptions {
  enabled?: boolean
  charsPerFrame?: number
  frameIntervalMs?: number
}

/**
 * Animates text reveal using requestAnimationFrame with adaptive speed
 * that accelerates when buffer grows to maintain smooth catch-up.
 * Respects prefers-reduced-motion for accessibility.
 */
export function useAnimatedText(targetText: string, options: UseAnimatedTextOptions = {}): string {
  const { enabled = true, charsPerFrame = 3, frameIntervalMs = 16.67 } = options

  const [displayedText, setDisplayedText] = useState('')
  const displayedLengthRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const prefersReducedMotion = useRef(false)

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

  const isTextEmpty = targetText.length === 0
  useEffect(() => {
    if (isTextEmpty) {
      displayedLengthRef.current = 0
      setDisplayedText('')
    }
  }, [isTextEmpty])

  useEffect(() => {
    if (!enabled || prefersReducedMotion.current) {
      if (displayedLengthRef.current !== targetText.length) {
        displayedLengthRef.current = targetText.length
        setDisplayedText(targetText)
      }
      return
    }

    if (displayedLengthRef.current >= targetText.length) {
      return
    }

    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current < frameIntervalMs) {
        rafIdRef.current = requestAnimationFrame(animate)
        return
      }

      lastFrameTimeRef.current = timestamp

      const currentLength = displayedLengthRef.current
      const targetLength = targetText.length

      if (currentLength >= targetLength) {
        rafIdRef.current = null
        return
      }

      // Adaptive speed: accelerate reveal when buffer grows large
      const bufferSize = targetLength - currentLength
      let charsThisFrame = charsPerFrame

      if (bufferSize > 100) {
        charsThisFrame = Math.min(charsPerFrame * 2, 6)
      } else if (bufferSize > 200) {
        charsThisFrame = Math.min(charsPerFrame * 3, 9)
      }

      const newLength = Math.min(currentLength + charsThisFrame, targetLength)
      displayedLengthRef.current = newLength
      setDisplayedText(targetText.slice(0, newLength))

      if (newLength < targetLength) {
        rafIdRef.current = requestAnimationFrame(animate)
      } else {
        rafIdRef.current = null
      }
    }

    rafIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [targetText, enabled, charsPerFrame, frameIntervalMs])

  if (!enabled) {
    return targetText
  }

  return displayedText
}

/** Returns true while animation is in progress. */
export function useIsAnimating(
  targetText: string,
  displayedText: string,
  enabled: boolean = true
): boolean {
  if (!enabled) return false
  return displayedText.length < targetText.length
}
