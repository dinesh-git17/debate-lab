// src/lib/pusher-client.ts

'use client'

import Pusher from 'pusher-js'

import type { SSEEvent, SSEEventType } from '@/types/execution'

// Singleton Pusher client instance
let pusherClient: Pusher | null = null

/**
 * Check if Pusher client is configured with required environment variables.
 */
export function isPusherClientConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER)
}

/**
 * Get or create the Pusher client instance.
 * Returns null if Pusher is not configured.
 */
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

/**
 * Disconnect and cleanup the Pusher client.
 */
export function disconnectPusher(): void {
  if (pusherClient) {
    pusherClient.disconnect()
    pusherClient = null
  }
}

/**
 * Get the channel name for a debate.
 */
export function getDebateChannelName(debateId: string): string {
  return `debate-${debateId}`
}

/**
 * Connection state for Pusher client
 */
export type PusherConnectionState =
  | 'initialized'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'failed'
  | 'disconnected'

/**
 * Event handler type for debate events
 * Events now include seq numbers from the server for ordering
 */
export type DebateEventHandler = (event: SSEEvent) => void

/**
 * Subscribe to a debate channel.
 * Returns an unsubscribe function.
 */
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

  // All event types we want to listen for
  const eventTypes: SSEEventType[] = [
    'debate_started',
    'turn_started',
    'turn_streaming',
    'turn_completed',
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

  // Bind to all event types
  // Events now include seq numbers from the server for ordering/deduplication
  for (const eventType of eventTypes) {
    channel.bind(eventType, (data: SSEEvent) => {
      onEvent(data)
    })
  }

  // Handle subscription errors
  channel.bind('pusher:subscription_error', (error: unknown) => {
    if (onError) {
      onError(
        error instanceof Error ? error : new Error(`Subscription error: ${JSON.stringify(error)}`)
      )
    }
  })

  // Handle connection state changes
  if (onConnectionChange) {
    const handleStateChange = (states: { current: string; previous: string }) => {
      onConnectionChange(states.current as PusherConnectionState)
    }

    client.connection.bind('state_change', handleStateChange)

    // Return enhanced cleanup
    return () => {
      client.connection.unbind('state_change', handleStateChange)
      channel.unbind_all()
      client.unsubscribe(channelName)
    }
  }

  // Return cleanup function
  return () => {
    channel.unbind_all()
    client.unsubscribe(channelName)
  }
}

/**
 * Get current Pusher connection state.
 */
export function getConnectionState(): PusherConnectionState {
  const client = getPusherClient()

  if (!client) {
    return 'disconnected'
  }

  return client.connection.state as PusherConnectionState
}

/**
 * Bind to Pusher connection state changes.
 * Returns an unbind function.
 */
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

/**
 * Force reconnect the Pusher client.
 */
export function reconnectPusher(): void {
  const client = getPusherClient()

  if (client) {
    client.disconnect()
    client.connect()
  }
}
