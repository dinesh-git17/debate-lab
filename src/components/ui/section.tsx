// src/components/ui/section.tsx
/**
 * Page section component with consistent vertical spacing and background variants.
 * Used to structure page content into distinct visual regions.
 */

import { cn } from '@/lib/utils'

type SectionVariant = 'default' | 'muted' | 'accent'

interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
  variant?: SectionVariant
}

const variantStyles: Record<SectionVariant, string> = {
  default: 'bg-background',
  muted: 'bg-muted',
  accent: 'bg-accent',
}

export function Section({ children, className, id, variant = 'default' }: SectionProps) {
  return (
    <section id={id} className={cn('py-16 md:py-24 lg:py-32', variantStyles[variant], className)}>
      {children}
    </section>
  )
}
