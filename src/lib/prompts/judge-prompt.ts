// judge-prompt.ts
/**
 * Judge prompt templates for debate evaluation.
 * Supports two-tier analysis: quick scores (GPT-4o-mini) and full analysis (GPT-4o).
 */

import { MAX_TOTAL_SCORE, SCORING_RUBRICS } from '@/lib/scoring-rubric'

import type { QuickScore } from '@/types/judge'
import type { DebateHistoryEntry } from '@/types/prompts'
export const JUDGE_SYSTEM_PROMPT = `You are an expert debate judge providing educational analysis of an AI debate. Your role is to evaluate argument quality, provide constructive feedback, and offer insights that help understand effective argumentation.

## Your Role as Judge

You are NOT:
- Declaring a definitive winner
- Taking sides on the substantive issue
- Expressing personal opinions on the topic

You ARE:
- Evaluating argumentation quality objectively
- Identifying strengths and weaknesses
- Providing educational insights
- Analyzing debate dynamics

## Evaluation Principles

1. **Objectivity**: Evaluate technique, not which position you agree with
2. **Balance**: Give equal analytical attention to both sides
3. **Specificity**: Reference specific moments and quotes
4. **Constructiveness**: Frame feedback as learning opportunities
5. **Nuance**: Avoid absolute statements; use comparative language

## Scoring Guidelines

Use the following rubric categories:
${SCORING_RUBRICS.map(
  (r) => `
### ${r.label} (0-${r.maxScore} points)
Criteria:
${r.criteria.map((c) => `- ${c}`).join('\n')}`
).join('\n')}

Total possible score: ${MAX_TOTAL_SCORE} points per side

## Important Constraints

- NEVER declare one side the "winner" or "loser"
- Use comparative language: "demonstrated stronger X" not "won on X"
- Acknowledge that reasonable people can disagree
- Focus on HOW arguments were made, not WHAT was argued
- Include a disclaimer about AI limitations`

/**
 * Build user prompt for judge analysis request.
 * When quickScores provided, anchors analysis to those exact percentages.
 */
export function buildJudgeAnalysisPrompt(
  topic: string,
  format: string,
  debateHistory: DebateHistoryEntry[],
  forModel: string,
  againstModel: string,
  customRules: string[],
  quickScores?: QuickScore
): string {
  const transcript = debateHistory
    .filter((h) => h.speaker !== 'moderator' || h.turnType === 'moderator_intervention')
    .map((h) => `[${h.speakerLabel}] (${h.turnType})\n${h.content}`)
    .join('\n\n---\n\n')

  const customRulesSection =
    customRules.length > 0
      ? `**Custom Rules:**\n${customRules.map((r) => `- ${r}`).join('\n')}\n`
      : ''

  const quickScoresSection = quickScores
    ? `
## Pre-computed Scores (USE THESE EXACT PERCENTAGES)

These scores have been pre-calculated. Convert them to the rubric scale and use them exactly.

**FOR Position Scores:**
- Argument Quality: ${quickScores.forScores.argument_quality}% (convert to 0-25 scale)
- Clarity/Presentation: ${quickScores.forScores.clarity_presentation}% (convert to 0-20 scale)
- Evidence Support: ${quickScores.forScores.evidence_support}% (convert to 0-20 scale)
- Rebuttal Effectiveness: ${quickScores.forScores.rebuttal_effectiveness}% (convert to 0-20 scale)

**AGAINST Position Scores:**
- Argument Quality: ${quickScores.againstScores.argument_quality}% (convert to 0-25 scale)
- Clarity/Presentation: ${quickScores.againstScores.clarity_presentation}% (convert to 0-20 scale)
- Evidence Support: ${quickScores.againstScores.evidence_support}% (convert to 0-20 scale)
- Rebuttal Effectiveness: ${quickScores.againstScores.rebuttal_effectiveness}% (convert to 0-20 scale)

Your task: Provide detailed feedback, key moments, and turning points that JUSTIFY these scores.
Do NOT change the scores - explain WHY each score is appropriate based on the debate content.

`
    : ''

  return `## Debate to Analyze

**Topic:** ${topic}
**Format:** ${format}
**FOR Position:** ${forModel}
**AGAINST Position:** ${againstModel}

${customRulesSection}${quickScoresSection}
## Complete Transcript

${transcript}

## Your Analysis Task

Provide a comprehensive judge analysis in the following JSON format:

\`\`\`json
{
  "overviewSummary": "2-3 sentence high-level assessment of the debate",
  "debateQuality": "excellent|good|fair|developing",
  "debateQualityExplanation": "Why this rating",

  "forAnalysis": {
    "totalScore": <number>,
    "categoryScores": [
      {
        "category": "argument_quality",
        "score": <0-25>,
        "feedback": "Specific feedback"
      },
      {
        "category": "evidence_support",
        "score": <0-20>,
        "feedback": "Specific feedback"
      },
      {
        "category": "rebuttal_effectiveness",
        "score": <0-20>,
        "feedback": "Specific feedback"
      },
      {
        "category": "clarity_presentation",
        "score": <0-20>,
        "feedback": "Specific feedback"
      },
      {
        "category": "rule_adherence",
        "score": <0-15>,
        "feedback": "Specific feedback"
      }
    ],
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "standoutMoments": ["Specific quote or moment that was effective"]
  },

  "againstAnalysis": {
    "totalScore": <number>,
    "categoryScores": [
      {
        "category": "argument_quality",
        "score": <0-25>,
        "feedback": "Specific feedback"
      },
      {
        "category": "evidence_support",
        "score": <0-20>,
        "feedback": "Specific feedback"
      },
      {
        "category": "rebuttal_effectiveness",
        "score": <0-20>,
        "feedback": "Specific feedback"
      },
      {
        "category": "clarity_presentation",
        "score": <0-20>,
        "feedback": "Specific feedback"
      },
      {
        "category": "rule_adherence",
        "score": <0-15>,
        "feedback": "Specific feedback"
      }
    ],
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "standoutMoments": ["Specific quote or moment that was effective"]
  },

  "keyClashPoints": [
    {
      "topic": "The core issue being contested",
      "description": "What this clash was about",
      "forArgument": "Summary of FOR's position",
      "againstArgument": "Summary of AGAINST's position",
      "analysis": "How this clash played out",
      "advantageNote": "Neutral observation about engagement (optional)"
    }
  ],

  "turningMoments": [
    "Description of a moment that shifted debate dynamics"
  ],

  "missedOpportunities": [
    "Arguments or rebuttals that could have been made but weren't"
  ],

  "whatWorkedWell": [
    "Effective techniques demonstrated"
  ],

  "areasForImprovement": [
    "Common issues both sides could address"
  ],

  "lessonsForDebaters": [
    "Takeaways for anyone learning debate"
  ],

  "judgeNotes": "Any additional observations"
}
\`\`\`

## Critical Instructions

1. Be SPECIFIC - reference actual content from the debate
2. Be BALANCED - spend equal effort analyzing both sides
3. Be EDUCATIONAL - frame everything as learning opportunities
4. Be NEUTRAL - evaluate technique, not who you agree with
5. DO NOT declare a winner
6. Scores should reflect the rubric criteria precisely
7. Your entire response must be valid JSON only`
}

/**
 * Standard disclaimer for judge analysis
 */
export const JUDGE_DISCLAIMER = `This analysis was generated by AI acting as a debate judge. The scores and feedback reflect an assessment of argumentation technique, not the validity of either position on the topic. Reasonable evaluators may score differently. This analysis is for educational purposes and should not be taken as a definitive judgment.`

/**
 * System prompt for quick score generation (GPT-4o-mini).
 * Optimized for speed with minimal output tokens.
 */
export const QUICK_SCORE_SYSTEM_PROMPT = `You are a debate scoring assistant. Evaluate debates quickly and return only numerical scores. Be concise and precise.`

/**
 * Build minimal prompt for fast quick score generation.
 * Designed for ~100-200 token output from GPT-4o-mini.
 */
export function buildQuickScorePrompt(topic: string, transcript: string): string {
  return `Score this debate on "${topic}".

Evaluate each side on these criteria (0-100 scale):
- argument_quality: Logical structure, coherence, persuasiveness
- clarity_presentation: Clear communication, organization
- evidence_support: Use of examples, data, reasoning
- rebuttal_effectiveness: Addressing opponent's points

Return ONLY this JSON (no explanation):
{"for":{"argument_quality":0,"clarity_presentation":0,"evidence_support":0,"rebuttal_effectiveness":0},"against":{"argument_quality":0,"clarity_presentation":0,"evidence_support":0,"rebuttal_effectiveness":0}}

Transcript:
${transcript}`
}
