// src/components/debate/typing-indicator.tsx

'use client'

import { cn } from '@/lib/utils'

import type { TurnSpeaker } from '@/types/turn'

interface TypingIndicatorProps {
  speaker: TurnSpeaker
}

/**
 * Color configurations for each speaker's typing indicator dots
 */
const SPEAKER_DOT_COLORS: Record<TurnSpeaker, string> = {
  for: 'bg-blue-400',
  against: 'bg-rose-400',
  moderator: 'bg-amber-400',
}

/**
 * Animated typing indicator with three bouncing dots.
 * Matches the speaker's color theme.
 */
export function TypingIndicator({ speaker }: TypingIndicatorProps) {
  const dotColor = SPEAKER_DOT_COLORS[speaker]

  return (
    <div
      className="inline-flex items-center gap-1 py-2"
      role="status"
      aria-label="Generating response"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn('h-2 w-2 rounded-full opacity-70', dotColor, 'animate-bounce')}
          style={{
            animationDelay: `${index * 150}ms`,
            animationDuration: '600ms',
          }}
        />
      ))}
      <span className="sr-only">Thinking...</span>
    </div>
  )
}
