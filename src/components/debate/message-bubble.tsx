// src/components/debate/message-bubble.tsx

'use client'

import { memo, useEffect, useRef } from 'react'
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa'
import { LuScale } from 'react-icons/lu'

import { Markdown } from '@/components/ui/markdown'
import {
  getSpeakerConfig,
  getTurnTypeShortLabel,
  SPEAKER_GRADIENTS,
  SPEAKER_BADGE_COLORS,
} from '@/lib/speaker-config'
import { cn } from '@/lib/utils'

import type { DebateMessage } from '@/types/debate-ui'

interface MessageBubbleProps {
  message: DebateMessage
  showTimestamp?: boolean
  /** Called when the message is complete and ready for next message */
  onAnimationComplete?: () => void
  isActive?: boolean
  /** Whether this is the first message (no anchor needed) */
  isFirst?: boolean
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
 * Content renderer with markdown support and editorial typography
 */
function MessageContent({
  content,
  isStreaming,
  isComplete,
  onAnimationComplete,
}: {
  content: string
  isStreaming: boolean
  isComplete: boolean
  onAnimationComplete?: (() => void) | undefined
}) {
  const hasCalledComplete = useRef(false)

  useEffect(() => {
    if (isComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true
      // eslint-disable-next-line no-console
      console.log('[MessageContent] Animation complete, calling onAnimationComplete')
      onAnimationComplete?.()
    }
  }, [isComplete, onAnimationComplete])

  return (
    <div className="prose prose-invert max-w-none">
      <div className="font-serif text-lg leading-loose font-light text-zinc-200 antialiased">
        <Markdown content={content} />
        {isStreaming && (
          <span
            className="ml-1 inline-block h-4 w-2 animate-pulse bg-current align-middle"
            aria-label="Generating content"
          />
        )}
      </div>
    </div>
  )
}

export const MessageBubble = memo(function MessageBubble({
  message,
  showTimestamp = false,
  onAnimationComplete,
  isActive = true,
  isFirst = false,
}: MessageBubbleProps) {
  const config = getSpeakerConfig(message.speaker)
  const gradient = SPEAKER_GRADIENTS[message.speaker]
  const badgeColors = SPEAKER_BADGE_COLORS[message.speaker]
  const isCenter = config.position === 'center'

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

      {/* Ghost Glass Card - solid background always at full opacity to mask timeline */}
      <div
        className={cn(
          'relative mx-auto max-w-3xl overflow-hidden rounded-xl',
          // Solid background to mask the timeline - matches page bg
          'bg-[#0a0a0b]'
        )}
      >
        {/* Content wrapper with focus mode effects */}
        <div
          className={cn(
            'relative rounded-xl overflow-hidden',
            'border border-white/[0.05]',
            'backdrop-blur-xl',
            'p-8',
            'transition-all duration-500',
            // Focus mode: inactive messages are faded and slightly desaturated
            isActive
              ? 'opacity-100 grayscale-0'
              : 'opacity-50 grayscale-[0.3] group-hover:opacity-100 group-hover:grayscale-0',
            // Active card glow
            isActive && 'ring-1 ring-white/10 shadow-2xl',
            isActive && config.glowColor
          )}
        >
          {/* Glass overlay */}
          <div
            className={cn('absolute inset-0 pointer-events-none', config.bgColor)}
            aria-hidden="true"
          />

          {/* Neon Left Border */}
          <div
            className={cn('absolute top-0 left-0 bottom-0 w-[2px]', config.borderColor)}
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
            className={cn('relative flex items-center gap-2.5 mb-6', isCenter && 'justify-center')}
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

            {/* Phase Label - Plain text */}
            <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wide">
              {getTurnTypeShortLabel(message.turnType)}
            </span>

            {/* Timestamp */}
            {showTimestamp && (
              <span className="text-xs text-zinc-600 font-mono ml-auto">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Body: Editorial Serif */}
          <div className="relative">
            <MessageContent
              content={message.content}
              isStreaming={message.isStreaming}
              isComplete={message.isComplete}
              onAnimationComplete={onAnimationComplete}
            />
          </div>

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
