/**
 * Prompt templates for the evidence-based jury deliberation system.
 * These prompts guide AI jurors through claim extraction, scoring, and deliberation.
 */

import { JURY_SCORING_RUBRICS, MAX_JURY_SCORE } from '../jury-scoring-rubric'

import type { ExtractedClaim, JurorEvaluation, ScoreDisagreement } from '@/types/jury'

/**
 * System prompt for evidence extraction phase
 */
export const EVIDENCE_EXTRACTION_SYSTEM_PROMPT = `You are an evidence extraction system. Your task is to identify factual claims from debate arguments.

Your role is strictly analytical. Extract claims without evaluating their truth or merit.

## Extraction Rules

1. EXTRACT only statements that make factual assertions
2. NORMALIZE each claim into a simple, verifiable declarative statement
3. STRIP all rhetoric, analogies, persuasive language, and emotional appeals
4. CLASSIFY each claim by type:
   - factual: Direct assertion about reality ("X is Y")
   - causal: Claim about cause and effect ("X causes Y")
   - definitional: Claim about meaning or categorization ("X is defined as Y")
   - evaluative: Claim about quality or value ("X is better/worse than Y")

5. DO NOT include:
   - Opinions or preferences
   - Rhetorical questions
   - Hypotheticals not presented as claims
   - Pure value judgments without factual basis

6. DEDUPLICATE substantially similar claims from the same speaker

## Output Format

Return a JSON array of claims with this structure:
{
  "claims": [
    {
      "id": "F1",
      "speaker": "for" | "against",
      "originalText": "The exact quote from the debate",
      "normalizedStatement": "A simple declarative statement",
      "turnNumber": 1,
      "claimType": "factual" | "causal" | "definitional" | "evaluative"
    }
  ]
}

Use IDs like F1, F2 for FOR claims and A1, A2 for AGAINST claims.`

/**
 * Build the evidence extraction user prompt with debate content
 */
export function buildExtractionPrompt(
  topic: string,
  debateTranscript: { speaker: 'for' | 'against'; content: string; turnNumber: number }[]
): string {
  const transcriptText = debateTranscript
    .map((turn) => `[Turn ${turn.turnNumber}] [${turn.speaker.toUpperCase()}]:\n${turn.content}`)
    .join('\n\n---\n\n')

  return `## Debate Topic
${topic}

## Debate Transcript

${transcriptText}

---

Extract all factual claims from both sides. Return only the JSON object with the claims array.`
}

/**
 * System prompt for juror scoring phase
 */
export const JUROR_SCORING_SYSTEM_PROMPT = `You are an independent juror evaluating evidence quality in a debate. Your task is to score each side's claims based ONLY on factual accuracy and evidence strength.

## Critical Rules

1. Score ONLY based on evidence quality, NOT persuasiveness or debate skill
2. Reference specific claim IDs in every justification
3. Penalize unsupported certainty (claims stated as fact without backing)
4. Maintain independence - do not guess what other jurors might score
5. Be conservative when uncertain - lower scores for unclear evidence
6. Apply the same standards equally to both sides

## Scoring Rubric

${JURY_SCORING_RUBRICS.map(
  (r) => `### ${r.label} (${r.maxScore} points${r.isPenalty ? ' - PENALTY' : ''})
${r.description}
Criteria:
${r.criteria.map((c) => `- ${c}`).join('\n')}`
).join('\n\n')}

## Total Maximum Score: ${MAX_JURY_SCORE} points per side

## Output Format

Return a JSON object with this structure:
{
  "forScores": [
    {
      "category": "factual_accuracy",
      "score": 0-25,
      "justification": "Specific reasoning referencing claim IDs",
      "referencedClaims": ["F1", "F3"]
    }
  ],
  "againstScores": [
    {
      "category": "factual_accuracy",
      "score": 0-25,
      "justification": "Specific reasoning referencing claim IDs",
      "referencedClaims": ["A1", "A2"]
    }
  ],
  "confidence": 0.0-1.0,
  "notes": "Any relevant observations about evidence quality"
}

Include all 5 categories for each side. For the "unsupported_claims" category, the score represents the PENALTY to apply (higher = more penalty).`

/**
 * Build the juror scoring user prompt with extracted claims
 */
export function buildScoringPrompt(topic: string, claims: ExtractedClaim[]): string {
  const forClaims = claims.filter((c) => c.speaker === 'for')
  const againstClaims = claims.filter((c) => c.speaker === 'against')

  const formatClaims = (claimList: ExtractedClaim[]): string =>
    claimList
      .map(
        (c) => `[${c.id}] (${c.claimType}, Turn ${c.turnNumber})
Original: "${c.originalText}"
Normalized: ${c.normalizedStatement}`
      )
      .join('\n\n')

  return `## Debate Topic
${topic}

## Extracted Claims - FOR Position
${forClaims.length > 0 ? formatClaims(forClaims) : 'No claims extracted.'}

## Extracted Claims - AGAINST Position
${againstClaims.length > 0 ? formatClaims(againstClaims) : 'No claims extracted.'}

---

Evaluate each side using the scoring rubric. Return only the JSON object.`
}

/**
 * System prompt for deliberation phase
 */
export const DELIBERATION_SYSTEM_PROMPT = `You are reviewing another juror's evaluation scores. Your task is to identify claim-level disagreements and determine if adjustments are warranted.

## Deliberation Rules

1. Focus ONLY on specific claims and scoring categories
2. You may adjust your scores if the other juror's justification reveals evidence you missed
3. You may NOT adjust based on:
   - Persuasion or rhetoric
   - General impressions
   - Anything not tied to specific claim IDs

4. For each disagreement, provide:
   - The claim ID in question
   - The scoring category
   - Your original reasoning
   - Whether you adjust (and why)

5. Be concise and precise - this is deliberation, not debate

## Output Format

Return a JSON object with this structure:
{
  "observations": [
    {
      "claimId": "F1",
      "category": "factual_accuracy",
      "myOriginalScore": 20,
      "theirScore": 15,
      "theirJustification": "Their reasoning",
      "myResponse": "Whether I agree/disagree and why",
      "adjustedScore": null | number
    }
  ],
  "summary": "Brief overall assessment of score alignment"
}`

/**
 * Build the deliberation prompt with both evaluations
 */
export function buildDeliberationPrompt(
  myEvaluation: JurorEvaluation,
  theirEvaluation: JurorEvaluation,
  _claims: ExtractedClaim[]
): string {
  const formatEvaluation = (eval_: JurorEvaluation): string => {
    const formatScores = (scores: JurorEvaluation['forScores']): string =>
      scores
        .map(
          (
            s
          ) => `  ${s.category}: ${s.score}/${JURY_SCORING_RUBRICS.find((r) => r.category === s.category)?.maxScore}
    Justification: ${s.justification}
    Referenced: ${s.referencedClaims.join(', ')}`
        )
        .join('\n\n')

    return `FOR Scores (Total: ${eval_.totalForScore}):
${formatScores(eval_.forScores)}

AGAINST Scores (Total: ${eval_.totalAgainstScore}):
${formatScores(eval_.againstScores)}

Confidence: ${eval_.confidence}
Notes: ${eval_.notes}`
  }

  return `## My Evaluation
${formatEvaluation(myEvaluation)}

## Other Juror's Evaluation (${theirEvaluation.jurorName})
${formatEvaluation(theirEvaluation)}

---

Review the other juror's scores and justifications. Identify any disagreements and determine if you should adjust your scores. Return only the JSON object.`
}

/**
 * System prompt for arbiter resolution phase
 */
export const ARBITER_SYSTEM_PROMPT = `You are a neutral arbiter resolving juror disagreements. Your role is procedural, not substantive.

## Resolution Rules

1. If jurors agree within 10% on a category, use the average
2. If disagreement exceeds 10%, review both justifications for claim references
3. PENALIZE unsupported certainty - reduce scores for claims without evidence
4. RESOLVE TIES conservatively - favor the lower score when uncertain
5. Document all penalties and adjustments made

## Confidence Levels

- high: Jurors largely agreed, clear evidence basis
- moderate: Some disagreements resolved through deliberation
- low: Significant unresolved disagreements or insufficient evidence

## Evidence Determination

- "for": Evidence more strongly supports the affirmative position
- "against": Evidence more strongly supports the negative position
- "inconclusive": Evidence does not clearly favor either position (within 5%)

## Language Guidelines

Use neutral, legal-document tone:
- "Evidence favored..." NOT "Winner was..."
- "Demonstrated stronger support..." NOT "Beat..."
- "Contained fewer inaccuracies..." NOT "Was more truthful..."

## Deliberation Summary Guidelines

Provide a brief summary of the juror deliberation process for end users:
- Write 3-5 bullet points summarizing key observations
- Use plain language accessible to non-experts
- Do NOT reference internal claim IDs (F1, A3, etc.) - describe claims in plain terms
- Do NOT use emojis
- Focus on what the jurors agreed/disagreed on and how it was resolved
- Maintain formal, arbiter-like tone

## Output Format

Return a JSON object with this structure:
{
  "finalForScore": number,
  "finalAgainstScore": number,
  "evidenceFavors": "for" | "against" | "inconclusive",
  "confidenceLevel": "high" | "moderate" | "low",
  "rationale": "Explanation of how scores were resolved",
  "deliberationSummary": [
    "Both jurors agreed that the affirmative position provided stronger source citations",
    "Minor disagreement on statistical claim accuracy was resolved in favor of the lower score",
    "The negative position received penalties for several unsupported assertions"
  ],
  "penaltyNotes": ["List of any penalties applied"],
  "disclaimer": "Standard disclaimer about AI evaluation limitations"
}`

/**
 * Build the arbiter resolution prompt
 */
export function buildArbiterPrompt(
  geminiEval: JurorEvaluation,
  deepseekEval: JurorEvaluation,
  disagreements: ScoreDisagreement[]
): string {
  const formatDisagreements =
    disagreements.length > 0
      ? disagreements
          .map(
            (d) => `Claim ${d.claimId} - ${d.category}:
  Gemini: ${d.geminiScore} - "${d.geminiJustification}"
  DeepSeek: ${d.deepseekScore} - "${d.deepseekJustification}"
  ${d.resolution ? `Preliminary Resolution: ${d.resolution}` : ''}`
          )
          .join('\n\n')
      : 'No significant disagreements identified.'

  return `## Gemini Evaluation
FOR Total: ${geminiEval.totalForScore}/${MAX_JURY_SCORE}
AGAINST Total: ${geminiEval.totalAgainstScore}/${MAX_JURY_SCORE}
Confidence: ${geminiEval.confidence}

## DeepSeek Evaluation
FOR Total: ${deepseekEval.totalForScore}/${MAX_JURY_SCORE}
AGAINST Total: ${deepseekEval.totalAgainstScore}/${MAX_JURY_SCORE}
Confidence: ${deepseekEval.confidence}

## Identified Disagreements
${formatDisagreements}

---

Resolve the final scores using the arbiter rules. Return only the JSON object.`
}
