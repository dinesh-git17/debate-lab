// src/components/debate/message-bubble.tsx

'use client'

import { memo, useEffect, useRef } from 'react'

import { Markdown } from '@/components/ui/markdown'
import { getSpeakerConfig, getTurnTypeLabel } from '@/lib/speaker-config'
import { cn } from '@/lib/utils'

import type { DebateMessage } from '@/types/debate-ui'

interface MessageBubbleProps {
  message: DebateMessage
  showTimestamp?: boolean
  /** Called when the message is complete and ready for next message */
  onAnimationComplete?: () => void
}

/**
 * Content renderer with markdown support
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

  // Call onAnimationComplete when message is complete
  useEffect(() => {
    if (isComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true
      // eslint-disable-next-line no-console
      console.log('[MessageContent] Animation complete, calling onAnimationComplete')
      onAnimationComplete?.()
    }
  }, [isComplete, onAnimationComplete])

  return (
    <div className="leading-relaxed text-foreground">
      <Markdown content={content} />
      {isStreaming && (
        <span
          className="ml-1 inline-block h-4 w-2 animate-pulse bg-current align-middle"
          aria-label="Generating content"
        />
      )}
    </div>
  )
}

export const MessageBubble = memo(function MessageBubble({
  message,
  showTimestamp = false,
  onAnimationComplete,
}: MessageBubbleProps) {
  const config = getSpeakerConfig(message.speaker)
  const isCenter = config.position === 'center'
  const isRight = config.position === 'right'

  return (
    <div
      className={cn(
        'mb-4 flex w-full',
        isCenter && 'justify-center',
        isRight && 'justify-end',
        !isCenter && !isRight && 'justify-start'
      )}
      role="article"
      aria-label={`${config.label} - ${getTurnTypeLabel(message.turnType)}`}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl border px-4 py-3 md:max-w-[75%]',
          config.bgColor,
          config.borderColor,
          isCenter && 'max-w-[90%] text-center md:max-w-[80%]'
        )}
      >
        <div className={cn('mb-2 flex items-center gap-2', isCenter && 'justify-center')}>
          <span className="text-lg" role="img" aria-label={config.label}>
            {config.icon}
          </span>
          <span className={cn('text-sm font-semibold', config.color)}>{config.shortLabel}</span>
          <span className="text-xs text-muted-foreground">
            {getTurnTypeLabel(message.turnType)}
          </span>
        </div>

        <MessageContent
          content={message.content}
          isStreaming={message.isStreaming}
          isComplete={message.isComplete}
          onAnimationComplete={onAnimationComplete}
        />

        {(message.isComplete || showTimestamp) && (
          <div className={cn('mt-2 flex items-center gap-3 border-t pt-2', config.borderColor)}>
            {message.tokenCount !== undefined && message.tokenCount > 0 && (
              <span className="text-xs text-muted-foreground">{message.tokenCount} tokens</span>
            )}
            {showTimestamp && (
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString()}
              </span>
            )}
            {message.violations && message.violations.length > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {message.violations.length} violation{message.violations.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
