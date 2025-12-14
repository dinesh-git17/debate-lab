// src/components/summary/reveal-section.tsx
/**
 * Interactive reveal section for unveiling AI model identities post-debate.
 * Manages reveal animation state and displays model cards side-by-side.
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'
import { useSummaryStore, selectCanReveal } from '@/store/summary-store'

import { ModelCard } from './model-card'

const REVEAL_ANIMATION_DURATION = 2000

interface RevealSectionProps {
  className?: string
}

export function RevealSection({ className }: RevealSectionProps) {
  const revealState = useSummaryStore((s) => s.revealState)
  const assignment = useSummaryStore((s) => s.assignment)
  const canReveal = useSummaryStore(selectCanReveal)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleReveal = useCallback(() => {
    if (!canReveal) return

    useSummaryStore.getState().startReveal()

    timerRef.current = setTimeout(() => {
      useSummaryStore.getState().completeReveal()
    }, REVEAL_ANIMATION_DURATION)
  }, [canReveal])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const isRevealing = revealState === 'revealing'
  const isRevealed = revealState === 'revealed'

  return (
    <section className={cn('w-full', className)}>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isRevealed ? 'The Models Behind the Debate' : 'Who Was Arguing?'}
        </h2>
        <p className="text-muted-foreground">
          {isRevealed
            ? 'Now that you know who argued each side, reflect on their arguments'
            : 'Click the button below to reveal which AI model argued each position'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
        <ModelCard
          position="for"
          identity={assignment?.for ?? null}
          isRevealed={isRevealed}
          isRevealing={isRevealing}
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
          isRevealing={isRevealing}
        />
      </div>

      {!isRevealed && (
        <div className="flex justify-center">
          <button
            onClick={handleReveal}
            disabled={!canReveal || isRevealing}
            className={cn(
              'relative px-8 py-3.5 rounded-full font-medium',
              'bg-primary text-primary-foreground',
              'transition-all duration-200',
              'hover:bg-primary/90 hover:scale-[1.02]',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            )}
          >
            {isRevealing ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Revealing...
              </span>
            ) : (
              <span>Reveal the Models</span>
            )}
          </button>
        </div>
      )}

      {isRevealed && (
        <div
          className={cn(
            'mt-8 p-6 rounded-xl bg-muted/30 border border-border',
            'text-center animate-fade-in'
          )}
        >
          <p className="text-muted-foreground">
            Were you surprised? Both AI models are trained to argue persuasively, regardless of
            their actual capabilities or &ldquo;beliefs.&rdquo;
          </p>
        </div>
      )}
    </section>
  )
}
