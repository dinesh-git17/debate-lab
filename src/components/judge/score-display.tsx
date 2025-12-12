// src/components/judge/score-display.tsx
/**
 * Displays detailed scoring breakdown for a debate participant.
 * Renders aggregate scores, category breakdowns, and qualitative feedback.
 */

'use client'

import { memo } from 'react'

import { cn } from '@/lib/utils'

import type { CategoryScore, ParticipantScores } from '@/types/judge'

interface ScoreDisplayProps {
  scores: ParticipantScores
  className?: string
}

function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600 dark:text-green-400'
  if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

export const ScoreDisplay = memo(function ScoreDisplay({ scores, className }: ScoreDisplayProps) {
  const speakerColor = scores.speaker === 'for' ? 'border-blue-500' : 'border-red-500'

  return (
    <div className={cn('rounded-xl border-2 bg-card', speakerColor, className)}>
      <div className="border-b p-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{scores.label}</h3>
            {scores.model && <p className="text-sm text-muted-foreground">{scores.model}</p>}
          </div>
          <div className="text-right">
            <div className={cn('text-3xl font-bold', getScoreColor(scores.percentage))}>
              {scores.totalScore}
            </div>
            <div className="text-xs text-muted-foreground">of {scores.maxPossibleScore} points</div>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full transition-all duration-500', getBarColor(scores.percentage))}
            style={{ width: `${scores.percentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 p-4">
        {scores.categoryScores.map((cat) => (
          <CategoryScoreRow key={cat.category} score={cat} />
        ))}
      </div>

      <div className="grid gap-4 border-t p-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-green-600 dark:text-green-400">
            Strengths
          </h4>
          <ul className="space-y-1 text-sm">
            {scores.strengths.map((s, i) => (
              <li key={i} className="text-muted-foreground">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            Areas to Improve
          </h4>
          <ul className="space-y-1 text-sm">
            {scores.weaknesses.map((w, i) => (
              <li key={i} className="text-muted-foreground">
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {scores.standoutMoments.length > 0 && (
        <div className="border-t bg-muted/30 p-4">
          <h4 className="mb-2 text-sm font-semibold">Standout Moments</h4>
          <ul className="space-y-2 text-sm">
            {scores.standoutMoments.map((m, i) => (
              <li key={i} className="italic text-muted-foreground">
                &ldquo;{m}&rdquo;
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

function CategoryScoreRow({ score }: { score: CategoryScore }) {
  const percentage = score.percentage

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">{score.label}</span>
        <span className="text-sm text-muted-foreground">
          {score.score}/{score.maxScore}
        </span>
      </div>
      <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all duration-500', getBarColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {score.feedback && <p className="mt-1 text-xs text-muted-foreground">{score.feedback}</p>}
    </div>
  )
}
