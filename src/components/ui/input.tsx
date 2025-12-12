// src/components/ui/input.tsx
/**
 * Single-line text input with error state and consistent form styling.
 * Provides accessible markup and validation indicators.
 */
'use client'

import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | undefined
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl px-4 py-2',
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
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
