// console-scripts.ts
/**
 * Scripted log sequences for the intelligence console loading animation.
 * Pacing follows fast-slow-fast curve for optimal perceived responsiveness.
 */

import type { LogStep } from '@/components/ui/intelligence-console'

/**
 * Debate creation script with intentional pacing:
 * - Fast start (build momentum)
 * - Slower middle (meaningful steps, build anticipation)
 * - Fast finish (satisfying completion)
 */
export const DEBATE_CREATION_SCRIPT: LogStep[] = [
  { text: 'Understanding the topic…', duration: 900 },
  { text: 'Interpreting intent and nuance', duration: 1100, emphasis: true },
  { text: 'Reviewing relevant knowledge', duration: 1300 },
  { text: 'Structuring opposing perspectives', duration: 1200, emphasis: true },
  { text: 'Preparing Agent A · Constructive', duration: 900, emphasis: true },
  { text: 'Preparing Agent B · Counterpoint', duration: 800, emphasis: true },
  { text: 'Debate ready.', duration: 1000 },
]

export const TOPIC_POLISH_SCRIPT: LogStep[] = [
  { text: 'Analyzing structure and clarity…', duration: 900 },
  { text: 'Refining the question', duration: 1200, emphasis: true },
  { text: 'Enhancing tone and precision', duration: 1200 },
  { text: 'Topic finalized.', duration: 800 },
]

/**
 * Adds timing variance to prevent repetitive-feeling animations.
 * Emphasis steps get less variance to maintain their deliberate pacing.
 */
export function getRandomizedScript(base: LogStep[]): LogStep[] {
  return base.map((step) => {
    const varianceFactor = step.emphasis ? 0.15 : 0.25
    const variance = 1 - varianceFactor + Math.random() * varianceFactor * 2
    return {
      ...step,
      duration: Math.round(step.duration * variance),
    }
  })
}
