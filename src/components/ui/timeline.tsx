// src/components/ui/timeline.tsx
/**
 * Vertical timeline component for displaying sequential steps or events.
 * Supports alternating left-right layout on desktop with responsive mobile fallback.
 */

import { cn } from '@/lib/utils'

interface TimelineProps {
  children: React.ReactNode
  className?: string
}

export function Timeline({ children, className }: TimelineProps) {
  return <ol className={cn('relative', className)}>{children}</ol>
}

interface TimelineItemProps {
  children: React.ReactNode
  step: number
  title: string
  icon?: React.ReactNode
  isLast?: boolean
  className?: string
}

function TimelineItem({
  children,
  step,
  title,
  icon,
  isLast = false,
  className,
}: TimelineItemProps) {
  const isEven = step % 2 === 0

  return (
    <li
      className={cn(
        'relative pb-12 last:pb-0',
        'md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8',
        className
      )}
    >
      <div className={cn('hidden md:block', isEven ? 'order-3' : 'order-1')}>
        <div
          className={cn(
            'rounded-lg border border-border bg-card p-6',
            isEven ? 'text-left' : 'text-right'
          )}
        >
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <div className="mt-3 text-muted-foreground">{children}</div>
        </div>
      </div>

      <div className="order-2 flex flex-col items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-primary">
          {icon ?? <span className="text-sm font-bold">{step}</span>}
        </div>
        {!isLast && <div className="h-full w-0.5 bg-border" />}
      </div>

      <div className={cn('hidden md:block', isEven ? 'order-1' : 'order-3')} />

      <div className="ml-6 mt-3 md:hidden">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <div className="mt-2 text-muted-foreground">{children}</div>
      </div>
    </li>
  )
}

Timeline.Item = TimelineItem
