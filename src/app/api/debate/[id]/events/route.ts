// src/app/api/debate/[id]/events/route.ts

import { NextResponse } from 'next/server'

import { getAllEvents, getEventsSince, getEventsAfterTimestamp } from '@/lib/event-store'
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
}

/**
 * GET /api/debate/[id]/events
 *
 * Fetch events from Redis Stream for a debate.
 *
 * Query params:
 * - since: Event ID to fetch events after (exclusive)
 * - after: ISO timestamp to fetch events after
 *
 * If no query params provided, returns all events.
 */
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
  const sinceId = searchParams.get('since')
  const afterTimestamp = searchParams.get('after')

  try {
    let storedEvents: StoredEventResponse[]

    logger.debug('Fetching events', { debateId, sinceId, afterTimestamp })

    if (sinceId) {
      // Fetch events since a specific event ID
      const events = await getEventsSince(debateId, sinceId)
      storedEvents = events.map((e) => ({ id: e.id, event: e.event }))
      logger.debug('Fetched events since ID', { debateId, sinceId, count: storedEvents.length })
    } else if (afterTimestamp) {
      // Fetch events after a specific timestamp
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

    const lastEvent = storedEvents.length > 0 ? storedEvents[storedEvents.length - 1] : null
    const response: EventsResponse = {
      debateId,
      events: storedEvents,
      lastEventId: lastEvent?.id ?? null,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Failed to fetch events', error instanceof Error ? error : null, { debateId })
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
