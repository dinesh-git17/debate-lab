// src/lib/console-scripts.ts

import type { LogStep } from '@/components/ui/intelligence-console'

/**
 * Full script for debate creation loading
 * Total duration: ~7 seconds (human-readable pace)
 */
export const DEBATE_CREATION_SCRIPT: LogStep[] = [
  { text: 'Initializing semantic analysis...', duration: 800 },
  { text: 'Parsing user intent: "{topic}"', duration: 1200 },
  { text: 'Querying knowledge base (Vector_DB_Shard_04)...', duration: 1400 },
  { text: 'Identifying logical frameworks...', duration: 1000 },
  { text: 'Assigning Agent A: Constructive', duration: 800 },
  { text: 'Assigning Agent B: Rebuttal', duration: 700 },
  { text: 'Ready.', duration: 1000 },
]

/**
 * Short script for topic polish (sparkle button)
 * Total duration: ~4 seconds
 */
export const TOPIC_POLISH_SCRIPT: LogStep[] = [
  { text: 'Analyzing semantic structure...', duration: 800 },
  { text: 'Reformulating: "{topic}"', duration: 1200 },
  { text: 'Applying linguistic polish...', duration: 1200 },
  { text: 'Complete.', duration: 800 },
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
