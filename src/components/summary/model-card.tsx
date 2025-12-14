// src/components/summary/model-card.tsx
/**
 * Animated card component for revealing AI model identities.
 * Uses SpotlightCard for hover effect and 3D flip animation for reveal.
 */

'use client'

import { FaLock } from 'react-icons/fa'

import SpotlightCard from '@/components/SpotlightCard'
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

/**
 * Color config matching APPLE_COLORS from speaker-config.ts
 * RGB values derived from HSL for spotlight effect
 */
const positionConfig = {
  for: {
    label: 'FOR',
    hiddenLabel: 'Debater A',
    iconColor: 'text-[hsl(192,45%,52%)]',
    textColor: 'text-[hsl(190,38%,68%)]',
    accentColor: 'bg-[hsl(192,45%,52%)]',
    spotlightColor: 'rgba(73, 167, 190, 0.25)' as const,
  },
  against: {
    label: 'AGAINST',
    hiddenLabel: 'Debater B',
    iconColor: 'text-[hsl(25,50%,52%)]',
    textColor: 'text-[hsl(28,42%,68%)]',
    accentColor: 'bg-[hsl(25,50%,52%)]',
    spotlightColor: 'rgba(199, 130, 66, 0.25)' as const,
  },
  moderator: {
    label: 'MODERATOR',
    hiddenLabel: 'Moderator',
    iconColor: 'text-[hsl(220,12%,58%)]',
    textColor: 'text-[hsl(218,10%,72%)]',
    accentColor: 'bg-[hsl(220,12%,58%)]',
    spotlightColor: 'rgba(135, 141, 156, 0.25)' as const,
  },
}

const modelColors: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600',
}

function ModelIcon({ provider }: { provider: string }) {
  if (provider === 'anthropic') {
    return (
      <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.827 3.52l5.313 16.96h-3.72L14.157 17H9.843l-1.263 3.48H4.86L10.173 3.52h3.654zm-.534 10.639L12 9.441l-1.293 4.718h2.586z" />
      </svg>
    )
  }

  if (provider === 'xai') {
    return (
      <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.005 8.858l8.783 12.544h3.904L6.909 8.858H3.005zM3 3.397h3.907l5.556 7.678-1.9 2.86L3 3.396zm10.495 0l7.5 10.468v-3.292l-5.605-7.176h-1.895zm7.5 17.205l-5.49-7.928-1.903 2.86 3.492 5.068h3.901z" />
      </svg>
    )
  }

  return (
    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  )
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
        {/* Hidden state - front face */}
        <SpotlightCard
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden !rounded-2xl !p-0',
            'flex flex-col items-center justify-center gap-3',
            '!bg-neutral-900/80 !border-neutral-700/50'
          )}
          spotlightColor={config.spotlightColor}
        >
          <FaLock className={cn('w-10 h-10', config.iconColor)} />
          <div className={cn('text-sm font-semibold uppercase tracking-wider', config.textColor)}>
            {config.label}
          </div>
          <div className="text-lg font-medium text-foreground/80">{config.hiddenLabel}</div>
        </SpotlightCard>

        {/* Revealed state - back face */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl',
            'flex flex-col items-center justify-center gap-3 p-6',
            'border border-white/10 shadow-lg',
            'bg-gradient-to-br',
            identity
              ? (modelColors[identity.color] ?? 'from-gray-500 to-gray-600')
              : 'from-gray-500 to-gray-600'
          )}
        >
          <ModelIcon provider={identity?.provider ?? 'openai'} />
          <div className="text-sm font-semibold uppercase tracking-wider text-white/80">
            {config.label}
          </div>
          <div className="text-xl font-bold text-white">{identity?.displayName ?? 'Unknown'}</div>
          <div className="text-sm text-white/70">{identity?.model ?? ''}</div>
        </div>
      </div>

      <div
        className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1',
          'rounded-full text-xs font-semibold text-white',
          'shadow-sm',
          config.accentColor
        )}
      >
        {config.label}
      </div>
    </div>
  )
}
