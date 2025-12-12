// src/components/debate/apple-background.tsx
/**
 * Theme-aware solid background layer for debate views.
 * Provides consistent cross-browser rendering with smooth theme transitions.
 */

'use client'

import { cn } from '@/lib/utils'

interface AppleBackgroundProps {
  className?: string
}

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
