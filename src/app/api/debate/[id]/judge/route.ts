// route.ts
/**
 * Debate judge analysis endpoint.
 * Supports two-tier loading: quick scores first, full analysis follows.
 */

import { NextResponse } from 'next/server'

import { isValidDebateId } from '@/lib/id-generator'
import { getJudgeAnalysis, isAnalysisCached, isQuickScoreCached } from '@/services/judge-service'

import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id: debateId } = await params

  if (!isValidDebateId(debateId)) {
    return NextResponse.json({ error: 'Invalid debate ID' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const forceRegenerate = searchParams.get('regenerate') === 'true'

  const response = await getJudgeAnalysis(debateId, forceRegenerate)

  if (!response.success) {
    const status = response.error === 'Debate not found' ? 404 : 400
    return NextResponse.json({ error: response.error }, { status })
  }

  return NextResponse.json(
    {
      success: true,
      quickScore: response.quickScore,
      analysis: response.analysis,
      cached: response.cached,
      quickScoreCached: response.quickScoreCached,
      generationTimeMs: response.generationTimeMs,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=3600',
      },
    }
  )
}

export async function HEAD(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const { id: debateId } = await params

  if (!isValidDebateId(debateId)) {
    return new Response(null, { status: 400 })
  }

  const [analysisCached, quickScoreCached] = await Promise.all([
    isAnalysisCached(debateId),
    isQuickScoreCached(debateId),
  ])

  return new Response(null, {
    status: 200,
    headers: {
      'X-Analysis-Cached': analysisCached ? 'true' : 'false',
      'X-QuickScore-Cached': quickScoreCached ? 'true' : 'false',
    },
  })
}
