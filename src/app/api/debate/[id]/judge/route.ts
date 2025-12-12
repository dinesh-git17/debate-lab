// route.ts
/**
 * Debate judge analysis endpoint.
 * Generates or retrieves AI-powered scoring and clash analysis for completed debates.
 */

import { NextResponse } from 'next/server'

import { isValidDebateId } from '@/lib/id-generator'
import { getJudgeAnalysis, isAnalysisCached } from '@/services/judge-service'

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
      analysis: response.analysis,
      cached: response.cached,
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

  const cached = isAnalysisCached(debateId)

  return new Response(null, {
    status: 200,
    headers: {
      'X-Analysis-Cached': cached ? 'true' : 'false',
    },
  })
}
