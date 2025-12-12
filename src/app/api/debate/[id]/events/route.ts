// route.ts
/**
 * Debate events streaming endpoint.
 * Provides sequence-based event fetching from Redis Streams for client synchronization.
 */

import { NextResponse } from 'next/server'

import { getCurrentSeq } from '@/lib/event-sequencer'
import {
  getAllEvents,
  getEventsSince,
  getEventsAfterTimestamp,
  getEventsAfterSeq,
} from '@/lib/event-store'
import { isValidDebateId } from '@/lib/id-generator'
import { logger } from '@/lib/logging'
import { getSession } from '@/lib/session-store'

import type { SSEEvent } from '@/types/execution'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export interface StoredEventResponse {
  id: string
  event: SSEEvent
}

export interface EventsResponse {
  debateId: string
  events: StoredEventResponse[]
  lastEventId: string | null
  currentSeq: number
  hasMore: boolean
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id: debateId } = await params

  if (!isValidDebateId(debateId)) {
    return NextResponse.json({ error: 'Invalid debate ID format' }, { status: 400 })
  }

  const session = await getSession(debateId)
  if (!session) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const afterSeq = searchParams.get('after')
  const sinceId = searchParams.get('since')
  const afterTimestamp = searchParams.get('afterTime')
  const limitParam = searchParams.get('limit')
  const limit = Math.min(parseInt(limitParam ?? '100', 10), 500)

  try {
    let storedEvents: StoredEventResponse[]
    let hasMore = false

    logger.debug('Fetching events', { debateId, afterSeq, sinceId, afterTimestamp, limit })

    if (afterSeq !== null && !isNaN(parseInt(afterSeq, 10))) {
      const afterSeqNum = parseInt(afterSeq, 10)
      const events = await getEventsAfterSeq(debateId, afterSeqNum, limit)
      storedEvents = events.map((e) => ({ id: e.id, event: e.event }))
      hasMore = events.length === limit
      logger.debug('Fetched events after seq', {
        debateId,
        afterSeq: afterSeqNum,
        count: storedEvents.length,
        hasMore,
      })
    } else if (sinceId) {
      const events = await getEventsSince(debateId, sinceId)
      storedEvents = events.map((e) => ({ id: e.id, event: e.event }))
      logger.debug('Fetched events since ID', { debateId, sinceId, count: storedEvents.length })
    } else if (afterTimestamp) {
      const events = await getEventsAfterTimestamp(debateId, afterTimestamp)
      storedEvents = events.map((e) => ({ id: e.id, event: e.event }))
      logger.debug('Fetched events after timestamp', {
        debateId,
        afterTimestamp,
        count: storedEvents.length,
      })
    } else {
      // Fetch all events
      const events = await getAllEvents(debateId)
      storedEvents = events.map((e) => ({ id: e.id, event: e.event }))
      logger.debug('Fetched all events', { debateId, count: storedEvents.length })
    }

    const currentSeq = await getCurrentSeq(debateId)

    const lastEvent = storedEvents.length > 0 ? storedEvents[storedEvents.length - 1] : null
    const response: EventsResponse = {
      debateId,
      events: storedEvents,
      lastEventId: lastEvent?.id ?? null,
      currentSeq,
      hasMore,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Failed to fetch events', error instanceof Error ? error : null, { debateId })
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
