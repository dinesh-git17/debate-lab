// src/components/debate/message-bubble.tsx
/**
 * Glass morphism message cards with depth-aware styling and 3D tilt effects.
 * Renders debate turns with speaker-specific theming and streaming animations.
 */

'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa'
import { LuScale } from 'react-icons/lu'

import { AnimatedText } from '@/components/debate/animated-text'
import { ThinkingIndicator } from '@/components/debate/thinking-indicator'
import { useIsMobile } from '@/hooks/use-media-query'
import { useSmoothReveal } from '@/hooks/use-smooth-reveal'
import { ANIMATION_CONFIG } from '@/lib/animation-config'
import {
  APPLE_COLORS,
  getSpeakerConfig,
  getTurnTypeShortLabel,
  SPEAKER_GRADIENTS,
  SPEAKER_ACTIVE_GRADIENTS,
  SPEAKER_ACTIVE_SHADOWS,
  SPEAKER_INACTIVE_SHADOWS,
  SPEAKER_PILL_STYLES,
  SPEAKER_PHASE_CHIP_STYLES,
  SPEAKER_SURFACE_TINT,
  SPEAKER_LUMINOSITY_BACKGROUND,
  SPEAKER_RIM_LIGHT,
} from '@/lib/speaker-config'
import { cn } from '@/lib/utils'

import type { DebateMessage } from '@/types/debate-ui'
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
  cardGap: 56,
  typography: {
    display: {
      fontFamily:
        '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      letterSpacing: '0.02em',
    },
    body: {
      fontFamily:
        '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      fontSize: 17,
      lineHeight: 1.68,
      letterSpacing: '-0.01em',
    },
    rounded: {
      fontFamily:
        'ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    maxContentWidth: 580,
  },
  tint: {
    base: 'rgba(255, 255, 255, 0.05)',
    gradientTop: 'rgba(255, 255, 255, 0.07)',
    gradientBottom: 'rgba(255, 255, 255, 0.03)',
  },
  shadow: {
    ambient: '0 30px 60px rgba(0, 0, 0, 0.25)',
    highlight: 'inset 0 3px 8px rgba(255, 255, 255, 0.08)',
  },
  floatingShadow: {
    active: '0 30px 60px rgba(0, 0, 0, 0.32), inset 0 3px 8px rgba(255, 255, 255, 0.08)',
    inactive: '0 20px 40px rgba(0, 0, 0, 0.18), inset 0 2px 6px rgba(255, 255, 255, 0.05)',
  },
  innerGlow: {
    sides: 'inset 1px 0 8px rgba(255, 255, 255, 0.04), inset -1px 0 8px rgba(255, 255, 255, 0.04)',
    top: 'inset 0 1px 12px rgba(255, 255, 255, 0.06)',
  },
} as const

interface MessageBubbleProps {
  message: DebateMessage
  showTimestamp?: boolean
  /** Called when the message is complete and ready for next message */
  onAnimationComplete?: () => void
  isActive?: boolean
  /** Whether this is the first message (no anchor needed) */
  isFirst?: boolean
  /** Skip animation - show content immediately (for hydrated/historical messages) */
  skipAnimation?: boolean
  /** Depth index for desaturation: 0 = active, 1 = adjacent, 2+ = distant */
  depthIndex?: number
  /** Whether the debate is in completed state (all messages visible) */
  isCompleted?: boolean
  /** Callback when hover state changes - reports to parent for cross-card effects */
  onHoverChange?: (messageId: string, isHovered: boolean) => void
  /** Whether the card above this one is hovered (to fade this card's top connector) */
  isPreviousCardHovered?: boolean
  /** Index for cascading entrance animation on page load (0 = first, 1 = second, etc.) */
  cascadeIndex?: number
}

function SpeakerIcon({ type, className }: { type: string; className?: string }) {
  const iconClass = cn('w-3 h-3 flex-shrink-0', className)

  switch (type) {
    case 'thumbs-up':
      return <FaThumbsUp className={iconClass} />
    case 'thumbs-down':
      return <FaThumbsDown className={iconClass} />
    case 'scale':
      return <LuScale className={iconClass} />
    default:
      return null
  }
}

function SmoothHeightWrapper({
  children,
  isExpanding,
}: {
  children: React.ReactNode
  isExpanding: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')
  const rafIdRef = useRef<number | null>(null)
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Buffer to account for sub-pixel rendering differences
  const HEIGHT_BUFFER_PX = 4

  useEffect(() => {
    if (!contentRef.current || !isExpanding) return

    const observer = new ResizeObserver((entries) => {
      // Cancel any pending RAF/timeout to prevent race conditions
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current)
      }

      // Debounce with small delay, then use RAF to ensure DOM has settled
      timeoutIdRef.current = setTimeout(() => {
        rafIdRef.current = requestAnimationFrame(() => {
          for (const entry of entries) {
            // Use getBoundingClientRect for more accurate measurement
            const rect = entry.target.getBoundingClientRect()
            const newHeight = Math.ceil(rect.height) + HEIGHT_BUFFER_PX
            setHeight(newHeight)
          }
        })
      }, 16) // ~1 frame debounce
    })

    observer.observe(contentRef.current)
    return () => {
      observer.disconnect()
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current)
      }
    }
  }, [isExpanding])

  useEffect(() => {
    if (!isExpanding) {
      setHeight('auto')
    }
  }, [isExpanding])

  // Only use overflow:hidden during active transitions, visible otherwise
  const isTransitioning = isExpanding && typeof height === 'number'

  return (
    <div
      style={{
        height: height === 'auto' ? 'auto' : height,
        overflow: isTransitioning ? 'hidden' : 'visible',
        transition: isExpanding
          ? `height ${ANIMATION_CONFIG.HEIGHT_TRANSITION.DURATION_MS}ms ${ANIMATION_CONFIG.HEIGHT_TRANSITION.EASING}`
          : 'none',
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}

function MessageContent({
  messageId,
  content,
  isStreaming,
  isComplete,
  speaker,
  onAnimationComplete,
  skipAnimation,
  bodyFontSize,
  bodyLineHeight,
}: {
  messageId: string
  content: string
  isStreaming: boolean
  isComplete: boolean
  speaker: TurnSpeaker
  onAnimationComplete?: (() => void) | undefined
  skipAnimation?: boolean
  bodyFontSize: number
  bodyLineHeight: number
}) {
  const hasCalledComplete = useRef(false)

  const initialDelayMs = speaker === 'moderator' ? 0 : ANIMATION_CONFIG.DEBATER_THINKING_DELAY_MS

  const { displayContent, isTyping, isRevealing, newContentStartIndex } = useSmoothReveal({
    messageId,
    rawContent: content,
    isStreaming,
    isComplete,
    skipAnimation: skipAnimation ?? false,
    initialDelayMs,
    onRevealComplete: () => {
      if (!hasCalledComplete.current) {
        hasCalledComplete.current = true
        onAnimationComplete?.()
      }
    },
  })

  useEffect(() => {
    hasCalledComplete.current = false
  }, [messageId])

  const isExpanding = isStreaming || isRevealing

  return (
    <div className="prose prose-invert max-w-none">
      {isTyping ? (
        <ThinkingIndicator speaker={speaker} />
      ) : (
        <SmoothHeightWrapper isExpanding={isExpanding}>
          <div
            className="font-normal antialiased"
            style={{
              // SF Pro Text for body - optimized for readability
              fontFamily: GLASS_CONFIG.typography.body.fontFamily,
              fontSize: bodyFontSize,
              lineHeight: bodyLineHeight,
              letterSpacing: GLASS_CONFIG.typography.body.letterSpacing,
              // Soft text color for premium feel
              color: 'rgba(244, 244, 245, 0.9)',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.03)',
            }}
          >
            <AnimatedText
              content={displayContent}
              isRevealing={isRevealing}
              newContentStartIndex={newContentStartIndex}
            />
          </div>
        </SmoothHeightWrapper>
      )}
    </div>
  )
}

const DEPTH_FILTERS = {
  active: 'none',
  adjacent: 'saturate(0.95) contrast(0.98)',
  distant: 'saturate(0.90) contrast(0.95)',
} as const

function getDepthFilter(depthIndex: number): string {
  if (depthIndex === 0) return DEPTH_FILTERS.active
  if (depthIndex === 1) return DEPTH_FILTERS.adjacent
  return DEPTH_FILTERS.distant
}

export const MessageBubble = memo(function MessageBubble({
  message,
  showTimestamp = false,
  onAnimationComplete,
  isActive = true,
  isFirst = false,
  skipAnimation = false,
  depthIndex = 0,
  isCompleted = false,
  onHoverChange,
  isPreviousCardHovered = false,
  cascadeIndex,
}: MessageBubbleProps) {
  const isMobile = useIsMobile()

  // Responsive layout values
  const responsivePadding = isMobile
    ? { x: 20, y: 24 }
    : { x: GLASS_CONFIG.padding.x, y: GLASS_CONFIG.padding.y }
  const responsiveBorderRadius = isMobile
    ? { top: 16, bottom: 16, css: '16px' }
    : GLASS_CONFIG.borderRadius
  const responsiveCardGap = isMobile ? 24 : GLASS_CONFIG.cardGap
  const responsiveShadow = isMobile
    ? {
        ambient: '0 16px 32px rgba(0, 0, 0, 0.18)',
        highlight: 'inset 0 2px 6px rgba(255, 255, 255, 0.06)',
      }
    : GLASS_CONFIG.shadow
  const responsiveTypography = {
    body: {
      fontSize: isMobile ? 16 : GLASS_CONFIG.typography.body.fontSize,
      lineHeight: isMobile ? 1.625 : GLASS_CONFIG.typography.body.lineHeight,
    },
    pill: {
      fontSize: isMobile ? 11 : 13,
    },
    phaseChip: {
      fontSize: isMobile ? 10 : 11,
    },
  }

  const config = getSpeakerConfig(message.speaker)
  // Use enhanced gradient when active, standard when inactive
  const gradient = isActive
    ? SPEAKER_ACTIVE_GRADIENTS[message.speaker]
    : SPEAKER_GRADIENTS[message.speaker]
  const activeShadow = SPEAKER_ACTIVE_SHADOWS[message.speaker]
  const pillStyles = SPEAKER_PILL_STYLES[message.speaker]
  const phaseChipStyles = SPEAKER_PHASE_CHIP_STYLES[message.speaker]
  const surfaceTint = SPEAKER_SURFACE_TINT[message.speaker]

  // Detect moderator transition for special styling
  const isModeratorTransition = message.turnType === 'moderator_transition'

  // Hover state for enhanced interactions
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Spring-physics tilt effect configuration - balanced responsiveness
  const springConfig = { damping: 40, stiffness: 120, mass: 1 }

  // Scale tilt amplitude based on content length - shorter cards get full tilt, longer cards get reduced tilt
  const contentLength = message.content.length
  const rotateAmplitude = useMemo(() => {
    const maxAmplitude = 8
    const minAmplitude = 4.5
    const shortThreshold = 200
    const longThreshold = 800

    if (contentLength <= shortThreshold) return maxAmplitude
    if (contentLength >= longThreshold) return minAmplitude

    // Linear interpolation between thresholds
    const ratio = (contentLength - shortThreshold) / (longThreshold - shortThreshold)
    return maxAmplitude - ratio * (maxAmplitude - minAmplitude)
  }, [contentLength])

  // Motion values for smooth spring-based tilt
  const rotateX = useSpring(useMotionValue(0), springConfig)
  const rotateY = useSpring(useMotionValue(0), springConfig)
  const scale = useSpring(1, springConfig)

  // Handle mouse move for spring tilt effect
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const offsetX = e.clientX - rect.left - rect.width / 2
      const offsetY = e.clientY - rect.top - rect.height / 2

      // Calculate rotation based on mouse position relative to center
      const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude
      const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude

      rotateX.set(rotationX)
      rotateY.set(rotationY)
    },
    [rotateX, rotateY, rotateAmplitude]
  )

  // Reset tilt on mouse leave with spring animation
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    onHoverChange?.(message.id, false)
    rotateX.set(0)
    rotateY.set(0)
    scale.set(1)
  }, [rotateX, rotateY, scale, onHoverChange, message.id])

  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    onHoverChange?.(message.id, true)
    scale.set(1.02) // Subtle scale on hover
  }, [scale, onHoverChange, message.id])

  // Track when the client-side reveal animation is complete
  // (separate from message.isComplete which reflects server state)
  const [isRevealComplete, setIsRevealComplete] = useState(skipAnimation)

  // Reset reveal state when message changes
  useEffect(() => {
    setIsRevealComplete(skipAnimation)
  }, [message.id, skipAnimation])

  const handleAnimationComplete = useCallback(() => {
    setIsRevealComplete(true)
    onAnimationComplete?.()
  }, [onAnimationComplete])

  // Determine if we should animate this card
  // cascadeIndex !== undefined means this is initial page load with hydrated messages
  const shouldAnimate = cascadeIndex !== undefined || !skipAnimation

  // Speaker-based micro-delay for visual rhythm (moderator → for → against)
  // Creates a subtle temporal cadence that feels intentional
  const speakerDelayOffset: Record<TurnSpeaker, number> = {
    moderator: 0,
    for: 0.02,
    against: 0.04,
  }

  // Calculate stagger delay for cascade effect
  // Uses CARD_ENTRANCE.STAGGER_MS from config, with cascadeIndex for page load
  // Adds speaker-based micro-offset for rhythmic entrance
  const staggerDelay =
    cascadeIndex !== undefined
      ? (cascadeIndex * ANIMATION_CONFIG.CARD_ENTRANCE.STAGGER_MS) / 1000 +
        speakerDelayOffset[message.speaker]
      : isModeratorTransition && !skipAnimation
        ? 0.08
        : speakerDelayOffset[message.speaker]

  return (
    <motion.div
      className="relative w-full group z-10"
      data-active={isActive}
      role="article"
      aria-label={`${config.label} - ${getTurnTypeShortLabel(message.turnType)}`}
      style={{
        scrollSnapAlign: 'start',
        scrollMarginTop: isMobile ? 64 : 80,
        marginBottom: responsiveCardGap,
      }}
      initial={
        shouldAnimate
          ? {
              opacity: 0,
              y: ANIMATION_CONFIG.CARD_ENTRANCE.TRANSLATE_Y,
              filter: `blur(${ANIMATION_CONFIG.CARD_ENTRANCE.BLUR_START}px)`,
            }
          : false
      }
      animate={{
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      }}
      transition={{
        duration: ANIMATION_CONFIG.CARD_ENTRANCE.DURATION_MS / 1000,
        ease: ANIMATION_CONFIG.CARD_ENTRANCE.EASING,
        delay: staggerDelay,
      }}
    >
      {/* Timeline String - fades out when this card OR previous card is hovered (desktop only) */}
      {!isFirst && !isMobile && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-30"
          style={{
            top: -responsiveCardGap + 4,
            height: responsiveCardGap + (isMobile ? 6 : 18),
            width: 1,
            background: `linear-gradient(180deg,
              ${APPLE_COLORS[message.speaker].rgba(0.08)} 0%,
              ${APPLE_COLORS[message.speaker].rgba(0.2)} 40%,
              ${APPLE_COLORS[message.speaker].rgba(0.35)} 80%,
              ${APPLE_COLORS[message.speaker].rgba(0.5)} 100%)`,
            // Fade out when this card is hovered OR when the card above is hovered
            opacity: isHovered || isPreviousCardHovered ? 0 : 1,
            transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Ghost Glass Card - Perspective container for 3D tilt effect */}
      <div
        ref={cardRef}
        className={cn(
          'relative mx-auto max-w-3xl',
          // Perspective container - this creates the 3D space
          '[perspective:800px]'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Inner tilting card - receives spring-physics rotation */}
        <motion.div
          className={cn(
            'relative z-10',
            // Smooth transition for depth filter
            'transition-[filter] duration-500 ease-out',
            // Enable 3D transforms on this element
            '[transform-style:preserve-3d]',
            // GPU optimization for transforms (replaces overflow-hidden)
            'will-change-transform'
          )}
          style={{
            borderRadius: responsiveBorderRadius.css,
            filter: getDepthFilter(depthIndex),
            // Spring-physics tilt values from useSpring
            rotateX: isMobile ? 0 : rotateX,
            rotateY: isMobile ? 0 : rotateY,
            scale: isMobile ? (isHovered ? 1.01 : 1) : scale,
          }}
        >
          {/* Content wrapper - Graphite Glass frosted panel */}
          <div
            className={cn(
              'relative backdrop-saturate-150',
              // Focus mode opacity - context-aware
              isCompleted
                ? 'opacity-100 grayscale-0' // Completed: all cards fully visible
                : isActive
                  ? 'opacity-100 grayscale-0'
                  : 'opacity-30 grayscale-[0.3] group-hover:opacity-65 group-hover:grayscale-[0.1]'
            )}
            style={{
              borderRadius: responsiveBorderRadius.css,
              // Graphite glass frosted blur (20-32px range)
              backdropFilter: `blur(${GLASS_CONFIG.backdropBlur}px)`,
              WebkitBackdropFilter: `blur(${GLASS_CONFIG.backdropBlur}px)`,
              // Breathable Apple spacing - responsive
              padding: `${responsivePadding.y}px ${responsivePadding.x}px`,
              // GRAPHITE GLASS: Subtle white base with vertical gradient tint
              backgroundColor: isActive ? GLASS_CONFIG.tint.base : 'rgba(255, 255, 255, 0.025)',
              backgroundImage: isActive
                ? `${SPEAKER_LUMINOSITY_BACKGROUND[message.speaker]}, linear-gradient(180deg,
                  ${GLASS_CONFIG.tint.gradientTop} 0%,
                  ${GLASS_CONFIG.tint.gradientBottom} 100%)`
                : `linear-gradient(180deg,
                  rgba(255, 255, 255, 0.04) 0%,
                  rgba(255, 255, 255, 0.015) 100%),
                  linear-gradient(180deg, ${surfaceTint.inactive} 0%, transparent 50%)`,
              // 3D Transform: subtle elevation for active state only (no hover scale - tilt handles interaction)
              transform:
                isActive && !isCompleted
                  ? 'scale(1.005) translateY(-2px)' // Active during streaming: subtle lift
                  : 'scale(1) translateY(0)', // All other states: baseline (tilt effect on outer container)
              // Multi-layer shadow system - ambient + highlight + rim light + inner glow for glass thickness
              boxShadow: isCompleted
                ? isHovered
                  ? `${SPEAKER_RIM_LIGHT[message.speaker]}, ${responsiveShadow.highlight}, ${activeShadow}, ${GLASS_CONFIG.innerGlow.sides}, ${GLASS_CONFIG.innerGlow.top}` // Completed + hover: full effect
                  : `${responsiveShadow.highlight}, ${SPEAKER_INACTIVE_SHADOWS}, ${GLASS_CONFIG.innerGlow.sides}` // Completed: subtle thickness
                : isActive
                  ? `${SPEAKER_RIM_LIGHT[message.speaker]}, ${responsiveShadow.highlight}, ${activeShadow}, ${GLASS_CONFIG.innerGlow.sides}, ${GLASS_CONFIG.innerGlow.top}` // Active: full glass effect
                  : `${responsiveShadow.highlight}, ${SPEAKER_INACTIVE_SHADOWS}, ${GLASS_CONFIG.innerGlow.sides}`,
              // Smooth state transitions
              transition:
                'transform 0.12s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.12s ease-out, background-color 0.12s ease-out, opacity 0.12s ease-out',
            }}
          >
            {/* Gradient border - softened (0.12 at top, fades to 70%) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: responsiveBorderRadius.css,
                padding: '1px',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.02) 50%, transparent 70%)'
                  : 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 35%, transparent 65%)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                transition: 'background 0.4s ease-out',
              }}
              aria-hidden="true"
            />

            {/* VisionOS Edge Lighting - 0.5px inner stroke with refraction gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: responsiveBorderRadius.css,
                // 0.5px inner stroke - top white, bottom blue/purple tint
                boxShadow: `
                  inset 0 0.5px 0 0 rgba(255, 255, 255, 0.18),
                  inset 0.5px 0 0 0 rgba(255, 255, 255, 0.08),
                  inset -0.5px 0 0 0 rgba(255, 255, 255, 0.08),
                  inset 0 -0.5px 0 0 rgba(120, 160, 255, 0.12)
                `
                  .replace(/\s+/g, ' ')
                  .trim(),
                opacity: isActive || (isCompleted && isHovered) ? 1 : 0.5,
                transition: 'opacity 0.4s ease-out',
              }}
              aria-hidden="true"
            />

            {/* Micro-specular highlights - top corners (barely visible, essential for depth) */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                borderRadius: responsiveBorderRadius.css,
              }}
              aria-hidden="true"
            >
              {/* Top-left corner specular */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 80,
                  height: 40,
                  background: `radial-gradient(ellipse 100% 100% at 0% 0%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 70%)`,
                  opacity: isActive || (isCompleted && isHovered) ? 1 : 0.4,
                  transition: 'opacity 0.4s ease-out',
                }}
              />
              {/* Top-right corner specular */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 40,
                  background: `radial-gradient(ellipse 100% 100% at 100% 0%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 30%, transparent 70%)`,
                  opacity: isActive || (isCompleted && isHovered) ? 1 : 0.4,
                  transition: 'opacity 0.4s ease-out',
                }}
              />
            </div>

            {/* Hanging Tab - entrance via framer-motion, hover fade via CSS (desktop only) */}
            {!isFirst && !isMobile && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-20"
                style={{ top: 17 }}
                initial={skipAnimation ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.25,
                  delay: skipAnimation ? 0 : 0.15,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
                aria-hidden="true"
              >
                {/* Wrapper for hover fade - separate from entrance animation */}
                <div
                  style={{
                    // Fade when this card OR previous card is hovered
                    opacity: isHovered || isPreviousCardHovered ? 0 : 1,
                    transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* The tab/clip where string attaches - small rounded rectangle */}
                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      width: 20,
                      height: 10,
                      borderRadius: 5,
                      background: `linear-gradient(180deg,
                        ${APPLE_COLORS[message.speaker].rgba(0.35)} 0%,
                        ${APPLE_COLORS[message.speaker].rgba(0.2)} 100%)`,
                      border: `1px solid ${APPLE_COLORS[message.speaker].rgba(0.3)}`,
                      boxShadow: `
                        inset 0 1px 2px rgba(255, 255, 255, 0.15),
                        0 1px 3px rgba(0, 0, 0, 0.2)
                      `,
                    }}
                  >
                    {/* Small hole in the tab where string threads through */}
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.4)',
                        boxShadow: `inset 0 1px 2px rgba(0, 0, 0, 0.5)`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Hover focus rim - visible in completed state on hover */}
            {isCompleted && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: responsiveBorderRadius.css,
                  boxShadow: `inset 0 0 0 1px ${APPLE_COLORS[message.speaker].rgba(0.2)}`,
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.3s ease-out',
                }}
                aria-hidden="true"
              />
            )}

            {/* LAYER 3: Top Glass - sharper with reflective streaks */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: responsiveBorderRadius.css,
                // Multi-layer reflective effect:
                // 1. Top-left corner highlight (window light simulation)
                // 2. Horizontal reflective streak across top third
                // 3. Subtle vertical edge highlights
                background: isActive
                  ? `
                    linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 20%, transparent 45%),
                    linear-gradient(90deg, transparent 10%, rgba(255, 255, 255, 0.03) 30%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.03) 70%, transparent 90%),
                    linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 15%, transparent 35%),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 0%, transparent 3%, transparent 97%, rgba(255, 255, 255, 0.02) 100%)
                  `.replace(/\s+/g, ' ')
                  : `
                    linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, transparent 35%),
                    linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 25%)
                  `.replace(/\s+/g, ' '),
                transition: 'background 0.4s ease-out',
              }}
              aria-hidden="true"
            />

            {/* Speaker accent border - full wrap with Apple colors, fades on hover */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: responsiveBorderRadius.css,
                border: `1px solid ${APPLE_COLORS[message.speaker].rgba(isActive ? 0.25 : 0.1)}`,
                opacity: isHovered ? 0 : 1,
                transition: 'opacity 0.3s ease-out, border-color 0.4s ease-out',
              }}
              aria-hidden="true"
            />

            {/* Glow Bleed Gradient - light bleeding from neon border */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: gradient,
                borderRadius: responsiveBorderRadius.css,
              }}
              aria-hidden="true"
            />

            {/* Bottom Edge Light Plane - subtle gradient fade for shared surface feel */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 z-10"
              style={{
                height: 2,
                background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.15))',
                borderRadius: `0 0 ${responsiveBorderRadius.bottom}px ${responsiveBorderRadius.bottom}px`,
              }}
              aria-hidden="true"
            />

            {/* Header Zone - Centered information architecture */}
            <div className="relative mb-7">
              {/* Row 1: Speaker Identity (always centered) */}
              <div className="flex items-center justify-center mb-6">
                {/* Speaker Pill Badge - Luminous frosted glass with SF Pro Rounded */}
                <motion.div
                  className="inline-flex items-center gap-2 rounded-full"
                  style={{
                    height: 30,
                    paddingLeft: 14,
                    paddingRight: 14,
                    // Luminous gradient background (instead of flat frosted)
                    background:
                      isActive || (isCompleted && isHovered)
                        ? pillStyles.background
                        : 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${pillStyles.border}`,
                    // Combined inner glow + outer glow for luminous effect
                    boxShadow:
                      isActive || (isCompleted && isHovered)
                        ? `${pillStyles.innerGlow}, ${pillStyles.glow}`
                        : 'none',
                  }}
                  whileHover={{ scale: 1.02 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                >
                  <SpeakerIcon type={config.icon} className="w-3 h-3" />
                  <span
                    className="uppercase"
                    style={{
                      color: pillStyles.text,
                      fontSize: responsiveTypography.pill.fontSize,
                      fontWeight: 600,
                      letterSpacing: '0.1em', // Optical tracking for display
                      fontFamily: GLASS_CONFIG.typography.rounded.fontFamily,
                    }}
                  >
                    {config.shortLabel}
                  </span>
                </motion.div>
              </div>

              {/* Timestamp - Absolute positioned, top-right */}
              {showTimestamp && isRevealComplete && (
                <span
                  className="absolute top-0 right-0 tabular-nums"
                  style={{
                    fontSize: 12,
                    fontFamily: GLASS_CONFIG.typography.body.fontFamily,
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                    color: 'rgba(161, 161, 170, 0.4)', // 40% opacity graphite
                    opacity: isCompleted ? (isHovered ? 1 : 0) : 1,
                    transform: isCompleted
                      ? isHovered
                        ? 'translateX(0)'
                        : 'translateX(4px)'
                      : 'translateX(0)',
                    transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
                    pointerEvents: isCompleted && !isHovered ? 'none' : 'auto',
                  }}
                >
                  {message.timestamp
                    .toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                    .toLowerCase()}
                </span>
              )}

              {/* Row 2: Phase/Turn Type Chip - visually centered to match speaker pill */}
              <div className="relative flex items-center justify-center">
                {/* Left divider - absolute positioned */}
                <div
                  className="absolute left-0 right-1/2 h-px mr-12"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.06) 100%)',
                  }}
                  aria-hidden="true"
                />

                {/* Phase chip - speaker-tinted with SF Pro Display */}
                <span
                  className="relative px-3 py-1.5 rounded-md uppercase"
                  style={{
                    fontSize: responsiveTypography.phaseChip.fontSize,
                    fontWeight: 500,
                    letterSpacing: '0.08em', // Optical tracking for display
                    fontFamily: GLASS_CONFIG.typography.display.fontFamily,
                    background: phaseChipStyles.background,
                    color: phaseChipStyles.text,
                    border: `1px solid ${phaseChipStyles.border}`,
                  }}
                >
                  {getTurnTypeShortLabel(message.turnType)}
                </span>

                {/* Right divider - absolute positioned */}
                <div
                  className="absolute left-1/2 right-0 h-px ml-12"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Body: Editorial content */}
            <div className="relative">
              <MessageContent
                messageId={message.id}
                content={message.content}
                isStreaming={message.isStreaming}
                isComplete={message.isComplete}
                speaker={message.speaker}
                onAnimationComplete={handleAnimationComplete}
                skipAnimation={skipAnimation}
                bodyFontSize={responsiveTypography.body.fontSize}
                bodyLineHeight={responsiveTypography.body.lineHeight}
              />
            </div>

            {/* Violations footer (only if violations exist) */}
            {message.violations && message.violations.length > 0 && (
              <div className="relative mt-8 flex items-center gap-3 pt-6 border-t border-white/[0.04]">
                <span className="text-xs text-amber-400 font-mono">
                  {message.violations.length} VIOLATION{message.violations.length > 1 ? 'S' : ''}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
})
