// src/components/summary/debate-highlights-card.tsx
/**
 * Sports-style post-debate breakdown card.
 * Displays performance metrics, key moments, and turning points.
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import { useSummaryStore, selectFormattedDuration } from '@/store/summary-store'

const JUDGE_PHRASES = [
  'Analyzing arguments',
  'Reviewing evidence',
  'Evaluating rebuttals',
  'Weighing claims',
  'Scoring performance',
  'Assessing clarity',
]

interface DebateHighlightsCardProps {
  className?: string
}

interface MetricBarProps {
  label: string
  forValue: number
  againstValue: number
}

function MetricBar({ label, forValue, againstValue }: MetricBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground/70 w-8 text-right">{forValue}%</span>
          <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-600/80 to-teal-500/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${forValue}%` }}
              transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
            />
          </div>
        </div>
        <div className="w-px h-4 bg-neutral-700" />
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500/60 to-amber-600/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${againstValue}%` }}
              transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
            />
          </div>
          <span className="text-xs text-muted-foreground/70 w-8">{againstValue}%</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Apple-style skeleton placeholder bar
 */
function SkeletonBar({ width, height = 'h-2.5' }: { width: string; height?: string }) {
  return <div className={cn(height, 'rounded-full bg-neutral-800', width)} />
}

/**
 * Custom Mosaic loader synced with typewriter progress.
 * Squares appear/disappear diagonally based on typing progress:
 * - Progress 0 (deleted) → 1 square visible (top-left)
 * - Progress 1 (fully typed) → all 9 squares visible
 */
function SyncedMosaic({ progress }: { progress: number }) {
  // Diagonal priority for each grid position (0-4 diagonals from top-left)
  // Grid layout:  0 1 2
  //               3 4 5
  //               6 7 8
  // Diagonal order: 0 → 1,3 → 2,4,6 → 5,7 → 8
  const diagonalPriority = [0, 1, 2, 1, 2, 3, 2, 3, 4]

  const getSquareScale = (index: number) => {
    const priority = diagonalPriority[index] ?? 0
    // Map progress (0-1) to priority threshold (0-4)
    const currentThreshold = progress * 4

    if (priority < currentThreshold) return 1 // Fully visible
    if (priority < currentThreshold + 1) {
      // Animate in based on fractional progress within this diagonal
      const fractional = currentThreshold - priority + 1
      return Math.max(0, Math.min(1, fractional))
    }
    return 0 // Hidden
  }

  return (
    <div className="grid grid-cols-3 gap-[1px] w-3 h-3">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="w-[3px] h-[3px] rounded-[0.5px] bg-neutral-500"
          style={{
            transform: `scale(${getSquareScale(i)})`,
            transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Hook for typewriter animation state.
 * Returns progress (0-1) and current display text.
 */
function useTypewriter() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing')

  const currentPhrase = JUDGE_PHRASES[phraseIndex] ?? ''

  useEffect(() => {
    if (phase === 'typing') {
      if (displayText.length < currentPhrase.length) {
        const timeout = setTimeout(
          () => setDisplayText(currentPhrase.slice(0, displayText.length + 1)),
          40 + Math.random() * 25
        )
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => setPhase('pausing'), 100)
        return () => clearTimeout(timeout)
      }
    }

    if (phase === 'pausing') {
      const timeout = setTimeout(() => setPhase('deleting'), 1800)
      return () => clearTimeout(timeout)
    }

    if (phase === 'deleting') {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => setDisplayText(displayText.slice(0, -1)), 20)
        return () => clearTimeout(timeout)
      } else {
        setPhraseIndex((prev) => (prev + 1) % JUDGE_PHRASES.length)
        setPhase('typing')
      }
    }
  }, [phase, displayText, currentPhrase])

  const progress = currentPhrase.length > 0 ? displayText.length / currentPhrase.length : 0

  return { displayText, progress }
}

interface JudgeThinkingProps {
  displayText: string
  progress: number
}

/**
 * Judge thinking indicator with Mosaic loader and typewriter text.
 */
function JudgeThinking({ displayText, progress }: JudgeThinkingProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
      <SyncedMosaic progress={progress} />
      <span className="font-medium whitespace-nowrap w-44">
        {displayText}
        <motion.span
          className="inline-block w-0.5 h-3.5 bg-muted-foreground/50 ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.53, repeat: Infinity, repeatType: 'reverse' }}
        />
      </span>
    </div>
  )
}

/**
 * Apple-style skeleton loading state matching final layout exactly.
 * Pulse syncs with typewriter: full opacity when typed, faded when deleted.
 */
function SkeletonCard() {
  const { displayText, progress } = useTypewriter()

  // Skeleton opacity syncs with typewriter progress
  const skeletonOpacity = 0.4 + progress * 0.6

  return (
    <div className="space-y-8">
      {/* Header with thinking indicator */}
      <div className="flex items-start justify-between">
        <div
          className="space-y-2 transition-opacity duration-100"
          style={{ opacity: skeletonOpacity }}
        >
          <SkeletonBar width="w-56" height="h-7" />
          <SkeletonBar width="w-32" height="h-4" />
        </div>
        <JudgeThinking displayText={displayText} progress={progress} />
      </div>

      {/* Rest of skeleton with synced opacity */}
      <div
        className="space-y-8 transition-opacity duration-100"
        style={{ opacity: skeletonOpacity }}
      >
        {/* Metadata skeleton */}
        <div className="flex items-center gap-3">
          <SkeletonBar width="w-24" height="h-4" />
          <div className="w-1 h-1 rounded-full bg-neutral-800" />
          <SkeletonBar width="w-28" height="h-4" />
          <div className="w-1 h-1 rounded-full bg-neutral-800" />
          <SkeletonBar width="w-24" height="h-4" />
          <div className="w-1 h-1 rounded-full bg-neutral-800" />
          <SkeletonBar width="w-20" height="h-4" />
        </div>

        {/* Performance Breakdown skeleton */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <SkeletonBar width="w-44" height="h-4" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-800" />
                <SkeletonBar width="w-8" height="h-3" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-800" />
                <SkeletonBar width="w-16" height="h-3" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {['Structure', 'Clarity', 'Evidence', 'Rebuttal'].map((label) => (
              <div key={label} className="space-y-2">
                <SkeletonBar width="w-20" height="h-3" />
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <SkeletonBar width="w-8" height="h-3" />
                    <div className="flex-1 h-2 bg-neutral-800 rounded-full" />
                  </div>
                  <div className="w-px h-4 bg-neutral-800" />
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-neutral-800 rounded-full" />
                    <SkeletonBar width="w-8" height="h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Moments skeleton */}
        <div className="space-y-4">
          <SkeletonBar width="w-28" height="h-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 flex-shrink-0" />
                <SkeletonBar
                  width={i === 1 ? 'w-full' : i === 2 ? 'w-5/6' : 'w-4/6'}
                  height="h-4"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Where the Debate Turned skeleton */}
        <div className="space-y-4">
          <SkeletonBar width="w-48" height="h-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 flex-shrink-0" />
                <SkeletonBar width={i === 1 ? 'w-full' : 'w-5/6'} height="h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer skeleton */}
        <div className="pt-4 border-t border-neutral-800/30">
          <div className="flex justify-center">
            <SkeletonBar width="w-72" height="h-3" />
          </div>
        </div>
      </div>
    </div>
  )
}

const fadeTransition = {
  duration: 0.25,
  ease: [0.22, 0.61, 0.36, 1] as const,
}

export function DebateHighlightsCard({ className }: DebateHighlightsCardProps) {
  const judgeAnalysis = useSummaryStore((s) => s.judgeAnalysis)
  const statistics = useSummaryStore((s) => s.statistics)
  const format = useSummaryStore((s) => s.format)
  const duration = useSummaryStore(selectFormattedDuration)

  const metricMapping: Record<string, string> = {
    argument_quality: 'Structure',
    clarity_presentation: 'Clarity',
    evidence_support: 'Evidence',
    rebuttal_effectiveness: 'Rebuttal',
  }

  const getMetricPair = (category: string): { forValue: number; againstValue: number } => {
    if (!judgeAnalysis) return { forValue: 0, againstValue: 0 }

    const forScore = judgeAnalysis.forAnalysis.categoryScores.find((s) => s.category === category)
    const againstScore = judgeAnalysis.againstAnalysis.categoryScores.find(
      (s) => s.category === category
    )

    return {
      forValue: forScore?.percentage ?? 0,
      againstValue: againstScore?.percentage ?? 0,
    }
  }

  const keyMoments = judgeAnalysis
    ? [
        ...judgeAnalysis.forAnalysis.standoutMoments.slice(0, 2),
        ...judgeAnalysis.againstAnalysis.standoutMoments.slice(0, 2),
      ].slice(0, 4)
    : []

  const turningPoints = judgeAnalysis?.turningMoments.slice(0, 3) ?? []

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
          {!judgeAnalysis ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
            >
              <SkeletonCard />
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
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Post-Debate Breakdown
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Debate Highlights</p>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground/70">
                <span>Format: {format}</span>
                <span className="text-neutral-700">·</span>
                <span>Total Turns: {statistics?.totalTurns ?? 0}</span>
                <span className="text-neutral-700">·</span>
                <span>Duration: {duration}</span>
                <span className="text-neutral-700">·</span>
                <span className="text-emerald-500/80">Completed</span>
              </div>

              {/* Performance Breakdown */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
                    Performance Breakdown
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-teal-500/80" />
                      <span className="text-muted-foreground">FOR</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                      <span className="text-muted-foreground">AGAINST</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {Object.entries(metricMapping).map(([category, label]) => {
                    const { forValue, againstValue } = getMetricPair(category)
                    return (
                      <MetricBar
                        key={category}
                        label={label}
                        forValue={forValue}
                        againstValue={againstValue}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Key Moments */}
              {keyMoments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
                    Key Moments
                  </h3>
                  <ul className="space-y-2.5">
                    {keyMoments.map((moment, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-muted-foreground/90"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-600 flex-shrink-0" />
                        <span className="leading-relaxed">{moment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Where the Debate Turned */}
              {turningPoints.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
                    Where the Debate Turned
                  </h3>
                  <ul className="space-y-2.5">
                    {turningPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-muted-foreground/90"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-600 flex-shrink-0" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-neutral-800/60">
                <p className="text-xs text-muted-foreground/50 text-center">
                  Objective analysis of argument structure and reasoning
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
