// debate-assignment.ts
/**
 * Random assignment of AI models to debate positions.
 * Uses cryptographic randomness to ensure unbiased FOR/AGAINST allocation.
 */

import { randomInt } from 'crypto'

import type { DebateAssignment, DebatePosition, LLMProvider } from '@/types/debate'

export function generateDebateAssignment(): DebateAssignment {
  const coinFlip = randomInt(0, 2)

  if (coinFlip === 0) {
    return {
      forPosition: 'chatgpt',
      againstPosition: 'grok',
    }
  } else {
    return {
      forPosition: 'grok',
      againstPosition: 'chatgpt',
    }
  }
}

export function getProviderForPosition(
  assignment: DebateAssignment,
  position: DebatePosition
): LLMProvider {
  return position === 'for' ? assignment.forPosition : assignment.againstPosition
}

export function getPositionForProvider(
  assignment: DebateAssignment,
  provider: LLMProvider
): DebatePosition {
  return assignment.forPosition === provider ? 'for' : 'against'
}
