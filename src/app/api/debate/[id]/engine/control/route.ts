// route.ts
/**
 * Debate engine control endpoint.
 * Handles pause, resume, and early termination of running debates.
 */

import { NextResponse } from 'next/server'

import { isValidDebateId } from '@/lib/id-generator'
import {
  endDebateEarly,
  getDebateEngineState,
  pauseDebate,
  resumeDebate,
} from '@/services/debate-engine'

import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

type ControlAction = 'pause' | 'resume' | 'end'

interface ControlRequestBody {
  action: ControlAction
  reason?: string
}

const VALID_ACTIONS: ControlAction[] = ['pause', 'resume', 'end']

function isValidAction(action: unknown): action is ControlAction {
  return typeof action === 'string' && VALID_ACTIONS.includes(action as ControlAction)
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params

  if (!isValidDebateId(id)) {
    return NextResponse.json({ error: 'Invalid debate ID' }, { status: 400 })
  }

  const state = await getDebateEngineState(id)

  if (!state) {
    return NextResponse.json({ error: 'Engine not found' }, { status: 404 })
  }

  let body: ControlRequestBody

  try {
    body = (await request.json()) as ControlRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action, reason } = body

  if (!isValidAction(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 }
    )
  }

  let success = false
  let errorMessage: string | undefined

  switch (action) {
    case 'pause':
      if (state.status !== 'in_progress') {
        return NextResponse.json(
          { error: `Cannot pause debate in status: ${state.status}` },
          { status: 400 }
        )
      }
      success = await pauseDebate(id)
      break

    case 'resume':
      if (state.status !== 'paused') {
        return NextResponse.json(
          { error: `Cannot resume debate in status: ${state.status}` },
          { status: 400 }
        )
      }
      success = await resumeDebate(id)
      break

    case 'end':
      if (state.status === 'completed' || state.status === 'cancelled') {
        return NextResponse.json({ error: 'Debate already ended' }, { status: 400 })
      }
      success = await endDebateEarly(id, reason ?? 'Ended by user')
      break

    default: {
      const _exhaustiveCheck: never = action
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  }

  if (!success) {
    return NextResponse.json({ error: errorMessage ?? 'Action failed' }, { status: 500 })
  }

  const updatedState = await getDebateEngineState(id)

  return NextResponse.json({
    success: true,
    status: updatedState?.status,
  })
}
