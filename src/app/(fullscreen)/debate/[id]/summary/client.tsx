// client.tsx
/**
 * Client component for debate summary display.
 * Orchestrates reveal, statistics, sharing, and highlights sections.
 */

'use client'

import Link from 'next/link'
import { useEffect, useCallback, useRef } from 'react'

import { DebateHighlightsCard } from '@/components/summary/debate-highlights-card'
import { RevealSection } from '@/components/summary/reveal-section'
import { ShareSection } from '@/components/summary/share-section'
import { SummaryNavigation } from '@/components/summary/summary-navigation'
import { clientLogger } from '@/lib/client-logger'
import { cn } from '@/lib/utils'
import { useSummaryStore } from '@/store/summary-store'

import type { JudgeAnalysisResponse } from '@/types/judge'
import type { SummaryResponse } from '@/types/summary'

interface SummaryPageClientProps {
  initialData: SummaryResponse
  shareUrl?: string
}

export function SummaryPageClient({ initialData, shareUrl }: SummaryPageClientProps) {
  const status = useSummaryStore((s) => s.status)
  const error = useSummaryStore((s) => s.error)
  const hasFetchedAnalysis = useRef(false)

  const fetchJudgeAnalysis = useCallback(async () => {
    if (hasFetchedAnalysis.current) return
    hasFetchedAnalysis.current = true

    const store = useSummaryStore.getState()
    store.setAnalysisLoading(true)

    try {
      const response = await fetch(`/api/debate/${initialData.debateId}/judge`)
      if (!response.ok) {
        clientLogger.error('Summary: Failed to fetch judge analysis')
        store.setAnalysisLoading(false)
        return
      }

      const data = (await response.json()) as JudgeAnalysisResponse
      if (data.success && data.analysis) {
        store.setJudgeAnalysis(data.analysis)
      } else {
        store.setAnalysisLoading(false)
      }
    } catch (err) {
      clientLogger.error('Summary: Error fetching judge analysis', err)
      store.setAnalysisLoading(false)
    }
  }, [initialData.debateId])

  useEffect(() => {
    useSummaryStore.getState().loadSummary(initialData)

    // Skip judge analysis for debates that were ended early (cancelled)
    if (initialData.status !== 'cancelled') {
      fetchJudgeAnalysis()
    }

    return () => {
      useSummaryStore.getState().reset()
      hasFetchedAnalysis.current = false
    }
  }, [initialData, fetchJudgeAnalysis])

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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
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
        <DebateHighlightsCard className="mb-16" />
        <hr className="border-border my-12" />
        <ShareSection debateId={initialData.debateId} shareUrl={shareUrl} className="mb-16" />
        <div className="h-16" />
      </div>
    </div>
  )
}
