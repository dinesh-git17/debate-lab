// src/components/debate/message-bubble.tsx

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
          className="text-[17px] leading-[1.75] font-normal text-zinc-100 antialiased tracking-[-0.01em]"
          style={{
            fontFamily: 'var(--font-inter), system-ui, sans-serif',
            textShadow: '0 0 30px rgba(255, 255, 255, 0.08)',
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
  const isCenter = config.position === 'center'

  // Hover state for enhanced interactions
  const [isHovered, setIsHovered] = useState(false)

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
      className="relative w-full mb-16 group z-10"
      data-active={isActive}
      role="article"
      aria-label={`${config.label} - ${getTurnTypeShortLabel(message.turnType)}`}
      initial={skipAnimation ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24, mass: 1 }}
    >
      {/* Timeline Connector - line going UP to connect from previous card */}
      {/* Only show for non-first messages (where timeline connects from above) */}
      {!isFirst && (
        <>
          {/* Vertical line from previous card to this anchor */}
          <div
            className="absolute left-1/2 -top-12 h-10 w-px -translate-x-1/2 bg-white/[0.08]"
            aria-hidden="true"
          />
          {/* Anchor node at top edge of card */}
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-20" aria-hidden="true">
            <div className="w-4 h-4 rounded-full border-2 border-zinc-600 bg-[#0a0a0b] grid place-items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            </div>
          </div>
        </>
      )}

      {/* Ghost Glass Card - 3D floating container */}
      <div
        className={cn(
          'relative mx-auto max-w-3xl overflow-hidden',
          // Larger radius for premium Apple feel
          'rounded-2xl',
          // Smooth transition for depth filter
          'transition-[filter,transform] duration-500 ease-out'
        )}
        style={{
          filter: getDepthFilter(depthIndex),
          // Subtle 3D perspective hint
          transformStyle: 'preserve-3d',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Content wrapper - 3D frosted glass panel */}
        <div
          className={cn(
            'relative overflow-hidden',
            // Larger radius to match outer
            'rounded-2xl',
            // Stronger blur for frosted effect
            'backdrop-blur-2xl backdrop-saturate-150',
            // 8px grid system: 48px horizontal, 40px vertical (asymmetric for optical balance)
            'px-12 py-10',
            // Focus mode opacity with enhanced hover
            isActive
              ? 'opacity-100 grayscale-0'
              : 'opacity-30 grayscale-[0.3] group-hover:opacity-65 group-hover:grayscale-[0.1] group-hover:scale-[1.005]'
          )}
          style={{
            // TRUE GLASS: Semi-transparent background with role-based surface tint
            backgroundColor: isActive ? 'rgba(18, 18, 22, 0.78)' : 'rgba(15, 15, 18, 0.55)',
            backgroundImage: `linear-gradient(180deg, ${isActive ? surfaceTint.active : surfaceTint.inactive} 0%, transparent 60%)`,
            // 3D Transform: lift and scale when active, subtle lift on hover
            transform: isActive
              ? 'scale(1.02) translateY(-4px)'
              : isHovered
                ? 'scale(0.99) translateY(-2px)'
                : 'scale(0.985) translateY(0)',
            // Full 3D shadow system
            boxShadow: isActive ? activeShadow : SPEAKER_INACTIVE_SHADOWS,
            // Spring transition with all properties
            transition:
              'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.5s ease-out, background-color 0.4s ease-out, opacity 0.5s ease-out, filter 0.5s ease-out',
          }}
        >
          {/* Gradient border - brighter top edge, fades at bottom */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              padding: '1px',
              background: isActive
                ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 20%, rgba(255, 255, 255, 0.03) 50%, transparent 80%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 30%, transparent 60%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              transition: 'background 0.4s ease-out',
            }}
            aria-hidden="true"
          />

          {/* Glass surface with directional lighting */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 30%, transparent 60%), linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 40%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, transparent 40%), linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 30%)',
              transition: 'background 0.4s ease-out',
            }}
            aria-hidden="true"
          />

          {/* Subtle noise texture for tactile feel */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              mixBlendMode: 'overlay',
            }}
            aria-hidden="true"
          />

          {/* Speaker accent - soft glow bar instead of hard neon */}
          <div
            className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-2xl overflow-hidden"
            style={{
              background:
                message.speaker === 'for'
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.4) 100%)'
                  : message.speaker === 'against'
                    ? 'linear-gradient(180deg, rgba(244, 63, 94, 0.8) 0%, rgba(244, 63, 94, 0.4) 100%)'
                    : 'linear-gradient(180deg, rgba(245, 158, 11, 0.7) 0%, rgba(245, 158, 11, 0.35) 100%)',
              boxShadow:
                message.speaker === 'for'
                  ? '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.2)'
                  : message.speaker === 'against'
                    ? '0 0 20px rgba(244, 63, 94, 0.5), 0 0 40px rgba(244, 63, 94, 0.2)'
                    : '0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(245, 158, 11, 0.15)',
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

          {/* Header Zone - Two-row information architecture */}
          <div className={cn('relative mb-8', isCenter && 'text-center')}>
            {/* Row 1: Speaker Identity + Timestamp */}
            <div
              className={cn(
                'flex items-center gap-3 mb-3',
                isCenter ? 'justify-center' : 'justify-between'
              )}
            >
              {/* Speaker Pill Badge - Premium gradient style */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
                style={{
                  background: pillStyles.background,
                  border: `1px solid ${pillStyles.border}`,
                  boxShadow: isActive ? pillStyles.glow : 'none',
                  transition: 'box-shadow 0.3s ease-out',
                }}
              >
                <SpeakerIcon type={config.icon} className="w-3.5 h-3.5" />
                <span
                  className="text-[11px] font-semibold tracking-[0.15em] uppercase"
                  style={{ color: pillStyles.text }}
                >
                  {config.shortLabel}
                </span>
              </div>

              {/* Timestamp - Right aligned, context-aware visibility */}
              {showTimestamp && isRevealComplete && (
                <span
                  className="text-[11px] font-mono tabular-nums tracking-wide transition-opacity duration-300"
                  style={{
                    color: isActive || isHovered ? 'rgb(113, 113, 122)' : 'rgb(63, 63, 70)',
                    opacity: isActive ? 1 : isHovered ? 0.9 : 0.5,
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
            </div>

            {/* Row 2: Phase/Turn Type Chip with centered dividers */}
            <div className="flex items-center gap-3">
              {/* Left divider */}
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 100%)',
                }}
                aria-hidden="true"
              />

              {/* Phase chip - speaker-tinted */}
              <span
                className="px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase"
                style={{
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
                    'linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
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
