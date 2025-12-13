// use-debate-stream.ts
/**
 * Server-Sent Events (SSE) client for debate streaming.
 * Handles connection lifecycle, reconnection with backoff, and store updates.
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'

import { clientLogger } from '@/lib/client-logger'
import { useDebateViewStore } from '@/store/debate-view-store'

import type {
  DebateMessage,
  UseDebateStreamOptions,
  UseDebateStreamReturn,
} from '@/types/debate-ui'
import type { SSEEventType } from '@/types/execution'
import type { TurnSpeaker, TurnType } from '@/types/turn'

interface SSEMessageData {
  type: SSEEventType
  timestamp: string
  debateId: string
  turnId?: string
  turnNumber?: number
  speaker?: TurnSpeaker
  speakerLabel?: string
  turnType?: TurnType
  chunk?: string
  content?: string
  tokenCount?: number
  error?: string
  violation?: {
    ruleViolated: string
    severity: 'warning' | 'error'
    description: string
  }
  currentTurn?: number
  totalTurns?: number
  percentComplete?: number
  reason?: string
  [key: string]: unknown
}

const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000

export function useDebateStream(options: UseDebateStreamOptions): UseDebateStreamReturn {
  const { debateId, autoConnect = true, onDebateComplete, onError } = options

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const debateIdRef = useRef(debateId)
  const onDebateCompleteRef = useRef(onDebateComplete)
  const onErrorRef = useRef(onError)

  const connection = useDebateViewStore((s) => s.connection)

  useEffect(() => {
    debateIdRef.current = debateId
  }, [debateId])

  useEffect(() => {
    onDebateCompleteRef.current = onDebateComplete
  }, [onDebateComplete])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const connectImpl = useCallback(() => {
    const currentDebateId = debateIdRef.current

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    clearReconnectTimeout()

    const store = useDebateViewStore.getState()
    store.setConnection('connecting')

    const eventSource = new EventSource(`/api/debate/${currentDebateId}/stream`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      useDebateViewStore.getState().setConnection('connected')
      reconnectAttempts.current = 0
    }

    eventSource.onerror = () => {
      const currentStore = useDebateViewStore.getState()
      currentStore.setConnection('error')
      eventSource.close()
      eventSourceRef.current = null

      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
          MAX_RECONNECT_DELAY
        )
        currentStore.setConnection('reconnecting')

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++
          connectImpl()
        }, delay)
      } else {
        const errorMsg = 'Connection lost. Please refresh the page.'
        currentStore.setError(errorMsg)
        onErrorRef.current?.(errorMsg)
      }
    }

    eventSource.addEventListener('debate_started', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        const s = useDebateViewStore.getState()
        s.setStatus('active')
        if (data.totalTurns) {
          s.setProgress({
            currentTurn: 0,
            totalTurns: data.totalTurns,
            percentComplete: 0,
          })
        }
      } catch (err) {
        clientLogger.error('SSE: Failed to parse debate_started event', err)
      }
    })

    eventSource.addEventListener('turn_started', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        if (!data.turnId || !data.speaker || !data.turnType) return

        const message: DebateMessage = {
          id: data.turnId,
          speaker: data.speaker,
          speakerLabel: data.speakerLabel ?? data.speaker.toUpperCase(),
          turnType: data.turnType,
          content: '',
          isStreaming: true,
          isComplete: false,
          timestamp: new Date(data.timestamp),
        }

        const s = useDebateViewStore.getState()
        s.addMessage(message)
        s.setCurrentTurn(data.turnId)
      } catch (err) {
        clientLogger.error('SSE: Failed to parse turn_started event', err)
      }
    })

    eventSource.addEventListener('turn_streaming', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        if (!data.turnId || !data.chunk) return
        useDebateViewStore.getState().appendToMessage(data.turnId, data.chunk)
      } catch (err) {
        clientLogger.error('SSE: Failed to parse turn_streaming event', err)
      }
    })

    eventSource.addEventListener('turn_completed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        if (!data.turnId) return
        const s = useDebateViewStore.getState()
        s.completeMessage(data.turnId, data.content ?? '', data.tokenCount ?? 0)
        s.setCurrentTurn(null)
      } catch (err) {
        clientLogger.error('SSE: Failed to parse turn_completed event', err)
      }
    })

    eventSource.addEventListener('turn_interrupted', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        if (!data.turnId) return
        const s = useDebateViewStore.getState()
        // Stop streaming animation with partial content
        s.interruptMessage(data.turnId, (data as { partialContent?: string }).partialContent ?? '')
        s.setCurrentTurn(null)
        clientLogger.info('Turn interrupted', { turnId: data.turnId, reason: data.reason })
      } catch (err) {
        clientLogger.error('SSE: Failed to parse turn_interrupted event', err)
      }
    })

    eventSource.addEventListener('turn_resumed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        if (!data.turnId) return
        const s = useDebateViewStore.getState()
        // Resume streaming for a previously interrupted turn
        s.updateMessage(data.turnId, { isStreaming: true })
        s.setCurrentTurn(data.turnId)
        clientLogger.info('Turn resumed', { turnId: data.turnId })
      } catch (err) {
        clientLogger.error('SSE: Failed to parse turn_resumed event', err)
      }
    })

    eventSource.addEventListener('turn_error', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        const errorMsg = `Turn failed: ${data.error ?? 'Unknown error'}`
        useDebateViewStore.getState().setError(errorMsg)
        onErrorRef.current?.(errorMsg)
      } catch (err) {
        clientLogger.error('SSE: Failed to parse turn_error event', err)
      }
    })

    eventSource.addEventListener('violation_detected', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        if (!data.turnId || !data.violation) return

        const s = useDebateViewStore.getState()
        const message = s.messages.find((m) => m.id === data.turnId)

        if (message) {
          s.updateMessage(data.turnId, {
            violations: [...(message.violations ?? []), data.violation.ruleViolated],
          })
        }
      } catch (err) {
        clientLogger.error('SSE: Failed to parse violation_detected event', err)
      }
    })

    eventSource.addEventListener('intervention', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        const interventionMessage: DebateMessage = {
          id: `intervention_${Date.now()}`,
          speaker: 'moderator',
          speakerLabel: 'Moderator Intervention',
          turnType: 'moderator_intervention',
          content: data.content ?? '',
          isStreaming: false,
          isComplete: true,
          timestamp: new Date(data.timestamp),
        }
        useDebateViewStore.getState().addMessage(interventionMessage)
      } catch (err) {
        clientLogger.error('SSE: Failed to parse intervention event', err)
      }
    })

    eventSource.addEventListener('progress_update', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        if (data.currentTurn !== undefined && data.totalTurns !== undefined) {
          useDebateViewStore.getState().setProgress({
            currentTurn: data.currentTurn,
            totalTurns: data.totalTurns,
            percentComplete: data.percentComplete ?? 0,
          })
        }
      } catch (err) {
        clientLogger.error('SSE: Failed to parse progress_update event', err)
      }
    })

    eventSource.addEventListener('budget_warning', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        clientLogger.warn('Budget warning received', data)
      } catch (err) {
        clientLogger.error('SSE: Failed to parse budget_warning event', err)
      }
    })

    eventSource.addEventListener('debate_completed', () => {
      const s = useDebateViewStore.getState()
      s.setStatus('completed')
      s.setCurrentTurn(null)
      onDebateCompleteRef.current?.()
    })

    eventSource.addEventListener('debate_cancelled', () => {
      const s = useDebateViewStore.getState()
      s.setStatus('completed')
      s.setCurrentTurn(null)
    })

    eventSource.addEventListener('debate_error', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEMessageData
        const s = useDebateViewStore.getState()
        s.setStatus('error')
        const errorMsg = data.error ?? 'An error occurred during the debate'
        s.setError(errorMsg)
        onErrorRef.current?.(errorMsg)
      } catch (err) {
        clientLogger.error('SSE: Failed to parse debate_error event', err)
      }
    })
  }, [clearReconnectTimeout])

  const disconnect = useCallback(() => {
    clearReconnectTimeout()

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    useDebateViewStore.getState().setConnection('disconnected')
  }, [clearReconnectTimeout])

  useEffect(() => {
    if (autoConnect && debateId) {
      connectImpl()
    }

    return () => {
      clearReconnectTimeout()
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debateId, autoConnect])

  return {
    connect: connectImpl,
    disconnect,
    isConnected: connection === 'connected',
  }
}
