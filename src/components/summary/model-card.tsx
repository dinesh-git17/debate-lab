// src/components/summary/model-card.tsx
/**
 * Animated card component for revealing AI model identities.
 * Implements a 3D flip animation transitioning from hidden to revealed state.
 */

'use client'

import { cn } from '@/lib/utils'

import type { ModelIdentity } from '@/types/summary'
import type { TurnSpeaker } from '@/types/turn'

interface ModelCardProps {
  position: TurnSpeaker
  identity: ModelIdentity | null
  isRevealed: boolean
  isRevealing: boolean
  className?: string
}

const positionConfig = {
  for: {
    label: 'FOR',
    hiddenLabel: 'Debater A',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    accentColor: 'bg-blue-500',
  },
  against: {
    label: 'AGAINST',
    hiddenLabel: 'Debater B',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-600 dark:text-red-400',
    accentColor: 'bg-red-500',
  },
  moderator: {
    label: 'MODERATOR',
    hiddenLabel: 'Moderator',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    accentColor: 'bg-amber-500',
  },
}

const modelColors: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600',
}

export function ModelCard({
  position,
  identity,
  isRevealed,
  isRevealing,
  className,
}: ModelCardProps) {
  const config = positionConfig[position]

  return (
    <div className={cn('relative w-full max-w-xs perspective-1000', className)}>
      <div
        className={cn(
          'relative w-full h-48 transition-transform duration-700 transform-style-preserve-3d',
          isRevealing && 'animate-card-flip',
          isRevealed && 'rotate-y-180'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden rounded-xl border-2',
            'flex flex-col items-center justify-center gap-3 p-6',
            config.bgColor,
            config.borderColor
          )}
        >
          <div className="text-4xl">❓</div>
          <div className={cn('text-sm font-semibold uppercase tracking-wider', config.textColor)}>
            {config.label}
          </div>
          <div className="text-lg font-medium text-foreground/80">{config.hiddenLabel}</div>
          <div className="text-sm text-muted-foreground">Identity hidden</div>
        </div>

        <div
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl',
            'flex flex-col items-center justify-center gap-3 p-6',
            'bg-gradient-to-br',
            identity
              ? (modelColors[identity.color] ?? 'from-gray-500 to-gray-600')
              : 'from-gray-500 to-gray-600'
          )}
        >
          <div className="text-4xl">{identity?.icon ?? '🤖'}</div>
          <div className="text-sm font-semibold uppercase tracking-wider text-white/80">
            {config.label}
          </div>
          <div className="text-xl font-bold text-white">{identity?.displayName ?? 'Unknown'}</div>
          <div className="text-sm text-white/70">{identity?.model ?? ''}</div>
        </div>
      </div>

      <div
        className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white',
          config.accentColor
        )}
      >
        {config.label}
      </div>
    </div>
  )
}
