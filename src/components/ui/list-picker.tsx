// src/components/ui/list-picker.tsx
/**
 * Dropdown picker with rich option cards supporting title and subtitle.
 * Uses portal rendering to escape stacking contexts and fixed positioning for scroll stability.
 */
'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

export interface ListPickerOption {
  value: string
  title: string
  subtitle?: string | undefined
}

interface ListPickerProps {
  options: ListPickerOption[]
  value?: string | undefined
  onChange?: ((value: string) => void) | undefined
  placeholder?: string | undefined
  disabled?: boolean | undefined
  error?: boolean | undefined
  id?: string | undefined
  className?: string | undefined
}

export function ListPicker({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  id,
  className,
}: ListPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const generatedId = useId()
  const pickerId = id ?? generatedId
  const listId = `${pickerId}-list`

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below trigger
        left: rect.left,
        width: rect.width,
      })
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target)
      const isOutsideDropdown = listRef.current && !listRef.current.contains(target)

      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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
              triggerRef.current?.focus()
            }
          } else {
            if (!isOpen) updatePosition()
            setIsOpen(!isOpen)
          }
          break
        case 'ArrowDown':
          event.preventDefault()
          if (!isOpen) {
            updatePosition()
            setIsOpen(true)
            setHighlightedIndex(0)
          } else {
            setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1))
          }
          break
        case 'ArrowUp':
          event.preventDefault()
          if (isOpen) {
            setHighlightedIndex((prev) => Math.max(prev - 1, 0))
          }
          break
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          triggerRef.current?.focus()
          break
        case 'Tab':
          setIsOpen(false)
          break
      }
    },
    [disabled, isOpen, highlightedIndex, options, onChange, updatePosition]
  )

  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value)
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0)
    }
  }, [isOpen, options, value])

  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      const highlightedItem = items[highlightedIndex] as HTMLElement
      highlightedItem?.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen, highlightedIndex])

  const handleOptionClick = (event: React.MouseEvent, optionValue: string) => {
    event.stopPropagation()
    event.preventDefault()
    onChange?.(optionValue)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={pickerId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-invalid={error ? 'true' : undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          if (!isOpen) {
            updatePosition() // Calculate position before opening
          }
          setIsOpen(!isOpen)
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full rounded-2xl p-4 text-left',
          'flex items-center justify-between gap-3',
          'transition-all duration-200',
          'bg-neutral-50/80 hover:bg-neutral-100/80',
          'border border-neutral-200/80',
          'dark:bg-white/[0.03] dark:hover:bg-white/[0.05]',
          'dark:border-white/[0.08]',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
          'focus:border-blue-500/50',
          isOpen && [
            'ring-2 ring-blue-500/30',
            'border-blue-500/50',
            'bg-white dark:bg-white/[0.05]',
          ],
          error && 'border-red-300 dark:border-red-500/30',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex-1 min-w-0">
          {selectedOption ? (
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {selectedOption.title}
              </p>
              {selectedOption.subtitle && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                  {selectedOption.subtitle}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{placeholder}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0',
            'text-neutral-400 dark:text-neutral-500',
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {mounted &&
        isOpen &&
        dropdownPosition.width > 0 &&
        createPortal(
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={pickerId}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              'fixed z-[9999] rounded-2xl overflow-hidden',
              'bg-white',
              'border border-neutral-200',
              'shadow-[0_8px_30px_rgba(0,0,0,0.12),0_20px_60px_rgba(0,0,0,0.08)]',
              'dark:bg-[#171717]',
              'dark:border-neutral-700',
              'dark:shadow-[0_8px_30px_rgba(0,0,0,0.6),0_20px_60px_rgba(0,0,0,0.5)]',
              'animate-list-picker'
            )}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <div className="max-h-[320px] overflow-y-auto py-2 bg-white dark:bg-[#171717]">
              {options.map((option, index) => {
                const isSelected = option.value === value
                const isHighlighted = index === highlightedIndex

                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => handleOptionClick(e, option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'px-4 py-3 cursor-pointer',
                      'flex items-center justify-between gap-3',
                      'transition-colors duration-100',
                      'bg-white dark:bg-[#171717]',
                      isHighlighted && ['bg-neutral-100 dark:bg-neutral-800'],
                      isHighlighted && isSelected && ['bg-blue-50 dark:bg-blue-900/50']
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium truncate',
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-neutral-900 dark:text-white'
                        )}
                      >
                        {option.title}
                      </p>
                      {option.subtitle && (
                        <p
                          className={cn(
                            'text-xs mt-0.5 truncate',
                            isSelected
                              ? 'text-blue-500/70 dark:text-blue-400/70'
                              : 'text-neutral-500 dark:text-neutral-400'
                          )}
                        >
                          {option.subtitle}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check
                        className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
