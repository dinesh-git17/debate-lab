// src/components/ui/textarea.tsx
/**
 * Multi-line text input with optional character count display.
 * Provides consistent styling and validation state indicators.
 */
'use client'

import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | undefined
  showCount?: boolean | undefined
  currentLength?: number | undefined
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, showCount, currentLength = 0, maxLength, ...props }, ref) => {
    return (
      <div className="relative group">
        <textarea
          className={cn(
            'flex min-h-[120px] w-full rounded-xl px-4 py-3',
            'text-sm text-neutral-900 dark:text-neutral-100',
            'bg-neutral-50/50 dark:bg-white/[0.03]',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            'border transition-all duration-200',
            error
              ? 'border-red-300 dark:border-red-500/30'
              : 'border-neutral-300 dark:border-white/[0.10]',
            'hover:border-neutral-400 dark:hover:border-white/[0.15]',
            'focus:outline-none focus:border-blue-500/50',
            'focus:bg-white dark:focus:bg-white/[0.05]',
            'focus:ring-2 focus:ring-blue-500/20',
            'focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]',
            'resize-y',
            'disabled:cursor-not-allowed disabled:opacity-50',
            showCount && 'pb-8',
            className
          )}
          ref={ref}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {showCount && maxLength && (
          <div
            className={cn(
              'absolute bottom-3 right-4 text-xs font-medium',
              'transition-colors duration-200',
              currentLength > maxLength
                ? 'text-red-500 dark:text-red-400'
                : 'text-neutral-400 dark:text-neutral-500'
            )}
            aria-live="polite"
          >
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
