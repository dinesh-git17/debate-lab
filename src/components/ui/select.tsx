// src/components/ui/select.tsx
'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  options: SelectOption[]
  value?: string | undefined
  error?: boolean | undefined
  placeholder?: string | undefined
  onChange?: ((value: string) => void) | undefined
  disabled?: boolean | undefined
  id?: string | undefined
  className?: string | undefined
}

export function Select({
  options,
  value,
  error,
  placeholder = 'Select an option',
  onChange,
  disabled = false,
  id,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listboxId = `${selectId}-listbox`

  const selectedOption = options.find((opt) => opt.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (isOpen && highlightedIndex >= 0) {
            const option = options[highlightedIndex]
            if (option) {
              onChange?.(option.value)
              setIsOpen(false)
              buttonRef.current?.focus()
            }
          } else {
            setIsOpen(!isOpen)
          }
          break
        case 'ArrowDown':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            setHighlightedIndex(0)
          } else {
            setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev))
          }
          break
        case 'ArrowUp':
          event.preventDefault()
          if (isOpen) {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          }
          break
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          buttonRef.current?.focus()
          break
        case 'Tab':
          setIsOpen(false)
          break
      }
    },
    [disabled, isOpen, highlightedIndex, options, onChange]
  )

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value)
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0)
    }
  }, [isOpen, options, value])

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const highlightedElement = listboxRef.current.children[highlightedIndex] as HTMLElement
      highlightedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen, highlightedIndex])

  const handleOptionClick = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        id={selectId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-invalid={error ? 'true' : undefined}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          // Base styles - Apple-style select trigger
          'flex h-12 w-full items-center justify-between rounded-xl px-4 py-3',
          'text-sm font-medium text-left',
          // Colors
          'bg-neutral-50/50 dark:bg-white/[0.03]',
          // Border
          'border transition-all duration-200',
          error
            ? 'border-red-300 dark:border-red-500/30'
            : 'border-neutral-300 dark:border-white/[0.10]',
          // Hover
          !disabled && 'hover:border-neutral-400 dark:hover:border-white/[0.15]',
          !disabled && 'hover:bg-neutral-100/50 dark:hover:bg-white/[0.05]',
          // Focus - Apple-style blue ring
          'focus:outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/[0.05]',
          'focus:ring-2 focus:ring-blue-500/20',
          'focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]',
          // Open state
          isOpen && [
            'border-blue-500/50 dark:border-blue-400/30',
            'ring-2 ring-blue-500/20',
            'shadow-[0_0_0_4px_rgba(59,130,246,0.1)]',
          ],
          // Disabled
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'truncate',
            selectedOption
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 dark:text-neutral-400'
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 ml-2',
            'text-neutral-500 dark:text-neutral-400',
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={selectId}
          className={cn(
            'absolute z-50 mt-2 w-full',
            'max-h-[280px] overflow-auto',
            'rounded-xl py-1.5',
            // Light mode - clean white dropdown
            'bg-white',
            'border border-neutral-200',
            'shadow-[0_4px_20px_rgba(0,0,0,0.08),0_8px_40px_rgba(0,0,0,0.06)]',
            // Dark mode - elevated surface
            'dark:bg-neutral-900',
            'dark:border-white/[0.10]',
            'dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_8px_40px_rgba(0,0,0,0.3)]',
            // Animation
            'animate-[selectFadeIn_0.15s_ease-out]'
          )}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isHighlighted = index === highlightedIndex

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleOptionClick(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'flex items-center justify-between px-4 py-2.5 cursor-pointer',
                  'text-sm transition-colors duration-100',
                  // Default text colors
                  'text-neutral-700 dark:text-neutral-200',
                  // Highlighted state (keyboard or hover)
                  isHighlighted && [
                    'bg-neutral-100 dark:bg-white/[0.08]',
                    'text-neutral-900 dark:text-white',
                  ],
                  // Selected state
                  isSelected && ['font-medium', 'text-blue-600 dark:text-blue-400'],
                  // Combined highlighted + selected
                  isHighlighted &&
                    isSelected && [
                      'bg-blue-50 dark:bg-blue-500/15',
                      'text-blue-700 dark:text-blue-300',
                    ]
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <Check
                    className={cn('h-4 w-4 shrink-0 ml-2', 'text-blue-600 dark:text-blue-400')}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
