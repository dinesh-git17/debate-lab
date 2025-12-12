// src/components/debate/connection-status.tsx
/**
 * Real-time connection status indicator with animated state transitions.
 * Visual states reflect Pusher connection lifecycle (connecting, connected, reconnecting, error).
 */

'use client'

import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import type { ViewConnectionStatus } from '@/types/debate-ui'

interface ConnectionStatusProps {
  className?: string
}

interface ConnectionConfig {
  dot: string
  text: string
  pulse: 'none' | 'ping' | 'breathe'
}

const CONNECTION_CONFIGS: Record<ViewConnectionStatus, ConnectionConfig> = {
  disconnected: {
    dot: 'bg-muted-foreground/50',
    text: 'Offline',
    pulse: 'none',
  },
  connecting: {
    dot: 'bg-amber-400',
    text: 'Connecting',
    pulse: 'ping',
  },
  connected: {
    dot: 'bg-emerald-400',
    text: 'Live',
    pulse: 'breathe',
  },
  reconnecting: {
    dot: 'bg-amber-400',
    text: 'Reconnecting',
    pulse: 'ping',
  },
  error: {
    dot: 'bg-red-400',
    text: 'Error',
    pulse: 'none',
  },
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const connection = useDebateViewStore((s) => s.connection)
  const config = CONNECTION_CONFIGS[connection]

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${config.text}`}
    >
      <span className="relative flex h-[6px] w-[6px]">
        {config.pulse === 'ping' && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
              config.dot
            )}
          />
        )}
        {config.pulse === 'breathe' && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-breathe-glow rounded-full',
              config.dot
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex h-[6px] w-[6px] rounded-full',
            config.dot,
            config.pulse === 'breathe' && 'animate-breathe'
          )}
        />
      </span>
      <span className="text-[13px] leading-none text-muted-foreground/60">{config.text}</span>
    </div>
  )
}
