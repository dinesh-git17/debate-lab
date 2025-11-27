// src/app/(debate)/debate/[id]/client.tsx

'use client'

import { useEffect, useRef, useCallback } from 'react'

import { DebateHeader } from '@/components/debate/debate-header'
import { FloatingControls } from '@/components/debate/floating-controls'
import { MessageList } from '@/components/debate/message-list'
import { ShortcutsHelp } from '@/components/debate/shortcuts-help'
import { useDebateStream } from '@/hooks/use-debate-stream'
import { clientLogger } from '@/lib/client-logger'
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

  const autoStartDebate = useCallback(async () => {
    if (hasAutoStarted.current) return
    hasAutoStarted.current = true

    try {
      const response = await fetch(`/api/debate/${debateId}/engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        clientLogger.error('Auto-start failed', null, { error: data.error ?? 'Unknown error' })
      }
    } catch (error) {
      clientLogger.error('Auto-start error', error)
    }
  }, [debateId])

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
    if (initialStatus === 'ready') {
      autoStartDebate()
    }

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
    autoStartDebate,
    hydrateFromServer,
  ])

  useDebateStream({
    debateId,
    autoConnect: true,
  })

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <DebateHeader debateId={debateId} />

      <main className="relative min-h-0 flex-1">
        <MessageList autoScroll className="h-full" />

        {/* Shortcuts help - bottom right */}
        <div className="absolute bottom-4 right-4 z-10">
          <ShortcutsHelp />
        </div>
      </main>

      {/* Floating controls */}
      <FloatingControls debateId={debateId} />

      <div className="safe-area-inset-bottom" />
    </div>
  )
}
