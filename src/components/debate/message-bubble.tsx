/**
 * src/components/debate/message-bubble.tsx
 * Apple-inspired glass morphism message cards with 3D floating effect
 */

'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa'
import { LuScale } from 'react-icons/lu'

import { AnimatedText } from '@/components/debate/animated-text'
import { ThinkingIndicator } from '@/components/debate/thinking-indicator'
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
  SPEAKER_AMBIENT_GLOW,
  SPEAKER_LUMINOSITY_BACKGROUND,
  SPEAKER_RIM_LIGHT,
} from '@/lib/speaker-config'
import { cn } from '@/lib/utils'

import type { DebateMessage } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

/**
 * Graphite Glass configuration - Apple-inspired premium frosted effect
 * Creates depth through layered translucency and sophisticated shadows
 */
const GLASS_CONFIG = {
  // Optical rounding - larger top corners feel more "lifted", smaller bottom feels grounded
  borderRadius: {
    top: 34, // px - visually larger top corners (32-36px range)
    bottom: 28, // px - slightly tighter bottom corners (28-32px range)
    // CSS shorthand: top-left top-right bottom-right bottom-left
    get css() {
      return `${this.top}px ${this.top}px ${this.bottom}px ${this.bottom}px`
    },
  },
  backdropBlur: 28, // px - optimized frosted effect (20-32px range)
  padding: { x: 36, y: 44 }, // px - breathable Apple spacing
  cardGap: 56, // px - generous vertical rhythm for timeline
  // Graphite glass tint values
  tint: {
    base: 'rgba(255, 255, 255, 0.05)', // Subtle white base
    gradientTop: 'rgba(255, 255, 255, 0.07)', // Top gradient opacity
    gradientBottom: 'rgba(255, 255, 255, 0.03)', // Bottom gradient opacity
  },
  // Dual shadow system for depth
  shadow: {
    ambient: '0 6px 18px rgba(0, 0, 0, 0.32)', // Soft ambient shadow
    highlight: '0 2px 4px rgba(255, 255, 255, 0.08)', // Top highlight
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
}

/**
 * Speaker icons using react-icons
 */
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

/**
 * Smooth height expansion wrapper - prevents layout jumps during streaming
 * Uses CSS grid trick for smooth height animation from 0 to auto
 */
function SmoothHeightWrapper({
  children,
  isExpanding,
}: {
  children: React.ReactNode
  isExpanding: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')

  // Track content height changes for smooth expansion
  useEffect(() => {
    if (!contentRef.current || !isExpanding) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height
        setHeight(newHeight)
      }
    })

    observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [isExpanding])

  // Once expansion is complete, switch to auto height
  useEffect(() => {
    if (!isExpanding) {
      setHeight('auto')
    }
  }, [isExpanding])

  return (
    <div
      style={{
        height: height === 'auto' ? 'auto' : height,
        overflow: 'hidden',
        transition: isExpanding
          ? `height ${ANIMATION_CONFIG.HEIGHT_TRANSITION.DURATION_MS}ms ${ANIMATION_CONFIG.HEIGHT_TRANSITION.EASING}`
          : 'none',
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}

/**
 * Content renderer with markdown support and editorial typography.
 * Uses chunked display for smooth, readable streaming.
 */
function MessageContent({
  messageId,
  content,
  isStreaming,
  isComplete,
  speaker,
  onAnimationComplete,
  skipAnimation,
}: {
  messageId: string
  content: string
  isStreaming: boolean
  isComplete: boolean
  speaker: TurnSpeaker
  onAnimationComplete?: (() => void) | undefined
  skipAnimation?: boolean
}) {
  const hasCalledComplete = useRef(false)

  // Debaters get a "thinking" delay, moderator speaks immediately
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

  // Reset the ref when message changes
  useEffect(() => {
    hasCalledComplete.current = false
  }, [messageId])

  // Determine if content is still expanding (streaming or revealing)
  const isExpanding = isStreaming || isRevealing

  return (
    <div className="prose prose-invert max-w-none">
      {isTyping ? (
        // Show thinking indicator when API is streaming but we have no content yet
        <ThinkingIndicator speaker={speaker} />
      ) : (
        <SmoothHeightWrapper isExpanding={isExpanding}>
          <div
            className="font-normal antialiased"
            style={{
              // SF Pro Text system stack for Apple-native rendering
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
              fontSize: 17,
              lineHeight: 1.52, // Apple News style - calm, breathable
              letterSpacing: '-0.008em',
              // Reduced text opacity for softer appearance (0.85)
              color: 'rgba(244, 244, 245, 0.88)',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.04)',
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

// Depth filter values for desaturation effect
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
}: MessageBubbleProps) {
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

  // Spring-physics tilt effect configuration
  const springConfig = { damping: 30, stiffness: 100, mass: 2 }
  const rotateAmplitude = 12 // Maximum tilt angle in degrees

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

  return (
    <motion.div
      className="relative w-full mb-14 group z-10"
      data-active={isActive}
      role="article"
      aria-label={`${config.label} - ${getTurnTypeShortLabel(message.turnType)}`}
      initial={
        skipAnimation
          ? false
          : {
              opacity: 0,
              y: ANIMATION_CONFIG.CARD_ENTRANCE.TRANSLATE_Y,
              filter: `blur(${ANIMATION_CONFIG.CARD_ENTRANCE.BLUR_START}px)`,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      }}
      transition={{
        duration: ANIMATION_CONFIG.CARD_ENTRANCE.DURATION_MS / 1000,
        ease: ANIMATION_CONFIG.CARD_ENTRANCE.EASING,
        // Stagger animation for transition cards
        delay: isModeratorTransition && !skipAnimation ? 0.08 : 0,
      }}
    >
      {/* Moderator transition section divider - horizontal gradient line */}
      {isModeratorTransition && !isFirst && (
        <motion.div
          className="absolute left-1/2 -top-6 -translate-x-1/2 w-full max-w-md h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(132, 140, 158, 0.3) 30%, rgba(132, 140, 158, 0.4) 50%, rgba(132, 140, 158, 0.3) 70%, transparent 100%)',
          }}
          initial={skipAnimation ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.95, 0.35, 1],
            delay: skipAnimation ? 0 : 0.1,
          }}
          aria-hidden="true"
        />
      )}

      {/* Timeline String - fades out when this card OR previous card is hovered */}
      {!isFirst && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-30"
          style={{
            top: -GLASS_CONFIG.cardGap + 4,
            height: GLASS_CONFIG.cardGap + 9,
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

      {/* String going DOWN to connect to next card (only during streaming) */}
      {!message.isComplete && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-30"
          style={{
            bottom: -GLASS_CONFIG.cardGap + 4,
            height: GLASS_CONFIG.cardGap - 8,
            width: 1,
            background: `linear-gradient(180deg,
              ${APPLE_COLORS[message.speaker].rgba(0.3)} 0%,
              ${APPLE_COLORS[message.speaker].rgba(0.12)} 100%)`,
            // Fade out on hover, fade in when not hovered
            opacity: isHovered ? 0 : 0.6,
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
        {/* Atmospheric Ambient Glow - small, subtle glow behind the card */}
        <div
          className="pointer-events-none absolute -inset-3 z-0"
          style={{
            background: SPEAKER_AMBIENT_GLOW[message.speaker],
            opacity: isActive || (isCompleted && isHovered) ? 0.7 : 0.15,
            transition: 'opacity 0.5s ease-out',
            borderRadius: GLASS_CONFIG.borderRadius.css,
            filter: 'blur(16px)',
          }}
          aria-hidden="true"
        />

        {/* Inner tilting card - receives spring-physics rotation */}
        <motion.div
          className={cn(
            'relative z-10 overflow-hidden',
            // Smooth transition for depth filter
            'transition-[filter] duration-500 ease-out',
            // Enable 3D transforms on this element
            '[transform-style:preserve-3d]'
          )}
          style={{
            borderRadius: GLASS_CONFIG.borderRadius.css,
            filter: getDepthFilter(depthIndex),
            // Spring-physics tilt values from useSpring
            rotateX,
            rotateY,
            scale,
          }}
        >
          {/* Content wrapper - Graphite Glass frosted panel */}
          <div
            className={cn(
              'relative overflow-hidden backdrop-saturate-150',
              // Focus mode opacity - context-aware
              isCompleted
                ? 'opacity-100 grayscale-0' // Completed: all cards fully visible
                : isActive
                  ? 'opacity-100 grayscale-0'
                  : 'opacity-30 grayscale-[0.3] group-hover:opacity-65 group-hover:grayscale-[0.1]'
            )}
            style={{
              borderRadius: GLASS_CONFIG.borderRadius.css,
              // Graphite glass frosted blur (20-32px range)
              backdropFilter: `blur(${GLASS_CONFIG.backdropBlur}px)`,
              WebkitBackdropFilter: `blur(${GLASS_CONFIG.backdropBlur}px)`,
              // Breathable Apple spacing
              padding: `${GLASS_CONFIG.padding.y}px ${GLASS_CONFIG.padding.x}px`,
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
              // Dual shadow system - ambient + highlight + rim light
              boxShadow: isCompleted
                ? isHovered
                  ? `${SPEAKER_RIM_LIGHT[message.speaker]}, ${GLASS_CONFIG.shadow.highlight}, ${activeShadow}` // Completed + hover: full glow with rim
                  : `${GLASS_CONFIG.shadow.highlight}, ${SPEAKER_INACTIVE_SHADOWS}` // Completed: baseline
                : isActive
                  ? `${SPEAKER_RIM_LIGHT[message.speaker]}, ${GLASS_CONFIG.shadow.highlight}, ${activeShadow}` // Active: rim light + glow
                  : `${GLASS_CONFIG.shadow.highlight}, ${SPEAKER_INACTIVE_SHADOWS}`,
              // Smooth state transitions
              transition:
                'transform 0.12s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.12s ease-out, background-color 0.12s ease-out, opacity 0.12s ease-out',
            }}
          >
            {/* Gradient border - softened (0.12 at top, fades to 70%) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: GLASS_CONFIG.borderRadius.css,
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

            {/* Hanging Tab - entrance via framer-motion, hover fade via CSS */}
            {!isFirst && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-20"
                style={{ top: 8 }}
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
                  borderRadius: GLASS_CONFIG.borderRadius.css,
                  boxShadow: `inset 0 0 0 1px ${APPLE_COLORS[message.speaker].rgba(0.2)}`,
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.3s ease-out',
                }}
                aria-hidden="true"
              />
            )}

            {/* Glass surface with directional lighting */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: GLASS_CONFIG.borderRadius.css,
                background: isActive
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 30%, transparent 60%), linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 40%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 40%), linear-gradient(180deg, rgba(255, 255, 255, 0.015) 0%, transparent 30%)',
                transition: 'background 0.4s ease-out',
              }}
              aria-hidden="true"
            />

            {/* Subtle noise texture for tactile feel - 2-3% opacity as per Apple spec */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.025]"
              style={{
                borderRadius: GLASS_CONFIG.borderRadius.css,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                mixBlendMode: 'overlay',
              }}
              aria-hidden="true"
            />

            {/* Speaker accent - soft glow bar with Apple colors */}
            <div
              className="absolute top-0 left-0 bottom-0 w-[3px] overflow-hidden"
              style={{
                borderTopLeftRadius: GLASS_CONFIG.borderRadius.top,
                borderBottomLeftRadius: GLASS_CONFIG.borderRadius.bottom,
                background: `linear-gradient(180deg, ${APPLE_COLORS[message.speaker].rgba(0.7)} 0%, ${APPLE_COLORS[message.speaker].rgba(0.35)} 100%)`,
                boxShadow: `0 0 16px ${APPLE_COLORS[message.speaker].rgba(0.35)}, 0 0 32px ${APPLE_COLORS[message.speaker].rgba(0.15)}`,
                opacity: isActive ? 1 : 0.4,
                transition: 'opacity 0.4s ease-out',
              }}
              aria-hidden="true"
            />

            {/* Glow Bleed Gradient - light bleeding from neon border */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: gradient }}
              aria-hidden="true"
            />

            {/* Header Zone - Centered information architecture */}
            <div className="relative mb-8">
              {/* Row 1: Speaker Identity (always centered) */}
              <div className="flex items-center justify-center mb-3">
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
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      fontFamily:
                        'ui-rounded, -apple-system, BlinkMacSystemFont, "SF Pro Rounded", "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {config.shortLabel}
                  </span>
                </motion.div>
              </div>

              {/* Timestamp - Absolute positioned, top-right */}
              {showTimestamp && isRevealComplete && (
                <span
                  className="absolute top-0 right-0 font-mono tabular-nums"
                  style={{
                    fontSize: 13,
                    color: 'rgba(161, 161, 170, 0.35)', // 35% opacity graphite
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

              {/* Row 2: Phase/Turn Type Chip with centered dividers */}
              <div className="flex items-center gap-3">
                {/* Left divider */}
                <div
                  className="flex-1 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.06) 100%)',
                  }}
                  aria-hidden="true"
                />

                {/* Phase chip - speaker-tinted with variable font weight */}
                <span
                  className="px-2.5 py-1 rounded-md uppercase"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    fontVariationSettings: "'wght' 500",
                    background: phaseChipStyles.background,
                    color: phaseChipStyles.text,
                    border: `1px solid ${phaseChipStyles.border}`,
                  }}
                >
                  {getTurnTypeShortLabel(message.turnType)}
                </span>

                {/* Right divider */}
                <div
                  className="flex-1 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Body: Editorial content with optical alignment */}
            <div className="relative -ml-0.5">
              <MessageContent
                messageId={message.id}
                content={message.content}
                isStreaming={message.isStreaming}
                isComplete={message.isComplete}
                speaker={message.speaker}
                onAnimationComplete={handleAnimationComplete}
                skipAnimation={skipAnimation}
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
