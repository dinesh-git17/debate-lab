/**
 * src/app/(fullscreen)/debate/[id]/client.tsx
 * Fullscreen debate viewer with Apple-inspired atmospheric design
 */

'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useCallback, useMemo } from 'react'

import { AmbientLighting } from '@/components/debate/ambient-lighting'
import { AtmosphericBackground } from '@/components/debate/atmospheric-background'
import { DebateHeader } from '@/components/debate/debate-header'
import { FilmGrain } from '@/components/debate/film-grain'
import { FloatingControls } from '@/components/debate/floating-controls'
import { MessageList } from '@/components/debate/message-list'
import { ShortcutsHelp } from '@/components/debate/shortcuts-help'
import { useDebateRealtime } from '@/hooks/use-debate-realtime'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import type { DebateHistoryResponse } from '@/app/api/debate/[id]/history/route'
import type { DebatePhase } from '@/types/debate'
import type { DebateMessage, DebateViewStatus } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

/**
 * Apple-inspired canvas configuration
 * Background uses AtmosphericBackground component with CSS variables
 */
const CANVAS_CONFIG = {
  // Noise overlay for tactile texture
  noiseOpacity: 0.015,
  // Vignette: soft elliptical falloff
  vignetteEllipse: '120% 100%',
  vignetteBreatheDuration: 18,
} as const

/**
 * SVG noise pattern for subtle texture overlay
 */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`

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
        'fixed inset-0 z-50 flex flex-col overflow-hidden'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Atmospheric background - 5-layer gradient system (z-0 to z-4) */}
      <AtmosphericBackground />

      {/* Ambient lighting (z-5) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.5,
          delay: 0.4,
          ease: [0.25, 0.95, 0.35, 1],
        }}
        className="z-[5]"
      >
        <AmbientLighting
          activeSpeaker={activeSpeaker}
          isStreaming={isStreaming}
          phase={ambientPhase}
        />
      </motion.div>

      {/* Global noise texture overlay (z-6) */}
      <div
        className="pointer-events-none fixed inset-0 z-[6]"
        style={{
          backgroundImage: NOISE_SVG,
          opacity: CANVAS_CONFIG.noiseOpacity,
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />

      {/* Vignette - soft elliptical falloff with gentle breathing (z-7) */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[7]"
        style={{
          background: `radial-gradient(ellipse ${CANVAS_CONFIG.vignetteEllipse} at center,
            transparent ${status === 'completed' ? '28%' : '30%'},
            hsl(var(--gradient-void) / 0.06) ${status === 'completed' ? '42%' : '45%'},
            hsl(var(--gradient-void) / 0.18) ${status === 'completed' ? '55%' : '58%'},
            hsl(var(--gradient-void) / 0.45) 75%,
            hsl(var(--gradient-void) / 0.75) 90%,
            hsl(var(--gradient-void) / 0.9) 100%
          )`,
        }}
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          scale: {
            duration: CANVAS_CONFIG.vignetteBreatheDuration,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          },
        }}
      />

      {/* Film grain - reduced opacity for subtlety */}
      <FilmGrain className="z-[100]" opacity={0.6} />

      {/* Subtle backdrop blur to smooth lighting/grain artifacts */}
      <div
        className="pointer-events-none fixed inset-0 z-[110]"
        style={{
          backdropFilter: 'blur(0.4px)',
          WebkitBackdropFilter: 'blur(0.4px)',
        }}
        aria-hidden="true"
      />

      <DebateHeader debateId={debateId} className="relative z-[120]" />

      <main className="relative z-[115] min-h-0 flex-1">
        <MessageList
          autoScroll
          className="h-full"
          initialStatus={mapPhaseToViewStatus(initialStatus)}
        />

        {/* Shortcuts help - bottom right */}
        <motion.div
          className="absolute bottom-4 right-4 z-[115]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
        >
          <ShortcutsHelp />
        </motion.div>
      </main>

      {/* Floating controls - only visible during active debate or completed */}
      {(status === 'active' || status === 'paused' || status === 'completed') && (
        <div className="relative z-[115]">
          <FloatingControls debateId={debateId} />
        </div>
      )}

      <div className="safe-area-inset-bottom" />
    </motion.div>
  )
}
