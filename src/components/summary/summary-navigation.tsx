// src/components/summary/summary-navigation.tsx
/**
 * Navigation component for the debate summary page.
 * Provides breadcrumbs, topic header, and action buttons for related views.
 */

'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { useSummaryStore } from '@/store/summary-store'

interface SummaryNavigationProps {
  className?: string
}

export function SummaryNavigation({ className }: SummaryNavigationProps) {
  const debateId = useSummaryStore((s) => s.debateId)
  const topic = useSummaryStore((s) => s.topic)

  return (
    <nav className={cn('w-full', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href={`/debate/${debateId}`} className="hover:text-foreground transition-colors">
          Debate
        </Link>
        <span>/</span>
        <span className="text-foreground">Summary</span>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase">
            Completed
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {topic || 'Debate Summary'}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/debate/${debateId}`}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-muted text-foreground border border-border',
            'hover:bg-muted/80 transition-colors',
            'focus:outline-none focus:ring-4 focus:ring-primary/20'
          )}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>View Debate</span>
        </Link>

        <Link
          href={`/debate/${debateId}/judge`}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-violet-600 text-white',
            'hover:bg-violet-700 transition-colors',
            'focus:outline-none focus:ring-4 focus:ring-violet-500/30'
          )}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <span>Detailed Analysis</span>
        </Link>

        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'focus:outline-none focus:ring-4 focus:ring-primary/30'
          )}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Debate</span>
        </Link>
      </div>
    </nav>
  )
}
