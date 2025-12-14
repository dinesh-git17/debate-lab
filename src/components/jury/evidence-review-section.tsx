/**
 * Evidence Review section for post-debate fact checking.
 * Displays independent AI juror evaluations with Apple-style animations.
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { FaQuestionCircle } from 'react-icons/fa'

import { cn } from '@/lib/utils'
import { useSummaryStore } from '@/store/summary-store'

import { ArbiterResolutionCard } from './arbiter-resolution-card'
import { DeliberationLog } from './deliberation-log'
import { JurorCard } from './juror-card'
import { JuryHelpModal } from './jury-help-modal'
import { JurySkeleton } from './jury-skeleton'

import type { JuryDeliberation } from '@/types/jury'

interface EvidenceReviewSectionProps {
  className?: string
}

const fadeTransition = {
  duration: 0.25,
  ease: [0.22, 0.61, 0.36, 1] as const,
}

/**
 * Help icon button with Apple-style tooltip
 */
function HelpIconButton({
  onClick,
  size = 'md',
  className,
}: {
  onClick: () => void
  size?: 'sm' | 'md'
  className?: string
}) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className={cn('relative group', className)}>
      <button
        onClick={onClick}
        className={cn(
          'p-2 rounded-full cursor-pointer',
          'text-muted-foreground/60 group-hover:text-muted-foreground',
          'group-hover:bg-white/[0.06]'
        )}
        aria-label="How this works"
      >
        <FaQuestionCircle className={iconSize} />
      </button>

      {/* Apple-style tooltip - pure CSS for instant sync */}
      <div
        className={cn(
          'absolute top-full right-0 mt-2 z-50',
          'px-3 py-1.5 rounded-lg',
          'bg-[#1c1c1e]/95 backdrop-blur-xl',
          'border border-white/[0.08]',
          'shadow-[0_4px_20px_rgba(0,0,0,0.4)]',
          'whitespace-nowrap',
          'pointer-events-none',
          'opacity-0 scale-95 translate-y-1',
          'group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0',
          'transition-all duration-150 ease-out'
        )}
      >
        <span className="text-xs font-medium text-white/90">How this works</span>
        {/* Tooltip arrow */}
        <div className="absolute -top-1 right-4 w-2 h-2 rotate-45 bg-[#1c1c1e]/95 border-l border-t border-white/[0.08]" />
      </div>
    </div>
  )
}

export function EvidenceReviewSection({ className }: EvidenceReviewSectionProps) {
  const debateId = useSummaryStore((s) => s.debateId)
  const juryDeliberation = useSummaryStore((s) => s.juryDeliberation)
  const isJuryLoading = useSummaryStore((s) => s.isJuryLoading)
  const juryError = useSummaryStore((s) => s.juryError)
  const setJuryDeliberation = useSummaryStore((s) => s.setJuryDeliberation)
  const setJuryLoading = useSummaryStore((s) => s.setJuryLoading)
  const setJuryError = useSummaryStore((s) => s.setJuryError)
  const resetJury = useSummaryStore((s) => s.resetJury)

  const [hasRequested, setHasRequested] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const handleRequestFactCheck = useCallback(async () => {
    if (isJuryLoading || !debateId) return

    setHasRequested(true)
    setJuryLoading(true)
    setJuryError(null)

    try {
      const response = await fetch(`/api/debate/${debateId}/jury`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate fact check')
      }

      setJuryDeliberation(data.deliberation as JuryDeliberation)
    } catch (error) {
      setJuryError(error instanceof Error ? error.message : 'Something went wrong')
    }
  }, [debateId, isJuryLoading, setJuryDeliberation, setJuryLoading, setJuryError])

  const handleRetry = useCallback(() => {
    resetJury()
    setHasRequested(false)
  }, [resetJury])

  // Initial state - show trigger button
  if (!hasRequested && !juryDeliberation) {
    return (
      <section className={cn('w-full', className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          className={cn(
            'rounded-2xl border border-neutral-800/60',
            'bg-neutral-900/80 backdrop-blur-xl',
            'p-6 sm:p-8',
            'relative',
            'min-h-[200px]'
          )}
        >
          {/* Help icon */}
          <HelpIconButton
            onClick={() => setIsHelpOpen(true)}
            size="sm"
            className="absolute top-4 right-4"
          />

          <div className="flex flex-col items-center justify-center text-center h-full space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Evidence Review</h3>
              <p className="text-sm text-muted-foreground/70 max-w-md">
                Independent fact-checking by external AI jurors evaluating factual accuracy and
                evidence quality.
              </p>
            </div>

            <button
              onClick={handleRequestFactCheck}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-full',
                'bg-white/[0.06] text-foreground/90',
                'border border-white/[0.1]',
                'hover:bg-white/[0.1] hover:border-white/[0.15]',
                'transition-all duration-200',
                'text-sm font-medium',
                'cursor-pointer'
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              Request Fact Check
            </button>
          </div>
        </motion.div>

        <JuryHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </section>
    )
  }

  // Error state
  if (juryError && !isJuryLoading) {
    return (
      <section className={cn('w-full', className)}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'rounded-2xl border border-neutral-800/60',
            'bg-neutral-900/80 backdrop-blur-xl',
            'p-6 sm:p-8',
            'flex flex-col items-center justify-center text-center',
            'min-h-[200px]'
          )}
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-amber-500/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Unable to Complete Review</h3>
              <p className="text-sm text-muted-foreground/70 max-w-sm">{juryError}</p>
            </div>

            <button
              onClick={handleRetry}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2 rounded-full',
                'bg-white/[0.06] text-foreground/80',
                'border border-white/[0.08]',
                'hover:bg-white/[0.1]',
                'transition-all duration-200',
                'text-sm font-medium',
                'cursor-pointer'
              )}
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </section>
    )
  }

  return (
    <section className={cn('w-full', className)}>
      <motion.div
        layout
        className={cn(
          'rounded-2xl border border-neutral-800/60',
          'bg-neutral-900/80 backdrop-blur-xl',
          'p-6 sm:p-8',
          'overflow-hidden'
        )}
        transition={{ layout: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] } }}
      >
        <AnimatePresence mode="wait">
          {isJuryLoading || !juryDeliberation ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
            >
              <JurySkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={fadeTransition}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Evidence Review</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Independent assessment based on factual accuracy and evidence quality
                  </p>
                </div>
                <HelpIconButton
                  onClick={() => setIsHelpOpen(true)}
                  size="md"
                  className="flex-shrink-0"
                />
              </div>

              {/* Juror Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {juryDeliberation.geminiEvaluation && (
                  <JurorCard evaluation={juryDeliberation.geminiEvaluation} position="for" />
                )}
                {juryDeliberation.deepseekEvaluation && (
                  <JurorCard evaluation={juryDeliberation.deepseekEvaluation} position="against" />
                )}
              </div>

              {/* Deliberation Log */}
              {juryDeliberation.deliberationLog.length > 0 && (
                <DeliberationLog exchanges={juryDeliberation.deliberationLog} />
              )}

              {/* Arbiter Resolution */}
              {juryDeliberation.arbiterResolution && (
                <ArbiterResolutionCard resolution={juryDeliberation.arbiterResolution} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Help Modal */}
      <JuryHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </section>
  )
}
