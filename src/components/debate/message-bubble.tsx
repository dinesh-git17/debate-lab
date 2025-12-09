// src/components/debate/message-bubble.tsx

'use client'

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
  SPEAKER_BADGE_COLORS,
  SPEAKER_ACTIVE_SHADOWS,
  SPEAKER_INACTIVE_SHADOWS,
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
  const iconClass = cn('w-3 h-3', className)

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
          className="text-lg leading-[1.7] font-normal text-zinc-100 antialiased tracking-[-0.01em]"
          style={{
            fontFamily: 'var(--font-inter), system-ui, sans-serif',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
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
  const badgeColors = SPEAKER_BADGE_COLORS[message.speaker]
  // Use enhanced gradient when active, standard when inactive
  const gradient = isActive
    ? SPEAKER_ACTIVE_GRADIENTS[message.speaker]
    : SPEAKER_GRADIENTS[message.speaker]
  const activeShadow = SPEAKER_ACTIVE_SHADOWS[message.speaker]
  const isCenter = config.position === 'center'

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
    <div
      className="relative w-full mb-12 group z-10"
      data-active={isActive}
      role="article"
      aria-label={`${config.label} - ${getTurnTypeShortLabel(message.turnType)}`}
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
      >
        {/* Content wrapper - 3D frosted glass panel */}
        <div
          className={cn(
            'relative overflow-hidden',
            // Larger radius to match outer
            'rounded-2xl',
            // Stronger blur for frosted effect
            'backdrop-blur-2xl backdrop-saturate-150',
            // More generous padding for premium feel
            'p-10',
            // Focus mode opacity
            isActive
              ? 'opacity-100 grayscale-0'
              : 'opacity-35 grayscale-[0.25] group-hover:opacity-70 group-hover:grayscale-0'
          )}
          style={{
            // TRUE GLASS: Semi-transparent background
            backgroundColor: isActive ? 'rgba(18, 18, 22, 0.75)' : 'rgba(15, 15, 18, 0.6)',
            // 3D Transform: lift and scale when active
            transform: isActive ? 'scale(1.02) translateY(-4px)' : 'scale(0.98) translateY(0)',
            // Full 3D shadow system
            boxShadow: isActive ? activeShadow : SPEAKER_INACTIVE_SHADOWS,
            // Spring transition
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

          {/* Header: Physical Badge System */}
          <div
            className={cn('relative flex items-baseline gap-2 mb-6', isCenter && 'justify-center')}
          >
            {/* Role Badge - Physical Chip */}
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded border',
                badgeColors
              )}
            >
              <SpeakerIcon type={config.icon} />
              <span className="text-[9px] font-bold tracking-widest uppercase">
                {config.shortLabel}
              </span>
            </div>

            {/* Divider */}
            <span className="w-px h-3 bg-zinc-700/50" aria-hidden="true" />

            {/* Phase Label */}
            <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wide">
              {getTurnTypeShortLabel(message.turnType)}
            </span>
          </div>

          {/* Body: Editorial Serif */}
          <div className="relative">
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

          {/* Timestamp footer - only show after client-side reveal animation is complete */}
          {showTimestamp && isRevealComplete && (
            <div className="relative mt-4 flex justify-end">
              <span className="text-[10px] text-zinc-500/60 font-mono tabular-nums">
                {message.timestamp
                  .toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                  .toLowerCase()}
              </span>
            </div>
          )}

          {/* Violations footer (only if violations exist) */}
          {message.violations && message.violations.length > 0 && (
            <div className="relative mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
              <span className="text-xs text-amber-400 font-mono">
                {message.violations.length} VIOLATION{message.violations.length > 1 ? 'S' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
