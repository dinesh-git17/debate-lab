// src/components/ui/segmented-control.tsx
/**
 * Tab-style segmented control with animated sliding indicator.
 * Supports keyboard navigation and responsive grid-to-flex layout.
 */
'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string | number = string> {
  value: T
  label: string
  description?: string | undefined
}

interface SegmentedControlProps<T extends string | number = string> {
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  name?: string | undefined
  disabled?: boolean | undefined
  error?: boolean | undefined
  className?: string | undefined
}

export function SegmentedControl<T extends string | number = string>({
  options,
  value,
  onChange,
  name = 'segmented-control',
  disabled = false,
  error = false,
  className,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const selectedIndex = options.findIndex((opt) => opt.value === value)
    if (selectedIndex === -1) return

    const buttons = containerRef.current.querySelectorAll('[role="radio"]')
    const selectedButton = buttons[selectedIndex] as HTMLElement

    if (selectedButton) {
      setIndicatorStyle({
        left: selectedButton.offsetLeft,
        width: selectedButton.offsetWidth,
      })
    }
  }, [value, options])

  const selectedIndex = options.findIndex((opt) => opt.value === value)

  return (
    <div className={cn('relative', className)}>
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={name}
        className={cn(
          'relative w-full rounded-xl p-1',
          'grid grid-cols-2 gap-1',
          'sm:flex sm:flex-row sm:gap-0',
          'bg-neutral-100',
          'dark:bg-white/[0.06]',
          error && 'ring-2 ring-red-500/30',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute top-1 bottom-1 rounded-lg',
            'hidden sm:block',
            'bg-white',
            'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)]',
            'dark:bg-white/[0.12]',
            'dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]',
            'transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]'
          )}
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          aria-hidden="true"
        />

        {options.map((option, index) => {
          const isSelected = value === option.value
          const isHovered = hoveredIndex === index

          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={
                option.description ? `${option.label}: ${option.description}` : option.label
              }
              onClick={() => !disabled && onChange(option.value)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' && index < options.length - 1) {
                  e.preventDefault()
                  onChange(options[index + 1]!.value)
                } else if (e.key === 'ArrowLeft' && index > 0) {
                  e.preventDefault()
                  onChange(options[index - 1]!.value)
                }
              }}
              disabled={disabled}
              className={cn(
                'relative z-10 px-4 py-2.5 rounded-lg',
                'sm:flex-1',
                'text-sm font-medium text-center',
                'transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1',
                index === options.length - 1 &&
                  options.length % 2 === 1 &&
                  'col-span-2 sm:col-span-1',
                isSelected && [
                  'sm:bg-transparent',
                  'bg-white dark:bg-white/[0.12]',
                  'shadow-[0_1px_3px_rgba(0,0,0,0.08)] sm:shadow-none',
                ],
                isSelected
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400',
                !isSelected && isHovered && 'text-neutral-800 dark:text-neutral-300'
              )}
            >
              <span className="relative">
                {option.label}
                {option.description && isHovered && !isSelected && (
                  <span
                    className={cn(
                      'absolute left-1/2 -translate-x-1/2 top-full mt-3 px-3 py-1.5',
                      'text-xs font-normal whitespace-nowrap',
                      'bg-neutral-800 dark:bg-neutral-100',
                      'text-neutral-100 dark:text-neutral-800',
                      'rounded-lg',
                      'shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
                      'dark:shadow-[0_4px_12px_rgba(0,0,0,0.1)]',
                      'animate-[tooltipFadeIn_0.2s_ease-out]',
                      'z-50'
                    )}
                  >
                    {option.description}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {options[selectedIndex]?.description && (
        <p
          className={cn(
            'mt-2 text-xs text-center',
            'text-neutral-500 dark:text-neutral-400',
            'animate-[fadeIn_0.2s_ease-out]'
          )}
        >
          {options[selectedIndex]?.description}
        </p>
      )}
    </div>
  )
}
