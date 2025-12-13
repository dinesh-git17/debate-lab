// scoring-rubric.ts
/**
 * Debate scoring rubrics based on academic judging criteria.
 * Defines weighted categories and utility functions for score calculations.
 */

import type { DebateQualityRating, ScoringCategory, ScoringRubric } from '@/types/judge'
export const SCORING_RUBRICS: ScoringRubric[] = [
  {
    category: 'argument_quality',
    label: 'Argument Quality',
    maxScore: 25,
    weight: 0.3,
    criteria: [
      'Logical structure and coherence',
      'Strength of reasoning',
      'Relevance to the topic',
      'Depth of analysis',
      'Original insights or perspectives',
    ],
  },
  {
    category: 'evidence_support',
    label: 'Evidence & Support',
    maxScore: 20,
    weight: 0.25,
    criteria: [
      'Use of facts, examples, or reasoning',
      'Credibility of supporting points',
      'Appropriate use of evidence',
      'Connection between evidence and claims',
      'Variety of supporting material',
    ],
  },
  {
    category: 'rebuttal_effectiveness',
    label: 'Rebuttal Effectiveness',
    maxScore: 20,
    weight: 0.2,
    criteria: [
      'Direct engagement with opponent arguments',
      'Identification of weaknesses',
      'Quality of counter-arguments',
      'Defense of own position under attack',
      'Strategic prioritization of points',
    ],
  },
  {
    category: 'clarity_presentation',
    label: 'Clarity & Presentation',
    maxScore: 20,
    weight: 0.15,
    criteria: [
      'Clear and organized structure',
      'Accessible language',
      'Effective transitions',
      'Persuasive delivery',
      'Appropriate length and pacing',
    ],
  },
  {
    category: 'rule_adherence',
    label: 'Rule Adherence',
    maxScore: 15,
    weight: 0.1,
    criteria: [
      'Stayed on topic',
      'Followed turn structure',
      'Maintained professional discourse',
      'No personal attacks',
      'Respected format conventions',
    ],
  },
]

export const MAX_TOTAL_SCORE = SCORING_RUBRICS.reduce((sum, r) => sum + r.maxScore, 0)

export function getRubric(category: ScoringCategory): ScoringRubric | undefined {
  return SCORING_RUBRICS.find((r) => r.category === category)
}

export function calculateWeightedScore(
  scores: { category: ScoringCategory; score: number }[]
): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const { category, score } of scores) {
    const rubric = getRubric(category)
    if (rubric) {
      const normalizedScore = score / rubric.maxScore
      weightedSum += normalizedScore * rubric.weight
      totalWeight += rubric.weight
    }
  }

  return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0
}

export function getQualityRating(percentage: number): DebateQualityRating {
  if (percentage >= 85) return 'excellent'
  if (percentage >= 70) return 'good'
  if (percentage >= 55) return 'fair'
  return 'developing'
}

export function getQualityDescription(rating: DebateQualityRating): string {
  const descriptions: Record<DebateQualityRating, string> = {
    excellent:
      'An exceptionally well-argued debate with sophisticated reasoning and strong engagement.',
    good: 'A solid debate with clear arguments and effective back-and-forth.',
    fair: 'A reasonable debate with some strong moments but room for improvement.',
    developing: 'A debate that shows potential but has significant areas for growth.',
  }
  return descriptions[rating]
}

export function validateCategoryScore(category: ScoringCategory, score: number): number {
  const rubric = getRubric(category)
  if (!rubric) return 0
  return Math.min(Math.max(score, 0), rubric.maxScore)
}

export function calculateTotalScore(
  categoryScores: { category: ScoringCategory; score: number }[]
): number {
  return categoryScores.reduce((total, { category, score }) => {
    return total + validateCategoryScore(category, score)
  }, 0)
}

export function getScoreColorClass(percentage: number): string {
  if (percentage >= 80) return 'text-green-600 dark:text-green-400'
  if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export function getBarColorClass(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}
