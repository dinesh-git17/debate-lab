// route.ts
/**
 * Debate reveal endpoint.
 * Returns model assignments after debate completion.
 */

import { NextResponse } from 'next/server'

import { isValidDebateId } from '@/lib/id-generator'
import { revealAssignment } from '@/services/debate-service'

import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params

  if (!isValidDebateId(id)) {
    return NextResponse.json({ error: 'Invalid debate ID format' }, { status: 400 })
  }

  const assignment = await revealAssignment(id)

  if (!assignment) {
    return NextResponse.json(
      { error: 'Assignment not available. Debate may not be completed.' },
      { status: 403 }
    )
  }

  return NextResponse.json({ assignment })
}
