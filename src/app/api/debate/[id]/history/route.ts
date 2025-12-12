// route.ts
/**
 * Debate history endpoint.
 * Returns chronological message history with metadata for UI rendering.
 */

import { NextResponse } from 'next/server'

import { getEngineState } from '@/lib/engine-store'
import { isValidDebateId } from '@/lib/id-generator'
import { getSession } from '@/lib/session-store'

import type { TurnSpeaker, TurnType } from '@/types/turn'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export interface DebateHistoryMessage {
  id: string
  speaker: TurnSpeaker
  speakerLabel: string
  turnType: TurnType
  content: string
  tokenCount: number
  timestamp: string
  isComplete: boolean
}

export interface DebateHistoryResponse {
  debateId: string
  topic: string
  format: string
  status: string
  totalTurns: number
  currentTurnIndex: number
  messages: DebateHistoryMessage[]
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params

  if (!isValidDebateId(id)) {
    return NextResponse.json({ error: 'Invalid debate ID format' }, { status: 400 })
  }

  const session = await getSession(id)
  if (!session) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
  }

  const engineState = await getEngineState(id)

  const messages: DebateHistoryMessage[] = (engineState?.completedTurns ?? []).map((turn) => ({
    id: turn.id,
    speaker: turn.speaker,
    speakerLabel: turn.config.label,
    turnType: turn.config.type,
    content: turn.content,
    tokenCount: turn.tokenCount,
    timestamp: turn.completedAt.toISOString(),
    isComplete: true,
  }))

  const response: DebateHistoryResponse = {
    debateId: id,
    topic: session.topic,
    format: session.format,
    status: session.status,
    totalTurns: session.turns,
    currentTurnIndex: engineState?.currentTurnIndex ?? 0,
    messages,
  }

  return NextResponse.json(response)
}
