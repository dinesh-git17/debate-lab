// usage-store.ts
/**
 * Token usage and cost tracking for debate sessions.
 * Provides per-debate tracking, cost breakdowns, and aggregate statistics.
 */

import { calculateBudgetForTurns, getBudgetConfig } from './budget-config'

import type { CostBreakdown, DebateUsage, TurnUsage, UsageStats } from '@/types/budget'
import type { LLMProviderType } from '@/types/llm'

const usageStore = new Map<string, DebateUsage>()

let aggregateStatsCache: UsageStats | null = null
let aggregateStatsCacheTimestamp: number = 0
const STATS_CACHE_TTL = 60000

export function initializeUsage(debateId: string, turnCount?: number): DebateUsage {
  const config = getBudgetConfig()

  const budgetTokens = turnCount ? calculateBudgetForTurns(turnCount) : config.maxTokensPerDebate

  const usage: DebateUsage = {
    debateId,
    turns: [],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    budgetTokens,
    budgetRemainingTokens: budgetTokens,
    budgetUtilizationPercent: 0,
    startedAt: new Date(),
    lastUpdatedAt: new Date(),
  }

  usageStore.set(debateId, usage)
  return usage
}

export function getUsage(debateId: string): DebateUsage | null {
  return usageStore.get(debateId) ?? null
}

export function recordTurnUsage(debateId: string, turnUsage: TurnUsage): DebateUsage {
  let usage = usageStore.get(debateId)

  if (!usage) {
    usage = initializeUsage(debateId)
  }

  usage.turns.push(turnUsage)

  usage.totalInputTokens += turnUsage.inputTokens
  usage.totalOutputTokens += turnUsage.outputTokens
  usage.totalTokens += turnUsage.totalTokens
  usage.totalCostUsd += turnUsage.costUsd

  usage.budgetRemainingTokens = Math.max(0, usage.budgetTokens - usage.totalTokens)
  usage.budgetUtilizationPercent = Math.round((usage.totalTokens / usage.budgetTokens) * 100)

  usage.lastUpdatedAt = new Date()

  usageStore.set(debateId, usage)

  aggregateStatsCache = null

  return usage
}

export function getCostBreakdown(debateId: string): CostBreakdown[] {
  const usage = usageStore.get(debateId)
  if (!usage) return []

  const byProvider = new Map<string, CostBreakdown>()

  for (const turn of usage.turns) {
    const key = turn.provider
    const existing = byProvider.get(key) ?? {
      provider: turn.provider as LLMProviderType,
      inputTokens: 0,
      outputTokens: 0,
      inputCostUsd: 0,
      outputCostUsd: 0,
      totalCostUsd: 0,
    }

    existing.inputTokens += turn.inputTokens
    existing.outputTokens += turn.outputTokens
    existing.totalCostUsd += turn.costUsd

    byProvider.set(key, existing)
  }

  return Array.from(byProvider.values())
}

export function getAllUsage(): DebateUsage[] {
  return Array.from(usageStore.values())
}

export function getAggregateStats(period: 'hour' | 'day' | 'week' | 'month' = 'day'): UsageStats {
  const now = Date.now()

  if (aggregateStatsCache && now - aggregateStatsCacheTimestamp < STATS_CACHE_TTL) {
    return aggregateStatsCache
  }

  const periodMs = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  } as const
  const cutoff = new Date(now - periodMs[period])

  const debatesInPeriod = getAllUsage().filter((u) => u.startedAt >= cutoff)

  let totalTokens = 0
  let totalCostUsd = 0
  const providerTotals = new Map<string, CostBreakdown>()

  for (const debate of debatesInPeriod) {
    totalTokens += debate.totalTokens
    totalCostUsd += debate.totalCostUsd

    for (const turn of debate.turns) {
      const key = turn.provider
      const existing = providerTotals.get(key) ?? {
        provider: turn.provider as LLMProviderType,
        inputTokens: 0,
        outputTokens: 0,
        inputCostUsd: 0,
        outputCostUsd: 0,
        totalCostUsd: 0,
      }

      existing.inputTokens += turn.inputTokens
      existing.outputTokens += turn.outputTokens
      existing.totalCostUsd += turn.costUsd

      providerTotals.set(key, existing)
    }
  }

  const debatesCount = debatesInPeriod.length

  aggregateStatsCache = {
    period,
    debatesCount,
    totalTokens,
    totalCostUsd: Math.round(totalCostUsd * 1000000) / 1000000,
    averageTokensPerDebate: debatesCount > 0 ? Math.round(totalTokens / debatesCount) : 0,
    averageCostPerDebate:
      debatesCount > 0 ? Math.round((totalCostUsd / debatesCount) * 1000000) / 1000000 : 0,
    byProvider: Array.from(providerTotals.values()),
    timestamp: new Date(),
  }

  aggregateStatsCacheTimestamp = now

  return aggregateStatsCache
}

export function deleteUsage(debateId: string): boolean {
  aggregateStatsCache = null
  return usageStore.delete(debateId)
}

export function clearAllUsage(): void {
  usageStore.clear()
  aggregateStatsCache = null
}

export function hasUsage(debateId: string): boolean {
  return usageStore.has(debateId)
}

export function getActiveDebateCount(): number {
  return usageStore.size
}
