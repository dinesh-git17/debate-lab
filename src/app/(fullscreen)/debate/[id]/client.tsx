/**
 * src/app/(fullscreen)/debate/[id]/client.tsx
 * Fullscreen debate viewer with Apple-inspired atmospheric design
 */

'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useCallback } from 'react'

import { AppleBackground } from '@/components/debate/apple-background'
import { DebateHeader } from '@/components/debate/debate-header'
import { FloatingControls } from '@/components/debate/floating-controls'
import { MessageList } from '@/components/debate/message-list'
import { ShortcutsHelp } from '@/components/debate/shortcuts-help'
import { useDebateRealtime } from '@/hooks/use-debate-realtime'
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
  initialBackgroundCategory?: string | undefined
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
  initialBackgroundCategory,
}: DebatePageClientProps) {
  const { setDebateInfo, setStatus, setProgress, hydrateMessages, reset } = useDebateViewStore()
  const status = useDebateViewStore((s) => s.status)

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
      backgroundCategory: initialBackgroundCategory,
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

  useDebateRealtime({
    debateId,
    autoConnect: true,
  })

  return (
    <motion.div
      className={cn(
        // Fullscreen fixed container - no navbar to account for
        'fixed inset-0 z-50 flex flex-col overflow-hidden'
      )}
      initial={{ opacity: 0, scale: 1.008 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {/* Apple-inspired static background - 3 CSS layers, cinematic entrance */}
      <AppleBackground className="z-0" />

      <DebateHeader debateId={debateId} className="relative z-10" />

      <main className="relative z-10 min-h-0 flex-1">
        <MessageList
          autoScroll
          className="h-full"
          initialStatus={mapPhaseToViewStatus(initialStatus)}
        />

        {/* Shortcuts help - bottom right */}
        <motion.div
          className="absolute bottom-4 right-4 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
        >
          <ShortcutsHelp />
        </motion.div>
      </main>

      {/* Floating controls - only visible during active debate or completed */}
      {(status === 'active' || status === 'paused' || status === 'completed') && (
        <div className="relative z-10">
          <FloatingControls debateId={debateId} />
        </div>
      )}

      <div className="safe-area-inset-bottom" />
    </motion.div>
  )
}
