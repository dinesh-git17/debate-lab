/**
 * Apple-style skeleton loading state for jury deliberation.
 * Displays animated placeholders matching the final layout.
 */

'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

const JURY_PHRASES = [
  'Extracting claims',
  'Analyzing evidence',
  'Gemini reviewing',
  'DeepSeek reviewing',
  'Deliberating scores',
  'Resolving verdict',
]

function SkeletonBar({ width, height = 'h-2.5' }: { width: string; height?: string }) {
  return <div className={cn(height, 'rounded-full bg-neutral-800', width)} />
}

function useTypewriter() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing')

  const currentPhrase = JURY_PHRASES[phraseIndex] ?? ''

  useEffect(() => {
    if (phase === 'typing') {
      if (displayText.length < currentPhrase.length) {
        const timeout = setTimeout(
          () => setDisplayText(currentPhrase.slice(0, displayText.length + 1)),
          45 + Math.random() * 30
        )
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => setPhase('pausing'), 100)
        return () => clearTimeout(timeout)
      }
    }

    if (phase === 'pausing') {
      const timeout = setTimeout(() => setPhase('deleting'), 1600)
      return () => clearTimeout(timeout)
    }

    if (phase === 'deleting') {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => setDisplayText(displayText.slice(0, -1)), 25)
        return () => clearTimeout(timeout)
      } else {
        setPhraseIndex((prev) => (prev + 1) % JURY_PHRASES.length)
        setPhase('typing')
      }
    }
  }, [phase, displayText, currentPhrase])

  const progress = currentPhrase.length > 0 ? displayText.length / currentPhrase.length : 0

  return { displayText, progress }
}

function JuryThinking({ displayText }: { displayText: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-neutral-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="font-medium whitespace-nowrap w-40">
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

function JurorCardSkeleton() {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-800/50',
        'bg-neutral-900/50',
        'p-5',
        'space-y-5'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-800" />
          <div className="space-y-1.5">
            <SkeletonBar width="w-16" height="h-4" />
            <SkeletonBar width="w-12" height="h-3" />
          </div>
        </div>
        <div className="text-right space-y-1">
          <SkeletonBar width="w-10" height="h-5" />
          <SkeletonBar width="w-14" height="h-3" />
        </div>
      </div>

      {/* Position Badge */}
      <SkeletonBar width="w-24" height="h-6" />

      {/* Score Bars */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <SkeletonBar width="w-24" height="h-3" />
              <SkeletonBar width="w-10" height="h-3" />
            </div>
            <div className="h-1.5 bg-neutral-800 rounded-full" />
          </div>
        ))}
      </div>

      {/* Confidence */}
      <div className="pt-3 border-t border-neutral-800/50">
        <div className="flex items-center justify-between">
          <SkeletonBar width="w-16" height="h-3" />
          <SkeletonBar width="w-8" height="h-3" />
        </div>
      </div>
    </div>
  )
}

export function JurySkeleton() {
  const { displayText, progress } = useTypewriter()
  const skeletonOpacity = 0.4 + progress * 0.6

  return (
    <div className="space-y-8">
      {/* Header with thinking indicator */}
      <div className="flex items-start justify-between">
        <div
          className="space-y-2 transition-opacity duration-100"
          style={{ opacity: skeletonOpacity }}
        >
          <SkeletonBar width="w-40" height="h-7" />
          <SkeletonBar width="w-64" height="h-4" />
        </div>
        <JuryThinking displayText={displayText} />
      </div>

      {/* Juror Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-100"
        style={{ opacity: skeletonOpacity }}
      >
        <JurorCardSkeleton />
        <JurorCardSkeleton />
      </div>

      {/* Deliberation placeholder */}
      <div
        className="space-y-4 transition-opacity duration-100"
        style={{ opacity: skeletonOpacity }}
      >
        <SkeletonBar width="w-32" height="h-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-neutral-800 flex-shrink-0" />
              <SkeletonBar width={i === 1 ? 'w-5/6' : 'w-4/6'} height="h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Resolution placeholder */}
      <div
        className="rounded-xl border border-neutral-800/50 bg-neutral-900/50 p-5 space-y-4 transition-opacity duration-100"
        style={{ opacity: skeletonOpacity }}
      >
        <SkeletonBar width="w-36" height="h-5" />
        <div className="space-y-2">
          <SkeletonBar width="w-full" height="h-4" />
          <SkeletonBar width="w-4/5" height="h-4" />
        </div>
      </div>
    </div>
  )
}
