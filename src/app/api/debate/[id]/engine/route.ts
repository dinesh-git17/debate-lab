// route.ts
/**
 * Debate engine orchestration endpoint.
 * Manages debate execution lifecycle with SSE streaming for real-time turn updates.
 */

import { NextResponse } from 'next/server'

import { debateEvents } from '@/lib/debate-events'
import { isValidDebateId } from '@/lib/id-generator'
import { logger } from '@/lib/logging'
import {
  canStartDebate,
  getCurrentTurnInfo,
  getDebateEngineState,
  runDebateLoop,
  startDebate,
} from '@/services/debate-engine'
import { isMockMode, runMockDebateLoop } from '@/services/mock-debate-engine'

import type { SSEEvent } from '@/types/execution'
import type { NextRequest } from 'next/server'

export const maxDuration = 300

interface RouteParams {
  params: Promise<{ id: string }>
}

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

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  const { id } = await params

  const mockMode = isMockMode()
  logger.info('Engine start request', { debateId: id, mockMode })

  if (!isValidDebateId(id)) {
    logger.warn('Invalid debate ID format', { debateId: id })
    return NextResponse.json({ error: 'Invalid debate ID' }, { status: 400 })
  }

  // Check if this is a resume (engine status is in_progress after control/resume)
  const existingState = await getDebateEngineState(id)
  const isResume = existingState?.status === 'in_progress'

  if (!isResume) {
    // Normal start flow
    const { canStart, reason } = await canStartDebate(id)

    if (!canStart) {
      logger.warn('Cannot start debate', { debateId: id, reason })
      return NextResponse.json({ error: reason }, { status: 400 })
    }

    const result = await startDebate(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } else {
    logger.info('Resuming debate loop', { debateId: id })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const unsubscribe = debateEvents.subscribe(id, (event: SSEEvent) => {
        try {
          const message = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch {}
      })

      // Send initial success message
      const initEvent = {
        type: 'engine_started',
        timestamp: new Date().toISOString(),
        debateId: id,
        success: true,
      }
      controller.enqueue(
        encoder.encode(`event: engine_started\ndata: ${JSON.stringify(initEvent)}\n\n`)
      )

      try {
        const loopResult = isMockMode() ? await runMockDebateLoop(id) : await runDebateLoop(id)

        if (!loopResult.success) {
          const errorEvent = {
            type: 'debate_error',
            timestamp: new Date().toISOString(),
            debateId: id,
            error: loopResult.error,
          }
          controller.enqueue(
            encoder.encode(`event: debate_error\ndata: ${JSON.stringify(errorEvent)}\n\n`)
          )
        }
      } catch (error) {
        logger.error('Debate loop failed', error instanceof Error ? error : null, { debateId: id })
        const errorEvent = {
          type: 'debate_error',
          timestamp: new Date().toISOString(),
          debateId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
        controller.enqueue(
          encoder.encode(`event: debate_error\ndata: ${JSON.stringify(errorEvent)}\n\n`)
        )
      } finally {
        unsubscribe()
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
