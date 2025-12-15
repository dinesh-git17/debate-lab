// src/services/judge-service.ts
/**
 * Two-tier judge analysis service for debate evaluation.
 * Quick scores and full analysis both use GPT-4o-mini for cost efficiency.
 */

import { getEngineState } from '@/lib/engine-store'
import {
  getStoredAnalysis,
  getStoredQuickScore,
  hasStoredAnalysis,
  hasStoredQuickScore,
  storeAnalysis,
  storeQuickScore,
} from '@/lib/judge-store'
import { logger } from '@/lib/logging'
import {
  buildJudgeAnalysisPrompt,
  buildQuickScorePrompt,
  JUDGE_DISCLAIMER,
  JUDGE_SYSTEM_PROMPT,
  QUICK_SCORE_SYSTEM_PROMPT,
} from '@/lib/prompts/judge-prompt'
import { getFormatDisplayName } from '@/lib/prompts/moderator-system'
import { MAX_TOTAL_SCORE, SCORING_RUBRICS, validateCategoryScore } from '@/lib/scoring-rubric'
import { getSession } from '@/lib/session-store'
import { generate } from '@/services/llm'
import { isMockMode } from '@/services/mock-debate-engine'

import type {
  CategoryScore,
  ClashPoint,
  JudgeAnalysis,
  JudgeAnalysisResponse,
  ParsedJudgeResponse,
  ParticipantScores,
  QuickScore,
  ScoringCategory,
} from '@/types/judge'
import type { DebateHistoryEntry } from '@/types/prompts'
import type { TurnSpeaker } from '@/types/turn'

/**
 * Generate mock judge analysis for testing without API calls
 */
function generateMockJudgeAnalysis(
  debateId: string,
  forModel: string,
  againstModel: string
): JudgeAnalysis {
  const buildMockParticipantScores = (
    speaker: 'for' | 'against',
    label: string,
    model: string
  ): ParticipantScores => {
    const baseScore = 70 + Math.floor(Math.random() * 20)
    const categoryScores: CategoryScore[] = SCORING_RUBRICS.map((rubric) => {
      const percentage = baseScore + Math.floor(Math.random() * 10) - 5
      const score = Math.round((percentage / 100) * rubric.maxScore)
      return {
        category: rubric.category,
        label: rubric.label,
        score: validateCategoryScore(rubric.category, score),
        maxScore: rubric.maxScore,
        percentage,
        feedback: `Strong performance in ${rubric.label.toLowerCase()} with clear demonstration of the core criteria.`,
      }
    })

    const totalScore = categoryScores.reduce((sum, cs) => sum + cs.score, 0)
    const percentage = Math.round((totalScore / MAX_TOTAL_SCORE) * 100)

    return {
      speaker,
      label,
      model,
      totalScore,
      maxPossibleScore: MAX_TOTAL_SCORE,
      percentage,
      categoryScores,
      strengths: [
        'Maintained a clear and consistent argumentative framework throughout',
        'Effectively used examples to support key claims',
        'Demonstrated strong understanding of the topic complexity',
      ],
      weaknesses: [
        'Could have addressed counterarguments more directly in some sections',
        'Some opportunities for deeper engagement with opposing evidence were missed',
      ],
      standoutMoments:
        speaker === 'for'
          ? [
              'Strong opening framework establishing functional definitions over philosophical abstraction',
              'Effective use of the "crumb test" to ground abstract concepts in observable reality',
            ]
          : [
              'Compelling argument that conceptual analysis can fundamentally alter perception',
              'Strategic pivot to linguistic philosophy that reframed the entire debate',
            ],
    }
  }

  const forAnalysis = buildMockParticipantScores('for', 'FOR (Affirmative)', forModel)
  const againstAnalysis = buildMockParticipantScores('against', 'AGAINST (Negative)', againstModel)

  const avgPercentage = (forAnalysis.percentage + againstAnalysis.percentage) / 2
  const debateQuality =
    avgPercentage >= 85
      ? 'excellent'
      : avgPercentage >= 70
        ? 'good'
        : avgPercentage >= 55
          ? 'fair'
          : 'developing'

  return {
    debateId,
    generatedAt: new Date(),
    overviewSummary:
      'This was a well-structured debate with both participants demonstrating strong argumentation skills. The exchange featured substantive engagement with the core issues and effective use of evidence to support competing positions.',
    debateQuality,
    debateQualityExplanation:
      'Both debaters maintained professional discourse while presenting nuanced arguments. The debate featured genuine clash on key issues with effective rebuttals from both sides.',
    forAnalysis,
    againstAnalysis,
    keyClashPoints: [
      {
        topic: 'Functional vs Conceptual Identity',
        description:
          'Whether a sandwich is defined by its physical properties or by how we conceptualize it',
        forArgument:
          'A sandwich is defined by use and structure—bread, filling, consumption method. Overthinking cannot change these facts.',
        againstArgument:
          'Conceptual analysis reveals that "sandwich" is a linguistic construct whose boundaries dissolve under scrutiny.',
        analysis:
          'This clash highlighted the tension between pragmatic definitions and philosophical deconstruction.',
      },
      {
        topic: 'The Hot Dog Question',
        description: 'Whether edge cases like hot dogs undermine categorical definitions',
        forArgument:
          'Edge cases prove the rule—hot dogs have their own category precisely because sandwiches have clear boundaries',
        againstArgument:
          'The inability to cleanly categorize hot dogs reveals the arbitrariness of all food taxonomy',
        analysis: 'Both sides made compelling points about how we handle definitional edge cases.',
      },
    ],
    turningMoments: [
      "The shift from physical properties to linguistic philosophy changed the debate's entire framing",
      'FOR\'s "crumb test" argument forced AGAINST to concede that practical definitions have utility',
    ],
    missedOpportunities: [
      'Neither side fully explored the implications of their position for edge cases',
      'Some strong arguments made early were not adequately developed in later turns',
    ],
    whatWorkedWell: [
      'Clear structure and signposting made arguments easy to follow',
      'Both sides maintained respectful discourse while being assertive',
      'Effective use of examples to make abstract concepts concrete',
    ],
    areasForImprovement: [
      'More direct engagement with the strongest opposing arguments',
      'Better time allocation to develop key points more thoroughly',
      'Clearer impact calculus comparing competing considerations',
    ],
    lessonsForDebaters: [
      'Establish clear frameworks early to organize the debate productively',
      'Prioritize quality over quantity when making arguments',
      'Direct clash on key issues is more persuasive than parallel argumentation',
    ],
    judgeNotes:
      'This analysis is based on mock debate content for testing purposes. In a real debate, scoring would reflect the actual quality of arguments presented.',
    disclaimer: '[MOCK MODE] This is simulated analysis for testing. ' + JUDGE_DISCLAIMER,
  }
}

/**
 * Generate mock quick scores for testing without API calls
 */
function generateMockQuickScore(): QuickScore {
  const randomScore = (): number => 65 + Math.floor(Math.random() * 25)

  return {
    forScores: {
      argument_quality: randomScore(),
      clarity_presentation: randomScore(),
      evidence_support: randomScore(),
      rebuttal_effectiveness: randomScore(),
    },
    againstScores: {
      argument_quality: randomScore(),
      clarity_presentation: randomScore(),
      evidence_support: randomScore(),
      rebuttal_effectiveness: randomScore(),
    },
    generatedAt: new Date(),
  }
}

/**
 * Build transcript string for quick score prompt
 */
function buildTranscriptForScoring(completedTurns: DebateHistoryEntry[]): string {
  return completedTurns
    .filter((t) => t.speaker !== 'moderator')
    .map((t) => `[${t.speaker.toUpperCase()}]: ${t.content}`)
    .join('\n\n')
}

/**
 * Parse quick score JSON response from GPT-4o-mini
 */
function parseQuickScoreResponse(response: string): QuickScore {
  let jsonStr = response.trim()

  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch?.[0]) {
    jsonStr = jsonMatch[0]
  }

  const parsed = JSON.parse(jsonStr) as {
    for: {
      argument_quality: number
      clarity_presentation: number
      evidence_support: number
      rebuttal_effectiveness: number
    }
    against: {
      argument_quality: number
      clarity_presentation: number
      evidence_support: number
      rebuttal_effectiveness: number
    }
  }

  return {
    forScores: {
      argument_quality: Math.round(Math.min(100, Math.max(0, parsed.for.argument_quality))),
      clarity_presentation: Math.round(Math.min(100, Math.max(0, parsed.for.clarity_presentation))),
      evidence_support: Math.round(Math.min(100, Math.max(0, parsed.for.evidence_support))),
      rebuttal_effectiveness: Math.round(
        Math.min(100, Math.max(0, parsed.for.rebuttal_effectiveness))
      ),
    },
    againstScores: {
      argument_quality: Math.round(Math.min(100, Math.max(0, parsed.against.argument_quality))),
      clarity_presentation: Math.round(
        Math.min(100, Math.max(0, parsed.against.clarity_presentation))
      ),
      evidence_support: Math.round(Math.min(100, Math.max(0, parsed.against.evidence_support))),
      rebuttal_effectiveness: Math.round(
        Math.min(100, Math.max(0, parsed.against.rebuttal_effectiveness))
      ),
    },
    generatedAt: new Date(),
  }
}

interface QuickScoreResponse {
  success: boolean
  quickScore?: QuickScore
  error?: string
  cached: boolean
}

/**
 * Generate fast quick scores using GPT-4o-mini.
 * Returns in ~1-2 seconds for immediate UI rendering.
 */
export async function getQuickScore(debateId: string): Promise<QuickScoreResponse> {
  const cached = await getStoredQuickScore(debateId)
  if (cached) {
    return { success: true, quickScore: cached, cached: true }
  }

  const session = await getSession(debateId)
  if (!session) {
    return { success: false, error: 'Debate not found', cached: false }
  }

  if (session.status !== 'completed') {
    return { success: false, error: 'Debate is not yet completed', cached: false }
  }

  const engineState = await getEngineState(debateId)
  if (!engineState || engineState.completedTurns.length === 0) {
    return { success: false, error: 'No debate turns found', cached: false }
  }

  if (engineState.status === 'cancelled') {
    return {
      success: false,
      error: 'Quick score not available for cancelled debates',
      cached: false,
    }
  }

  if (isMockMode()) {
    const quickScore = generateMockQuickScore()
    await storeQuickScore(debateId, quickScore)
    return { success: true, quickScore, cached: false }
  }

  try {
    const debateHistory: DebateHistoryEntry[] = engineState.completedTurns.map((turn, index) => ({
      speaker: turn.speaker,
      speakerLabel: turn.speaker === 'moderator' ? 'MODERATOR' : turn.speaker.toUpperCase(),
      turnType: turn.config.type,
      content: turn.content,
      turnNumber: index + 1,
    }))

    const transcript = buildTranscriptForScoring(debateHistory)
    const prompt = buildQuickScorePrompt(session.topic, transcript)

    const result = await generate({
      provider: 'openai',
      params: {
        systemPrompt: QUICK_SCORE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 500,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      },
      enableRetry: true,
      enableRateLimit: true,
    })

    const quickScore = parseQuickScoreResponse(result.content)
    await storeQuickScore(debateId, quickScore)

    logger.info('Quick score generated', { debateId, latencyMs: result.latencyMs })

    return { success: true, quickScore, cached: false }
  } catch (error) {
    logger.error('Failed to generate quick score', error instanceof Error ? error : null, {
      debateId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate quick score',
      cached: false,
    }
  }
}

/**
 * Generate or retrieve judge analysis for a completed debate.
 * When quickScores provided, anchors full analysis to those exact scores.
 */
export async function getJudgeAnalysis(
  debateId: string,
  forceRegenerate: boolean = false,
  quickScores?: QuickScore
): Promise<JudgeAnalysisResponse> {
  const startTime = Date.now()

  // Get cached quick score if not provided
  const storedQuickScore = await getStoredQuickScore(debateId)
  const cachedQuickScore = quickScores ?? storedQuickScore ?? undefined

  if (!forceRegenerate) {
    const cachedAnalysis = await getStoredAnalysis(debateId)
    if (cachedAnalysis) {
      const response: JudgeAnalysisResponse = {
        success: true,
        analysis: cachedAnalysis,
        cached: true,
        quickScoreCached: !!cachedQuickScore,
      }
      if (cachedQuickScore) {
        response.quickScore = cachedQuickScore
      }
      return response
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

  // Skip judge analysis for debates that were ended early (cancelled)
  if (engineState.status === 'cancelled') {
    return {
      success: false,
      error: 'Judge analysis not available for debates ended early',
      cached: false,
    }
  }

  const modelNames: Record<string, string> = {
    chatgpt: 'ChatGPT',
    grok: 'Grok',
  }

  const forModel = modelNames[session.assignment.forPosition] ?? 'Unknown'
  const againstModel = modelNames[session.assignment.againstPosition] ?? 'Unknown'

  // Return mock analysis in mock mode to avoid API calls
  if (isMockMode()) {
    const analysis = generateMockJudgeAnalysis(debateId, forModel, againstModel)
    await storeAnalysis(debateId, analysis)

    const mockResponse: JudgeAnalysisResponse = {
      success: true,
      analysis,
      cached: false,
      generationTimeMs: Date.now() - startTime,
    }
    if (cachedQuickScore) {
      mockResponse.quickScore = cachedQuickScore
    }
    return mockResponse
  }

  const debateHistory: DebateHistoryEntry[] = engineState.completedTurns.map((turn, index) => ({
    speaker: turn.speaker,
    speakerLabel: turn.speaker === 'moderator' ? 'MODERATOR' : turn.speaker.toUpperCase(),
    turnType: turn.config.type,
    content: turn.content,
    turnNumber: index + 1,
  }))

  try {
    // Pass quick scores to anchor full analysis to same values
    const prompt = buildJudgeAnalysisPrompt(
      session.topic,
      getFormatDisplayName(session.format),
      debateHistory,
      forModel,
      againstModel,
      session.customRules,
      cachedQuickScore
    )

    const result = await generate({
      provider: 'openai',
      params: {
        systemPrompt: JUDGE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 4000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      },
      enableRetry: true,
      enableRateLimit: true,
    })

    const analysis = parseJudgeResponse(debateId, result.content, forModel, againstModel)

    await storeAnalysis(debateId, analysis)

    logger.info('Full analysis generated', { debateId, latencyMs: result.latencyMs })

    const successResponse: JudgeAnalysisResponse = {
      success: true,
      analysis,
      cached: false,
      generationTimeMs: Date.now() - startTime,
    }
    if (cachedQuickScore) {
      successResponse.quickScore = cachedQuickScore
    }
    return successResponse
  } catch (error) {
    logger.error(
      'JudgeService failed to generate analysis',
      error instanceof Error ? error : null,
      {
        debateId,
      }
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate analysis',
      cached: false,
    }
  }
}

/**
 * Parse Claude's JSON response into JudgeAnalysis
 */
function parseJudgeResponse(
  debateId: string,
  response: string,
  forModel: string,
  againstModel: string
): JudgeAnalysis {
  // Validate response is not empty
  if (!response || response.trim().length === 0) {
    throw new Error('Judge analysis response was empty - AI returned no content')
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

  // Validate extracted JSON string is not empty
  if (!jsonStr || jsonStr.trim().length === 0) {
    throw new Error(
      `Failed to extract JSON from judge response. Response preview: ${response.slice(0, 200)}...`
    )
  }

  // Check for truncated JSON (missing closing braces)
  const openBraces = (jsonStr.match(/\{/g) || []).length
  const closeBraces = (jsonStr.match(/\}/g) || []).length
  if (openBraces > closeBraces) {
    throw new Error(
      `Judge response appears truncated (${openBraces} open braces, ${closeBraces} close braces). ` +
        `Response may have exceeded token limit. Last 100 chars: ...${jsonStr.slice(-100)}`
    )
  }

  let parsed: ParsedJudgeResponse
  try {
    parsed = JSON.parse(jsonStr) as ParsedJudgeResponse
  } catch (parseError) {
    throw new Error(
      `Failed to parse judge JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. ` +
        `Last 100 chars: ...${jsonStr.slice(-100)}`
    )
  }

  const forScores = buildParticipantScores('for', 'FOR (Affirmative)', forModel, parsed.forAnalysis)
  const againstScores = buildParticipantScores(
    'against',
    'AGAINST (Negative)',
    againstModel,
    parsed.againstAnalysis
  )

  const avgPercentage = (forScores.percentage + againstScores.percentage) / 2
  const debateQuality = normalizeQualityRating(parsed.debateQuality, avgPercentage)

  return {
    debateId,
    generatedAt: new Date(),

    overviewSummary: parsed.overviewSummary ?? '',
    debateQuality,
    debateQualityExplanation: parsed.debateQualityExplanation ?? '',

    forAnalysis: forScores,
    againstAnalysis: againstScores,

    keyClashPoints: (parsed.keyClashPoints ?? []).map((cp) => {
      const clashPoint: ClashPoint = {
        topic: cp.topic ?? '',
        description: cp.description ?? '',
        forArgument: cp.forArgument ?? '',
        againstArgument: cp.againstArgument ?? '',
        analysis: cp.analysis ?? '',
      }
      if (cp.advantageNote) {
        clashPoint.advantageNote = cp.advantageNote
      }
      return clashPoint
    }),

    turningMoments: parsed.turningMoments ?? [],
    missedOpportunities: parsed.missedOpportunities ?? [],

    whatWorkedWell: parsed.whatWorkedWell ?? [],
    areasForImprovement: parsed.areasForImprovement ?? [],
    lessonsForDebaters: parsed.lessonsForDebaters ?? [],

    judgeNotes: parsed.judgeNotes ?? '',
    disclaimer: JUDGE_DISCLAIMER,
  }
}

/**
 * Normalize quality rating from Claude's response
 */
function normalizeQualityRating(
  rating: string,
  fallbackPercentage: number
): 'excellent' | 'good' | 'fair' | 'developing' {
  const normalized = rating?.toLowerCase().trim()

  if (normalized === 'excellent') return 'excellent'
  if (normalized === 'good') return 'good'
  if (normalized === 'fair') return 'fair'
  if (normalized === 'developing') return 'developing'

  if (fallbackPercentage >= 85) return 'excellent'
  if (fallbackPercentage >= 70) return 'good'
  if (fallbackPercentage >= 55) return 'fair'
  return 'developing'
}

/**
 * Build participant scores from parsed response data
 */
function buildParticipantScores(
  speaker: TurnSpeaker,
  label: string,
  model: string,
  data: ParsedJudgeResponse['forAnalysis']
): ParticipantScores {
  const categoryScores: CategoryScore[] = SCORING_RUBRICS.map((rubric) => {
    const scoreData = (data?.categoryScores ?? []).find((s) => s.category === rubric.category)

    const score = validateCategoryScore(rubric.category as ScoringCategory, scoreData?.score ?? 0)

    return {
      category: rubric.category,
      label: rubric.label,
      score,
      maxScore: rubric.maxScore,
      percentage: Math.round((score / rubric.maxScore) * 100),
      feedback: scoreData?.feedback ?? '',
    }
  })

  const totalScore = categoryScores.reduce((sum, cs) => sum + cs.score, 0)
  const percentage = Math.round((totalScore / MAX_TOTAL_SCORE) * 100)

  return {
    speaker,
    label,
    model,
    totalScore,
    maxPossibleScore: MAX_TOTAL_SCORE,
    percentage,
    categoryScores,
    strengths: data?.strengths ?? [],
    weaknesses: data?.weaknesses ?? [],
    standoutMoments: data?.standoutMoments ?? [],
  }
}

/**
 * Check if analysis is cached for a debate (async - checks persistent store)
 */
export async function isAnalysisCached(debateId: string): Promise<boolean> {
  return hasStoredAnalysis(debateId)
}

/**
 * Check if quick score is cached for a debate (async - checks persistent store)
 */
export async function isQuickScoreCached(debateId: string): Promise<boolean> {
  return hasStoredQuickScore(debateId)
}

/**
 * Get cached quick score for a debate (async - checks persistent store)
 */
export async function getCachedQuickScore(debateId: string): Promise<QuickScore | null> {
  return getStoredQuickScore(debateId)
}
