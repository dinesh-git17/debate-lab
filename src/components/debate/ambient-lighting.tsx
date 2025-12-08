// src/components/debate/ambient-lighting.tsx

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

// Color tokens (HSL) - matched to speaker card colors from speaker-config.ts
// For: blue-500 (#3b82f6), Against: rose-500 (#f43f5e), Moderator: amber-500 (#f59e0b)
const AMBIENT_COLORS = {
  for: {
    primary: 'hsl(217, 91%, 60%)',
    glow: 'hsla(217, 91%, 60%, 0.04)',
    glowIntense: 'hsla(217, 91%, 60%, 0.06)',
  },
  against: {
    primary: 'hsl(350, 89%, 60%)',
    glow: 'hsla(350, 89%, 60%, 0.04)',
    glowIntense: 'hsla(350, 89%, 60%, 0.06)',
  },
  moderator: {
    primary: 'hsl(42, 70%, 48%)',
    glow: 'hsla(42, 65%, 45%, 0.025)',
    glowIntense: 'hsla(42, 65%, 45%, 0.04)',
  },
  neutral: 'hsla(0, 0%, 100%, 0.02)',
  completed: 'hsla(220, 10%, 50%, 0.03)',
} as const

// Animation timing tokens
const AMBIENT_TIMING = {
  breathe: 8000,
  speakerTransition: 800,
} as const

const EASING = {
  smoothOut: [0.0, 0.0, 0.2, 1] as const,
  smoothInOut: [0.4, 0, 0.2, 1] as const,
}

type SpeakerType = 'for' | 'against' | 'moderator'

interface AmbientLightingProps {
  activeSpeaker: SpeakerType | null
  isStreaming: boolean
  phase: 'active' | 'completed'
  className?: string
}

function getGlowColor(
  speaker: SpeakerType | null,
  isStreaming: boolean,
  phase: 'active' | 'completed'
): string {
  if (phase === 'completed') {
    return AMBIENT_COLORS.completed
  }

  if (!speaker) {
    return AMBIENT_COLORS.neutral
  }

  const colors = AMBIENT_COLORS[speaker]
  return isStreaming ? colors.glowIntense : colors.glow
}

function getAtmosphericColor(speaker: SpeakerType | null, phase: 'active' | 'completed'): string {
  if (phase === 'completed') {
    return AMBIENT_COLORS.completed
  }

  if (!speaker) {
    return AMBIENT_COLORS.neutral
  }

  // Atmospheric layer uses an even more subtle version
  return AMBIENT_COLORS[speaker].glow.replace(/[\d.]+\)$/, '0.02)')
}

export function AmbientLighting({
  activeSpeaker,
  isStreaming,
  phase,
  className,
}: AmbientLightingProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Track previous speaker for transition choreography
  const [previousSpeaker, setPreviousSpeaker] = useState<SpeakerType | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Update previous speaker when active speaker changes
  useEffect(() => {
    if (activeSpeaker !== previousSpeaker) {
      setPreviousSpeaker(activeSpeaker)
    }
  }, [activeSpeaker, previousSpeaker])

  const glowColor = getGlowColor(activeSpeaker, isStreaming, phase)
  const atmosphericColor = getAtmosphericColor(activeSpeaker, phase)

  const breatheDuration = AMBIENT_TIMING.breathe / 1000
  const transitionDuration = AMBIENT_TIMING.speakerTransition / 1000

  return (
    <div className={cn('pointer-events-none fixed inset-0', className)}>
      {/* Layer 1: Atmospheric Wash - largest, most subtle, heavily blurred */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 1600,
          height: 1600,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${atmosphericColor} 0%, ${atmosphericColor.replace(/[\d.]+\)$/, '0.018)')} 10%, ${atmosphericColor.replace(/[\d.]+\)$/, '0.012)')} 25%, ${atmosphericColor.replace(/[\d.]+\)$/, '0.006)')} 45%, ${atmosphericColor.replace(/[\d.]+\)$/, '0.002)')} 65%, transparent 85%)`,
          filter: 'blur(120px)',
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: [1, 1.03, 1],
              }
        }
        transition={{
          scale: {
            duration: breatheDuration,
            repeat: Infinity,
            ease: EASING.smoothInOut,
          },
        }}
      />

      {/* Layer 2: Speaker Aura - follows active speaker color, blurred */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`${activeSpeaker}-${phase}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 900,
            height: 900,
            borderRadius: '50%',
            background: `radial-gradient(circle at center, ${glowColor} 0%, ${glowColor.replace(/[\d.]+\)$/, '0.035)')} 8%, ${glowColor.replace(/[\d.]+\)$/, '0.02)')} 20%, ${glowColor.replace(/[\d.]+\)$/, '0.01)')} 35%, ${glowColor.replace(/[\d.]+\)$/, '0.004)')} 55%, ${glowColor.replace(/[\d.]+\)$/, '0.001)')} 75%, transparent 100%)`,
            filter: 'blur(100px)',
          }}
          initial={
            prefersReducedMotion
              ? false
              : {
                  opacity: 0,
                  y: '-45%',
                }
          }
          animate={{
            opacity: 1,
            y: '-50%',
          }}
          exit={
            prefersReducedMotion
              ? {}
              : {
                  opacity: 0,
                  y: '-40%',
                }
          }
          transition={{
            duration: transitionDuration,
            ease: EASING.smoothOut,
          }}
        />
      </AnimatePresence>

      {/* Layer 3: Focal Bloom - tight, centered, subtle glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${
            phase === 'completed' ? 'hsla(220, 10%, 60%, 0.012)' : 'hsla(0, 0%, 100%, 0.01)'
          } 0%, ${
            phase === 'completed' ? 'hsla(220, 10%, 60%, 0.008)' : 'hsla(0, 0%, 100%, 0.006)'
          } 20%, ${
            phase === 'completed' ? 'hsla(220, 10%, 60%, 0.003)' : 'hsla(0, 0%, 100%, 0.002)'
          } 45%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: [1, 1.02, 1],
              }
        }
        transition={{
          scale: {
            duration: breatheDuration * 1.2,
            repeat: Infinity,
            ease: EASING.smoothInOut,
            delay: 0.5,
          },
        }}
      />

      {/* Completed state overlay - cool silver wash */}
      <AnimatePresence>
        {phase === 'completed' && (
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 150% 120% at 50% 50%, hsla(220, 15%, 50%, 0.02) 0%, transparent 50%)',
              filter: 'blur(40px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: EASING.smoothInOut }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
