/**
 * Jury deliberation service for evidence-based fact checking.
 * GPT-4o-mini extracts claims, Gemini/DeepSeek score independently, Gemini arbitrates.
 */

import { getEngineState } from '@/lib/engine-store'
import { JURY_DISCLAIMER, JURY_SCORING_RUBRICS, MAX_JURY_SCORE } from '@/lib/jury-scoring-rubric'
import {
  deleteDeliberation,
  getStoredDeliberation,
  hasStoredDeliberation,
  storeDeliberation,
} from '@/lib/jury-store'
import { logger } from '@/lib/logging'
import {
  ARBITER_SYSTEM_PROMPT,
  buildArbiterPrompt,
  buildExtractionPrompt,
  buildScoringPrompt,
  EVIDENCE_EXTRACTION_SYSTEM_PROMPT,
  JUROR_SCORING_SYSTEM_PROMPT,
} from '@/lib/prompts/jury-prompts'
import { getSession } from '@/lib/session-store'
import { generate } from '@/services/llm'
import { isMockMode } from '@/services/mock-debate-engine'

import type {
  ArbiterResolution,
  EvidenceCategory,
  EvidenceCategoryType,
  ExtractedClaim,
  JurorEvaluation,
  JurorId,
  JuryDeliberation,
  JuryDeliberationResponse,
  ScoreDisagreement,
} from '@/types/jury'

/**
 * Generate mock jury deliberation for testing without API calls
 */
function generateMockJuryDeliberation(debateId: string): JuryDeliberation {
  const mockClaims: ExtractedClaim[] = [
    {
      id: 'F1',
      speaker: 'for',
      originalText: 'Studies show that X leads to Y in 85% of cases',
      normalizedStatement: 'X causes Y with 85% frequency',
      turnNumber: 1,
      claimType: 'causal',
    },
    {
      id: 'F2',
      speaker: 'for',
      originalText: 'The definition clearly states that this falls under category A',
      normalizedStatement: 'This phenomenon is classified as category A',
      turnNumber: 2,
      claimType: 'definitional',
    },
    {
      id: 'A1',
      speaker: 'against',
      originalText: 'Research from 2023 contradicts this assumption',
      normalizedStatement: 'Recent research contradicts the X-Y relationship',
      turnNumber: 1,
      claimType: 'factual',
    },
    {
      id: 'A2',
      speaker: 'against',
      originalText: 'The data shows no significant correlation',
      normalizedStatement: 'No significant correlation exists between X and Y',
      turnNumber: 3,
      claimType: 'causal',
    },
  ]

  const buildMockEvaluation = (jurorId: JurorId, jurorName: string): JurorEvaluation => {
    const baseScore = 60 + Math.floor(Math.random() * 25)
    const forScores: EvidenceCategory[] = JURY_SCORING_RUBRICS.map((rubric) => ({
      category: rubric.category as EvidenceCategoryType,
      score: Math.round((baseScore / 100) * rubric.maxScore),
      maxScore: rubric.maxScore,
      justification: `Based on claims ${rubric.isPenalty ? 'F1, F2' : 'F1'}, the ${rubric.label.toLowerCase()} demonstrates ${baseScore > 70 ? 'adequate' : 'limited'} support.`,
      referencedClaims: rubric.isPenalty ? ['F1', 'F2'] : ['F1'],
    }))

    const againstScores: EvidenceCategory[] = JURY_SCORING_RUBRICS.map((rubric) => ({
      category: rubric.category as EvidenceCategoryType,
      score: Math.round(((baseScore + 5) / 100) * rubric.maxScore),
      maxScore: rubric.maxScore,
      justification: `Claims ${rubric.isPenalty ? 'A1, A2' : 'A1'} show ${baseScore > 70 ? 'stronger' : 'comparable'} ${rubric.label.toLowerCase()}.`,
      referencedClaims: rubric.isPenalty ? ['A1', 'A2'] : ['A1'],
    }))

    const totalForScore = forScores.reduce((sum, s) => sum + s.score, 0)
    const totalAgainstScore = againstScores.reduce((sum, s) => sum + s.score, 0)

    return {
      jurorId,
      jurorName,
      evaluatedAt: new Date(),
      forScores,
      againstScores,
      totalForScore,
      totalAgainstScore,
      maxPossibleScore: MAX_JURY_SCORE,
      confidence: 0.75 + Math.random() * 0.2,
      notes: `[MOCK] ${jurorName} evaluation based on simulated analysis of extracted claims.`,
    }
  }

  const geminiEval = buildMockEvaluation('gemini', 'Gemini')
  const deepseekEval = buildMockEvaluation('deepseek', 'DeepSeek')

  const disagreements: ScoreDisagreement[] = [
    {
      claimId: 'F1',
      category: 'evidence_strength',
      geminiScore: geminiEval.forScores.find((s) => s.category === 'evidence_strength')?.score ?? 0,
      deepseekScore:
        deepseekEval.forScores.find((s) => s.category === 'evidence_strength')?.score ?? 0,
      geminiJustification: 'Claim F1 provides specific statistical support.',
      deepseekJustification: 'Claim F1 lacks source attribution for the statistic.',
      resolution: 'Split the difference given valid points from both jurors.',
    },
  ]

  // Deliberation phase removed for optimization - arbiter handles summary directly
  const deliberationLog: JuryDeliberation['deliberationLog'] = []

  const avgForScore = (geminiEval.totalForScore + deepseekEval.totalForScore) / 2
  const avgAgainstScore = (geminiEval.totalAgainstScore + deepseekEval.totalAgainstScore) / 2

  const evidenceFavors =
    Math.abs(avgForScore - avgAgainstScore) < MAX_JURY_SCORE * 0.05
      ? 'inconclusive'
      : avgForScore > avgAgainstScore
        ? 'for'
        : 'against'

  const arbiterResolution: ArbiterResolution = {
    finalForScore: Math.round(avgForScore),
    finalAgainstScore: Math.round(avgAgainstScore),
    maxPossibleScore: MAX_JURY_SCORE,
    evidenceFavors,
    confidenceLevel: 'moderate',
    rationale:
      evidenceFavors === 'inconclusive'
        ? 'Both positions presented comparable evidence quality. Scores within 5% margin.'
        : `Evidence ${evidenceFavors === 'for' ? 'favored the affirmative' : 'favored the negative'} position based on ${evidenceFavors === 'for' ? 'stronger source attribution' : 'more consistent logical framework'}.`,
    deliberationSummary: [
      'Both jurors independently evaluated factual claims from each position.',
      'Minor disagreement on evidence strength was resolved through deliberation.',
      'The affirmative position demonstrated stronger source attribution overall.',
      'Penalties were applied to claims presented without supporting evidence.',
    ],
    penaltyNotes: ['Minor penalty applied for unsupported claim (-2 points)'],
    disclaimer: '[MOCK MODE] ' + JURY_DISCLAIMER,
  }

  return {
    debateId,
    phase: 'completed',
    extractedClaims: mockClaims,
    geminiEvaluation: geminiEval,
    deepseekEvaluation: deepseekEval,
    disagreements,
    deliberationLog,
    arbiterResolution,
    generatedAt: new Date(),
    processingTimeMs: 1500,
  }
}

/**
 * Phase 1: Extract factual claims from debate transcript
 */
async function extractClaims(
  topic: string,
  debateTranscript: { speaker: 'for' | 'against'; content: string; turnNumber: number }[]
): Promise<ExtractedClaim[]> {
  const prompt = buildExtractionPrompt(topic, debateTranscript)

  const result = await generate({
    provider: 'openai',
    params: {
      systemPrompt: EVIDENCE_EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 4000,
      temperature: 0.2,
      model: 'gpt-4o-mini',
    },
    enableRetry: true,
    enableRateLimit: true,
  })

  const parsed = parseJsonResponse<{ claims: ExtractedClaim[] }>(result.content)
  return parsed.claims ?? []
}

/**
 * Phase 2: Get independent scoring from a single juror
 */
async function getJurorEvaluation(
  jurorId: JurorId,
  topic: string,
  claims: ExtractedClaim[]
): Promise<JurorEvaluation> {
  const provider = jurorId === 'gemini' ? 'gemini' : 'deepseek'
  const jurorName = jurorId === 'gemini' ? 'Gemini' : 'DeepSeek'

  const prompt = buildScoringPrompt(topic, claims)

  const result = await generate({
    provider,
    params: {
      systemPrompt: JUROR_SCORING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 4000,
      temperature: 0.3,
    },
    enableRetry: true,
    enableRateLimit: true,
  })

  const parsed = parseJsonResponse<{
    forScores: EvidenceCategory[]
    againstScores: EvidenceCategory[]
    confidence: number
    notes: string
  }>(result.content)

  const totalForScore = (parsed.forScores ?? []).reduce((sum, s) => {
    const rubric = JURY_SCORING_RUBRICS.find((r) => r.category === s.category)
    if (rubric?.isPenalty) return sum - Math.min(s.score, rubric.maxScore)
    return sum + Math.min(s.score, rubric?.maxScore ?? 0)
  }, 0)

  const totalAgainstScore = (parsed.againstScores ?? []).reduce((sum, s) => {
    const rubric = JURY_SCORING_RUBRICS.find((r) => r.category === s.category)
    if (rubric?.isPenalty) return sum - Math.min(s.score, rubric.maxScore)
    return sum + Math.min(s.score, rubric?.maxScore ?? 0)
  }, 0)

  return {
    jurorId,
    jurorName,
    evaluatedAt: new Date(),
    forScores: parsed.forScores ?? [],
    againstScores: parsed.againstScores ?? [],
    totalForScore: Math.max(0, totalForScore),
    totalAgainstScore: Math.max(0, totalAgainstScore),
    maxPossibleScore: MAX_JURY_SCORE,
    confidence: parsed.confidence ?? 0.5,
    notes: parsed.notes ?? '',
  }
}

/**
 * Identify score disagreements between jurors (>10% difference)
 * Used by arbiter to focus resolution on contentious areas.
 */
function identifyDisagreements(
  geminiEval: JurorEvaluation,
  deepseekEval: JurorEvaluation
): ScoreDisagreement[] {
  const disagreements: ScoreDisagreement[] = []

  for (const category of JURY_SCORING_RUBRICS) {
    const geminiFor = geminiEval.forScores.find((s) => s.category === category.category)
    const deepseekFor = deepseekEval.forScores.find((s) => s.category === category.category)

    if (geminiFor && deepseekFor) {
      const diff = Math.abs(geminiFor.score - deepseekFor.score)
      if (diff > category.maxScore * 0.1) {
        disagreements.push({
          claimId: geminiFor.referencedClaims[0] ?? 'general',
          category: category.category as EvidenceCategoryType,
          geminiScore: geminiFor.score,
          deepseekScore: deepseekFor.score,
          geminiJustification: geminiFor.justification,
          deepseekJustification: deepseekFor.justification,
        })
      }
    }
  }

  return disagreements
}

/**
 * Phase 4: Arbiter resolution of final scores
 */
async function resolveScores(
  geminiEval: JurorEvaluation,
  deepseekEval: JurorEvaluation,
  disagreements: ScoreDisagreement[]
): Promise<ArbiterResolution> {
  const prompt = buildArbiterPrompt(geminiEval, deepseekEval, disagreements)

  const result = await generate({
    provider: 'gemini',
    params: {
      systemPrompt: ARBITER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2000,
      temperature: 0.2,
    },
    enableRetry: true,
    enableRateLimit: true,
  })

  const parsed = parseJsonResponse<ArbiterResolution>(result.content)

  return {
    finalForScore:
      parsed.finalForScore ??
      Math.round((geminiEval.totalForScore + deepseekEval.totalForScore) / 2),
    finalAgainstScore:
      parsed.finalAgainstScore ??
      Math.round((geminiEval.totalAgainstScore + deepseekEval.totalAgainstScore) / 2),
    maxPossibleScore: MAX_JURY_SCORE,
    evidenceFavors: parsed.evidenceFavors ?? 'inconclusive',
    confidenceLevel: parsed.confidenceLevel ?? 'moderate',
    rationale: parsed.rationale ?? 'Resolution based on averaged juror scores.',
    deliberationSummary: parsed.deliberationSummary ?? [
      'Jurors completed independent evaluation of both positions.',
      'Final scores represent the arbiter-resolved consensus.',
    ],
    penaltyNotes: parsed.penaltyNotes ?? [],
    disclaimer: JURY_DISCLAIMER,
  }
}

/**
 * Main entry point: Generate or retrieve jury deliberation for a completed debate
 */
export async function getJuryDeliberation(
  debateId: string,
  forceRegenerate: boolean = false
): Promise<JuryDeliberationResponse> {
  const startTime = Date.now()

  if (!forceRegenerate) {
    const cached = await getStoredDeliberation(debateId)
    if (cached) {
      return {
        success: true,
        deliberation: cached,
        cached: true,
      }
    }
  }

  const session = await getSession(debateId)
  if (!session) {
    return {
      success: false,
      error: 'Debate not found',
      cached: false,
    }
  }

  if (session.status !== 'completed') {
    return {
      success: false,
      error: 'Debate is not yet completed',
      cached: false,
    }
  }

  const engineState = await getEngineState(debateId)
  if (!engineState || engineState.completedTurns.length === 0) {
    return {
      success: false,
      error: 'No debate turns found',
      cached: false,
    }
  }

  // Return mock deliberation in mock mode
  if (isMockMode()) {
    const deliberation = generateMockJuryDeliberation(debateId)
    await storeDeliberation(debateId, deliberation)

    return {
      success: true,
      deliberation,
      cached: false,
    }
  }

  try {
    // Build debate transcript for extraction
    const debateTranscript = engineState.completedTurns
      .filter((turn) => turn.speaker !== 'moderator')
      .map((turn, index) => ({
        speaker: turn.speaker as 'for' | 'against',
        content: turn.content,
        turnNumber: index + 1,
      }))

    // Phase 1: Extract claims
    logger.info('Jury: Starting claim extraction', { debateId })
    const extractedClaims = await extractClaims(session.topic, debateTranscript)

    if (extractedClaims.length === 0) {
      return {
        success: false,
        error: 'No factual claims could be extracted from the debate',
        cached: false,
      }
    }

    // Phase 2: Independent juror scoring (parallel)
    logger.info('Jury: Starting independent scoring', {
      debateId,
      claimCount: extractedClaims.length,
    })
    const [geminiEvaluation, deepseekEvaluation] = await Promise.all([
      getJurorEvaluation('gemini', session.topic, extractedClaims),
      getJurorEvaluation('deepseek', session.topic, extractedClaims),
    ])

    // Phase 3: Identify disagreements (deliberation API calls removed for optimization)
    const disagreements = identifyDisagreements(geminiEvaluation, deepseekEvaluation)
    const deliberationLog: JuryDeliberation['deliberationLog'] = []

    // Phase 4: Arbiter resolution
    logger.info('Jury: Resolving final scores', {
      debateId,
      disagreementCount: disagreements.length,
    })
    const arbiterResolution = await resolveScores(
      geminiEvaluation,
      deepseekEvaluation,
      disagreements
    )

    const deliberation: JuryDeliberation = {
      debateId,
      phase: 'completed',
      extractedClaims,
      geminiEvaluation,
      deepseekEvaluation,
      disagreements,
      deliberationLog,
      arbiterResolution,
      generatedAt: new Date(),
      processingTimeMs: Date.now() - startTime,
    }

    await storeDeliberation(debateId, deliberation)

    logger.info('Jury deliberation generated and cached', {
      debateId,
      processingTimeMs: deliberation.processingTimeMs,
    })

    return {
      success: true,
      deliberation,
      cached: false,
    }
  } catch (error) {
    logger.error('JuryService failed', error instanceof Error ? error : null, { debateId })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate jury deliberation',
      cached: false,
    }
  }
}

/**
 * Parse JSON from LLM response, handling markdown code blocks
 */
function parseJsonResponse<T>(response: string): T {
  if (!response || response.trim().length === 0) {
    throw new Error('Empty response from LLM')
  }

  let jsonStr = response

  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch?.[1]) {
    jsonStr = jsonMatch[1]
  } else {
    const plainMatch = response.match(/\{[\s\S]*\}/)
    if (plainMatch?.[0]) {
      jsonStr = plainMatch[0]
    }
  }

  try {
    return JSON.parse(jsonStr) as T
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}. Response: ${response.slice(0, 200)}...`
    )
  }
}

/**
 * Clear cached deliberation for a debate
 */
export async function clearDeliberationCache(debateId: string): Promise<void> {
  await deleteDeliberation(debateId)
}

/**
 * Check if deliberation is cached for a debate
 */
export async function isDeliberationCached(debateId: string): Promise<boolean> {
  return hasStoredDeliberation(debateId)
}
