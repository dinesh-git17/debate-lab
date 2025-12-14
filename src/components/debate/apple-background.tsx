// src/components/debate/apple-background.tsx
/**
 * Ambient background layer for debate views with vignette and speaker-aware tint.
 * Creates subtle environmental depth that shifts based on active speaker.
 */

'use client'

import { APPLE_COLORS } from '@/lib/speaker-config'
import { cn } from '@/lib/utils'

import type { TurnSpeaker } from '@/types/turn'

interface AppleBackgroundProps {
  className?: string
  activeSpeaker?: TurnSpeaker | null
}

const SPEAKER_AMBIENT_TINTS: Record<TurnSpeaker, string> = {
  for: APPLE_COLORS.for.rgba(0.035),
  against: APPLE_COLORS.against.rgba(0.035),
  moderator: APPLE_COLORS.moderator.rgba(0.025),
}

const VIGNETTE_GRADIENT = `
  radial-gradient(
    ellipse 80% 60% at 50% 50%,
    transparent 0%,
    transparent 40%,
    rgba(0, 0, 0, 0.15) 70%,
    rgba(0, 0, 0, 0.35) 100%
  )
`.replace(/\s+/g, ' ')

export function AppleBackground({ className, activeSpeaker }: AppleBackgroundProps) {
  const ambientTint = activeSpeaker ? SPEAKER_AMBIENT_TINTS[activeSpeaker] : 'transparent'

  return (
    <div className={cn('pointer-events-none fixed inset-0', className)} aria-hidden="true">
      {/* Base solid color */}
      <div
        className="absolute inset-0"
        style={{
          background: 'hsl(var(--gradient-void))',
        }}
      />

      {/* Speaker-aware ambient tint - barely perceptible, slow transition */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 100% at 50% 30%, ${ambientTint} 0%, transparent 70%)`,
          transition: 'background 800ms ease-out',
        }}
      />

      {/* Static vignette - draws focus to center */}
      <div
        className="absolute inset-0"
        style={{
          background: VIGNETTE_GRADIENT,
        }}
      />
    </div>
  )
}
