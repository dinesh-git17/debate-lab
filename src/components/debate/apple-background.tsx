/**
 * src/components/debate/apple-background.tsx
 * Apple-inspired premium background - Pure solid color, maximum simplicity
 *
 * Design principles:
 * - Single solid color - no gradients, no visual artifacts
 * - Identical rendering across all browsers
 * - Zero complexity, zero distraction
 * - Content is the hero
 */

'use client'

import { cn } from '@/lib/utils'

interface AppleBackgroundProps {
  className?: string
}

/**
 * AppleBackground - Pure solid color background
 *
 * Uses CSS variable for theme-aware color:
 * - Dark: deep charcoal (hsl 225, 10%, 8%)
 * - Light: warm off-white (hsl 40, 15%, 98%)
 */
export function AppleBackground({ className }: AppleBackgroundProps) {
  return (
    <div
      className={cn('pointer-events-none fixed inset-0', className)}
      style={{
        background: 'hsl(var(--gradient-void))',
        transition: 'background-color 0.4s ease',
      }}
      aria-hidden="true"
    />
  )
}
