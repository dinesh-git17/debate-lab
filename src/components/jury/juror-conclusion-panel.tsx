/**
 * Juror Conclusion panel displaying the arbiter's summary of deliberation.
 * Shows human-readable bullet points instead of raw exchange logs.
 */

'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface JurorConclusionPanelProps {
  summary: string[]
  className?: string
}

export function JurorConclusionPanel({ summary, className }: JurorConclusionPanelProps) {
  if (summary.length === 0) return null

  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-800/50',
        'bg-neutral-900/50',
        'overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800/50">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-violet-400/80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Juror Conclusion</h3>
          <p className="text-xs text-muted-foreground/60">Summary of deliberation findings</p>
        </div>
      </div>

      {/* Summary Bullets */}
      <div className="px-5 py-4">
        <ul className="space-y-3">
          {summary.map((point, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.22, 0.61, 0.36, 1],
                delay: index * 0.1,
              }}
              className="flex items-start gap-3"
            >
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-violet-400/60 flex-shrink-0" />
              <span className="text-sm text-foreground/80 leading-relaxed">{point}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}
