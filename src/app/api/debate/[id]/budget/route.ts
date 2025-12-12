// route.ts
/**
 * Debate budget status endpoint.
 * Returns token usage, cost tracking, and budget utilization metrics.
 */

import { NextResponse } from 'next/server'

import { isValidDebateId } from '@/lib/id-generator'
import { formatCost, getProviderDisplayName } from '@/lib/provider-pricing'
import { getBudgetStatus } from '@/services/budget-manager'

import type { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params

  if (!isValidDebateId(id)) {
    return NextResponse.json({ error: 'Invalid debate ID' }, { status: 400 })
  }

  const status = getBudgetStatus(id)

  if (!status.usage) {
    return NextResponse.json({ error: 'No usage data found for debate' }, { status: 404 })
  }

  return NextResponse.json({
    budget: {
      total: status.config.maxTokensPerDebate,
      used: status.usage.totalTokens,
      remaining: status.usage.budgetRemainingTokens,
      utilizationPercent: status.usage.budgetUtilizationPercent,
    },
    cost: {
      total: formatCost(status.usage.totalCostUsd),
      totalRaw: status.usage.totalCostUsd,
      limit: status.config.costLimitUsd ? formatCost(status.config.costLimitUsd) : null,
    },
    breakdown: status.breakdown.map((b) => ({
      provider: getProviderDisplayName(b.provider),
      tokens: b.inputTokens + b.outputTokens,
      cost: formatCost(b.totalCostUsd),
    })),
    turns: status.usage.turns.length,
    lastUpdated: status.usage.lastUpdatedAt.toISOString(),
  })
}
