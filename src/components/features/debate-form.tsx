// src/components/features/debate-form.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { CustomRulesInput } from '@/components/features/custom-rules-input'
import { AnimatedTextarea } from '@/components/ui/animated-textarea'
import { PrimaryCTA, SecondaryCTA } from '@/components/ui/cta-buttons'
import { ListPicker, type ListPickerOption } from '@/components/ui/list-picker'
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'
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
  onSubmit: (data: DebateFormValues) => Promise<{ success: boolean; error?: string | undefined }>
  isSubmitting?: boolean | undefined
}

// Apple-style form section wrapper
function FormSection({
  children,
  label,
  htmlFor,
  error,
  helperText,
  required,
  className,
}: {
  children: React.ReactNode
  label: string
  htmlFor?: string | undefined
  error?: string | undefined
  helperText?: string | undefined
  required?: boolean | undefined
  className?: string | undefined
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-neutral-500 dark:text-neutral-500">{helperText}</p>
      )}
    </div>
  )
}

// Apple-style section divider
function SectionDivider() {
  return (
    <div
      className="h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-white/10"
      aria-hidden="true"
    />
  )
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

  // Map options for SegmentedControl (turns)
  const turnSegmentOptions: SegmentOption<number>[] = turnOptions.map((opt) => ({
    value: opt.value,
    label: opt.label,
    description: opt.description,
  }))

  // Map options for ListPicker (format)
  const formatListOptions: ListPickerOption[] = formatOptions.map((opt) => ({
    value: opt.value,
    title: opt.label,
    subtitle: opt.description,
  }))

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-10">
      {/* Section 1: Topic — Premium AnimatedTextarea with progress bar */}
      <div className="animate-section-reveal stagger-1">
        <AnimatedTextarea
          id="topic"
          label="Debate Topic"
          placeholder="Enter a topic you'd like to see debated. For example: 'Should AI be regulated by governments?'"
          maxLength={500}
          currentLength={topicValue?.length ?? 0}
          error={!!errors.topic}
          helperText={
            errors.topic?.message ?? "Enter a topic you'd like to see debated (10-500 characters)"
          }
          aria-describedby={errors.topic ? 'topic-error' : 'topic-description'}
          {...register('topic')}
        />
      </div>

      <SectionDivider />

      {/* Section 2: Turns — iOS SegmentedControl */}
      <div className="animate-section-reveal stagger-2">
        <FormSection label="Number of Turns" error={errors.turns?.message} required>
          <SegmentedControl<number>
            name="turns"
            options={turnSegmentOptions}
            value={turnsValue}
            onChange={(value) => setValue('turns', value, { shouldValidate: true })}
            error={!!errors.turns}
          />
        </FormSection>
      </div>

      <SectionDivider />

      {/* Section 3: Format — Floating ListPicker */}
      <div className="animate-section-reveal stagger-3">
        <FormSection label="Debate Format" htmlFor="format" error={errors.format?.message}>
          <ListPicker
            id="format"
            options={formatListOptions}
            value={formatValue}
            onChange={(value) =>
              setValue('format', value as DebateFormValues['format'], { shouldValidate: true })
            }
            error={!!errors.format}
            placeholder="Select a debate format"
          />
        </FormSection>
      </div>

      <SectionDivider />

      {/* Section 4: Custom Rules (Collapsible) */}
      <div className="space-y-4 animate-section-reveal stagger-4">
        <button
          type="button"
          onClick={() => setShowCustomRules(!showCustomRules)}
          className={cn(
            'flex w-full items-center justify-between rounded-xl p-4 text-left',
            // Apple-style card button
            'bg-neutral-50/60 dark:bg-white/[0.03]',
            'border border-neutral-200/80 dark:border-white/[0.08]',
            'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
            // Hover effects
            'hover:bg-neutral-100/80 dark:hover:bg-white/[0.05]',
            'hover:border-neutral-300 dark:hover:border-white/[0.12]',
            // Focus
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
            'transition-all duration-200'
          )}
          aria-expanded={showCustomRules}
          aria-controls="custom-rules-section"
        >
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Add Custom Rules
            <span className="ml-2 text-neutral-500 dark:text-neutral-500">(Optional)</span>
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-neutral-500 dark:text-neutral-400',
              'transition-transform duration-300 ease-out',
              showCustomRules && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {/* Animated collapsible panel */}
        <div
          id="custom-rules-section"
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            showCustomRules ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div
            className={cn(
              'rounded-2xl p-5',
              'bg-neutral-50/60 dark:bg-white/[0.02]',
              'border border-neutral-200/60 dark:border-white/[0.06]',
              'shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
            )}
          >
            <CustomRulesInput
              value={customRulesValue ?? []}
              onChange={handleCustomRulesChange}
              maxRules={5}
              maxLength={200}
              disabled={isSubmitting}
            />
            {errors.customRules?.message && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {errors.customRules.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div
          role="alert"
          className={cn(
            'rounded-xl p-4',
            'bg-red-50 dark:bg-red-500/10',
            'border border-red-200 dark:border-red-500/20',
            'text-sm text-red-700 dark:text-red-400'
          )}
        >
          {submitError}
        </div>
      )}

      {/* Apple-style CTA Buttons */}
      <div className="flex flex-col-reverse gap-4 pt-6 sm:flex-row sm:justify-end animate-section-reveal stagger-5">
        {/* Reset - Secondary Pill Button */}
        <SecondaryCTA type="button" onClick={handleReset} disabled={isSubmitting}>
          Reset
        </SecondaryCTA>

        {/* Start Debate - Primary Pill Button */}
        <PrimaryCTA type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
          Start Debate
        </PrimaryCTA>
      </div>
    </form>
  )
}
