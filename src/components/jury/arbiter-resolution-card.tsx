/**
 * Arbiter resolution card displaying final verdict.
 * Uses neutral, legal-document tone without celebratory language.
 */

'use client'

import { motion } from 'framer-motion'

import { VERDICT_LANGUAGE } from '@/lib/jury-scoring-rubric'
import { cn } from '@/lib/utils'

import type { ArbiterResolution } from '@/types/jury'

interface ArbiterResolutionCardProps {
  resolution: ArbiterResolution
}

function ScoreComparison({
  forScore,
  againstScore,
  maxScore,
}: {
  forScore: number
  againstScore: number
  maxScore: number
}) {
  const forPercentage = Math.round((forScore / maxScore) * 100)
  const againstPercentage = Math.round((againstScore / maxScore) * 100)

  return (
    <div className="flex items-center gap-4">
      {/* FOR Score */}
      <div className="flex-1 text-right">
        <div className="text-xs text-muted-foreground/60 mb-1">FOR</div>
        <div className="flex items-center justify-end gap-2">
          <div className="flex-1 max-w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-600/60 to-teal-500/40 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${forPercentage}%` }}
              transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            />
          </div>
          <span className="text-sm font-medium text-foreground/80 w-12">{forPercentage}%</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-neutral-700" />

      {/* AGAINST Score */}
      <div className="flex-1">
        <div className="text-xs text-muted-foreground/60 mb-1">AGAINST</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground/80 w-12">{againstPercentage}%</span>
          <div className="flex-1 max-w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500/40 to-amber-600/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${againstPercentage}%` }}
              transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ArbiterResolutionCard({ resolution }: ArbiterResolutionCardProps) {
  const verdictText = VERDICT_LANGUAGE.favor[resolution.evidenceFavors]
  const confidenceText = VERDICT_LANGUAGE.confidence[resolution.confidenceLevel]

  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-800/50',
        'bg-neutral-900/50',
        'p-6',
        'space-y-6'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Resolution</h3>
          <p className="text-xs text-muted-foreground/60">Arbiter determination</p>
        </div>
      </div>

      {/* Score Comparison */}
      <ScoreComparison
        forScore={resolution.finalForScore}
        againstScore={resolution.finalAgainstScore}
        maxScore={resolution.maxPossibleScore}
      />

      {/* Verdict */}
      <div className="space-y-3">
        <div
          className={cn(
            'px-4 py-3 rounded-lg text-center',
            resolution.evidenceFavors === 'inconclusive'
              ? 'bg-slate-500/10 border border-slate-500/20'
              : resolution.evidenceFavors === 'for'
                ? 'bg-teal-500/10 border border-teal-500/20'
                : 'bg-amber-500/10 border border-amber-500/20'
          )}
        >
          <p
            className={cn(
              'text-sm font-medium',
              resolution.evidenceFavors === 'inconclusive'
                ? 'text-slate-300'
                : resolution.evidenceFavors === 'for'
                  ? 'text-teal-300'
                  : 'text-amber-300'
            )}
          >
            {verdictText}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">{confidenceText}</p>
        </div>

        {/* Rationale */}
        <p className="text-sm text-muted-foreground/80 leading-relaxed">{resolution.rationale}</p>
      </div>

      {/* Penalty Notes */}
      {resolution.penaltyNotes.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wide">
            Adjustments Applied
          </div>
          <ul className="space-y-1">
            {resolution.penaltyNotes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground/70">
                <span className="text-amber-400/60 mt-0.5">-</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="pt-4 border-t border-neutral-800/50">
        <p className="text-xs text-muted-foreground/40 text-center leading-relaxed">
          {resolution.disclaimer}
        </p>
      </div>
    </div>
  )
}
