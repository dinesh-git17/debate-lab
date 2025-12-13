// budget-config.ts
/**
 * Token budget configuration for debate sessions.
 * Manages limits, thresholds, and cost controls for LLM API usage.
 */

import type { BudgetConfig } from '@/types/budget'

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  maxTokensPerDebate: 250000,
  maxTokensPerTurn: 15000,
  warningThresholdPercent: 80,
  hardLimitEnabled: true,
  costLimitUsd: undefined,
}

/**
 * Calculates token budget based on turn count.
 * Accounts for context growth as debate progresses plus moderator overhead.
 */
export function calculateBudgetForTurns(turnCount: number): number {
  const moderatorTurns = turnCount + 2
  const estimatedTokens = turnCount * 20000 + moderatorTurns * 5000 + 20000
  return Math.min(300000, Math.max(100000, estimatedTokens))
}

export function getBudgetConfig(): BudgetConfig {
  return {
    maxTokensPerDebate: parseInt(process.env.TOKEN_BUDGET_PER_DEBATE ?? '150000', 10),
    maxTokensPerTurn: parseInt(process.env.MAX_TOKENS_PER_TURN ?? '12000', 10),
    warningThresholdPercent: parseInt(process.env.BUDGET_WARNING_THRESHOLD ?? '80', 10),
    hardLimitEnabled: process.env.BUDGET_HARD_LIMIT !== 'false',
    costLimitUsd: process.env.COST_LIMIT_USD ? parseFloat(process.env.COST_LIMIT_USD) : undefined,
  }
}

export function validateBudgetConfig(config: BudgetConfig): string[] {
  const errors: string[] = []

  if (config.maxTokensPerDebate < 1000) {
    errors.push('maxTokensPerDebate must be at least 1000')
  }

  if (config.maxTokensPerDebate > 500000) {
    errors.push('maxTokensPerDebate exceeds safe limit of 500000')
  }

  if (config.maxTokensPerTurn < 100) {
    errors.push('maxTokensPerTurn must be at least 100')
  }

  if (config.maxTokensPerTurn > config.maxTokensPerDebate) {
    errors.push('maxTokensPerTurn cannot exceed maxTokensPerDebate')
  }

  if (config.warningThresholdPercent < 50 || config.warningThresholdPercent > 99) {
    errors.push('warningThresholdPercent must be between 50 and 99')
  }

  if (config.costLimitUsd !== undefined && config.costLimitUsd <= 0) {
    errors.push('costLimitUsd must be positive')
  }

  return errors
}

export function getValidatedBudgetConfig(): { config: BudgetConfig; errors: string[] } {
  const config = getBudgetConfig()
  const errors = validateBudgetConfig(config)
  return { config, errors }
}
