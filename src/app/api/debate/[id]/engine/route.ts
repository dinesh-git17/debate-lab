// src/app/api/debate/[id]/engine/route.ts

import { NextResponse } from 'next/server'

import { isValidDebateId } from '@/lib/id-generator'
import { logger } from '@/lib/logging'
import {
  canStartDebate,
  getCurrentTurnInfo,
  getDebateEngineState,
  runDebateLoop,
  startDebate,
} from '@/services/debate-engine'

import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/debate/[id]/engine
 * Get engine state and current turn info
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params

  if (!isValidDebateId(id)) {
    return NextResponse.json({ error: 'Invalid debate ID' }, { status: 400 })
  }

  const state = await getDebateEngineState(id)

  if (!state) {
    return NextResponse.json({ error: 'Engine not initialized' }, { status: 404 })
  }

  const turnInfo = await getCurrentTurnInfo(id)

  return NextResponse.json({
    status: state.status,
    currentTurnIndex: state.currentTurnIndex,
    totalTurns: state.totalTurns,
    currentTurn: turnInfo?.turn ?? null,
    progress: turnInfo?.progress ?? null,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    error: state.error,
  })
}

/**
 * POST /api/debate/[id]/engine
 * Start the debate engine
 */
export async function POST(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params

  logger.info('Engine start request', { debateId: id })

  if (!isValidDebateId(id)) {
    logger.warn('Invalid debate ID format', { debateId: id })
    return NextResponse.json({ error: 'Invalid debate ID' }, { status: 400 })
  }

  const { canStart, reason } = await canStartDebate(id)

  if (!canStart) {
    logger.warn('Cannot start debate', { debateId: id, reason })
    return NextResponse.json({ error: reason }, { status: 400 })
  }

  const result = await startDebate(id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Start the debate loop in the background (don't await)
  // This allows the endpoint to return immediately while turns execute
  runDebateLoop(id).catch((error) => {
    logger.error('Debate loop failed', error instanceof Error ? error : null, { debateId: id })
  })

  const turnInfo = await getCurrentTurnInfo(id)

  return NextResponse.json({
    success: true,
    currentTurn: turnInfo?.turn ?? null,
    progress: turnInfo?.progress ?? null,
  })
}
