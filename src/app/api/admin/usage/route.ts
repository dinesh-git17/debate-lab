// route.ts
/**
 * Admin usage statistics endpoint.
 * Aggregates token consumption and cost metrics across time periods.
 */

import { NextResponse } from 'next/server'

import { formatCost, getProviderDisplayName } from '@/lib/provider-pricing'
import { getAggregateStats } from '@/lib/usage-store'

import type { NextRequest } from 'next/server'

type Period = 'hour' | 'day' | 'week' | 'month'

const VALID_PERIODS: Period[] = ['hour', 'day', 'week', 'month']

function isValidPeriod(value: string): value is Period {
  return VALID_PERIODS.includes(value as Period)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const periodParam = searchParams.get('period') ?? 'day'

  if (!isValidPeriod(periodParam)) {
    return NextResponse.json(
      { error: `Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}` },
      { status: 400 }
    )
  }

  const stats = getAggregateStats(periodParam)

  return NextResponse.json({
    period: stats.period,
    summary: {
      debates: stats.debatesCount,
      totalTokens: stats.totalTokens,
      totalCost: formatCost(stats.totalCostUsd),
      avgTokensPerDebate: stats.averageTokensPerDebate,
      avgCostPerDebate: formatCost(stats.averageCostPerDebate),
    },
    byProvider: stats.byProvider.map((p) => ({
      provider: getProviderDisplayName(p.provider),
      inputTokens: p.inputTokens,
      outputTokens: p.outputTokens,
      cost: formatCost(p.totalCostUsd),
    })),
    timestamp: stats.timestamp.toISOString(),
  })
}
