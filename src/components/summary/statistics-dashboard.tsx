// src/components/summary/statistics-dashboard.tsx
/**
 * Dashboard displaying debate session metrics and analytics.
 * Shows turn counts, token usage, costs, and per-participant breakdowns.
 */

'use client'

import { cn } from '@/lib/utils'
import { useSummaryStore, selectFormattedDuration } from '@/store/summary-store'

interface StatisticsDashboardProps {
  className?: string
}

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  subValue?: string
  colorClass?: string
}

function StatCard({ icon, label, value, subValue, colorClass = 'bg-muted/50' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border p-4',
        'flex flex-col items-center justify-center text-center',
        'transition-all duration-200 hover:border-primary/30',
        colorClass
      )}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {subValue && <div className="text-xs text-muted-foreground/70 mt-1">{subValue}</div>}
    </div>
  )
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  return `$${cost.toFixed(2)}`
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

function formatDebateFormat(format: string): string {
  const formatNames: Record<string, string> = {
    standard: 'Standard',
    oxford: 'Oxford',
    lincoln_douglas: 'Lincoln-Douglas',
  }
  return formatNames[format] ?? format
}

export function StatisticsDashboard({ className }: StatisticsDashboardProps) {
  const statistics = useSummaryStore((s) => s.statistics)
  const format = useSummaryStore((s) => s.format)
  const formattedDuration = useSummaryStore(selectFormattedDuration)
  const revealState = useSummaryStore((s) => s.revealState)

  if (!statistics) {
    return (
      <section className={cn('w-full', className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted/30" />
          ))}
        </div>
      </section>
    )
  }

  const isRevealed = revealState === 'revealed'

  return (
    <section className={cn('w-full', className)}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Debate Statistics</h2>
        <p className="text-muted-foreground">Key metrics from the debate session</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="💬" label="Total Turns" value={statistics.totalTurns} />
        <StatCard
          icon="📝"
          label="Total Tokens"
          value={formatNumber(statistics.totalTokens)}
          subValue={`~${Math.round(statistics.totalTokens * 0.75)} words`}
        />
        <StatCard
          icon="💰"
          label="Total Cost"
          value={formatCost(statistics.totalCost)}
          colorClass="bg-emerald-500/10"
        />
        <StatCard icon="⏱️" label="Duration" value={formattedDuration} subValue="minutes:seconds" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon="📊"
          label="Avg Tokens/Turn"
          value={formatNumber(statistics.avgTokensPerTurn)}
        />
        <StatCard
          icon="⚡"
          label="Avg Response Time"
          value={`${(statistics.avgResponseTimeMs / 1000).toFixed(1)}s`}
        />
        <div className="col-span-2 md:col-span-1">
          <StatCard icon="🎯" label="Debate Format" value={formatDebateFormat(format)} />
        </div>
      </div>

      {isRevealed && (
        <div className="mt-8 p-6 rounded-xl bg-muted/30 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Tokens by Participant</h3>
          <div className="space-y-4">
            <TokenBar
              label="FOR"
              tokens={statistics.tokensByParticipant.for}
              total={statistics.totalTokens}
              colorClass="bg-blue-500"
            />
            <TokenBar
              label="AGAINST"
              tokens={statistics.tokensByParticipant.against}
              total={statistics.totalTokens}
              colorClass="bg-red-500"
            />
            <TokenBar
              label="Moderator"
              tokens={statistics.tokensByParticipant.moderator}
              total={statistics.totalTokens}
              colorClass="bg-amber-500"
            />
          </div>
        </div>
      )}

      {isRevealed && statistics.costByProvider.length > 0 && (
        <div className="mt-6 p-6 rounded-xl bg-muted/30 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Cost by Provider</h3>
          <div className="space-y-3">
            {statistics.costByProvider.map((item) => (
              <div
                key={item.provider}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-foreground/80">{item.provider}</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCost(item.cost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

interface TokenBarProps {
  label: string
  tokens: number
  total: number
  colorClass: string
}

function TokenBar({ label, tokens, total, colorClass }: TokenBarProps) {
  const percentage = total > 0 ? (tokens / total) * 100 : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="text-foreground/80">{label}</span>
        <span className="font-mono text-muted-foreground">
          {formatNumber(tokens)} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
