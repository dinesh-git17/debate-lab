/**
 * src/components/debate/apple-background.tsx
 * Apple-inspired premium background - Static, simple, cross-browser consistent
 *
 * Design principles:
 * - NO blend modes (causes Safari/Firefox variance)
 * - NO animations or JS intervals
 * - Single combined gradient per layer (fewer compositing operations)
 * - Explicit hsla() colors for cross-browser consistency
 * - Performance optimized with CSS containment
 */

'use client'

import { cn } from '@/lib/utils'

interface AppleBackgroundProps {
  className?: string
}

/**
 * AppleBackground - Premium static background with 3 CSS layers
 *
 * Layer 0 - Base Void: Solid color foundation using CSS variable
 * Layer 1 - Subtle Glow: Radial gradient from center-top, adds depth
 * Layer 2 - Vignette: Edge darkening for focus effect
 */
export function AppleBackground({ className }: AppleBackgroundProps) {
  return (
    <div
      className={cn('pointer-events-none fixed inset-0', className)}
      style={{
        contain: 'layout style paint',
      }}
      aria-hidden="true"
    >
      {/* Layer 0: Base Void - Solid color foundation */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 0,
          background: 'hsl(var(--gradient-void))',
          transition: 'background-color 0.4s ease',
        }}
      />

      {/* Layer 1: Subtle radial glow from center-top - Dark mode */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          zIndex: 1,
          background: `
            radial-gradient(
              ellipse 100% 70% at 50% 30%,
              hsla(225, 10%, 12%, 0.35) 0%,
              hsla(225, 10%, 10%, 0.22) 20%,
              hsla(225, 10%, 9%, 0.12) 40%,
              hsla(225, 10%, 8%, 0.05) 60%,
              transparent 80%
            )
          `,
          transition: 'background 0.4s ease',
        }}
      />

      {/* Layer 1: Subtle radial glow from center-top - Light mode */}
      <div
        className="absolute inset-0 block dark:hidden"
        style={{
          zIndex: 1,
          background: `
            radial-gradient(
              ellipse 100% 70% at 50% 30%,
              hsla(40, 18%, 100%, 0.5) 0%,
              hsla(40, 15%, 99%, 0.3) 25%,
              hsla(40, 12%, 98%, 0.12) 50%,
              transparent 75%
            )
          `,
          transition: 'background 0.4s ease',
        }}
      />

      {/* Layer 2: Static vignette - Dark mode
          Subtle edge darkening for natural focus toward center */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          zIndex: 2,
          background: `
            radial-gradient(
              ellipse 85% 75% at 50% 50%,
              transparent 0%,
              transparent 40%,
              hsla(225, 10%, 6%, 0.04) 50%,
              hsla(225, 10%, 6%, 0.10) 60%,
              hsla(225, 10%, 6%, 0.18) 70%,
              hsla(225, 10%, 6%, 0.28) 80%,
              hsla(225, 10%, 6%, 0.42) 90%,
              hsla(225, 10%, 6%, 0.55) 100%
            )
          `,
          transition: 'background 0.4s ease',
        }}
      />

      {/* Layer 2: Static vignette - Light mode */}
      <div
        className="absolute inset-0 block dark:hidden"
        style={{
          zIndex: 2,
          background: `
            radial-gradient(
              ellipse 85% 75% at 50% 50%,
              transparent 0%,
              transparent 45%,
              hsla(40, 15%, 96%, 0.03) 55%,
              hsla(40, 15%, 94%, 0.08) 65%,
              hsla(40, 15%, 92%, 0.15) 75%,
              hsla(40, 15%, 90%, 0.25) 85%,
              hsla(40, 15%, 88%, 0.35) 100%
            )
          `,
          transition: 'background 0.4s ease',
        }}
      />
    </div>
  )
}
