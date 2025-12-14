/**
 * Type definitions for the evidence-based jury deliberation system.
 * Used by independent AI jurors (Gemini, DeepSeek) to evaluate factual accuracy.
 */

/**
 * Types of factual claims that can be extracted from debate arguments
 */
export type ClaimType = 'factual' | 'causal' | 'definitional' | 'evaluative'

/**
 * Evidence scoring categories used by jurors
 */
export type EvidenceCategoryType =
  | 'factual_accuracy'
  | 'evidence_strength'
  | 'source_quality'
  | 'logical_consistency'
  | 'unsupported_claims'

/**
 * Juror identifiers
 */
export type JurorId = 'gemini' | 'deepseek'

/**
 * Phase of the jury deliberation process
 */
export type JuryPhase =
  | 'idle'
  | 'extracting'
  | 'scoring'
  | 'deliberating'
  | 'resolving'
  | 'completed'
  | 'error'

/**
 * Confidence level for final resolution
 */
export type ConfidenceLevel = 'high' | 'moderate' | 'low'

/**
 * Evidence favors determination
 */
export type EvidenceFavors = 'for' | 'against' | 'inconclusive'

/**
 * A factual claim extracted from debate arguments
 */
export interface ExtractedClaim {
  id: string
  speaker: 'for' | 'against'
  originalText: string
  normalizedStatement: string
  turnNumber: number
  claimType: ClaimType
}

/**
 * Score for a single evidence category
 */
export interface EvidenceCategory {
  category: EvidenceCategoryType
  score: number
  maxScore: number
  justification: string
  referencedClaims: string[]
}

/**
 * Complete evaluation from a single juror
 */
export interface JurorEvaluation {
  jurorId: JurorId
  jurorName: string
  evaluatedAt: Date
  forScores: EvidenceCategory[]
  againstScores: EvidenceCategory[]
  totalForScore: number
  totalAgainstScore: number
  maxPossibleScore: number
  confidence: number
  notes: string
}

/**
 * A disagreement between jurors on a specific claim/category
 */
export interface ScoreDisagreement {
  claimId: string
  category: EvidenceCategoryType
  geminiScore: number
  deepseekScore: number
  geminiJustification: string
  deepseekJustification: string
  resolution?: string
  resolvedScore?: number
}

/**
 * A single exchange in the deliberation process
 */
export interface DeliberationExchange {
  round: number
  speaker: JurorId
  content: string
  adjustedScores?: { claimId: string; category: EvidenceCategoryType; newScore: number }[]
  timestamp: Date
}

/**
 * Final resolution from the arbiter
 */
export interface ArbiterResolution {
  finalForScore: number
  finalAgainstScore: number
  maxPossibleScore: number
  evidenceFavors: EvidenceFavors
  confidenceLevel: ConfidenceLevel
  rationale: string
  penaltyNotes: string[]
  disclaimer: string
}

/**
 * Complete jury deliberation result
 */
export interface JuryDeliberation {
  debateId: string
  phase: JuryPhase
  extractedClaims: ExtractedClaim[]
  geminiEvaluation: JurorEvaluation | null
  deepseekEvaluation: JurorEvaluation | null
  disagreements: ScoreDisagreement[]
  deliberationLog: DeliberationExchange[]
  arbiterResolution: ArbiterResolution | null
  generatedAt: Date
  processingTimeMs: number
}

/**
 * API response for jury deliberation
 */
export interface JuryDeliberationResponse {
  success: boolean
  deliberation?: JuryDeliberation
  error?: string
  cached: boolean
}

/**
 * Juror configuration for UI display
 */
export interface JurorConfig {
  id: JurorId
  name: string
  provider: string
  logo: string
  color: string
}

/**
 * Evidence rubric category definition
 */
export interface EvidenceRubricCategory {
  category: EvidenceCategoryType
  label: string
  maxScore: number
  description: string
  criteria: string[]
  isPenalty: boolean
}
