// route.ts
/**
 * Debate cost estimation endpoint.
 * Calculates expected token usage and costs before debate creation.
 */

import { NextResponse } from 'next/server'

import { formatCost } from '@/lib/provider-pricing'
import { estimateDebateCost } from '@/services/budget-manager'

import type { NextRequest } from 'next/server'

interface EstimateRequest {
  turns: number
  format: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: EstimateRequest

  try {
    body = (await request.json()) as EstimateRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { turns, format } = body

  if (typeof turns !== 'number' || turns < 2 || turns > 10) {
    return NextResponse.json({ error: 'turns must be a number between 2 and 10' }, { status: 400 })
  }

  if (typeof format !== 'string' || format.length === 0) {
    return NextResponse.json({ error: 'format is required' }, { status: 400 })
  }

  const estimate = estimateDebateCost(turns, format)

  return NextResponse.json({
    estimatedTokens: estimate.estimatedTokens,
    estimatedCost: formatCost(estimate.estimatedCostUsd),
    estimatedCostRaw: estimate.estimatedCostUsd,
    breakdown: estimate.breakdown.map((b) => ({
      provider: b.provider,
      cost: formatCost(b.cost),
    })),
  })
}
