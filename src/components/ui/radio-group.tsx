// src/components/ui/radio-group.tsx
'use client'

import { cn } from '@/lib/utils'

export interface RadioOption<T extends string | number = string> {
  value: T
  label: string
  description?: string | undefined
}

interface RadioGroupProps<T extends string | number = string> {
  name: string
  options: readonly RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  orientation?: 'horizontal' | 'vertical' | undefined
  error?: boolean | undefined
  className?: string | undefined
}

export function RadioGroup<T extends string | number = string>({
  name,
  options,
  value,
  onChange,
  orientation = 'vertical',
  error,
  className,
}: RadioGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'flex gap-2.5',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value
        const inputId = `${name}-${option.value}`

        return (
          <label
            key={String(option.value)}
            htmlFor={inputId}
            className={cn(
              // Base styles - Apple-style pill card
              'relative flex cursor-pointer rounded-xl p-4',
              'border transition-all duration-200 ease-out',
              // Focus ring
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:ring-offset-2',
              // Selected state - Blue accent
              isSelected && [
                'bg-blue-50 dark:bg-blue-500/10',
                'border-blue-500/50 dark:border-blue-400/30',
                'shadow-[0_0_0_1px_rgba(59,130,246,0.1),0_2px_8px_rgba(59,130,246,0.1)]',
              ],
              // Default state
              !isSelected && [
                'bg-neutral-50/50 dark:bg-white/[0.02]',
                'border-neutral-200 dark:border-white/[0.08]',
                'hover:bg-neutral-100/80 dark:hover:bg-white/[0.04]',
                'hover:border-neutral-300 dark:hover:border-white/[0.12]',
              ],
              // Error state
              error && !isSelected && 'border-red-300 dark:border-red-500/30'
            )}
          >
            <input
              type="radio"
              id={inputId}
              name={name}
              value={String(option.value)}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only"
              aria-describedby={option.description ? `${inputId}-desc` : undefined}
            />
            {/* Apple-style radio indicator */}
            <span
              className={cn(
                'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full',
                'border-2 transition-all duration-200',
                isSelected
                  ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400'
                  : 'border-neutral-300 dark:border-neutral-600'
              )}
              aria-hidden="true"
            >
              {/* Inner check dot with scale animation */}
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full bg-white',
                  'transition-transform duration-200 ease-out',
                  isSelected ? 'scale-100' : 'scale-0'
                )}
              />
            </span>
            <div className="ml-3 flex flex-col">
              <span
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  isSelected
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-neutral-700 dark:text-neutral-300'
                )}
              >
                {option.label}
              </span>
              {option.description && (
                <span
                  id={`${inputId}-desc`}
                  className={cn(
                    'mt-0.5 text-xs transition-colors duration-200',
                    isSelected
                      ? 'text-blue-600/70 dark:text-blue-400/70'
                      : 'text-neutral-500 dark:text-neutral-500'
                  )}
                >
                  {option.description}
                </span>
              )}
            </div>
          </label>
        )
      })}
    </div>
  )
}
