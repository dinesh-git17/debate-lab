// client.tsx
/**
 * Interactive debate viewer client component.
 * Manages real-time message streaming, state hydration, and user controls.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useCallback, useState } from 'react'

import { AppleBackground } from '@/components/debate/apple-background'
import { DebateEndedCard } from '@/components/debate/debate-ended-card'
import { DebateHeader } from '@/components/debate/debate-header'
import { ExitStateCard } from '@/components/debate/exit-state-card'
import { FloatingControls } from '@/components/debate/floating-controls'
import { MessageList } from '@/components/debate/message-list'
import { ShortcutsHelp } from '@/components/debate/shortcuts-help'
import { useDebateRealtime } from '@/hooks/use-debate-realtime'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import type { DebateHistoryResponse } from '@/app/api/debate/[id]/history/route'
import type { DebatePhase } from '@/types/debate'
import type { DebateMessage } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

interface DebatePageClientProps {
  debateId: string
  initialTopic: string
  initialFormat: string
  initialStatus: DebatePhase
  initialBackgroundCategory?: string | undefined
  wasEndedEarly?: boolean
}

type ServerViewStatus = 'ready' | 'active' | 'completed' | 'error'

function mapPhaseToViewStatus(phase: DebatePhase): ServerViewStatus {
  switch (phase) {
    case 'idle':
    case 'configuring':
    case 'validating':
    case 'ready':
      return 'ready'
    case 'active':
    case 'paused':
      return 'active'
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
  wasEndedEarly = false,
}: DebatePageClientProps) {
  const router = useRouter()
  const { setDebateInfo, setStatus, setProgress, hydrateMessages, reset } = useDebateViewStore()
  const status = useDebateViewStore((s) => s.status)
  const messages = useDebateViewStore((s) => s.messages)
  const isMobile = useIsMobile()

  // Derive active speaker from last message (streaming or complete)
  const activeSpeaker: TurnSpeaker | null = messages[messages.length - 1]?.speaker ?? null

  // Track exit card visibility for animation sequencing
  const [showExitCard, setShowExitCard] = useState(false)
  const isEnded = status === 'ended'

  const handleStartNewDebate = useCallback(() => {
    router.push('/debate/new')
  }, [router])

  const hasAutoStarted = useRef(false)
  const hasHydrated = useRef(false)
  const previousDebateId = useRef<string | null>(null)

  const hydrateFromServer = useCallback(async () => {
    if (hasHydrated.current) return
    hasHydrated.current = true

    try {
      const response = await fetch(`/api/debate/${debateId}/history`)
      if (!response.ok) return

      const data = (await response.json()) as DebateHistoryResponse

      if (data.messages && data.messages.length > 0) {
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
      // Silent failure: debate will start fresh without history
    }
  }, [debateId, hydrateMessages, setProgress])

  // Sequence: fade out messages first, then show exit card
  useEffect(() => {
    if (isEnded) {
      const timer = setTimeout(() => {
        setShowExitCard(true)
      }, 350) // Match message fade out duration
      return () => clearTimeout(timer)
    } else {
      setShowExitCard(false)
    }
  }, [isEnded])

  useEffect(() => {
    // Skip hydration for debates that were ended early
    if (wasEndedEarly) return

    // Reset on debate ID change or if store has stale data from a different debate
    const storeDebateId = useDebateViewStore.getState().debateId
    const shouldReset =
      (previousDebateId.current && previousDebateId.current !== debateId) ||
      (storeDebateId && storeDebateId !== debateId)

    if (shouldReset) {
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

    hydrateFromServer()
  }, [
    debateId,
    initialTopic,
    initialFormat,
    initialStatus,
    setDebateInfo,
    setStatus,
    reset,
    hydrateFromServer,
    initialBackgroundCategory,
    wasEndedEarly,
  ])

  useDebateRealtime({
    debateId,
    autoConnect: !wasEndedEarly,
  })

  // If debate was ended early on server (reload case), show the ended card
  if (wasEndedEarly) {
    return (
      <motion.div
        className={cn('fixed inset-0 z-50 flex flex-col overflow-hidden')}
        initial={{ opacity: 0, scale: 1.008 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <AppleBackground className="z-0" activeSpeaker={activeSpeaker} />
        <DebateHeader debateId={debateId} />
        <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-6">
          <DebateEndedCard />
        </main>
        <div className="safe-area-inset-bottom" />
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn('fixed inset-0 z-50 flex flex-col overflow-hidden')}
      initial={{ opacity: 0, scale: 1.008 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <AppleBackground className="z-0" activeSpeaker={activeSpeaker} />

      <DebateHeader debateId={debateId} />

      <main className="relative z-10 min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {!isEnded ? (
            <motion.div
              key="messages"
              className="h-full"
              initial={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] },
              }}
            >
              <MessageList
                autoScroll
                className="h-full"
                initialStatus={mapPhaseToViewStatus(initialStatus)}
              />
            </motion.div>
          ) : showExitCard ? (
            <motion.div
              key="exit-card"
              className="flex h-full items-center justify-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <ExitStateCard onStartNew={handleStartNewDebate} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!isMobile && !isEnded && (
          <motion.div
            className="absolute bottom-4 right-4 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
          >
            <ShortcutsHelp />
          </motion.div>
        )}
      </main>

      {(status === 'active' || status === 'completed') && (
        <div className="relative z-10">
          <FloatingControls debateId={debateId} />
        </div>
      )}

      <div className="safe-area-inset-bottom" />
    </motion.div>
  )
}
