/**
 * src/components/debate/atmospheric-background.tsx
 * Premium atmospheric gradient system - Cross-browser optimized
 *
 * Key rendering principles for Safari/Firefox consistency:
 * - NO blend modes (Safari renders them darker)
 * - Single combined gradient per layer (fewer compositing operations)
 * - Many small opacity steps to prevent banding
 * - Use rgba() instead of hsl() with alpha for Safari compatibility
 */

'use client'

import { cn } from '@/lib/utils'

interface AtmosphericBackgroundProps {
  className?: string
}

/**
 * AtmosphericBackground - Simplified for cross-browser consistency
 *
 * Reduced to essential layers with NO blend modes:
 * 0 - Base Void: Solid color foundation
 * 1 - Combined atmospheric gradient (radial + linear in one)
 */
export function AtmosphericBackground({ className }: AtmosphericBackgroundProps) {
  return (
    <div
      className={cn('pointer-events-none fixed inset-0', className)}
      style={{
        contain: 'layout style paint',
        backfaceVisibility: 'hidden',
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

      {/* Layer 1: Combined atmospheric effect - single gradient, no blend modes
          Dark mode: subtle radial lightening from center-top */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          zIndex: 1,
          background: `
            radial-gradient(
              ellipse 120% 80% at 50% 30%,
              hsla(220, 8%, 12%, 0.4) 0%,
              hsla(220, 8%, 11%, 0.3) 10%,
              hsla(220, 8%, 10%, 0.2) 20%,
              hsla(220, 8%, 9%, 0.12) 30%,
              hsla(220, 8%, 8%, 0.06) 45%,
              hsla(220, 8%, 7%, 0.02) 60%,
              transparent 80%
            )
          `,
          transition: 'background 0.4s ease',
        }}
      />

      {/* Layer 1: Light mode - warm subtle glow from top */}
      <div
        className="absolute inset-0 block dark:hidden"
        style={{
          zIndex: 1,
          background: `
            radial-gradient(
              ellipse 120% 80% at 50% 20%,
              hsla(40, 20%, 99%, 0.5) 0%,
              hsla(40, 15%, 98%, 0.3) 15%,
              hsla(40, 10%, 97%, 0.15) 30%,
              hsla(40, 8%, 96%, 0.06) 50%,
              transparent 75%
            )
          `,
          transition: 'background 0.4s ease',
        }}
      />
    </div>
  )
}
