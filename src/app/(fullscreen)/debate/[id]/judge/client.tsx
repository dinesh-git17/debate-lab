// src/app/(debate)/debate/[id]/judge/client.tsx

'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { ClashAnalysis } from '@/components/judge/clash-analysis'
import { EducationalInsights } from '@/components/judge/educational-insights'
import { ScoreDisplay } from '@/components/judge/score-display'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useJudgeStore } from '@/store/judge-store'

interface JudgePageClientProps {
  debateId: string
  topic: string
}

const qualityColors: Record<string, string> = {
  excellent: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  good: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  fair: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
  developing: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
}

export function JudgePageClient({ debateId, topic }: JudgePageClientProps) {
  const { analysis, isLoading, error, generationTime, fetchAnalysis, reset } = useJudgeStore()

  useEffect(() => {
    fetchAnalysis(debateId)
    return () => reset()
  }, [debateId, fetchAnalysis, reset])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">&#x2696;&#xFE0F;</div>
          <h2 className="mb-2 text-xl font-semibold">Analyzing Debate...</h2>
          <p className="text-muted-foreground">
            Claude is evaluating the arguments and generating scores.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">This may take 15-30 seconds.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">&#x274C;</div>
          <p className="mb-4 text-lg text-red-500">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => fetchAnalysis(debateId, true)}>Try Again</Button>
            <Button variant="outline" asChild>
              <Link href={`/debate/${debateId}/summary`}>Back to Summary</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/debate/${debateId}/summary`} className="hover:underline">
              Summary
            </Link>
            <span>/</span>
            <span>Judge Analysis</span>
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{topic}</h1>
          {generationTime && (
            <p className="mt-2 text-xs text-muted-foreground">
              Analysis generated in {(generationTime / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-12">
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-2 text-xl font-bold">Judge&apos;s Overview</h2>
                <p className="text-muted-foreground">{analysis.overviewSummary}</p>
              </div>
              <div
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-sm font-medium',
                  qualityColors[analysis.debateQuality]
                )}
              >
                {analysis.debateQuality.charAt(0).toUpperCase() + analysis.debateQuality.slice(1)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.debateQualityExplanation}</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold">Detailed Scoring</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoreDisplay scores={analysis.forAnalysis} />
            <ScoreDisplay scores={analysis.againstAnalysis} />
          </div>
        </section>

        <ClashAnalysis clashPoints={analysis.keyClashPoints} className="mb-12" />

        <EducationalInsights analysis={analysis} className="mb-12" />

        <section className="mb-12">
          <div className="rounded-xl border bg-muted/30 p-6">
            <h3 className="mb-2 text-sm font-semibold">Disclaimer</h3>
            <p className="text-sm text-muted-foreground">{analysis.disclaimer}</p>
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-4 border-t pt-8">
          <Button variant="outline" asChild>
            <Link href={`/debate/${debateId}/summary`}>Back to Summary</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/debate/${debateId}`}>View Transcript</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/debate/new">Start New Debate</Link>
          </Button>
        </div>
      </main>

      <div className="h-16" />
    </div>
  )
}
