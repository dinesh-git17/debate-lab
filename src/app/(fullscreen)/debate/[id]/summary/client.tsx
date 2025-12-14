// client.tsx
/**
 * Client component for debate summary display.
 * Orchestrates reveal, statistics, sharing, and highlights sections.
 */

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useCallback, useRef } from 'react'

import { EvidenceReviewSection } from '@/components/jury'
import { DebateHighlightsCard } from '@/components/summary/debate-highlights-card'
import { RevealSection } from '@/components/summary/reveal-section'
import { ShareSection } from '@/components/summary/share-section'
import { SummaryNavigation } from '@/components/summary/summary-navigation'
import { clientLogger } from '@/lib/client-logger'
import { cn } from '@/lib/utils'
import { useSummaryStore } from '@/store/summary-store'

import type { JudgeAnalysisResponse } from '@/types/judge'
import type { SummaryResponse } from '@/types/summary'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

const dividerVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

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
      if (data.success) {
        // Set quick score immediately for progressive rendering of metric bars
        if (data.quickScore) {
          store.setQuickScore(data.quickScore)
        }
        // Set full analysis if available
        if (data.analysis) {
          store.setJudgeAnalysis(data.analysis, data.quickScore)
        } else {
          store.setAnalysisLoading(false)
        }
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
      <motion.div
        className="max-w-5xl mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={sectionVariants}>
          <SummaryNavigation className="mb-12" />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <RevealSection className="mb-16" />
        </motion.div>

        <motion.hr className="border-border my-12 origin-left" variants={dividerVariants} />

        <motion.div variants={sectionVariants}>
          <DebateHighlightsCard className="mb-16" />
        </motion.div>

        <motion.hr className="border-border my-12 origin-left" variants={dividerVariants} />

        <motion.div variants={sectionVariants}>
          <EvidenceReviewSection className="mb-16" />
        </motion.div>

        <motion.hr className="border-border my-12 origin-left" variants={dividerVariants} />

        <motion.div variants={sectionVariants}>
          <ShareSection debateId={initialData.debateId} shareUrl={shareUrl} className="mb-16" />
        </motion.div>

        <div className="h-16" />
      </motion.div>
    </div>
  )
}
