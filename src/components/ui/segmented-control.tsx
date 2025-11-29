// src/components/ui/segmented-control.tsx
// Apple-style iOS Segmented Control with animated selection indicator
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

  // Calculate indicator position based on selected option
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
      {/* Container with iOS-style pill shape */}
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={name}
        className={cn(
          'relative inline-flex w-full rounded-xl p-1',
          // Light mode
          'bg-neutral-100',
          // Dark mode
          'dark:bg-white/[0.06]',
          // Error state
          error && 'ring-2 ring-red-500/30',
          // Disabled state
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        {/* Animated selection indicator */}
        <div
          className={cn(
            'absolute top-1 bottom-1 rounded-lg',
            // Light mode - white pill
            'bg-white',
            'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)]',
            // Dark mode - elevated surface
            'dark:bg-white/[0.12]',
            'dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]',
            // Smooth spring-like transition
            'transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]'
          )}
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          aria-hidden="true"
        />

        {/* Segment options */}
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
                'relative z-10 flex-1 px-4 py-2.5 rounded-lg',
                'text-sm font-medium text-center',
                'transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1',
                // Text colors
                isSelected
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400',
                // Hover state (only for non-selected)
                !isSelected && isHovered && 'text-neutral-800 dark:text-neutral-300'
              )}
            >
              <span className="relative">
                {option.label}
                {/* Tooltip for description - smooth floating fade */}
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

      {/* Selected option description (shown below) */}
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
