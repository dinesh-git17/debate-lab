// src/app/(fullscreen)/debate/[id]/client.tsx

'use client'

import { useEffect, useRef, useCallback } from 'react'

import { DebateHeader } from '@/components/debate/debate-header'
import { FloatingControls } from '@/components/debate/floating-controls'
import { MessageList } from '@/components/debate/message-list'
import { ShortcutsHelp } from '@/components/debate/shortcuts-help'
import { useDebateStream } from '@/hooks/use-debate-stream'
// import { clientLogger } from '@/lib/client-logger' // TODO: Re-enable with auto-start
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import type { DebateHistoryResponse } from '@/app/api/debate/[id]/history/route'
import type { DebatePhase } from '@/types/debate'
import type { DebateMessage, DebateViewStatus } from '@/types/debate-ui'

interface DebatePageClientProps {
  debateId: string
  initialTopic: string
  initialFormat: string
  initialStatus: DebatePhase
}

function mapPhaseToViewStatus(phase: DebatePhase): DebateViewStatus {
  switch (phase) {
    case 'idle':
    case 'configuring':
    case 'validating':
    case 'ready':
      return 'ready'
    case 'active':
      return 'active'
    case 'paused':
      return 'paused'
    case 'completed':
      return 'completed'
    case 'error':
      return 'error'
    default:
      return 'ready'
  }
}

export function DebatePageClient({
  debateId,
  initialTopic,
  initialFormat,
  initialStatus,
}: DebatePageClientProps) {
  const { setDebateInfo, setStatus, setProgress, hydrateMessages, reset } = useDebateViewStore()
  const hasAutoStarted = useRef(false)
  const hasHydrated = useRef(false)
  const previousDebateId = useRef<string | null>(null)

  // TODO: Re-enable auto-start after empty state review
  // const autoStartDebate = useCallback(async () => {
  //   if (hasAutoStarted.current) return
  //   hasAutoStarted.current = true
  //
  //   try {
  //     const response = await fetch(`/api/debate/${debateId}/engine`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //     })
  //
  //     if (!response.ok) {
  //       const data = (await response.json()) as { error?: string }
  //       clientLogger.error('Auto-start failed', null, { error: data.error ?? 'Unknown error' })
  //     }
  //   } catch (error) {
  //     clientLogger.error('Auto-start error', error)
  //   }
  // }, [debateId])

  // Fetch and hydrate existing debate history from server
  const hydrateFromServer = useCallback(async () => {
    if (hasHydrated.current) return
    hasHydrated.current = true

    try {
      const response = await fetch(`/api/debate/${debateId}/history`)
      if (!response.ok) return

      const data = (await response.json()) as DebateHistoryResponse

      if (data.messages && data.messages.length > 0) {
        // Convert server messages to client format
        const messages: DebateMessage[] = data.messages.map((msg) => ({
          id: msg.id,
          speaker: msg.speaker,
          speakerLabel: msg.speakerLabel,
          turnType: msg.turnType,
          content: msg.content,
          tokenCount: msg.tokenCount,
          timestamp: new Date(msg.timestamp),
          isStreaming: false,
          isComplete: true,
        }))

        hydrateMessages(messages)

        // Update progress based on loaded history
        setProgress({
          currentTurn: data.currentTurnIndex,
          totalTurns: data.totalTurns,
          percentComplete: Math.round((data.currentTurnIndex / data.totalTurns) * 100),
        })
      }
    } catch {
      // Failed to hydrate from server - continue without history
    }
  }, [debateId, hydrateMessages, setProgress])

  useEffect(() => {
    // Reset store only when switching to a DIFFERENT debate
    if (previousDebateId.current && previousDebateId.current !== debateId) {
      reset()
      hasAutoStarted.current = false
      hasHydrated.current = false
    }
    previousDebateId.current = debateId

    setDebateInfo({
      debateId,
      topic: initialTopic,
      format: initialFormat,
    })
    setStatus(mapPhaseToViewStatus(initialStatus))

    // Hydrate existing messages from server (for page reload or navigation back)
    hydrateFromServer()

    // Auto-start debate if status is ready
    // TODO: Re-enable auto-start after empty state review
    // if (initialStatus === 'ready') {
    //   autoStartDebate()
    // }

    // No cleanup reset - we want to preserve messages when navigating away
    // Messages are only cleared when switching to a different debate
  }, [
    debateId,
    initialTopic,
    initialFormat,
    initialStatus,
    setDebateInfo,
    setStatus,
    reset,
    // autoStartDebate, // TODO: Re-enable
    hydrateFromServer,
  ])

  useDebateStream({
    debateId,
    autoConnect: true,
  })

  return (
    <div
      className={cn(
        // Fullscreen fixed container - no navbar to account for
        'fixed inset-0 z-50 flex flex-col overflow-hidden',
        // Slightly off-black background for depth
        'bg-[#0a0a0b]'
      )}
    >
      {/* Film grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle vignette effect */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      <DebateHeader debateId={debateId} className="relative z-10" />

      <main className="relative z-10 min-h-0 flex-1">
        <MessageList autoScroll className="h-full" />

        {/* Shortcuts help - bottom right */}
        <div className="absolute bottom-4 right-4 z-10">
          <ShortcutsHelp />
        </div>
      </main>

      {/* Floating controls */}
      <div className="relative z-10">
        <FloatingControls debateId={debateId} />
      </div>

      <div className="safe-area-inset-bottom" />
    </div>
  )
}
