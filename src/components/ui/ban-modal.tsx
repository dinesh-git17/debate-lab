// src/components/ui/ban-modal.tsx

'use client'

import { Ban, Clock, AlertOctagon } from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

import { Button } from './button'

interface BanModalProps {
  isOpen: boolean
  onClose?: (() => void) | undefined
  banType: 'temporary' | 'permanent'
  reason: string
  expiresAt?: string | undefined
  remainingMs?: number | undefined
}

function formatTimeRemainingDetailed(ms: number): {
  days: number
  hours: number
  minutes: number
  seconds: number
} {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

export function BanModal({
  isOpen,
  onClose,
  banType,
  reason,
  expiresAt,
  remainingMs: initialRemainingMs,
}: BanModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [remainingMs, setRemainingMs] = useState(initialRemainingMs ?? 0)

  // Calculate remaining time from expiresAt if provided
  const calculateRemaining = useCallback(() => {
    if (expiresAt) {
      const expiry = new Date(expiresAt).getTime()
      return Math.max(0, expiry - Date.now())
    }
    return initialRemainingMs ?? 0
  }, [expiresAt, initialRemainingMs])

  // Track mounting for SSR safety with portals
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Update remaining time every second for temporary bans
  useEffect(() => {
    if (!isOpen || banType !== 'temporary') return

    setRemainingMs(calculateRemaining())

    const interval = setInterval(() => {
      const newRemaining = calculateRemaining()
      setRemainingMs(newRemaining)

      // If ban expired, close the modal
      if (newRemaining <= 0 && onClose) {
        onClose()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, banType, calculateRemaining, onClose])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only allow escape for temporary bans that have expired
      if (e.key === 'Escape' && banType === 'temporary' && remainingMs <= 0 && onClose) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Prevent background scrolling while modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, banType, remainingMs, onClose])

  if (!isOpen || !mounted) return null

  const isPermanent = banType === 'permanent'
  const time = formatTimeRemainingDetailed(remainingMs)
  const hasExpired = !isPermanent && remainingMs <= 0

  // Render modal at document.body level using portal for full-page coverage
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="ban-title"
      aria-describedby="ban-description"
    >
      {/* Backdrop with blur - covers entire page, no click to close */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative z-10 mx-4 w-full max-w-lg rounded-2xl border shadow-2xl',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200 dark:border-neutral-800',
          'animate-[scaleIn_0.2s_ease-out]'
        )}
      >
        {/* Icon Header */}
        <div
          className={cn(
            'flex items-center justify-center py-6',
            'rounded-t-2xl',
            isPermanent ? 'bg-red-500/15' : 'bg-orange-500/10'
          )}
        >
          <div
            className={cn('p-3 rounded-full', isPermanent ? 'bg-red-500/20' : 'bg-orange-500/15')}
          >
            {isPermanent ? (
              <AlertOctagon className="h-10 w-10 text-red-500" strokeWidth={1.5} />
            ) : (
              <Ban className="h-10 w-10 text-orange-500" strokeWidth={1.5} />
            )}
          </div>
        </div>

        <div className="p-6 pt-4">
          {/* Title */}
          <h2
            id="ban-title"
            className="mb-3 text-xl font-semibold text-center text-neutral-900 dark:text-white"
          >
            {isPermanent ? 'Account Permanently Suspended' : 'Temporarily Suspended'}
          </h2>

          {/* Description */}
          <p
            id="ban-description"
            className="mb-6 text-center text-neutral-600 dark:text-neutral-400"
          >
            {isPermanent
              ? 'Your access to Debate Lab has been permanently revoked due to severe policy violations.'
              : 'Your access to Debate Lab has been temporarily suspended.'}
          </p>

          {/* Reason Box */}
          <div
            className={cn(
              'mb-6 p-4 rounded-xl',
              isPermanent ? 'bg-red-50 dark:bg-red-500/10' : 'bg-orange-50 dark:bg-orange-500/10',
              isPermanent
                ? 'border border-red-200 dark:border-red-500/20'
                : 'border border-orange-200 dark:border-orange-500/20'
            )}
          >
            <p
              className={cn(
                'text-sm text-center font-medium',
                isPermanent
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-orange-700 dark:text-orange-400'
              )}
            >
              <span className="font-semibold">Reason:</span> {reason}
            </p>
          </div>

          {/* Countdown Timer for Temporary Bans */}
          {!isPermanent && !hasExpired && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-3 text-neutral-500 dark:text-neutral-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Time remaining until access is restored</span>
              </div>

              <div className="flex justify-center gap-3">
                {time.days > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                        {String(time.days).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Days
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                      {String(time.hours).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Hours</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                      {String(time.minutes).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Minutes
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                      {String(time.seconds).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Seconds
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ban Expired Message */}
          {hasExpired && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
              <p className="text-sm text-green-700 dark:text-green-400 text-center font-medium">
                Your suspension has ended. You may now use the platform again.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {hasExpired && onClose ? (
              <Button variant="primary" onClick={onClose} className="w-full">
                Continue to Debate Lab
              </Button>
            ) : (
              <Button variant="secondary" disabled className="w-full cursor-not-allowed opacity-60">
                {isPermanent ? 'Access Permanently Revoked' : 'Please Wait...'}
              </Button>
            )}
            <p className="text-xs text-center text-neutral-500 dark:text-neutral-500">
              If you believe this is an error, please contact{' '}
              <a
                href="mailto:support@debatelab.ai"
                className="underline hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                support@debatelab.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Hook to check ban status
export function useBanStatus() {
  const [banStatus, setBanStatus] = useState<{
    isBanned: boolean
    banType?: 'temporary' | 'permanent'
    reason?: string
    expiresAt?: string
    remainingMs?: number
    isLoading: boolean
  }>({ isBanned: false, isLoading: true })

  useEffect(() => {
    async function checkBanStatus() {
      try {
        const response = await fetch('/api/ban-status')
        const data = await response.json()
        setBanStatus({
          ...data,
          isLoading: false,
        })
      } catch {
        setBanStatus({ isBanned: false, isLoading: false })
      }
    }

    checkBanStatus()
  }, [])

  return banStatus
}
