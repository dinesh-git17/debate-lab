// src/components/ui/content-violation-modal.tsx
/**
 * Alert dialog for displaying content policy violations with severity-based styling.
 * Renders via portal with backdrop blur and focus trap for accessibility.
 */
'use client'

import { AlertTriangle, ShieldAlert, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

import { Button } from './button'

import type { BlockReason } from '@/lib/security'

interface ContentViolationModalProps {
  isOpen: boolean
  onClose: () => void
  blockReason?: BlockReason | undefined
  message?: string | undefined
}

const VIOLATION_CONFIG: Record<
  BlockReason,
  {
    icon: typeof AlertTriangle
    title: string
    description: string
    iconColor: string
    bgColor: string
  }
> = {
  prompt_injection: {
    icon: ShieldAlert,
    title: 'Security Violation Detected',
    description:
      'Your input contains patterns that attempt to manipulate the AI system. This is a violation of our Terms of Service.',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  harmful_content: {
    icon: XCircle,
    title: 'Prohibited Content Detected',
    description:
      'Your input contains content that is strictly prohibited. This type of request violates our Terms of Service and community guidelines.',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-500/10',
  },
  manipulation: {
    icon: ShieldAlert,
    title: 'Manipulation Attempt Detected',
    description:
      'Your input contains patterns designed to bypass safety measures. This is a violation of our Terms of Service.',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  dangerous_pattern: {
    icon: ShieldAlert,
    title: 'Prohibited Pattern Detected',
    description:
      'Your input contains formatting or patterns that are not allowed. Please revise your input.',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  sensitive_topic: {
    icon: XCircle,
    title: 'Sensitive Topic Not Allowed',
    description:
      'This topic involves content that cannot be debated on our platform due to its sensitive or harmful nature. Please choose a different topic.',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  profanity: {
    icon: AlertTriangle,
    title: 'Inappropriate Language',
    description:
      'Your input contains language that is not appropriate for our platform. Please revise your topic using professional language.',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  content_policy: {
    icon: AlertTriangle,
    title: 'Content Policy Violation',
    description: 'Your input was flagged by our content filter. Please revise your topic.',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
}

export function ContentViolationModal({
  isOpen,
  onClose,
  blockReason = 'content_policy',
  message,
}: ContentViolationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)

  const config = VIOLATION_CONFIG[blockReason]
  const Icon = config.icon

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const isSevere =
    blockReason === 'prompt_injection' ||
    blockReason === 'harmful_content' ||
    blockReason === 'manipulation' ||
    blockReason === 'dangerous_pattern' ||
    blockReason === 'sensitive_topic'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="violation-title"
      aria-describedby="violation-description"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={modalRef}
        className={cn(
          'relative z-10 mx-4 w-full max-w-lg rounded-2xl border shadow-2xl',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200 dark:border-neutral-800',
          'animate-[scaleIn_0.2s_ease-out]'
        )}
      >
        <div
          className={cn('flex items-center justify-center py-6', 'rounded-t-2xl', config.bgColor)}
        >
          <div className={cn('p-3 rounded-full', config.bgColor)}>
            <Icon className={cn('h-10 w-10', config.iconColor)} strokeWidth={1.5} />
          </div>
        </div>

        <div className="p-6 pt-4">
          <h2
            id="violation-title"
            className="mb-3 text-xl font-semibold text-center text-neutral-900 dark:text-white"
          >
            {config.title}
          </h2>

          <p
            id="violation-description"
            className="mb-4 text-center text-neutral-600 dark:text-neutral-400"
          >
            {message ?? config.description}
          </p>

          {isSevere && (
            <div
              className={cn(
                'mb-6 p-4 rounded-xl',
                'bg-red-50 dark:bg-red-500/10',
                'border border-red-200 dark:border-red-500/20'
              )}
            >
              <p className="text-sm text-red-700 dark:text-red-400 text-center font-medium">
                Repeated violations may result in termination of access to this service.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button ref={closeButtonRef} variant="primary" onClick={onClose} className="w-full">
              I Understand
            </Button>
            <p className="text-xs text-center text-neutral-500 dark:text-neutral-500">
              By continuing, you agree to follow our{' '}
              <a
                href="/terms"
                className="underline hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
