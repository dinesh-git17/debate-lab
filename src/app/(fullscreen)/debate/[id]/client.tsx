// src/app/(fullscreen)/debate/[id]/client.tsx

'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useCallback, useMemo } from 'react'

import { AmbientLighting } from '@/components/debate/ambient-lighting'
import { DebateHeader } from '@/components/debate/debate-header'
import { FilmGrain } from '@/components/debate/film-grain'
import { FloatingControls } from '@/components/debate/floating-controls'
import { MessageList } from '@/components/debate/message-list'
import { ShortcutsHelp } from '@/components/debate/shortcuts-help'
import { useDebateRealtime } from '@/hooks/use-debate-realtime'
// import { clientLogger } from '@/lib/client-logger' // TODO: Re-enable with auto-start
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import type { DebateHistoryResponse } from '@/app/api/debate/[id]/history/route'
import type { DebatePhase } from '@/types/debate'
import type { DebateMessage, DebateViewStatus } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

// TurnSpeaker and AmbientSpeaker use the same values
type AmbientSpeaker = TurnSpeaker

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
  const status = useDebateViewStore((s) => s.status)
  const messages = useDebateViewStore((s) => s.messages)
  const displayedMessageIds = useDebateViewStore((s) => s.displayedMessageIds)

  // Derive active speaker from the currently VISIBLE message (syncs with UI, not buffer)
  // The visible message is either:
  // - The first message NOT in displayedMessageIds (currently animating)
  // - Or the last displayed message if all are displayed
  const { activeSpeaker, isStreaming } = useMemo(() => {
    if (messages.length === 0) {
      return { activeSpeaker: null, isStreaming: false }
    }

    // Find the currently animating message (first non-displayed)
    let visibleMessage = null
    for (const msg of messages) {
      visibleMessage = msg
      if (!displayedMessageIds.has(msg.id)) {
        break // This is the currently animating message
      }
    }

    if (!visibleMessage) {
      return { activeSpeaker: null, isStreaming: false }
    }

    return {
      activeSpeaker: visibleMessage.speaker as AmbientSpeaker,
      isStreaming: visibleMessage.isStreaming && !displayedMessageIds.has(visibleMessage.id),
    }
  }, [messages, displayedMessageIds])

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

  useDebateRealtime({
    debateId,
    autoConnect: true,
  })

  // Determine ambient phase
  const ambientPhase = status === 'completed' ? 'completed' : 'active'

  return (
    <motion.div
      className={cn(
        // Fullscreen fixed container - no navbar to account for
        'fixed inset-0 z-50 flex flex-col overflow-hidden',
        // Slightly off-black background for depth
        'bg-[#0a0a0b]'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Ambient lighting - behind everything */}
      <AmbientLighting
        activeSpeaker={activeSpeaker}
        isStreaming={isStreaming}
        phase={ambientPhase}
        className="z-0"
      />

      {/* Vignette with breathing animation - darkens edges, focuses eye on center */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background: `radial-gradient(circle at center, transparent ${status === 'completed' ? '38%' : '40%'}, #000 100%)`,
        }}
        animate={{
          scale: [1, 1.03, 1],
        }}
        transition={{
          scale: {
            duration: 14,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          },
        }}
      />

      {/* Film grain - topmost overlay */}
      <FilmGrain className="z-[100]" />

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
