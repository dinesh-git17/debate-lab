// src/components/ui/container.tsx
/**
 * Responsive container component that constrains content width and applies consistent horizontal padding.
 * Serves as the primary layout wrapper for page content.
 */

import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'main'
}

export function Container({ children, className, as: Component = 'div' }: ContainerProps) {
  return (
    <Component className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </Component>
  )
}
