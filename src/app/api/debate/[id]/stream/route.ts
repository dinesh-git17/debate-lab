// src/app/api/debate/[id]/stream/route.ts

import { debateEvents, formatSSEComment, formatSSEMessage } from '@/lib/debate-events'
import { isValidDebateId } from '@/lib/id-generator'
import {
  generateRequestId,
  createDebateLogger,
  incrementConnections,
  decrementConnections,
} from '@/lib/logging'
import { getDebateSession } from '@/services/debate-service'

import type { SSEEvent } from '@/types/execution'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

const HEARTBEAT_INTERVAL = 30000

/**
 * GET /api/debate/[id]/stream
 * Server-Sent Events stream for real-time debate updates
 *
 * @deprecated This SSE endpoint is kept for local development fallback only.
 * In production, use Pusher for real-time events via the useDebateRealtime hook.
 * Events are persisted to Redis Streams and can be fetched via /api/debate/[id]/events
 * for catch-up after reconnection.
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const { id: debateId } = await params
  const connectionId = generateRequestId()
  const log = createDebateLogger(debateId)

  if (!isValidDebateId(debateId)) {
    return new Response(JSON.stringify({ error: 'Invalid debate ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = await getDebateSession(debateId)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Debate not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Track SSE connection
  incrementConnections()
  log.info('SSE connection opened', { connectionId })
  const connectionStartTime = Date.now()

  const encoder = new TextEncoder()
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null
  let unsubscribe: (() => void) | null = null
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: SSEEvent) => {
        if (isClosed) return
        try {
          controller.enqueue(encoder.encode(formatSSEMessage(event)))
        } catch {
          cleanup()
        }
      }

      const sendHeartbeat = () => {
        if (isClosed) return
        try {
          controller.enqueue(encoder.encode(formatSSEComment('heartbeat')))

          const heartbeatEvent: SSEEvent = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            debateId,
            serverTime: new Date().toISOString(),
          }
          controller.enqueue(encoder.encode(formatSSEMessage(heartbeatEvent)))
        } catch {
          cleanup()
        }
      }

      const cleanup = () => {
        if (isClosed) return
        isClosed = true

        // Track connection close
        decrementConnections()
        const connectionDuration = Date.now() - connectionStartTime
        log.info('SSE connection closed', { connectionId, durationMs: connectionDuration })

        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
          heartbeatInterval = null
        }

        if (unsubscribe) {
          unsubscribe()
          unsubscribe = null
        }

        try {
          controller.close()
        } catch {
          // Already closed
        }
      }

      unsubscribe = debateEvents.subscribe(debateId, sendEvent)

      heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)

      const initialComment = `Connected to debate ${debateId}`
      controller.enqueue(encoder.encode(formatSSEComment(initialComment)))

      const recentEvents = debateEvents.getRecentEvents(debateId)
      for (const event of recentEvents) {
        sendEvent(event)
      }

      request.signal.addEventListener('abort', cleanup)
    },

    cancel() {
      if (isClosed) return
      isClosed = true

      // Track connection close on cancel
      decrementConnections()
      const connectionDuration = Date.now() - connectionStartTime
      log.info('SSE connection cancelled', { connectionId, durationMs: connectionDuration })

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }

      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
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
