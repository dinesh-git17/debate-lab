// src/components/ui/textarea.tsx
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
            // Base styles - Apple-style textarea
            'flex min-h-[120px] w-full rounded-xl px-4 py-3',
            'text-sm text-neutral-900 dark:text-neutral-100',
            // Background
            'bg-neutral-50/50 dark:bg-white/[0.03]',
            // Placeholder
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            // Border
            'border transition-all duration-200',
            error
              ? 'border-red-300 dark:border-red-500/30'
              : 'border-neutral-300 dark:border-white/[0.10]',
            // Hover
            'hover:border-neutral-400 dark:hover:border-white/[0.15]',
            // Focus - Apple-style blue ring
            'focus:outline-none focus:border-blue-500/50',
            'focus:bg-white dark:focus:bg-white/[0.05]',
            'focus:ring-2 focus:ring-blue-500/20',
            'focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]',
            // Resize
            'resize-y',
            // Disabled
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Character count padding
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
