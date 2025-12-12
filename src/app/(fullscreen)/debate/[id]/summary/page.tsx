// page.tsx
/**
 * Server component for debate summary route.
 * Aggregates statistics, builds share metadata, and prepares summary data for hydration.
 */

import { notFound, redirect } from 'next/navigation'

import { getEngineState } from '@/lib/engine-store'
import { isValidDebateId } from '@/lib/id-generator'
import { buildShareMetadata } from '@/lib/og-image'
import { getProviderDisplayName } from '@/lib/provider-pricing'
import { getSession } from '@/lib/session-store'
import { getOrCreateShareSettings } from '@/lib/share-store'
import { getBudgetStatus } from '@/services/budget-manager'
import { revealAssignment } from '@/services/debate-service'

import { SummaryPageClient } from './client'

import type { DebateStatistics, SummaryResponse, TurnSummary } from '@/types/summary'
import type { Metadata } from 'next'

interface SummaryPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SummaryPageProps): Promise<Metadata> {
  const { id } = await params
  const session = await getSession(id)

  if (!session) {
    return { title: 'Summary Not Found' }
  }

  const assignment = await revealAssignment(id)
  const forModel = assignment?.forModel ?? 'AI'
  const againstModel = assignment?.againstModel ?? 'AI'

  const engineState = await getEngineState(id)
  const turnCount = engineState?.completedTurns?.length ?? 0

  const shareData = buildShareMetadata(
    id,
    session.topic,
    session.format,
    forModel,
    againstModel,
    session.status,
    turnCount
  )

  const shareSettings = await getOrCreateShareSettings(id)

  return {
    title: shareData.title,
    description: shareData.description,
    openGraph: {
      title: shareData.title,
      description: shareData.description,
      url: shareData.url,
      siteName: 'Debate Lab',
      type: 'article',
      images: [
        {
          url: shareData.imageUrl,
          width: 1200,
          height: 630,
          alt: `Debate: ${session.topic}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareData.title,
      description: shareData.description,
      images: [shareData.imageUrl],
    },
    alternates: {
      canonical: shareData.url,
    },
    other: {
      'share-url': shareSettings.shareUrl,
    },
  }
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { id } = await params

  if (!isValidDebateId(id)) {
    notFound()
  }

  const session = await getSession(id)

  if (!session) {
    notFound()
  }

  if (session.status !== 'completed') {
    redirect(`/debate/${id}`)
  }

  const engineState = await getEngineState(id)
  const budgetStatus = getBudgetStatus(id)

  const turns: TurnSummary[] = (engineState?.completedTurns ?? []).map((turn) => ({
    id: turn.id,
    turnNumber: turn.config.order,
    speaker: turn.speaker,
    speakerLabel: turn.config.label,
    turnType: turn.config.type,
    content: turn.content,
    tokenCount: turn.tokenCount,
    timestamp: turn.completedAt.toISOString(),
  }))

  const tokensByParticipant = { for: 0, against: 0, moderator: 0 }
  for (const turn of engineState?.completedTurns ?? []) {
    tokensByParticipant[turn.speaker] += turn.tokenCount
  }

  const totalDurationMs =
    engineState?.startedAt && engineState?.completedAt
      ? engineState.completedAt.getTime() - engineState.startedAt.getTime()
      : 0

  const statistics: DebateStatistics = {
    totalTurns: turns.length,
    totalTokens: budgetStatus.usage?.totalTokens ?? 0,
    totalCost: budgetStatus.usage?.totalCostUsd ?? 0,
    durationMs: totalDurationMs,
    avgTokensPerTurn:
      turns.length > 0 ? Math.round((budgetStatus.usage?.totalTokens ?? 0) / turns.length) : 0,
    avgResponseTimeMs: turns.length > 0 ? Math.round(totalDurationMs / turns.length) : 0,
    tokensByParticipant,
    costByProvider: budgetStatus.breakdown.map((b) => ({
      provider: getProviderDisplayName(b.provider),
      cost: b.totalCostUsd,
    })),
  }

  const assignment = session.status === 'completed' ? await revealAssignment(id) : null

  const summaryData: SummaryResponse = {
    debateId: id,
    topic: session.topic,
    format: session.format,
    status: 'completed',
    completedAt: session.updatedAt.toISOString(),
    turns,
    statistics,
    assignment,
  }

  const shareSettings = await getOrCreateShareSettings(id)

  return (
    <SummaryPageClient
      initialData={summaryData}
      shareUrl={shareSettings.shareUrl}
      shortCode={shareSettings.shortCode}
    />
  )
}
