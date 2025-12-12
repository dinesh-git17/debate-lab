// client.tsx
/**
 * Client component for debate summary display.
 * Orchestrates reveal, statistics, sharing, and Claude's analysis sections.
 */

'use client'

import Link from 'next/link'
import { useEffect, useCallback, useRef } from 'react'

import { RevealSection } from '@/components/summary/reveal-section'
import { ShareSection } from '@/components/summary/share-section'
import { StatisticsDashboard } from '@/components/summary/statistics-dashboard'
import { SummaryCard } from '@/components/summary/summary-card'
import { SummaryNavigation } from '@/components/summary/summary-navigation'
import { clientLogger } from '@/lib/client-logger'
import { cn } from '@/lib/utils'
import { useSummaryStore } from '@/store/summary-store'

import type { JudgeAnalysisResponse } from '@/types/judge'
import type { SummaryResponse } from '@/types/summary'

interface SummaryPageClientProps {
  initialData: SummaryResponse
  shareUrl?: string
  shortCode?: string
}

export function SummaryPageClient({ initialData, shareUrl, shortCode }: SummaryPageClientProps) {
  const status = useSummaryStore((s) => s.status)
  const error = useSummaryStore((s) => s.error)
  const hasFetchedSummary = useRef(false)

  const fetchClaudeSummary = useCallback(async () => {
    if (hasFetchedSummary.current) return
    hasFetchedSummary.current = true

    const store = useSummaryStore.getState()
    store.setSummaryLoading(true)

    try {
      const response = await fetch(`/api/debate/${initialData.debateId}/judge`)
      if (!response.ok) {
        clientLogger.error('Summary: Failed to fetch judge analysis')
        store.setSummaryLoading(false)
        return
      }

      const data = (await response.json()) as JudgeAnalysisResponse
      if (data.success && data.analysis) {
        store.setClaudeSummary(data.analysis.overviewSummary)
      } else {
        store.setSummaryLoading(false)
      }
    } catch (err) {
      clientLogger.error('Summary: Error fetching judge analysis', err)
      store.setSummaryLoading(false)
    }
  }, [initialData.debateId])

  useEffect(() => {
    useSummaryStore.getState().loadSummary(initialData)
    fetchClaudeSummary()

    return () => {
      useSummaryStore.getState().reset()
      hasFetchedSummary.current = false
    }
  }, [initialData, fetchClaudeSummary])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading summary...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Failed to Load Summary</h1>
          <p className="text-muted-foreground mb-6">
            {error ?? 'An unexpected error occurred while loading the debate summary.'}
          </p>
          <Link
            href="/"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors'
            )}
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <SummaryNavigation className="mb-12" />
        <RevealSection className="mb-16" />
        <hr className="border-border my-12" />
        <StatisticsDashboard className="mb-16" />
        <hr className="border-border my-12" />
        <SummaryCard className="mb-16" />
        <hr className="border-border my-12" />
        <ShareSection
          debateId={initialData.debateId}
          shareUrl={shareUrl}
          shortCode={shortCode}
          className="mb-16"
        />
        <div className="h-16" />
      </div>
    </div>
  )
}
