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

// Match visionOS glass config from message-bubble
const GLASS_CONFIG = {
  borderRadius: {
    value: 32,
    get css() {
      return `${this.value}px`
    },
  },
  backdropBlur: 40,
  padding: { x: 40, y: 48 },
  cardGap: 56,
  tint: {
    base: 'rgba(255, 255, 255, 0.08)',
    gradientTop: 'rgba(255, 255, 255, 0.08)',
    gradientBottom: 'rgba(255, 255, 255, 0.04)',
  },
  shadow: {
    ambient: '0 20px 40px rgba(0, 0, 0, 0.4)',
    highlight: 'inset 0 3px 8px rgba(255, 255, 255, 0.08)',
  },
} as const

// visionOS speaker colors - Electric Mint, Warm Coral, Platinum White
const SPEAKER_TINTS: Record<TurnSpeaker, string> = {
  for: 'rgba(99, 230, 190, 0.06)', // Electric Mint
  against: 'rgba(255, 107, 107, 0.06)', // Warm Coral
  moderator: 'rgba(242, 242, 247, 0.04)', // Platinum White
}

const SPEAKER_ACCENT_COLORS: Record<TurnSpeaker, string> = {
  for: 'rgba(99, 230, 190, 0.15)',
  against: 'rgba(255, 107, 107, 0.15)',
  moderator: 'rgba(242, 242, 247, 0.1)',
}

interface SkeletonCardProps {
  speaker: TurnSpeaker
  index: number
  className?: string
}

interface SkeletonLineProps {
  width: number // 0-1 fraction of container width
  height: number
  index: number
  lineIndex: number
}

/**
 * Animated shimmer line for skeleton loading states.
 * Width is a fraction (0-1) of the container width.
 */
function SkeletonLine({ width, height, index, lineIndex }: SkeletonLineProps) {
  return (
    <motion.div
      className="relative overflow-hidden"
      style={{
        width: `${width * 100}%`,
        height,
        borderRadius: height / 2,
        background: 'rgba(255, 255, 255, 0.06)',
      }}
    >
      <motion.div
        className="absolute inset-0 w-[200%]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'linear',
          delay: index * 0.15 + lineIndex * 0.08,
        }}
      />
    </motion.div>
  )
}

export function SkeletonCard({ speaker, index, className }: SkeletonCardProps) {
  const isMobile = useIsMobile()

  const responsivePadding = isMobile ? { x: 20, y: 24 } : GLASS_CONFIG.padding
  const responsiveBorderRadius = isMobile ? '16px' : GLASS_CONFIG.borderRadius.css
  const responsiveCardGap = isMobile ? 24 : GLASS_CONFIG.cardGap

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
      style={{ marginBottom: responsiveCardGap }}
    >
      <div className="relative mx-auto max-w-3xl">
        <div
          className="relative backdrop-saturate-150"
          style={{
            borderRadius: responsiveBorderRadius,
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
            boxShadow: `${GLASS_CONFIG.shadow.ambient}, ${GLASS_CONFIG.shadow.highlight}`,
          }}
        >
          {/* Gradient border - matches message-bubble */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: responsiveBorderRadius,
              padding: '1px',
              background:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.02) 50%, transparent 70%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
            aria-hidden="true"
          />

          {/* Header skeleton */}
          <div className="relative mb-7">
            {/* Speaker pill skeleton - capsule shape like real pills */}
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="overflow-hidden"
                style={{
                  width: isMobile ? 80 : 100,
                  height: 30,
                  borderRadius: 999,
                  background: SPEAKER_ACCENT_COLORS[speaker],
                  border: `1px solid ${SPEAKER_TINTS[speaker]}`,
                }}
              >
                <motion.div
                  className="h-full w-[200%]"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${SPEAKER_ACCENT_COLORS[speaker]} 50%, transparent 100%)`,
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 1.8,
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
                  background: `linear-gradient(90deg, transparent 0%, ${SPEAKER_TINTS[speaker]} 100%)`,
                }}
              />
              <motion.div
                className="relative rounded-md overflow-hidden"
                style={{
                  width: isMobile ? 60 : 80,
                  height: 24,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
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
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: index * 0.15 + 0.1,
                  }}
                />
              </motion.div>
              <div
                className="absolute left-1/2 right-0 h-px ml-12"
                style={{
                  background: `linear-gradient(90deg, ${SPEAKER_TINTS[speaker]} 0%, transparent 100%)`,
                }}
              />
            </div>
          </div>

          {/* Content skeleton - matches actual card structure */}
          {speaker === 'moderator' ? (
            // MOD intro: header, blockquote, sentences, divider, call-to-action
            <div className="space-y-4">
              {/* "Today's Debate" header */}
              <SkeletonLine width={0.28} height={20} index={index} lineIndex={0} />

              {/* Blockquote with left border */}
              <div className="pl-4" style={{ borderLeft: '3px solid rgba(255, 255, 255, 0.08)' }}>
                <SkeletonLine width={0.92} height={16} index={index} lineIndex={1} />
              </div>

              {/* Question sentence */}
              <SkeletonLine width={0.65} height={16} index={index} lineIndex={2} />

              {/* "Two sides..." sentence */}
              <SkeletonLine width={0.78} height={16} index={index} lineIndex={3} />

              {/* Divider */}
              <div
                className="my-4"
                style={{
                  height: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                }}
              />

              {/* "FOR, you have the floor" - bolder */}
              <SkeletonLine width={0.38} height={18} index={index} lineIndex={4} />
            </div>
          ) : (
            // FOR/AGAINST: header title + body paragraphs
            <div className="space-y-4">
              {/* Section header like "The Sandwich Collapses Under Scrutiny" */}
              <SkeletonLine width={0.65} height={22} index={index} lineIndex={0} />

              {/* Body paragraph lines */}
              <div className="space-y-3">
                <SkeletonLine width={0.98} height={16} index={index} lineIndex={1} />
                <SkeletonLine width={0.94} height={16} index={index} lineIndex={2} />
                <SkeletonLine width={0.88} height={16} index={index} lineIndex={3} />
                <SkeletonLine width={0.72} height={16} index={index} lineIndex={4} />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
