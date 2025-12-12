// rules-category.tsx
/**
 * Collapsible category container for grouping related debate rules.
 * Supports icon display and aggregates RuleItem components.
 */
'use client'

import {
  ChevronDown,
  ListOrdered,
  Scale,
  Settings,
  Shield,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

import { RuleItem } from '@/components/features/rule-item'
import { cn } from '@/lib/utils'

import type { RuleCategory } from '@/data/debate-rules'

const iconMap: Record<string, LucideIcon> = {
  ListOrdered,
  Scale,
  Settings,
  Shield,
  Trophy,
}

interface RulesCategoryProps {
  category: RuleCategory
  defaultOpen?: boolean
}

export function RulesCategory({ category, defaultOpen = false }: RulesCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen)
  const Icon = iconMap[category.icon] ?? ListOrdered
  const contentId = `category-${category.id}-content`
  const triggerId = `category-${category.id}-trigger`

  return (
    <section className="rounded-xl border border-border bg-card/50">
      <button
        id={triggerId}
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className={cn(
          'flex w-full items-center justify-between gap-4 p-6 text-left transition-colors',
          'hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          'rounded-xl'
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{category.title}</h2>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {category.rules.length} {category.rules.length === 1 ? 'rule' : 'rules'}
          </span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={cn(
          'grid transition-all duration-300 ease-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-6 pb-6">
            {category.rules.map((rule) => (
              <RuleItem key={rule.id} rule={rule} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
