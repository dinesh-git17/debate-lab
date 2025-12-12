// route.ts
/**
 * Debate summary endpoint.
 * Provides comprehensive post-debate analytics including turns, statistics, and model assignments.
 */

import { NextResponse } from 'next/server'

import { getEngineState } from '@/lib/engine-store'
import { isValidDebateId } from '@/lib/id-generator'
import { getProviderDisplayName } from '@/lib/provider-pricing'
import { getSession } from '@/lib/session-store'
import { getBudgetStatus } from '@/services/budget-manager'
import { revealAssignment } from '@/services/debate-service'

import type { DebateStatistics, SummaryResponse, TurnSummary } from '@/types/summary'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params

  if (!isValidDebateId(id)) {
    return NextResponse.json({ error: 'Invalid debate ID format' }, { status: 400 })
  }

  const session = await getSession(id)
  if (!session) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
  }

  if (session.status !== 'completed') {
    return NextResponse.json(
      { error: 'Summary only available for completed debates' },
      { status: 403 }
    )
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

  const response: SummaryResponse = {
    debateId: id,
    topic: session.topic,
    format: session.format,
    status: 'completed',
    completedAt: session.updatedAt.toISOString(),
    turns,
    statistics,
    assignment,
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
