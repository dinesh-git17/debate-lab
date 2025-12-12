// src/components/judge/educational-insights.tsx
/**
 * Renders educational takeaways from debate judge analysis.
 * Surfaces strengths, improvement areas, and lessons to help users develop argumentation skills.
 */

'use client'

import { cn } from '@/lib/utils'

import type { JudgeAnalysis } from '@/types/judge'

interface EducationalInsightsProps {
  analysis: JudgeAnalysis
  className?: string
}

export function EducationalInsights({ analysis, className }: EducationalInsightsProps) {
  return (
    <section className={cn('space-y-8', className)}>
      <div>
        <h2 className="mb-4 text-xl font-bold">Educational Takeaways</h2>
        <p className="text-muted-foreground">
          Insights for improving debate and argumentation skills
        </p>
      </div>

      {analysis.whatWorkedWell.length > 0 && (
        <div className="rounded-xl border bg-green-50 p-6 dark:bg-green-950/20">
          <h3 className="mb-3 font-semibold text-green-700 dark:text-green-400">
            What Worked Well
          </h3>
          <ul className="space-y-2">
            {analysis.whatWorkedWell.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-green-600">&#x2022;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.areasForImprovement.length > 0 && (
        <div className="rounded-xl border bg-amber-50 p-6 dark:bg-amber-950/20">
          <h3 className="mb-3 font-semibold text-amber-700 dark:text-amber-400">
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {analysis.areasForImprovement.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-amber-600">&#x2022;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.lessonsForDebaters.length > 0 && (
        <div className="rounded-xl border bg-blue-50 p-6 dark:bg-blue-950/20">
          <h3 className="mb-3 font-semibold text-blue-700 dark:text-blue-400">
            Lessons for Debaters
          </h3>
          <ul className="space-y-2">
            {analysis.lessonsForDebaters.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-blue-600">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.turningMoments && analysis.turningMoments.length > 0 && (
        <div className="rounded-xl border p-6">
          <h3 className="mb-3 font-semibold">Turning Moments</h3>
          <ul className="space-y-2">
            {analysis.turningMoments.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span>&#x2192;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.missedOpportunities && analysis.missedOpportunities.length > 0 && (
        <div className="rounded-xl border p-6">
          <h3 className="mb-3 font-semibold">Missed Opportunities</h3>
          <ul className="space-y-2">
            {analysis.missedOpportunities.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span>&#x25CB;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
