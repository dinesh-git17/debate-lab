// src/components/features/debate-form.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { CustomRulesInput } from '@/components/features/custom-rules-input'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { RadioGroup } from '@/components/ui/radio-group'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  debateFormSchema,
  defaultValues,
  formatOptions,
  turnOptions,
  type DebateFormValues,
} from '@/lib/schemas/debate-schema'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'debate-draft'

interface DebateFormProps {
  onSubmit: (data: DebateFormValues) => Promise<{ success: boolean; error?: string }>
  isSubmitting?: boolean
}

export function DebateForm({ onSubmit, isSubmitting = false }: DebateFormProps) {
  const [showCustomRules, setShowCustomRules] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<DebateFormValues>({
    resolver: zodResolver(debateFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form

  const topicValue = watch('topic')
  const turnsValue = watch('turns')
  const formatValue = watch('format')
  const customRulesValue = watch('customRules')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const draft = JSON.parse(saved) as DebateFormValues
        reset(draft)
        if (draft.customRules && draft.customRules.length > 0) {
          setShowCustomRules(true)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [reset])

  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const handleFormSubmit = async (data: DebateFormValues) => {
    setSubmitError(null)
    const result = await onSubmit(data)
    if (result.success) {
      localStorage.removeItem(STORAGE_KEY)
    } else if (result.error) {
      setSubmitError(result.error)
    }
  }

  const handleReset = () => {
    reset(defaultValues)
    setShowCustomRules(false)
    localStorage.removeItem(STORAGE_KEY)
    setSubmitError(null)
  }

  const handleCustomRulesChange = (rules: string[]) => {
    setValue('customRules', rules, { shouldValidate: true })
  }

  const formatSelectOptions = formatOptions.map((opt) => ({
    value: opt.value,
    label: `${opt.label} — ${opt.description}`,
  }))

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <FormField
        label="Debate Topic"
        htmlFor="topic"
        error={errors.topic?.message}
        helperText="Enter a topic you'd like to see debated (10-500 characters)"
        required
      >
        <Textarea
          id="topic"
          placeholder="Enter a topic you'd like to see debated. For example: 'Should AI be regulated by governments?'"
          maxLength={500}
          showCount
          currentLength={topicValue?.length ?? 0}
          error={!!errors.topic}
          aria-describedby={errors.topic ? 'topic-error' : 'topic-description'}
          {...register('topic')}
        />
      </FormField>

      <FormField label="Number of Turns" error={errors.turns?.message} required>
        <RadioGroup
          name="turns"
          options={turnOptions}
          value={turnsValue}
          onChange={(value) => setValue('turns', value as number, { shouldValidate: true })}
          error={!!errors.turns}
        />
      </FormField>

      <FormField label="Debate Format" htmlFor="format" error={errors.format?.message}>
        <Select
          id="format"
          options={formatSelectOptions}
          value={formatValue}
          onChange={(value) =>
            setValue('format', value as DebateFormValues['format'], { shouldValidate: true })
          }
          error={!!errors.format}
        />
      </FormField>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowCustomRules(!showCustomRules)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors',
            'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
          aria-expanded={showCustomRules}
          aria-controls="custom-rules-section"
        >
          <span className="text-sm font-medium text-foreground">
            Add Custom Rules
            <span className="ml-2 text-muted-foreground">(Optional)</span>
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              showCustomRules && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {showCustomRules && (
          <div id="custom-rules-section" className="rounded-lg border border-border p-4">
            <CustomRulesInput
              value={customRulesValue ?? []}
              onChange={handleCustomRulesChange}
              maxRules={5}
              maxLength={200}
              disabled={isSubmitting}
            />
            {errors.customRules?.message && (
              <p className="mt-3 text-sm text-destructive">{errors.customRules.message}</p>
            )}
          </div>
        )}
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Debate...' : 'Start Debate'}
        </Button>
      </div>
    </form>
  )
}
