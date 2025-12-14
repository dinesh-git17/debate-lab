/**
 * Jury deliberation endpoint.
 * Generates evidence-based fact checking from independent AI jurors (Gemini, DeepSeek).
 */

import { NextResponse } from 'next/server'

import { isValidDebateId } from '@/lib/id-generator'
import { getJuryDeliberation, isDeliberationCached } from '@/services/jury-service'

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

  const response = await getJuryDeliberation(debateId, forceRegenerate)

  if (!response.success) {
    const status = response.error === 'Debate not found' ? 404 : 400
    return NextResponse.json({ error: response.error }, { status })
  }

  return NextResponse.json(
    {
      success: true,
      deliberation: response.deliberation,
      cached: response.cached,
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

  const cached = await isDeliberationCached(debateId)

  return new Response(null, {
    status: 200,
    headers: {
      'X-Deliberation-Cached': cached ? 'true' : 'false',
    },
  })
}
