/**
 * Scoring rubric definitions for the evidence-based jury deliberation system.
 * Jurors evaluate factual accuracy and evidence quality, not debate performance.
 */

import type {
  EvidenceCategoryType,
  EvidenceRubricCategory,
  JurorConfig,
  JurorId,
} from '@/types/jury'

/**
 * Evidence scoring rubric - 5 categories totaling 100 points
 */
export const JURY_SCORING_RUBRICS: EvidenceRubricCategory[] = [
  {
    category: 'factual_accuracy',
    label: 'Factual Accuracy',
    maxScore: 25,
    description: 'Claims align with verifiable facts',
    criteria: [
      'Claims align with established, verifiable facts',
      'No demonstrably false statements',
      'Accurate representation of data, studies, or statistics',
      'Proper contextualization of facts',
    ],
    isPenalty: false,
  },
  {
    category: 'evidence_strength',
    label: 'Evidence Strength',
    maxScore: 25,
    description: 'Claims supported by concrete evidence',
    criteria: [
      'Claims backed by concrete, relevant evidence',
      'Quality and specificity of cited examples',
      'Direct relevance of evidence to claims made',
      'Appropriate level of detail in supporting material',
    ],
    isPenalty: false,
  },
  {
    category: 'source_quality',
    label: 'Source Quality',
    maxScore: 20,
    description: 'Credibility and recency of implied sources',
    criteria: [
      'Credibility of implied or referenced sources',
      'Recency and relevance of information',
      'Diversity of supporting evidence types',
      'Appropriate attribution and specificity',
    ],
    isPenalty: false,
  },
  {
    category: 'logical_consistency',
    label: 'Logical Consistency',
    maxScore: 20,
    description: 'Internal consistency and valid reasoning',
    criteria: [
      'Internal consistency across all claims',
      'No contradictory statements',
      'Valid logical structure connecting claims',
      'Coherent reasoning chain from evidence to conclusion',
    ],
    isPenalty: false,
  },
  {
    category: 'unsupported_claims',
    label: 'Unsupported Claims',
    maxScore: 10,
    description: 'Penalty for assertions without backing',
    criteria: [
      'Deduction for claims presented without evidence',
      'Penalty for overconfident assertions',
      'Reduction for speculation presented as fact',
      'Deduction for unqualified absolute statements',
    ],
    isPenalty: true,
  },
]

/**
 * Maximum possible score for each side
 */
export const MAX_JURY_SCORE = JURY_SCORING_RUBRICS.reduce((sum, r) => sum + r.maxScore, 0)

/**
 * Get rubric category by type
 */
export function getRubricCategory(
  category: EvidenceCategoryType
): EvidenceRubricCategory | undefined {
  return JURY_SCORING_RUBRICS.find((r) => r.category === category)
}

/**
 * Calculate total score from category scores
 */
export function calculateJuryScore(
  scores: { category: EvidenceCategoryType; score: number }[]
): number {
  return scores.reduce((total, s) => {
    const rubric = getRubricCategory(s.category)
    if (!rubric) return total

    if (rubric.isPenalty) {
      return total - Math.min(s.score, rubric.maxScore)
    }
    return total + Math.min(s.score, rubric.maxScore)
  }, 0)
}

/**
 * Validate that a score is within bounds for its category
 */
export function validateCategoryScore(category: EvidenceCategoryType, score: number): number {
  const rubric = getRubricCategory(category)
  if (!rubric) return 0

  return Math.max(0, Math.min(score, rubric.maxScore))
}

/**
 * Juror configurations for UI display
 */
export const JUROR_CONFIGS: Record<JurorId, JurorConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    provider: 'Google',
    logo: '/logos/gemini.svg',
    color: 'hsl(210, 60%, 55%)',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'DeepSeek',
    logo: '/logos/deepseek.svg',
    color: 'hsl(160, 50%, 45%)',
  },
}

/**
 * Get quality rating based on percentage score
 */
export function getEvidenceQualityRating(
  percentage: number
): 'strong' | 'moderate' | 'weak' | 'insufficient' {
  if (percentage >= 80) return 'strong'
  if (percentage >= 60) return 'moderate'
  if (percentage >= 40) return 'weak'
  return 'insufficient'
}

/**
 * Verdict language templates - neutral, legal-document tone
 */
export const VERDICT_LANGUAGE = {
  favor: {
    for: 'Evidence favored the affirmative position',
    against: 'Evidence favored the negative position',
    inconclusive: 'Evidence did not conclusively favor either position',
  },
  comparison: {
    stronger: 'demonstrated stronger evidentiary support',
    fewer_inaccuracies: 'contained fewer factual inaccuracies',
    better_sourced: 'presented better-sourced claims',
    more_consistent: 'maintained greater logical consistency',
  },
  confidence: {
    high: 'with high confidence',
    moderate: 'with moderate confidence',
    low: 'with limited confidence due to insufficient evidence',
  },
} as const

/**
 * Standard disclaimer for jury deliberation results
 */
export const JURY_DISCLAIMER =
  'This analysis evaluates evidence quality and factual accuracy as presented in the debate. ' +
  'It does not assess argument merit, persuasiveness, or determine objective truth. ' +
  'AI evaluations may contain errors and should be considered alongside other sources.'
