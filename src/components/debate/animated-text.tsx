// src/components/debate/animated-text.tsx

'use client'

import { motion } from 'framer-motion'
import { memo, useEffect, useRef, useState } from 'react'

import { Markdown } from '@/components/ui/markdown'
import { ANIMATION_CONFIG } from '@/lib/animation-config'
import { cn } from '@/lib/utils'

interface AnimatedTextProps {
  /** Content to display */
  content: string
  /** Whether content is still being revealed */
  isRevealing: boolean
  /** Index where new content begins */
  newContentStartIndex: number
  /** Additional class names */
  className?: string
}

/**
 * Animated text component that renders markdown with smooth word-level reveal animations.
 * Uses a hybrid approach: markdown rendering + CSS animations for the premium wave effect.
 */
export const AnimatedText = memo(function AnimatedText({
  content,
  isRevealing,
  newContentStartIndex,
  className,
}: AnimatedTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const previousContentLengthRef = useRef(0)
  const animationKeyRef = useRef(0)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Track content changes for animation triggering
  useEffect(() => {
    if (content.length > previousContentLengthRef.current) {
      animationKeyRef.current++
    }
    previousContentLengthRef.current = content.length
  }, [content])

  if (prefersReducedMotion) {
    return (
      <div className={className}>
        <Markdown content={content} />
      </div>
    )
  }

  // Split content into already-revealed and newly-revealed portions
  // We use a wrapper approach to animate new content smoothly
  const hasNewContent = newContentStartIndex > 0 && newContentStartIndex < content.length

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Main content with markdown */}
      <div className={cn('transition-opacity duration-75', isRevealing && 'will-change-contents')}>
        <Markdown content={content} />
      </div>

      {/* Reveal wave overlay - creates the premium sweep effect */}
      {hasNewContent && isRevealing && <RevealWave key={animationKeyRef.current} />}
    </div>
  )
})

/**
 * Subtle wave effect that sweeps across newly revealed content.
 * Creates a premium "text appearing" feel without DOM manipulation.
 */
const RevealWave = memo(function RevealWave() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: '100%', opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        x: {
          duration: 0.6,
          ease: [0.25, 0.1, 0.25, 1],
        },
        opacity: {
          duration: 0.2,
        },
      }}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden="true"
    />
  )
})

/**
 * Enhanced animated text with word-level micro-animations.
 * For use when content is simple text (no markdown).
 */
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
        // Preserve whitespace as-is
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
