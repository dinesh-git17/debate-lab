// src/components/debate/thinking-indicator.tsx

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  ANIMATION_CONFIG,
  SPEAKER_ANIMATION_COLORS,
  type SpeakerType,
} from '@/lib/animation-config'
import { cn } from '@/lib/utils'

interface ThinkingIndicatorProps {
  speaker: SpeakerType
  className?: string
}

/**
 * Fisher-Yates shuffle for randomizing word order
 */
function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j] as T
    shuffled[j] = temp as T
  }
  return shuffled
}

/**
 * Premium "Thinking" indicator with rotating words and subtle spinner.
 * Replaces the basic bouncing dots with an intellectual, calming animation.
 */
export const ThinkingIndicator = memo(function ThinkingIndicator({
  speaker,
  className,
}: ThinkingIndicatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Shuffle words on mount for variety
  const shuffledWords = useMemo(() => shuffleArray(ANIMATION_CONFIG.THINKING_WORDS), [])

  const colors = SPEAKER_ANIMATION_COLORS[speaker]

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Rotate through words
  const rotateWord = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % shuffledWords.length)
  }, [shuffledWords.length])

  useEffect(() => {
    if (prefersReducedMotion) return

    intervalRef.current = setInterval(rotateWord, ANIMATION_CONFIG.WORD_ROTATE_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [rotateWord, prefersReducedMotion])

  const currentWord = shuffledWords[currentIndex]

  // Reduced motion: simple static display
  if (prefersReducedMotion) {
    return (
      <div
        className={cn('inline-flex items-center gap-2 py-2', className)}
        role="status"
        aria-label="Generating response"
      >
        <span className={cn('text-sm font-medium', colors.text)}>{currentWord}...</span>
        <span className="sr-only">Thinking...</span>
      </div>
    )
  }

  return (
    <div
      className={cn('inline-flex items-center gap-2.5 py-2', className)}
      role="status"
      aria-label="Generating response"
    >
      {/* Subtle rotating spinner */}
      <div className="relative h-4 w-4">
        {/* Outer ring - rotating */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent',
            colors.spinner
          )}
          style={{
            borderTopColor: 'currentColor',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {/* Inner pulse - subtle glow */}
        <motion.div
          className={cn('absolute inset-1 rounded-full', colors.spinner.replace('border-', 'bg-'))}
          style={{ opacity: 0.3 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Rotating word with crossfade */}
      <div className="relative h-5 min-w-[100px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentWord}
            className={cn(
              'absolute left-0 top-0 text-sm font-medium whitespace-nowrap',
              colors.text
            )}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: ANIMATION_CONFIG.WORD_CROSSFADE_MS / 1000,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {currentWord}...
          </motion.span>
        </AnimatePresence>
      </div>

      <span className="sr-only">Thinking...</span>
    </div>
  )
})
