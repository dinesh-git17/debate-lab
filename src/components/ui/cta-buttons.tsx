// src/components/ui/cta-buttons.tsx
// Apple-style premium CTA buttons with micro-interactions
'use client'

import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  children: React.ReactNode
}

/**
 * Primary CTA Button - Apple-style pill with gradient, shadows, and micro-interactions
 */
export const PrimaryCTA = forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ className, isLoading = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base pill shape
          'relative inline-flex items-center justify-center gap-2',
          'h-12 px-8 rounded-full',
          'text-sm font-semibold text-white',
          'select-none outline-none',

          // Apple-style blue gradient (top-to-bottom)
          'bg-gradient-to-b from-[#3B8DF8] via-[#2563EB] to-[#1D4ED8]',

          // Internal top highlight (pseudo-element simulated via box-shadow)
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_1px_3px_rgba(0,0,0,0.1),0_4px_12px_rgba(37,99,235,0.3)]',

          // Smooth transitions - Apple motion
          'transition-all duration-200 ease-out',
          'transform-gpu will-change-transform',

          // Hover state
          'hover:scale-[1.02]',
          'hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_2px_4px_rgba(0,0,0,0.12),0_8px_24px_rgba(37,99,235,0.4)]',
          'hover:from-[#4A9AFF] hover:via-[#3B82F6] hover:to-[#2563EB]',

          // Active/Pressed state
          'active:scale-[0.98]',
          'active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.15)]',
          'active:from-[#2563EB] active:via-[#1D4ED8] active:to-[#1E40AF]',

          // Focus state - accessible ring
          'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900',

          // Disabled state
          isDisabled && [
            'opacity-60 cursor-not-allowed',
            'hover:scale-100 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_1px_3px_rgba(0,0,0,0.1),0_4px_12px_rgba(37,99,235,0.3)]',
            'active:scale-100',
          ],

          className
        )}
        {...props}
      >
        {/* Content container with arrow animation */}
        <span
          className={cn(
            'inline-flex items-center justify-center gap-2',
            'transition-all duration-200 ease-out',
            isLoading && 'opacity-0'
          )}
        >
          {children}
          {/* Arrow icon that shifts on hover */}
          <svg
            className={cn(
              'w-4 h-4 transition-transform duration-200 ease-out',
              'group-hover:translate-x-0.5'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </span>

        {/* Loading spinner - fades in */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        )}
      </button>
    )
  }
)

PrimaryCTA.displayName = 'PrimaryCTA'

/**
 * Secondary CTA Button - Apple-style outline pill with subtle interactions
 */
export const SecondaryCTA = forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ className, isLoading = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base pill shape
          'relative inline-flex items-center justify-center gap-2',
          'h-12 px-6 rounded-full',
          'text-sm font-medium',
          'select-none outline-none',

          // Outline style with transparent background
          'bg-transparent',
          'border-[1.5px] border-neutral-300 dark:border-neutral-600',

          // Text color
          'text-neutral-700 dark:text-neutral-300',

          // Subtle shadow on default (almost invisible)
          'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',

          // Smooth transitions
          'transition-all duration-200 ease-out',
          'transform-gpu will-change-transform',

          // Hover state
          'hover:bg-neutral-100/80 dark:hover:bg-white/[0.06]',
          'hover:border-neutral-400 dark:hover:border-neutral-500',
          'hover:text-neutral-900 dark:hover:text-white',

          // Active/Pressed state
          'active:scale-[0.98]',
          'active:bg-neutral-200/80 dark:active:bg-white/[0.08]',
          'active:border-neutral-500 dark:active:border-neutral-400',

          // Focus state
          'focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900',
          'focus-visible:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]',

          // Disabled state
          isDisabled && [
            'opacity-50 cursor-not-allowed',
            'hover:bg-transparent hover:border-neutral-300 dark:hover:border-neutral-600',
            'hover:text-neutral-700 dark:hover:text-neutral-300',
            'active:scale-100',
          ],

          className
        )}
        {...props}
      >
        {/* Content */}
        <span
          className={cn(
            'inline-flex items-center justify-center gap-2',
            'transition-opacity duration-150',
            isLoading && 'opacity-0'
          )}
        >
          {children}
        </span>

        {/* Loading spinner */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
          </span>
        )}
      </button>
    )
  }
)

SecondaryCTA.displayName = 'SecondaryCTA'
