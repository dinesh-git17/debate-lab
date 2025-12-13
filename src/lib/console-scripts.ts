// console-scripts.ts
/**
 * Scripted log sequences for the intelligence console loading animation.
 * Provides visual feedback during asynchronous operations.
 */

import type { LogStep } from '@/components/ui/intelligence-console'

export const DEBATE_CREATION_SCRIPT: LogStep[] = [
  { text: 'Initializing semantic analysis...', duration: 800 },
  { text: 'Parsing user intent: "{topic}"', duration: 1200 },
  { text: 'Querying knowledge base (Vector_DB_Shard_04)...', duration: 1400 },
  { text: 'Identifying logical frameworks...', duration: 1000 },
  { text: 'Assigning Agent A: Constructive', duration: 800 },
  { text: 'Assigning Agent B: Rebuttal', duration: 700 },
  { text: 'Ready.', duration: 1000 },
]

export const TOPIC_POLISH_SCRIPT: LogStep[] = [
  { text: 'Analyzing semantic structure...', duration: 800 },
  { text: 'Reformulating: "{topic}"', duration: 1200 },
  { text: 'Applying linguistic polish...', duration: 1200 },
  { text: 'Complete.', duration: 800 },
]

/** Adds timing variance to prevent repetitive-feeling animations. */
export function getRandomizedScript(base: LogStep[]): LogStep[] {
  return base.map((step) => ({
    ...step,
    duration: Math.round(step.duration * (0.8 + Math.random() * 0.4)),
  }))
}
