// src/components/ui/accordion.tsx
/**
 * Accessible accordion component supporting single or multiple expanded items.
 * Uses React Context for state management and CSS Grid for smooth expand/collapse animations.
 */
'use client'

import { ChevronDown } from 'lucide-react'
import { createContext, useCallback, useContext, useId, useState } from 'react'

import { cn } from '@/lib/utils'

type AccordionType = 'single' | 'multiple'

interface AccordionContextValue {
  type: AccordionType
  expandedItems: Set<string>
  toggleItem: (value: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordion() {
  const context = useContext(AccordionContext)
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion')
  }
  return context
}

interface AccordionProps {
  children: React.ReactNode
  type?: AccordionType
  defaultValue?: string | string[]
  className?: string
}

export function Accordion({ children, type = 'single', defaultValue, className }: AccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    if (!defaultValue) return new Set()
    if (Array.isArray(defaultValue)) return new Set(defaultValue)
    return new Set([defaultValue])
  })

  const toggleItem = useCallback(
    (value: string) => {
      setExpandedItems((prev) => {
        const next = new Set(prev)
        if (next.has(value)) {
          next.delete(value)
        } else {
          if (type === 'single') {
            next.clear()
          }
          next.add(value)
        }
        return next
      })
    },
    [type]
  )

  return (
    <AccordionContext.Provider value={{ type, expandedItems, toggleItem }}>
      <div className={cn('divide-y divide-border', className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

function AccordionItem({ value, trigger, children, className }: AccordionItemProps) {
  const { expandedItems, toggleItem } = useAccordion()
  const isExpanded = expandedItems.has(value)
  const contentId = useId()
  const triggerId = useId()

  return (
    <div className={cn('py-4', className)}>
      <h3>
        <button
          id={triggerId}
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={() => toggleItem(value)}
          className="flex w-full items-center justify-between text-left font-medium text-foreground transition-colors hover:text-muted-foreground"
        >
          {trigger}
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>
      </h3>
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
          <div className="pt-4 text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  )
}

Accordion.Item = AccordionItem
