// src/components/ui/validation-badge.tsx
/**
 * Status indicator badge for form validation states.
 * Renders appropriate icons for idle, validating, valid, invalid, and revision states.
 */

import { AlertTriangle, Check, Loader2, X } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { ValidationCategory, ValidationStatus } from '@/types/validation'

interface ValidationBadgeProps {
  status: ValidationStatus
  category?: ValidationCategory | undefined
  size?: 'sm' | 'md'
  className?: string | undefined
}

export function ValidationBadge({
  status,
  category,
  size = 'sm',
  className,
}: ValidationBadgeProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  if (status === 'idle') {
    return null
  }

  if (status === 'validating') {
    return (
      <span
        className={cn('inline-flex items-center text-muted-foreground', className)}
        role="status"
        aria-label="Validating rule"
      >
        <Loader2 className={cn(iconSize, 'animate-spin')} aria-hidden="true" />
      </span>
    )
  }

  if (status === 'error') {
    return (
      <span
        className={cn('inline-flex items-center text-amber-500', className)}
        role="status"
        aria-label="Validation error"
      >
        <AlertTriangle className={iconSize} aria-hidden="true" />
      </span>
    )
  }

  if (status === 'valid' || category === 'approved') {
    return (
      <span
        className={cn('inline-flex items-center text-green-500', className)}
        role="status"
        aria-label="Rule approved"
      >
        <Check className={iconSize} aria-hidden="true" />
      </span>
    )
  }

  if (category === 'needs_revision') {
    return (
      <span
        className={cn('inline-flex items-center text-amber-500', className)}
        role="status"
        aria-label="Rule needs revision"
      >
        <AlertTriangle className={iconSize} aria-hidden="true" />
      </span>
    )
  }

  if (status === 'invalid' || category === 'rejected') {
    return (
      <span
        className={cn('inline-flex items-center text-destructive', className)}
        role="status"
        aria-label="Rule rejected"
      >
        <X className={iconSize} aria-hidden="true" />
      </span>
    )
  }

  return null
}
