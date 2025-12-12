// src/components/ui/prose.tsx
/**
 * Typography wrapper that applies consistent styling to rich text content.
 * Handles headings, paragraphs, lists, and links with configurable max-width.
 */

import { cn } from '@/lib/utils'

type ProseSize = 'sm' | 'md' | 'lg'

interface ProseProps {
  children: React.ReactNode
  className?: string
  size?: ProseSize
}

const sizeStyles: Record<ProseSize, string> = {
  sm: 'max-w-[55ch]',
  md: 'max-w-[65ch]',
  lg: 'max-w-[75ch]',
}

export function Prose({ children, className, size = 'md' }: ProseProps) {
  return (
    <div
      className={cn(
        sizeStyles[size],
        '[&>p]:mb-4 [&>p]:leading-7 [&>p]:text-muted-foreground',
        '[&>p:last-child]:mb-0',
        '[&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-foreground',
        '[&>h3]:mb-3 [&>h3]:mt-6 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-foreground',
        '[&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:text-muted-foreground',
        '[&>ul>li]:mb-2 [&>ul>li]:leading-7',
        '[&>ol]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:text-muted-foreground',
        '[&>ol>li]:mb-2 [&>ol>li]:leading-7',
        '[&>a]:font-medium [&>a]:text-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a]:hover:text-muted-foreground',
        '[&>strong]:font-semibold [&>strong]:text-foreground',
        className
      )}
    >
      {children}
    </div>
  )
}
