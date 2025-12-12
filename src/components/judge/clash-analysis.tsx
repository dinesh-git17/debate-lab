// src/components/judge/clash-analysis.tsx
/**
 * Displays key points of clash from judge analysis.
 * Renders a side-by-side comparison of opposing positions with judicial commentary.
 */

'use client'

import { cn } from '@/lib/utils'

import type { ClashPoint } from '@/types/judge'

interface ClashAnalysisProps {
  clashPoints: ClashPoint[]
  className?: string
}

export function ClashAnalysis({ clashPoints, className }: ClashAnalysisProps) {
  if (clashPoints.length === 0) return null

  return (
    <section className={cn('', className)}>
      <h2 className="mb-4 text-xl font-bold">Key Points of Clash</h2>
      <p className="mb-6 text-muted-foreground">
        Where the debaters most directly engaged with each other
      </p>

      <div className="space-y-6">
        {clashPoints.map((clash, index) => (
          <ClashCard key={index} clash={clash} />
        ))}
      </div>
    </section>
  )
}

function ClashCard({ clash }: { clash: ClashPoint }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-muted/30 p-4">
        <h3 className="font-semibold">{clash.topic}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{clash.description}</p>
      </div>

      <div className="grid divide-y md:divide-x md:divide-y-0 md:grid-cols-2">
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              FOR&apos;s Position
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{clash.forArgument}</p>
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              AGAINST&apos;s Position
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{clash.againstArgument}</p>
        </div>
      </div>

      <div className="border-t bg-muted/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">&#x2696;&#xFE0F;</span>
          <span className="text-sm font-medium">Judge&apos;s Analysis</span>
        </div>
        <p className="text-sm text-muted-foreground">{clash.analysis}</p>
        {clash.advantageNote && (
          <p className="mt-2 text-xs italic text-muted-foreground">Note: {clash.advantageNote}</p>
        )}
      </div>
    </div>
  )
}
