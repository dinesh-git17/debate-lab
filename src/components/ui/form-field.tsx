// src/components/ui/form-field.tsx
/**
 * Wrapper component for form inputs that handles labels, error messages, and helper text.
 * Provides consistent form field structure and accessibility attributes.
 */

import { cn } from '@/lib/utils'

interface FormFieldProps {
  children: React.ReactNode
  label?: string | undefined
  error?: string | undefined
  helperText?: string | undefined
  required?: boolean | undefined
  className?: string | undefined
  htmlFor?: string | undefined
}

export function FormField({
  children,
  label,
  error,
  helperText,
  required = false,
  className,
  htmlFor,
}: FormFieldProps) {
  const descriptionId = htmlFor ? `${htmlFor}-description` : undefined
  const errorId = htmlFor ? `${htmlFor}-error` : undefined

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
          {required && (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}
