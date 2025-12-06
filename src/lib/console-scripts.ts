// src/lib/console-scripts.ts

import type { LogStep } from '@/components/ui/intelligence-console'

/**
 * Full script for debate creation loading
 */
export const DEBATE_CREATION_SCRIPT: LogStep[] = [
  { text: 'Initializing semantic analysis...', duration: 400 },
  { text: 'Parsing user intent: "{topic}"', duration: 600 },
  { text: 'Querying knowledge base (Vector_DB_Shard_04)...', duration: 800 },
  { text: 'Identifying logical frameworks...', duration: 600 },
  { text: 'Assigning Agent A: Constructive', duration: 400 },
  { text: 'Assigning Agent B: Rebuttal', duration: 300 },
  { text: 'Ready.', duration: 500 },
]

/**
 * Short script for topic polish (sparkle button)
 */
export const TOPIC_POLISH_SCRIPT: LogStep[] = [
  { text: 'Analyzing semantic structure...', duration: 300 },
  { text: 'Reformulating: "{topic}"', duration: 500 },
  { text: 'Applying linguistic polish...', duration: 600 },
  { text: 'Complete.', duration: 300 },
]

/**
 * Get random variation to prevent repetition feeling robotic
 */
export function getRandomizedScript(base: LogStep[]): LogStep[] {
  return base.map((step) => ({
    ...step,
    // Add ±20% variance to duration
    duration: Math.round(step.duration * (0.8 + Math.random() * 0.4)),
  }))
}
