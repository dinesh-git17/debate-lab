// src/components/debate/animated-text.tsx
/**
 * Animated text components for streaming debate content with word-level reveal effects.
 * Supports markdown rendering with accessibility-aware reduced motion fallbacks.
 */

'use client'

import { motion } from 'framer-motion'
import { memo, useEffect, useState } from 'react'

import { Markdown } from '@/components/ui/markdown'
import { ANIMATION_CONFIG } from '@/lib/animation-config'
import { cn } from '@/lib/utils'

interface AnimatedTextProps {
  /** Content to display */
  content: string
  /** Whether content is still being revealed */
  isRevealing: boolean
  /** Additional class names */
  className?: string
}

export const AnimatedText = memo(function AnimatedText({
  content,
  isRevealing,
  className,
}: AnimatedTextProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  if (prefersReducedMotion) {
    return (
      <div className={className}>
        <Markdown content={content} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'transition-opacity duration-75',
        isRevealing && 'will-change-contents',
        className
      )}
    >
      <Markdown content={content} />
    </div>
  )
})

interface AnimatedWordsProps {
  /** Plain text content (no markdown) */
  text: string
  /** Base delay before animations start */
  baseDelay?: number
  /** Additional class names */
  className?: string
}

export const AnimatedWords = memo(function AnimatedWords({
  text,
  baseDelay = 0,
  className,
}: AnimatedWordsProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const words = text.split(/(\s+)/)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {words.map((word, index) => {
        if (/^\s+$/.test(word)) {
          return <span key={index}>{word}</span>
        }

        const delay = baseDelay + index * (ANIMATION_CONFIG.WORD_STAGGER_MS / 1000)

        return (
          <motion.span
            key={`${word}-${index}`}
            className="inline-block"
            initial={{
              opacity: 0,
              y: ANIMATION_CONFIG.WORD_TRANSLATE_Y,
              filter: `blur(${ANIMATION_CONFIG.WORD_BLUR_START}px)`,
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
            }}
            transition={{
              duration: ANIMATION_CONFIG.WORD_FADE_DURATION_MS / 1000,
              delay,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ willChange: 'transform, opacity, filter' }}
          >
            {word}
          </motion.span>
        )
      })}
    </span>
  )
})
