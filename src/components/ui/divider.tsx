// src/components/ui/divider.tsx
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
