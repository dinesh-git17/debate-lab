// src/services/judge-service.ts

import { getEngineState } from '@/lib/engine-store'
import { logger } from '@/lib/logging'
import {
  buildJudgeAnalysisPrompt,
  JUDGE_DISCLAIMER,
  JUDGE_SYSTEM_PROMPT,
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
  ScoringCategory,
} from '@/types/judge'
import type { DebateHistoryEntry } from '@/types/prompts'
import type { TurnSpeaker } from '@/types/turn'

const analysisCache = new Map<string, JudgeAnalysis>()

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
 * Generate or retrieve judge analysis for a completed debate
 */
export async function getJudgeAnalysis(
  debateId: string,
  forceRegenerate: boolean = false
): Promise<JudgeAnalysisResponse> {
  const startTime = Date.now()

  if (!forceRegenerate) {
    const cachedAnalysis = analysisCache.get(debateId)
    if (cachedAnalysis) {
      return {
        success: true,
        analysis: cachedAnalysis,
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
    analysisCache.set(debateId, analysis)

    return {
      success: true,
      analysis,
      cached: false,
      generationTimeMs: Date.now() - startTime,
    }
  }

  const debateHistory: DebateHistoryEntry[] = engineState.completedTurns.map((turn, index) => ({
    speaker: turn.speaker,
    speakerLabel: turn.speaker === 'moderator' ? 'MODERATOR' : turn.speaker.toUpperCase(),
    turnType: turn.config.type,
    content: turn.content,
    turnNumber: index + 1,
  }))

  try {
    const prompt = buildJudgeAnalysisPrompt(
      session.topic,
      getFormatDisplayName(session.format),
      debateHistory,
      forModel,
      againstModel,
      session.customRules
    )

    const result = await generate({
      provider: 'openai',
      params: {
        systemPrompt: JUDGE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 8000,
        temperature: 0.3,
      },
      enableRetry: true,
      enableRateLimit: true,
    })

    const analysis = parseJudgeResponse(debateId, result.content, forModel, againstModel)

    analysisCache.set(debateId, analysis)

    return {
      success: true,
      analysis,
      cached: false,
      generationTimeMs: Date.now() - startTime,
    }
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
 * Clear cached analysis for a debate
 */
export function clearAnalysisCache(debateId: string): void {
  analysisCache.delete(debateId)
}

/**
 * Check if analysis is cached for a debate
 */
export function isAnalysisCached(debateId: string): boolean {
  return analysisCache.has(debateId)
}

/**
 * Get all cached debate IDs
 */
export function getCachedAnalysisIds(): string[] {
  return Array.from(analysisCache.keys())
}
