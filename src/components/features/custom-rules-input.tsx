// src/components/features/custom-rules-input.tsx
'use client'

import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ValidationBadge } from '@/components/ui/validation-badge'
import { ValidationFeedback } from '@/components/ui/validation-feedback'
import { cn } from '@/lib/utils'
import {
  clearCachedValidation,
  getCachedValidation,
  setCachedValidation,
} from '@/lib/validation-cache'

import type { RuleInputState, ValidationResponse } from '@/types/validation'

interface CustomRulesInputProps {
  value: string[]
  onChange: (rules: string[]) => void
  maxRules?: number
  maxLength?: number
  disabled?: boolean
}

const DEBOUNCE_MS = 500

export function CustomRulesInput({
  value,
  onChange,
  maxRules = 5,
  maxLength = 200,
  disabled = false,
}: CustomRulesInputProps) {
  const [ruleStates, setRuleStates] = useState<RuleInputState[]>(() =>
    value.map((v) => ({ value: v, status: 'idle' }))
  )
  const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const abortControllers = useRef<Map<number, AbortController>>(new Map())

  useEffect(() => {
    if (value.length !== ruleStates.length) {
      setRuleStates(
        value.map((v, i) => {
          const existing = ruleStates[i]
          if (existing && existing.value === v) {
            return existing
          }
          return { value: v, status: 'idle' as const }
        })
      )
    }
  }, [value, ruleStates])

  const validateRule = useCallback(async (rule: string, index: number) => {
    const cached = getCachedValidation(rule)
    if (cached) {
      setRuleStates((prev) => {
        const next = [...prev]
        const state = next[index]
        if (state) {
          next[index] = {
            ...state,
            status: cached.isValid ? 'valid' : 'invalid',
            result: cached,
          }
        }
        return next
      })
      return
    }

    const existingController = abortControllers.current.get(index)
    if (existingController) {
      existingController.abort()
    }

    const controller = new AbortController()
    abortControllers.current.set(index, controller)

    setRuleStates((prev) => {
      const next = [...prev]
      const state = next[index]
      if (state) {
        next[index] = { ...state, status: 'validating', error: undefined }
      }
      return next
    })

    try {
      const response = await fetch('/api/validate-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: [rule] }),
        signal: controller.signal,
      })

      const data = (await response.json()) as ValidationResponse

      if (data.success && data.results[0]) {
        const result = data.results[0]
        setCachedValidation(rule, result)

        setRuleStates((prev) => {
          const next = [...prev]
          const state = next[index]
          if (state && state.value === rule) {
            next[index] = {
              ...state,
              status: result.isValid ? 'valid' : 'invalid',
              result,
            }
          }
          return next
        })
      } else {
        setRuleStates((prev) => {
          const next = [...prev]
          const state = next[index]
          if (state) {
            next[index] = {
              ...state,
              status: 'error',
              error: data.error ?? 'Validation failed',
            }
          }
          return next
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      setRuleStates((prev) => {
        const next = [...prev]
        const state = next[index]
        if (state) {
          next[index] = {
            ...state,
            status: 'error',
            error: 'Connection error. Please try again.',
          }
        }
        return next
      })
    } finally {
      abortControllers.current.delete(index)
    }
  }, [])

  const handleRuleChange = useCallback(
    (index: number, newValue: string) => {
      const newRules = [...value]
      newRules[index] = newValue
      onChange(newRules)

      setRuleStates((prev) => {
        const next = [...prev]
        next[index] = { value: newValue, status: 'idle' }
        return next
      })

      clearCachedValidation(value[index] ?? '')

      const existingTimer = debounceTimers.current.get(index)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      if (newValue.trim().length >= 5) {
        const timer = setTimeout(() => {
          validateRule(newValue, index)
          debounceTimers.current.delete(index)
        }, DEBOUNCE_MS)
        debounceTimers.current.set(index, timer)
      }
    },
    [value, onChange, validateRule]
  )

  const handleRuleBlur = useCallback(
    (index: number) => {
      const rule = value[index]
      const state = ruleStates[index]

      if (rule && rule.trim().length >= 5 && state?.status === 'idle') {
        const existingTimer = debounceTimers.current.get(index)
        if (existingTimer) {
          clearTimeout(existingTimer)
          debounceTimers.current.delete(index)
        }
        validateRule(rule, index)
      }
    },
    [value, ruleStates, validateRule]
  )

  const handleAddRule = useCallback(() => {
    if (value.length < maxRules) {
      onChange([...value, ''])
      setRuleStates((prev) => [...prev, { value: '', status: 'idle' }])
    }
  }, [value, onChange, maxRules])

  const handleRemoveRule = useCallback(
    (index: number) => {
      const existingTimer = debounceTimers.current.get(index)
      if (existingTimer) {
        clearTimeout(existingTimer)
        debounceTimers.current.delete(index)
      }

      const existingController = abortControllers.current.get(index)
      if (existingController) {
        existingController.abort()
        abortControllers.current.delete(index)
      }

      const newRules = value.filter((_, i) => i !== index)
      onChange(newRules)
      setRuleStates((prev) => prev.filter((_, i) => i !== index))
    },
    [value, onChange]
  )

  const handleApplySuggestion = useCallback(
    (index: number, suggestion: string) => {
      handleRuleChange(index, suggestion)
      setTimeout(() => {
        validateRule(suggestion, index)
      }, 100)
    },
    [handleRuleChange, validateRule]
  )

  const handleRetry = useCallback(
    (index: number) => {
      const rule = value[index]
      if (rule && rule.trim().length >= 5) {
        validateRule(rule, index)
      }
    },
    [value, validateRule]
  )

  useEffect(() => {
    const timers = debounceTimers.current
    const controllers = abortControllers.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      controllers.forEach((controller) => controller.abort())
    }
  }, [])

  const hasRejectedRules = ruleStates.some((s) => s.result?.category === 'rejected')
  const isValidating = ruleStates.some((s) => s.status === 'validating')

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Custom rules supplement the{' '}
        <Link
          href="/debate/rules"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          default rules
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </Link>
        . Rules are validated by the moderator before being accepted.
      </p>

      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((rule, index) => {
            const state = ruleStates[index] ?? { value: rule, status: 'idle' }
            const showFeedback =
              state.status === 'invalid' ||
              state.status === 'error' ||
              (state.result && state.result.category !== 'approved')

            return (
              <div key={index} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={rule}
                      onChange={(e) => handleRuleChange(index, e.target.value)}
                      onBlur={() => handleRuleBlur(index)}
                      placeholder={`Rule ${index + 1} (5-${maxLength} characters)`}
                      maxLength={maxLength}
                      disabled={disabled}
                      error={state.status === 'invalid' && state.result?.category === 'rejected'}
                      aria-label={`Custom rule ${index + 1}`}
                      aria-describedby={showFeedback ? `rule-${index}-feedback` : undefined}
                      className={cn(
                        state.status === 'valid' && 'border-green-500/50',
                        state.status === 'invalid' &&
                          state.result?.category === 'needs_revision' &&
                          'border-amber-500/50'
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ValidationBadge status={state.status} category={state.result?.category} />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRule(index)}
                    disabled={disabled}
                    aria-label={`Remove rule ${index + 1}`}
                    className="h-10 w-10 shrink-0 p-0"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>

                {showFeedback && (
                  <div id={`rule-${index}-feedback`}>
                    {state.status === 'error' ? (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <span>{state.error}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(index)}
                          className="h-auto px-2 py-1 text-xs"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : state.result ? (
                      <ValidationFeedback
                        result={state.result}
                        onApplySuggestion={
                          state.result.suggestion
                            ? (suggestion) => handleApplySuggestion(index, suggestion)
                            : undefined
                        }
                      />
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddRule}
        disabled={disabled || value.length >= maxRules}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Add Rule ({value.length}/{maxRules})
      </Button>

      {hasRejectedRules && (
        <p className="text-sm text-destructive" role="alert">
          One or more rules have been rejected. Please revise or remove them before submitting.
        </p>
      )}

      {isValidating && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Validating rules...
        </p>
      )}
    </div>
  )
}

export function useCustomRulesValidation(ruleStates: RuleInputState[]) {
  const hasRejectedRules = ruleStates.some((s) => s.result?.category === 'rejected')
  const isValidating = ruleStates.some((s) => s.status === 'validating')
  const hasUnvalidatedRules = ruleStates.some(
    (s) => s.value.trim().length >= 5 && s.status === 'idle'
  )

  return {
    canSubmit: !hasRejectedRules && !isValidating,
    hasRejectedRules,
    isValidating,
    hasUnvalidatedRules,
  }
}
