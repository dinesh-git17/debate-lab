// route.ts
/**
 * Debate sharing configuration endpoint.
 * Manages visibility settings and tracks share analytics.
 */

import { NextResponse } from 'next/server'

import { isValidDebateId } from '@/lib/id-generator'
import { getSession } from '@/lib/session-store'
import {
  getOrCreateShareSettings,
  getShareAnalytics,
  updateShareVisibility,
} from '@/lib/share-store'

import type { ShareVisibility } from '@/types/share'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id: debateId } = await params

  if (!isValidDebateId(debateId)) {
    return NextResponse.json({ error: 'Invalid debate ID' }, { status: 400 })
  }

  const session = await getSession(debateId)
  if (!session) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
  }

  const settings = await getOrCreateShareSettings(debateId)
  const analytics = await getShareAnalytics(debateId)

  return NextResponse.json({
    settings,
    analytics,
  })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: debateId } = await params

  if (!isValidDebateId(debateId)) {
    return NextResponse.json({ error: 'Invalid debate ID' }, { status: 400 })
  }

  const session = await getSession(debateId)
  if (!session) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
  }

  let body: { visibility?: ShareVisibility }
  try {
    body = (await request.json()) as { visibility?: ShareVisibility }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { visibility } = body

  if (visibility && !['public', 'unlisted', 'private'].includes(visibility)) {
    return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 })
  }

  if (visibility) {
    const updated = await updateShareVisibility(debateId, visibility)

    if (!updated) {
      return NextResponse.json({ error: 'Share settings not found' }, { status: 404 })
    }

    return NextResponse.json({ settings: updated })
  }

  return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
}
