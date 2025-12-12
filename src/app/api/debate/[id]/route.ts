// route.ts
/**
 * Debate session retrieval endpoint.
 * Fetches active or completed debate session data.
 */

import { NextResponse } from 'next/server'

import { isValidDebateId } from '@/lib/id-generator'
import { getDebateSession } from '@/services/debate-service'

import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params

  if (!isValidDebateId(id)) {
    return NextResponse.json({ error: 'Invalid debate ID format' }, { status: 400 })
  }

  const session = await getDebateSession(id)

  if (!session) {
    return NextResponse.json({ error: 'Debate not found or expired' }, { status: 404 })
  }

  return NextResponse.json({ session })
}
