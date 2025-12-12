// src/components/ui/animated-textarea.tsx
/**
 * Enhanced textarea with animated character count progress bar and focus glow effects.
 * Supports optional action slot for auxiliary controls.
 */
'use client'

import { forwardRef, useId, useState } from 'react'

import { cn } from '@/lib/utils'

export interface AnimatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | undefined
  maxLength?: number | undefined
  currentLength?: number | undefined
  helperText?: string | undefined
  label?: string | undefined
  /** Optional action element (e.g., sparkle button) rendered in top-right of textarea */
  actionSlot?: React.ReactNode | undefined
}

export const AnimatedTextarea = forwardRef<HTMLTextAreaElement, AnimatedTextareaProps>(
  (
    { className, error, maxLength, currentLength = 0, helperText, label, id, actionSlot, ...props },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const generatedId = useId()
    const textareaId = id ?? generatedId

    const progress = maxLength ? Math.min((currentLength / maxLength) * 100, 100) : 0
    const isNearLimit = maxLength ? currentLength > maxLength * 0.9 : false
    const isAtLimit = maxLength ? currentLength >= maxLength : false

    const getProgressColor = () => {
      if (isAtLimit) return 'bg-red-500 dark:bg-red-400'
      if (isNearLimit) return 'bg-amber-500 dark:bg-amber-400'
      return 'bg-blue-500 dark:bg-blue-400'
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            'relative rounded-2xl overflow-hidden',
            'transition-all duration-300',
            isFocused && [
              'shadow-[0_0_0_4px_rgba(59,130,246,0.15)]',
              'dark:shadow-[0_0_0_4px_rgba(59,130,246,0.15)]',
            ]
          )}
        >
          <textarea
            id={textareaId}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={helperText ? `${textareaId}-helper` : undefined}
            className={cn(
              'w-full min-h-[160px] resize-y',
              'px-4 py-4 pb-8',
              'text-sm leading-relaxed',
              'rounded-2xl',
              'bg-neutral-50/80 dark:bg-white/[0.03]',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'border-2 transition-colors duration-200',
              error
                ? 'border-red-300 dark:border-red-500/40'
                : isFocused
                  ? 'border-blue-500/60 dark:border-blue-400/50'
                  : 'border-neutral-200 dark:border-white/[0.08]',
              !isFocused && 'hover:border-neutral-300 dark:hover:border-white/[0.12]',
              'shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]',
              'dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]',
              'focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />

          {actionSlot && <div className="absolute right-3 top-3 z-10">{actionSlot}</div>}

          {maxLength && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-200/50 dark:bg-white/[0.05]">
              <div
                className={cn(
                  'h-full transition-all duration-300 ease-out',
                  getProgressColor(),
                  progress > 0 && progress < 100 && 'rounded-r-full'
                )}
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={currentLength}
                aria-valuemin={0}
                aria-valuemax={maxLength}
                aria-label={`${currentLength} of ${maxLength} characters used`}
              />
            </div>
          )}

          {maxLength && (
            <div
              className={cn(
                'absolute bottom-3 right-3',
                'text-[10px] font-medium',
                'px-2 py-0.5 rounded-full',
                'transition-colors duration-200',
                isAtLimit
                  ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  : isNearLimit
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-white/[0.08] dark:text-neutral-400'
              )}
            >
              {currentLength}/{maxLength}
            </div>
          )}
        </div>

        {helperText && (
          <p
            id={`${textareaId}-helper`}
            className={cn(
              'text-xs',
              error ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

AnimatedTextarea.displayName = 'AnimatedTextarea'
