/**
 * Individual juror evaluation card displaying scores and justifications.
 * Shows evidence strength bars for each scoring category.
 */

'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

import { JUROR_CONFIGS, JURY_SCORING_RUBRICS } from '@/lib/jury-scoring-rubric'
import { cn } from '@/lib/utils'

import type { JurorEvaluation } from '@/types/jury'

const JUROR_LOGOS: Record<'gemini' | 'deepseek', string> = {
  gemini: '/models/gemini.svg',
  deepseek: '/models/deepseek.svg',
}

interface JurorCardProps {
  evaluation: JurorEvaluation
  position: 'for' | 'against'
}

interface ScoreBarProps {
  label: string
  score: number
  maxScore: number
  isPenalty?: boolean
}

function ScoreBar({ label, score, maxScore, isPenalty = false }: ScoreBarProps) {
  const percentage = Math.round((score / maxScore) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground/80">{label}</span>
        <span className={cn('font-medium', isPenalty ? 'text-amber-400/80' : 'text-foreground/70')}>
          {isPenalty ? `-${score}` : score}/{maxScore}
        </span>
      </div>
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            isPenalty
              ? 'bg-gradient-to-r from-amber-600/60 to-amber-500/40'
              : percentage >= 70
                ? 'bg-gradient-to-r from-emerald-600/70 to-emerald-500/50'
                : percentage >= 50
                  ? 'bg-gradient-to-r from-slate-500/70 to-slate-400/50'
                  : 'bg-gradient-to-r from-neutral-600/70 to-neutral-500/50'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
        />
      </div>
    </div>
  )
}

export function JurorCard({ evaluation, position }: JurorCardProps) {
  const config = JUROR_CONFIGS[evaluation.jurorId]
  const scores = position === 'for' ? evaluation.forScores : evaluation.againstScores
  const totalScore = position === 'for' ? evaluation.totalForScore : evaluation.totalAgainstScore
  const scorePercentage = Math.round((totalScore / evaluation.maxPossibleScore) * 100)

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
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center p-1.5',
              config.id === 'gemini' ? 'bg-neutral-900' : 'bg-white'
            )}
          >
            <Image
              src={JUROR_LOGOS[config.id]}
              alt={config.name}
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{config.name}</h4>
            <p className="text-xs text-muted-foreground/60">{config.provider}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-foreground">{scorePercentage}%</div>
          <div className="text-xs text-muted-foreground/60">
            {totalScore}/{evaluation.maxPossibleScore}
          </div>
        </div>
      </div>

      {/* Position Badge */}
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          position === 'for'
            ? 'bg-teal-500/10 text-teal-400/90 border border-teal-500/20'
            : 'bg-amber-500/10 text-amber-400/90 border border-amber-500/20'
        )}
      >
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            position === 'for' ? 'bg-teal-400' : 'bg-amber-400'
          )}
        />
        {position === 'for' ? 'FOR Position' : 'AGAINST Position'}
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        {JURY_SCORING_RUBRICS.map((rubric) => {
          const scoreData = scores.find((s) => s.category === rubric.category)
          if (!scoreData) return null

          return (
            <ScoreBar
              key={rubric.category}
              label={rubric.label}
              score={scoreData.score}
              maxScore={rubric.maxScore}
              isPenalty={rubric.isPenalty}
            />
          )
        })}
      </div>

      {/* Confidence */}
      <div className="pt-3 border-t border-neutral-800/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground/60">Confidence</span>
          <span className="text-muted-foreground/80">
            {Math.round(evaluation.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
