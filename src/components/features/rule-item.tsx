// rule-item.tsx
/**
 * Expandable rule display component with enforcement badge.
 * Renders individual debate rules with collapsible details and examples.
 */
'use client'

import { ChevronDown, Cpu, Shield } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import type { Rule } from '@/data/debate-rules'

interface RuleItemProps {
  rule: Rule
}

export function RuleItem({ rule }: RuleItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const contentId = `rule-${rule.id}-content`
  const triggerId = `rule-${rule.id}-trigger`

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        id={triggerId}
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className={cn(
          'flex w-full items-start justify-between gap-4 p-4 text-left transition-colors',
          'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
        )}
      >
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-medium text-foreground">{rule.title}</h4>
          <p className="text-sm text-muted-foreground">{rule.shortDescription}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <EnforcementBadge enforcedBy={rule.enforcedBy} />
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
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
          'grid transition-all duration-200 ease-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-4 pb-4 pt-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{rule.fullExplanation}</p>

            {rule.examples && rule.examples.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Examples
                </p>
                <div className="space-y-2">
                  {rule.examples.map((example, index) => (
                    <blockquote
                      key={index}
                      className="border-l-2 border-muted-foreground/30 pl-3 text-sm italic text-muted-foreground"
                    >
                      {example}
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EnforcementBadge({ enforcedBy }: { enforcedBy: 'system' | 'moderator' }) {
  if (enforcedBy === 'system') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Cpu className="h-3 w-3" aria-hidden="true" />
        System
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
      <Shield className="h-3 w-3" aria-hidden="true" />
      Moderator
    </span>
  )
}
