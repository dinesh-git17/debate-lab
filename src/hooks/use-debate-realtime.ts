// src/hooks/use-debate-realtime.ts

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { clientLogger } from '@/lib/client-logger'
import {
  getConnectionState,
  isPusherClientConfigured,
  subscribeToDebate,
  type PusherConnectionState,
} from '@/lib/pusher-client'
import { useDebateViewStore } from '@/store/debate-view-store'

import type {
  DebateMessage,
  UseDebateStreamOptions,
  UseDebateStreamReturn,
} from '@/types/debate-ui'
import type { SSEEvent, SSEEventType } from '@/types/execution'
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

/**
 * Fetch missed events from Redis and apply them to the store.
 * Used for catch-up after reconnection or initial load.
 */
async function fetchAndApplyMissedEvents(
  debateId: string,
  lastEventId: string | null,
  applyEvent: (event: SSEEvent) => void
): Promise<string | null> {
  try {
    const url = lastEventId
      ? `/api/debate/${debateId}/events?since=${encodeURIComponent(lastEventId)}`
      : `/api/debate/${debateId}/events`

    const response = await fetch(url)
    if (!response.ok) {
      clientLogger.warn('Failed to fetch missed events', { status: response.status })
      return lastEventId
    }

    const data = (await response.json()) as { events: Array<{ id: string; event: SSEEvent }> }

    if (data.events && data.events.length > 0) {
      clientLogger.debug('Fetched events', { count: data.events.length, debateId })
      for (const { event } of data.events) {
        applyEvent(event)
      }
      // Return the last event ID for tracking
      const lastEvent = data.events[data.events.length - 1]
      return lastEvent?.id ?? lastEventId
    }

    return lastEventId
  } catch (error) {
    clientLogger.error('Error fetching missed events', error)
    return lastEventId
  }
}

export function useDebateRealtime(options: UseDebateStreamOptions): UseDebateStreamReturn {
  const { debateId, autoConnect = true, onDebateComplete, onError } = options

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const lastEventIdRef = useRef<string | null>(null)
  const debateIdRef = useRef(debateId)
  const onDebateCompleteRef = useRef(onDebateComplete)
  const onErrorRef = useRef(onError)

  const [isPusherAvailable] = useState(() => isPusherClientConfigured())

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

  // Apply a single event to the store
  const applyEvent = useCallback((event: SSEEvent) => {
    const data = event as SSEMessageData
    const store = useDebateViewStore.getState()

    switch (data.type) {
      case 'debate_started':
        store.setStatus('active')
        if (data.totalTurns) {
          store.setProgress({
            currentTurn: 0,
            totalTurns: data.totalTurns,
            percentComplete: 0,
          })
        }
        break

      case 'turn_started':
        if (data.turnId && data.speaker && data.turnType) {
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
          store.addMessage(message)
          store.setCurrentTurn(data.turnId)
        }
        break

      case 'turn_streaming':
        if (data.turnId && data.chunk) {
          store.appendToMessage(data.turnId, data.chunk)
        }
        break

      case 'turn_completed':
        if (data.turnId) {
          store.completeMessage(data.turnId, data.content ?? '', data.tokenCount ?? 0)
          store.setCurrentTurn(null)
        }
        break

      case 'turn_error': {
        const errorMsg = `Turn failed: ${data.error ?? 'Unknown error'}`
        store.setError(errorMsg)
        onErrorRef.current?.(errorMsg)
        break
      }

      case 'violation_detected':
        if (data.turnId && data.violation) {
          const message = store.messages.find((m) => m.id === data.turnId)
          if (message) {
            store.updateMessage(data.turnId, {
              violations: [...(message.violations ?? []), data.violation.ruleViolated],
            })
          }
        }
        break

      case 'intervention': {
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
        store.addMessage(interventionMessage)
        break
      }

      case 'progress_update':
        if (data.currentTurn !== undefined && data.totalTurns !== undefined) {
          store.setProgress({
            currentTurn: data.currentTurn,
            totalTurns: data.totalTurns,
            percentComplete: data.percentComplete ?? 0,
          })
        }
        break

      case 'budget_warning':
        clientLogger.warn('Budget warning received', data)
        break

      case 'debate_completed':
        store.setStatus('completed')
        store.setCurrentTurn(null)
        onDebateCompleteRef.current?.()
        break

      case 'debate_paused':
        store.setStatus('paused')
        break

      case 'debate_resumed':
        store.setStatus('active')
        break

      case 'debate_cancelled':
        store.setStatus('completed')
        store.setCurrentTurn(null)
        break

      case 'debate_error': {
        store.setStatus('error')
        const debateErrorMsg = data.error ?? 'An error occurred during the debate'
        store.setError(debateErrorMsg)
        onErrorRef.current?.(debateErrorMsg)
        break
      }

      case 'heartbeat':
        // Heartbeat - no action needed
        break
    }
  }, [])

  const connectImpl = useCallback(async () => {
    const currentDebateId = debateIdRef.current

    // Cleanup existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    clearReconnectTimeout()

    const store = useDebateViewStore.getState()
    store.setConnection('connecting')

    // First, fetch any missed events from Redis
    lastEventIdRef.current = await fetchAndApplyMissedEvents(
      currentDebateId,
      lastEventIdRef.current,
      applyEvent
    )

    // If Pusher is not configured, fall back to periodic polling
    if (!isPusherAvailable) {
      clientLogger.warn('Pusher not configured, using polling fallback')
      store.setConnection('connected')

      // Set up polling interval
      const pollInterval = setInterval(async () => {
        lastEventIdRef.current = await fetchAndApplyMissedEvents(
          debateIdRef.current,
          lastEventIdRef.current,
          applyEvent
        )
      }, 2000) // Poll every 2 seconds

      unsubscribeRef.current = () => {
        clearInterval(pollInterval)
      }

      return
    }

    // Subscribe to Pusher channel
    const handleConnectionChange = (state: PusherConnectionState) => {
      const currentStore = useDebateViewStore.getState()

      switch (state) {
        case 'connected':
          currentStore.setConnection('connected')
          reconnectAttempts.current = 0
          break

        case 'connecting':
          currentStore.setConnection('connecting')
          break

        case 'disconnected':
        case 'unavailable':
        case 'failed':
          currentStore.setConnection('error')

          // Attempt reconnection with exponential backoff
          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(
              BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
              MAX_RECONNECT_DELAY
            )
            currentStore.setConnection('reconnecting')

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++
              // Fetch missed events on reconnection
              fetchAndApplyMissedEvents(
                debateIdRef.current,
                lastEventIdRef.current,
                applyEvent
              ).then((newLastId) => {
                lastEventIdRef.current = newLastId
              })
            }, delay)
          } else {
            const errorMsg = 'Connection lost. Please refresh the page.'
            currentStore.setError(errorMsg)
            onErrorRef.current?.(errorMsg)
          }
          break
      }
    }

    const handleError = (error: Error) => {
      clientLogger.error('Pusher subscription error', error)
    }

    unsubscribeRef.current = subscribeToDebate(
      currentDebateId,
      applyEvent,
      handleConnectionChange,
      handleError
    )

    // Check current connection state
    const currentState = getConnectionState()
    if (currentState === 'connected') {
      store.setConnection('connected')
      reconnectAttempts.current = 0
    }
  }, [clearReconnectTimeout, applyEvent, isPusherAvailable])

  const disconnect = useCallback(() => {
    clearReconnectTimeout()

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    useDebateViewStore.getState().setConnection('disconnected')
  }, [clearReconnectTimeout])

  useEffect(() => {
    if (autoConnect && debateId) {
      connectImpl()
    }

    return () => {
      clearReconnectTimeout()
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
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
