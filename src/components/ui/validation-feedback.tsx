// src/components/ui/validation-feedback.tsx
'use client'

import { ChevronDown, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { ValidationResult } from '@/types/validation'

interface ValidationFeedbackProps {
  result: ValidationResult
  onApplySuggestion?: ((suggestion: string) => void) | undefined
  className?: string | undefined
}

export function ValidationFeedback({
  result,
  onApplySuggestion,
  className,
}: ValidationFeedbackProps) {
  const [showReasoning, setShowReasoning] = useState(false)

  const hasIssues = result.issues.length > 0
  const hasSuggestion = !!result.suggestion
  const hasReasoning = !!result.reasoning

  if (result.category === 'approved' && !hasIssues) {
    return null
  }

  const borderColor =
    result.category === 'rejected'
      ? 'border-destructive/50'
      : result.category === 'needs_revision'
        ? 'border-amber-500/50'
        : 'border-border'

  const bgColor =
    result.category === 'rejected'
      ? 'bg-destructive/5'
      : result.category === 'needs_revision'
        ? 'bg-amber-500/5'
        : 'bg-muted/30'

  return (
    <div className={cn('rounded-md border p-3 text-sm', borderColor, bgColor, className)}>
      {hasIssues && (
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            {result.category === 'rejected' ? 'Issues:' : 'Suggestions:'}
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
            {result.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {hasSuggestion && (
        <div className={cn('space-y-2', hasIssues && 'mt-3 border-t border-border/50 pt-3')}>
          <p className="font-medium text-foreground">Suggested revision:</p>
          <p className="italic text-muted-foreground">&quot;{result.suggestion}&quot;</p>
          {onApplySuggestion && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onApplySuggestion(result.suggestion!)}
              className="mt-1"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Apply Suggestion
            </Button>
          )}
        </div>
      )}

      {hasReasoning && (
        <div className={cn((hasIssues || hasSuggestion) && 'mt-3 border-t border-border/50 pt-3')}>
          <button
            type="button"
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn('h-3 w-3 transition-transform', showReasoning && 'rotate-180')}
              aria-hidden="true"
            />
            {showReasoning ? 'Hide' : 'Show'} reasoning
          </button>
          {showReasoning && (
            <p className="mt-2 text-xs text-muted-foreground">{result.reasoning}</p>
          )}
        </div>
      )}
    </div>
  )
}
