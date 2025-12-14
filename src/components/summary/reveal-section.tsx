// src/components/summary/reveal-section.tsx
/**
 * Interactive reveal section for unveiling AI model identities post-debate.
 * Manages reveal animation state and displays model cards side-by-side.
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { useSummaryStore, selectCanReveal } from '@/store/summary-store'

import { ModelCard } from './model-card'

const REVEAL_ANIMATION_DURATION = 1000
const SPINNER_FADE_DURATION = 300

interface RevealSectionProps {
  className?: string
}

export function RevealSection({ className }: RevealSectionProps) {
  const revealState = useSummaryStore((s) => s.revealState)
  const assignment = useSummaryStore((s) => s.assignment)
  const canReveal = useSummaryStore(selectCanReveal)

  const [showSpinner, setShowSpinner] = useState(false)
  const [shouldFlipCards, setShouldFlipCards] = useState(revealState === 'revealed')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync shouldFlipCards when revealState changes (e.g., loaded from localStorage)
  useEffect(() => {
    if (revealState === 'revealed') {
      setShouldFlipCards(true)
    }
  }, [revealState])

  const handleReveal = useCallback(() => {
    if (!canReveal) return

    useSummaryStore.getState().startReveal()
    setShowSpinner(true)

    timerRef.current = setTimeout(() => {
      // Spinner starts fading out
      setShowSpinner(false)

      // After spinner fade completes, start card flip then mark revealed
      fadeTimerRef.current = setTimeout(() => {
        setShouldFlipCards(true)
        // Give flip animation time to complete before final state
        setTimeout(() => {
          useSummaryStore.getState().completeReveal()
        }, 800) // matches card flip duration
      }, SPINNER_FADE_DURATION)
    }, REVEAL_ANIMATION_DURATION)
  }, [canReveal])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current)
      }
    }
  }, [])

  const isRevealing = revealState === 'revealing'
  const isRevealed = revealState === 'revealed'

  const textTransition = {
    duration: 0.5,
    ease: [0.22, 0.61, 0.36, 1] as const,
  }

  return (
    <section className={cn('w-full', className)}>
      <div className="mb-8 text-center relative" style={{ minHeight: 80 }}>
        <AnimatePresence mode="wait">
          {!shouldFlipCards ? (
            <motion.div
              key="hidden-text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={textTransition}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">Who Was Arguing?</h2>
              <p className="text-muted-foreground">
                Click the button below to reveal which AI model argued each position
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="revealed-text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={textTransition}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                The Models Behind the Debate
              </h2>
              <p className="text-muted-foreground">
                Now that the debate has concluded, you can see which AI model argued each side
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
        <ModelCard
          position="for"
          identity={assignment?.for ?? null}
          isRevealed={isRevealed}
          isRevealing={shouldFlipCards}
        />

        <div
          className={cn(
            'flex items-center justify-center w-16 h-16 rounded-full',
            'bg-muted/50 border-2 border-border',
            'text-xl font-bold text-muted-foreground',
            isRevealing && 'animate-pulse'
          )}
        >
          VS
        </div>

        <ModelCard
          position="against"
          identity={assignment?.against ?? null}
          isRevealed={isRevealed}
          isRevealing={shouldFlipCards}
        />
      </div>

      <AnimatePresence>
        {!isRevealed && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 52, opacity: 1 }}
            animate={{ height: 52, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="flex items-center justify-center" style={{ height: 52 }}>
              {/* Button - fades out when revealing */}
              <AnimatePresence>
                {!isRevealing && (
                  <motion.button
                    onClick={handleReveal}
                    disabled={!canReveal}
                    className={cn(
                      'absolute px-8 py-3.5 rounded-full font-medium cursor-pointer',
                      'bg-primary text-primary-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-primary/30',
                      'disabled:cursor-not-allowed disabled:pointer-events-none'
                    )}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                  >
                    Reveal the Models
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Standalone spinner - fades in when loading, fades out before reveal */}
              <AnimatePresence>
                {showSpinner && (
                  <motion.div
                    className="absolute flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    style={{ pointerEvents: 'none' }}
                    transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="2.5"
                      />
                      <motion.circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="rgba(255,255,255,0.45)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="63"
                        strokeDashoffset="47"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ transformOrigin: 'center' }}
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRevealed && (
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div
              className={cn('mt-8 p-6 rounded-xl bg-muted/30 border border-border', 'text-center')}
            >
              <p className="text-muted-foreground">
                Both models are designed to argue convincingly from their assigned positions.
              </p>
              <p className="text-muted-foreground/70 text-sm mt-2">
                Performance here reflects rhetorical structure and reasoning, not beliefs, intent,
                or independent judgment.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
