// src/components/debate/apple-background.tsx
/**
 * Ambient background layer for debate views with vignette effect.
 * Creates subtle environmental depth that draws focus to center.
 */

'use client'

import { cn } from '@/lib/utils'

interface AppleBackgroundProps {
  className?: string
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

export function AppleBackground({ className }: AppleBackgroundProps) {
  return (
    <div className={cn('pointer-events-none fixed inset-0', className)} aria-hidden="true">
      {/* Base solid color */}
      <div
        className="absolute inset-0"
        style={{
          background: 'hsl(var(--gradient-void))',
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
