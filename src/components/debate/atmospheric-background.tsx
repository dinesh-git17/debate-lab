/**
 * src/components/debate/atmospheric-background.tsx
 * Premium 5-layer atmospheric gradient system
 * Creates Apple-level depth and visual sophistication
 */

'use client'

import { cn } from '@/lib/utils'

interface AtmosphericBackgroundProps {
  className?: string
}

/**
 * AtmosphericBackground - Premium layered gradient system
 *
 * Layer Stack:
 * 0 - Base Void: Solid color anchor point
 * 1 - Radial Bloom: Centered radial gradient for depth
 * 2 - Horizon Wash: Top-down light simulation
 * 3 - Corner Vignette: Focus attention toward center
 * 4 - Color Undertone: Subtle color wash for warmth
 */
export function AtmosphericBackground({ className }: AtmosphericBackgroundProps) {
  return (
    <div
      className={cn('pointer-events-none fixed inset-0', className)}
      style={{
        willChange: 'transform',
        contain: 'layout style paint',
        backfaceVisibility: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Layer 0: Base Void - Deepest anchor point */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 0,
          background: 'hsl(var(--gradient-void))',
          transform: 'translateZ(0)',
          transition: 'background-color 0.4s ease',
        }}
      />

      {/* Layer 1: Radial Bloom - Centered radial gradient for depth */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background: `radial-gradient(
            ellipse 80% 70% at 50% 35%,
            hsl(var(--gradient-deep) / 0.6) 0%,
            hsl(var(--gradient-deep) / 0.3) 15%,
            hsl(var(--gradient-deep) / 0.15) 40%,
            hsl(var(--gradient-deep) / 0.05) 70%,
            transparent 100%
          )`,
          mixBlendMode: 'screen',
          opacity: 0.08,
          transform: 'translateZ(0)',
          transition: 'background 0.4s ease, opacity 0.4s ease',
        }}
      />

      {/* Layer 2: Horizon Wash - Overhead light simulation */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: `linear-gradient(
            180deg,
            hsl(var(--gradient-glow) / 0.04) 0%,
            hsl(var(--gradient-glow) / 0.02) 15%,
            transparent 30%
          )`,
          mixBlendMode: 'soft-light',
          transform: 'translateZ(0)',
          transition: 'background 0.4s ease',
        }}
      />

      {/* Layer 3: Corner Vignette - Focus attention toward center */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 3,
          background: `radial-gradient(
            ellipse 70% 60% at 50% 50%,
            transparent 40%,
            hsl(var(--gradient-void) / 0.15) 70%,
            hsl(var(--gradient-void) / 0.25) 100%
          )`,
          transform: 'translateZ(0)',
          transition: 'background 0.4s ease',
        }}
      />

      {/* Layer 3b: Asymmetric bottom vignette - 25% stronger at bottom */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 3,
          background: `linear-gradient(
            to top,
            hsl(var(--gradient-void) / 0.08) 0%,
            hsl(var(--gradient-void) / 0.04) 15%,
            transparent 40%
          )`,
          transform: 'translateZ(0)',
          transition: 'background 0.4s ease',
        }}
      />

      {/* Layer 4: Color Undertone - Subtle overlay for warmth */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 4,
          background: 'hsl(var(--gradient-undertone))',
          opacity: 0.03,
          mixBlendMode: 'overlay',
          transform: 'translateZ(0)',
          transition: 'background-color 0.4s ease',
        }}
      />
    </div>
  )
}
