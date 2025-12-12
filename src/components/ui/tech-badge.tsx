// src/components/ui/tech-badge.tsx
/**
 * Badge component for displaying technology or feature items with icon, name, and description.
 * Renders as a link when href is provided, otherwise as a static container.
 */

import { cn } from '@/lib/utils'

interface TechBadgeProps {
  name: string
  description: string
  icon?: React.ReactNode
  href?: string
  className?: string
}

export function TechBadge({ name, description, icon, href, className }: TechBadgeProps) {
  const content = (
    <>
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-foreground">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </>
  )

  const baseStyles = cn(
    'block rounded-lg border border-border bg-card p-4 text-left',
    href && 'transition-colors hover:bg-muted/50',
    className
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseStyles}>
        {content}
      </a>
    )
  }

  return <div className={baseStyles}>{content}</div>
}
