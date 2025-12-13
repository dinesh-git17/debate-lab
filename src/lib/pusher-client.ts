// pusher-client.ts
/**
 * Client-side Pusher integration for real-time debate updates.
 * Manages WebSocket connections and channel subscriptions.
 */

'use client'

import Pusher from 'pusher-js'

import type { SSEEvent, SSEEventType } from '@/types/execution'

let pusherClient: Pusher | null = null

export function isPusherClientConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER)
}

export function getPusherClient(): Pusher | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (pusherClient) {
    return pusherClient
  }

  if (!isPusherClientConfigured()) {
    return null
  }

  pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
  })

  return pusherClient
}

export function disconnectPusher(): void {
  if (pusherClient) {
    pusherClient.disconnect()
    pusherClient = null
  }
}

export function getDebateChannelName(debateId: string): string {
  return `debate-${debateId}`
}

export type PusherConnectionState =
  | 'initialized'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'failed'
  | 'disconnected'

export type DebateEventHandler = (event: SSEEvent) => void

export function subscribeToDebate(
  debateId: string,
  onEvent: DebateEventHandler,
  onConnectionChange?: (state: PusherConnectionState) => void,
  onError?: (error: Error) => void
): () => void {
  const client = getPusherClient()

  if (!client) {
    if (onError) {
      onError(new Error('Pusher client not configured'))
    }
    return () => {}
  }

  const channelName = getDebateChannelName(debateId)
  const channel = client.subscribe(channelName)

  const eventTypes: SSEEventType[] = [
    'debate_started',
    'turn_started',
    'turn_streaming',
    'turn_completed',
    'turn_interrupted',
    'turn_resumed',
    'turn_error',
    'violation_detected',
    'intervention',
    'progress_update',
    'budget_warning',
    'budget_exceeded',
    'debate_paused',
    'debate_resumed',
    'debate_completed',
    'debate_cancelled',
    'debate_error',
    'heartbeat',
  ]

  for (const eventType of eventTypes) {
    channel.bind(eventType, (data: SSEEvent) => {
      onEvent(data)
    })
  }

  channel.bind('pusher:subscription_error', (error: unknown) => {
    if (onError) {
      onError(
        error instanceof Error ? error : new Error(`Subscription error: ${JSON.stringify(error)}`)
      )
    }
  })

  if (onConnectionChange) {
    const handleStateChange = (states: { current: string; previous: string }) => {
      onConnectionChange(states.current as PusherConnectionState)
    }

    client.connection.bind('state_change', handleStateChange)

    return () => {
      client.connection.unbind('state_change', handleStateChange)
      channel.unbind_all()
      client.unsubscribe(channelName)
    }
  }

  return () => {
    channel.unbind_all()
    client.unsubscribe(channelName)
  }
}

export function getConnectionState(): PusherConnectionState {
  const client = getPusherClient()

  if (!client) {
    return 'disconnected'
  }

  return client.connection.state as PusherConnectionState
}

export function bindConnectionState(callback: (state: PusherConnectionState) => void): () => void {
  const client = getPusherClient()

  if (!client) {
    return () => {}
  }

  const handleStateChange = (states: { current: string; previous: string }) => {
    callback(states.current as PusherConnectionState)
  }

  client.connection.bind('state_change', handleStateChange)

  return () => {
    client.connection.unbind('state_change', handleStateChange)
  }
}

export function reconnectPusher(): void {
  const client = getPusherClient()

  if (client) {
    client.disconnect()
    client.connect()
  }
}
