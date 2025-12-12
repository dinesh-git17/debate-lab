// src/components/ui/divider.tsx
/**
 * Horizontal rule component for visual separation of content sections.
 * Supports decorative mode which removes the element from the accessibility tree.
 */

import { cn } from '@/lib/utils'

interface DividerProps {
  className?: string
  decorative?: boolean
}

export function Divider({ className, decorative = true }: DividerProps) {
  return (
    <hr
      className={cn('my-8 border-t border-border', className)}
      {...(decorative && { 'aria-hidden': true, role: 'presentation' })}
    />
  )
}
