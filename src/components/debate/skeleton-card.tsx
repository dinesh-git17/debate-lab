// src/components/debate/skeleton-card.tsx
/**
 * Apple-style skeleton loading card for debate messages.
 * Displays a glass morphism placeholder with animated shimmer effects.
 */

'use client'

import { motion } from 'framer-motion'

import { useIsMobile } from '@/hooks/use-media-query'
import { ANIMATION_CONFIG } from '@/lib/animation-config'
import { cn } from '@/lib/utils'

import type { TurnSpeaker } from '@/types/turn'

const GLASS_CONFIG = {
  borderRadius: {
    top: 34,
    bottom: 28,
    get css() {
      return `${this.top}px ${this.top}px ${this.bottom}px ${this.bottom}px`
    },
  },
  backdropBlur: 28,
  padding: { x: 40, y: 48 },
  tint: {
    base: 'rgba(255, 255, 255, 0.03)',
    gradientTop: 'rgba(255, 255, 255, 0.05)',
    gradientBottom: 'rgba(255, 255, 255, 0.02)',
  },
} as const

const SPEAKER_TINTS: Record<TurnSpeaker, string> = {
  for: 'rgba(52, 199, 89, 0.08)',
  against: 'rgba(255, 69, 58, 0.08)',
  moderator: 'rgba(255, 214, 10, 0.08)',
}

interface SkeletonCardProps {
  speaker: TurnSpeaker
  index: number
  className?: string
}

export function SkeletonCard({ speaker, index, className }: SkeletonCardProps) {
  const isMobile = useIsMobile()

  const responsivePadding = isMobile ? { x: 20, y: 24 } : GLASS_CONFIG.padding
  const responsiveBorderRadius = isMobile ? { css: '16px' } : { css: GLASS_CONFIG.borderRadius.css }

  const staggerDelay = (index * ANIMATION_CONFIG.CARD_ENTRANCE.STAGGER_MS) / 1000

  return (
    <motion.div
      className={cn('relative w-full', className)}
      initial={{
        opacity: 0,
        y: ANIMATION_CONFIG.CARD_ENTRANCE.TRANSLATE_Y,
        filter: `blur(${ANIMATION_CONFIG.CARD_ENTRANCE.BLUR_START}px)`,
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      }}
      exit={{
        opacity: 0,
        y: -8,
        filter: 'blur(4px)',
        transition: { duration: 0.25, ease: [0.22, 0.61, 0.36, 1] },
      }}
      transition={{
        duration: ANIMATION_CONFIG.CARD_ENTRANCE.DURATION_MS / 1000,
        ease: ANIMATION_CONFIG.CARD_ENTRANCE.EASING,
        delay: staggerDelay,
      }}
      style={{ marginBottom: isMobile ? 24 : 56 }}
    >
      <div className="relative mx-auto max-w-3xl">
        <div
          className="relative backdrop-saturate-150"
          style={{
            borderRadius: responsiveBorderRadius.css,
            backdropFilter: `blur(${GLASS_CONFIG.backdropBlur}px)`,
            WebkitBackdropFilter: `blur(${GLASS_CONFIG.backdropBlur}px)`,
            padding: `${responsivePadding.y}px ${responsivePadding.x}px`,
            backgroundColor: GLASS_CONFIG.tint.base,
            backgroundImage: `
              linear-gradient(180deg,
                ${GLASS_CONFIG.tint.gradientTop} 0%,
                ${GLASS_CONFIG.tint.gradientBottom} 100%),
              linear-gradient(180deg, ${SPEAKER_TINTS[speaker]} 0%, transparent 50%)
            `.replace(/\s+/g, ' '),
            boxShadow: `
              0 20px 40px rgba(0, 0, 0, 0.18),
              inset 0 2px 6px rgba(255, 255, 255, 0.05)
            `.replace(/\s+/g, ' '),
          }}
        >
          {/* Gradient border */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: responsiveBorderRadius.css,
              padding: '1px',
              background:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 35%, transparent 65%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
            aria-hidden="true"
          />

          {/* Header skeleton */}
          <div className="relative mb-7">
            {/* Speaker pill skeleton */}
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="rounded-full overflow-hidden"
                style={{
                  width: isMobile ? 80 : 100,
                  height: 30,
                  background: 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <motion.div
                  className="h-full w-[200%]"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: index * 0.15,
                  }}
                />
              </motion.div>
            </div>

            {/* Phase chip skeleton */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute left-0 right-1/2 h-px mr-12"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.04) 100%)',
                }}
              />
              <motion.div
                className="relative rounded-md overflow-hidden"
                style={{
                  width: isMobile ? 60 : 80,
                  height: 24,
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <motion.div
                  className="h-full w-[200%]"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.06) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: index * 0.15 + 0.1,
                  }}
                />
              </motion.div>
              <div
                className="absolute left-1/2 right-0 h-px ml-12"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
                }}
              />
            </div>
          </div>

          {/* Content skeleton lines */}
          <div className="space-y-3">
            {[0.95, 0.88, 0.75, 0.6].map((width, lineIndex) => (
              <motion.div
                key={lineIndex}
                className="rounded overflow-hidden"
                style={{
                  width: `${width * 100}%`,
                  height: isMobile ? 16 : 18,
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <motion.div
                  className="h-full w-[200%]"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.06) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: index * 0.15 + lineIndex * 0.08,
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
