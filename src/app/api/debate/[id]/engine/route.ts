// src/app/api/debate/[id]/engine/route.ts

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

// Use longer timeout for debate execution
export const maxDuration = 300 // 5 minutes (requires Vercel Pro)

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
 * Start the debate engine and stream events
 */
export async function POST(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  const { id } = await params

  const mockMode = isMockMode()
  logger.info('Engine start request', { debateId: id, mockMode })

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

  // Create a streaming response that runs the debate and streams events
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Subscribe to debate events and forward them to the stream
      const unsubscribe = debateEvents.subscribe(id, (event: SSEEvent) => {
        try {
          const message = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch {
          // Stream may be closed
        }
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
        // Run the debate loop - use mock or real based on DEBATE_MODE
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
