/**
 * src/components/debate/message-bubble.tsx
 * Apple-inspired glass morphism message cards with 3D floating effect
 */

'use client'

import { motion } from 'framer-motion'
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
} from '@/lib/speaker-config'
import { cn } from '@/lib/utils'

import type { DebateMessage } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

/**
 * Glass morphism configuration - Apple-inspired values
 */
const GLASS_CONFIG = {
  borderRadius: 24, // px - premium Apple radius
  backdropBlur: 60, // px - stronger frosted effect
  padding: { x: 32, y: 40 }, // px - refined spacing
  cardGap: 48, // px - 44px section rhythm
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

  return (
    <div className="prose prose-invert max-w-none">
      {isTyping ? (
        // Show thinking indicator when API is streaming but we have no content yet
        <ThinkingIndicator speaker={speaker} />
      ) : (
        <div
          className="font-normal text-zinc-100 antialiased"
          style={{
            // SF Pro Text system stack for Apple-native rendering
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
            fontSize: 17,
            lineHeight: 1.55, // Tighter than 1.75 for Apple aesthetic
            letterSpacing: '-0.01em',
            textShadow: '0 0 24px rgba(255, 255, 255, 0.06)',
          }}
        >
          <AnimatedText
            content={displayContent}
            isRevealing={isRevealing}
            newContentStartIndex={newContentStartIndex}
          />
        </div>
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

  // Mouse position for tilt effect
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Handle mouse move for tilt effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePosition({ x, y })
  }, [])

  // Reset mouse position on leave
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setMousePosition({ x: 0.5, y: 0.5 })
  }, [])

  // Calculate tilt transform based on mouse position
  const getTiltTransform = () => {
    if (!isHovered || isCompleted) return ''
    const tiltX = (mousePosition.y - 0.5) * -2 // Tilt on X axis based on Y position
    const tiltY = (mousePosition.x - 0.5) * 2 // Tilt on Y axis based on X position
    return `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
  }

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
      className="relative w-full mb-12 group z-10"
      data-active={isActive}
      role="article"
      aria-label={`${config.label} - ${getTurnTypeShortLabel(message.turnType)}`}
      initial={skipAnimation ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 28,
        mass: 1,
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

      {/* Timeline Connector - line going UP to connect from previous card */}
      {/* Only show for non-first messages (where timeline connects from above) */}
      {!isFirst && !isModeratorTransition && (
        <>
          {/* Vertical line from previous card to this anchor */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-px"
            style={{
              top: -48, // Spans full gap (mb-12 = 48px)
              height: 40, // From top of gap to anchor
              background: `linear-gradient(180deg, ${APPLE_COLORS[message.speaker].rgba(0.08)} 0%, ${APPLE_COLORS[message.speaker].rgba(0.15)} 100%)`,
            }}
            aria-hidden="true"
          />
          {/* Anchor node at top edge of card */}
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-20" aria-hidden="true">
            <div
              className="w-3 h-3 rounded-full grid place-items-center"
              style={{
                border: `1.5px solid ${APPLE_COLORS[message.speaker].rgba(0.35)}`,
                background: 'hsl(220, 10%, 10%)',
                boxShadow: `0 0 8px ${APPLE_COLORS[message.speaker].rgba(0.15)}`,
              }}
            >
              <div
                className="w-1 h-1 rounded-full"
                style={{ background: APPLE_COLORS[message.speaker].rgba(0.6) }}
              />
            </div>
          </div>
        </>
      )}

      {/* Ghost Glass Card - 3D floating container with tilt effect */}
      <div
        ref={cardRef}
        className={cn(
          'relative mx-auto max-w-3xl overflow-hidden',
          // Smooth transition for depth filter and transform
          'transition-[filter] duration-500 ease-out'
        )}
        style={{
          borderRadius: GLASS_CONFIG.borderRadius,
          filter: getDepthFilter(depthIndex),
          // 3D perspective for tilt effect
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          // Apply tilt transform
          transform: getTiltTransform(),
          // Smooth tilt transition
          transition: 'transform 0.12s ease-out, filter 0.5s ease-out',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Content wrapper - 3D frosted glass panel */}
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
            borderRadius: GLASS_CONFIG.borderRadius,
            // Apple-level frosted glass blur
            backdropFilter: `blur(${GLASS_CONFIG.backdropBlur}px)`,
            WebkitBackdropFilter: `blur(${GLASS_CONFIG.backdropBlur}px)`,
            // Refined padding
            padding: `${GLASS_CONFIG.padding.y}px ${GLASS_CONFIG.padding.x}px`,
            // TRUE GLASS: Very subtle white base with role-based surface tint
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.015)',
            backgroundImage: `linear-gradient(180deg, ${isActive ? surfaceTint.active : surfaceTint.inactive} 0%, transparent 60%)`,
            // 3D Transform: context-aware elevation with micro-interaction lifts
            transform: isCompleted
              ? isHovered
                ? 'scale(1.005) translateY(-2px)' // Completed + hover: Apple-spec lift
                : 'scale(1) translateY(0)' // Completed: uniform baseline
              : isActive
                ? 'scale(1.01) translateY(-2px)' // Active during streaming: refined lift
                : isHovered
                  ? 'scale(1.005) translateY(-2px)' // Inactive + hover: Apple-spec lift
                  : 'scale(0.995) translateY(0)', // Inactive: very slight recess
            // Full 3D shadow system - context-aware
            boxShadow: isCompleted
              ? isHovered
                ? activeShadow // Completed + hover: full glow
                : SPEAKER_INACTIVE_SHADOWS // Completed: baseline shadow
              : isActive
                ? activeShadow
                : SPEAKER_INACTIVE_SHADOWS,
            // 120ms state crossfade for micro-interactions
            transition:
              'transform 0.12s cubic-bezier(0.25, 0.95, 0.35, 1), box-shadow 0.12s ease-out, background-color 0.12s ease-out, opacity 0.12s ease-out',
          }}
        >
          {/* Gradient border - softened (0.12 at top, fades to 70%) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: GLASS_CONFIG.borderRadius,
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

          {/* Hover focus rim - visible in completed state on hover */}
          {isCompleted && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: GLASS_CONFIG.borderRadius,
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
              borderRadius: GLASS_CONFIG.borderRadius,
              background: isActive
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 30%, transparent 60%), linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 40%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 40%), linear-gradient(180deg, rgba(255, 255, 255, 0.015) 0%, transparent 30%)',
              transition: 'background 0.4s ease-out',
            }}
            aria-hidden="true"
          />

          {/* Subtle noise texture for tactile feel */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.012]"
            style={{
              borderRadius: GLASS_CONFIG.borderRadius,
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
              borderTopLeftRadius: GLASS_CONFIG.borderRadius,
              borderBottomLeftRadius: GLASS_CONFIG.borderRadius,
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
              {/* Speaker Pill Badge - Frosted glass with SF Pro Rounded */}
              <motion.div
                className="inline-flex items-center gap-2 rounded-full"
                style={{
                  height: 30,
                  paddingLeft: 14,
                  paddingRight: 14,
                  // Frosted glass background
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${pillStyles.border}`,
                  boxShadow: isActive || (isCompleted && isHovered) ? pillStyles.glow : 'none',
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
      </div>
    </motion.div>
  )
})
