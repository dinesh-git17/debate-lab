// rules-explorer.tsx
/**
 * Interactive rules browser with expand/collapse controls.
 * Renders categorized debate rules with bulk toggle functionality.
 */
'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'

import { RulesCategory } from '@/components/features/rules-category'
import { Button } from '@/components/ui/button'

import type { RuleCategory } from '@/data/debate-rules'

interface RulesExplorerProps {
  categories: RuleCategory[]
  showAddRulesLink?: boolean
}

export function RulesExplorer({ categories, showAddRulesLink = true }: RulesExplorerProps) {
  const [expandedAll, setExpandedAll] = useState(false)
  const [key, setKey] = useState(0)

  const handleToggleAll = useCallback(() => {
    setExpandedAll((prev) => !prev)
    setKey((prev) => prev + 1)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} categories, {categories.reduce((acc, c) => acc + c.rules.length, 0)}{' '}
          rules total
        </p>
        <Button variant="ghost" size="sm" onClick={handleToggleAll} className="gap-2">
          {expandedAll ? (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              Expand All
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4" key={key}>
        {categories.map((category, index) => (
          <RulesCategory
            key={category.id}
            category={category}
            defaultOpen={expandedAll || index === 0}
          />
        ))}
      </div>

      {showAddRulesLink && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Want to add custom rules?{' '}
            <Link href="/debate/new" className="font-medium text-primary hover:underline">
              Create a debate
            </Link>{' '}
            and add up to 5 custom rules that the moderator will enforce.
          </p>
        </div>
      )}
    </div>
  )
}
