// src/components/debate/debate-controls.tsx
/**
 * Primary control interface for debate lifecycle management.
 * Handles start/pause/resume/end actions with responsive mobile and desktop variants.
 */

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { clientLogger } from '@/lib/client-logger'
import { exportTranscript } from '@/lib/export-transcript'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import { ExportModal } from './export-modal'

import type { ExportConfig } from '@/types/export'

interface DebateControlsProps {
  debateId: string
  className?: string
  variant?: 'header' | 'floating' | 'mobile'
}

export function DebateControls({ debateId, className, variant = 'header' }: DebateControlsProps) {
  const router = useRouter()
  const status = useDebateViewStore((s) => s.status)
  const topic = useDebateViewStore((s) => s.topic)
  const format = useDebateViewStore((s) => s.format)
  const messages = useDebateViewStore((s) => s.messages)

  const [isLoading, setIsLoading] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const isActive = status === 'active' || status === 'paused'

  const handleStart = async () => {
    setIsLoading(true)
    const store = useDebateViewStore.getState()

    try {
      const response = await fetch(`/api/debate/${debateId}/engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          throw new Error(data.error ?? 'Failed to start debate')
        } catch {
          throw new Error(text || 'Failed to start debate')
        }
      }

      // Consume stream to keep connection alive; events handled by useDebateStream hook
      const reader = response.body?.getReader()
      if (reader) {
        void (async () => {
          try {
            while (true) {
              const { done } = await reader.read()
              if (done) break
            }
          } catch {
            // Stream closed
          }
        })()
      }

      store.setStatus('active')
    } catch (error) {
      clientLogger.error('Debate start failed', error)
      store.setError(error instanceof Error ? error.message : 'Failed to start debate')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePause = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debate/${debateId}/engine/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Failed to pause debate')
      }
    } catch (error) {
      clientLogger.error('Debate pause failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResume = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debate/${debateId}/engine/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Failed to resume debate')
      }
    } catch (error) {
      clientLogger.error('Debate resume failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndDebate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debate/${debateId}/engine/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', reason: 'Ended early by user' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Failed to end debate')
      }
    } catch (error) {
      clientLogger.error('Debate end failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewDebate = useCallback(() => {
    if (isActive) {
      setShowNewModal(true)
    } else {
      router.push('/debate/new')
    }
  }, [isActive, router])

  const handleConfirmNew = async () => {
    if (isActive) {
      await handleEndDebate()
    }
    router.push('/debate/new')
  }

  const handleExport = useCallback(
    (config: ExportConfig) => {
      const summaryMessage = messages.find((m) => m.turnType === 'moderator_summary')
      exportTranscript(debateId, topic, format, status, messages, config, summaryMessage?.content)
    },
    [debateId, topic, format, status, messages]
  )

  const openExportModal = useCallback(() => {
    setShowExportModal(true)
  }, [])

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'e',
        ctrl: true,
        action: openExportModal,
        description: 'Export transcript',
      },
      {
        key: 'n',
        ctrl: true,
        action: handleNewDebate,
        description: 'New debate',
      },
    ],
    enabled: true,
  })

  const headerMenuStyles = cn(
    'absolute right-0 top-full mt-2 z-50',
    'min-w-[180px] rounded-2xl p-2',
    'bg-card/95 backdrop-blur-2xl backdrop-saturate-150',
    'border border-white/[0.08]',
    'shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]',
    'animate-list-picker'
  )

  const floatingMenuStyles = cn(
    'absolute right-0 bottom-full mb-2 z-50',
    'min-w-[180px] rounded-2xl p-2',
    'bg-card/95 backdrop-blur-2xl backdrop-saturate-150',
    'border border-white/[0.08]',
    'shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]',
    'animate-list-picker'
  )

  const mobileMenuItemStyles = cn(
    'flex w-full items-center gap-3 rounded-full px-4',
    'min-h-[44px]',
    'text-[15px] text-foreground/80',
    'hover:bg-white/[0.08] hover:text-foreground',
    'active:scale-[0.98]',
    'transition-all duration-150'
  )

  const mobileDockStyles = cn(
    'relative flex items-center gap-3 px-5 py-4',
    'rounded-[28px]',
    'bg-white/[0.06] backdrop-blur-3xl backdrop-saturate-[1.8]',
    'border border-white/[0.06]',
    'shadow-[0_4px_24px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.04)]'
  )

  const desktopDockStyles = cn('relative flex items-center gap-2')

  const dockPrimaryButtonStyles = cn(
    'inline-flex items-center justify-center gap-1.5',
    'h-[44px] min-w-[88px] rounded-full px-4 text-[13px] font-semibold tracking-[-0.01em]',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px]',
    'active:translate-y-[0.5px] active:scale-[0.98]',
    'focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50'
  )

  const desktopPrimaryButtonStyles = cn(
    'inline-flex items-center justify-center gap-1',
    'h-9 min-w-[72px] rounded-full px-3 text-[12px] font-semibold tracking-[-0.01em]',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px]',
    'active:translate-y-[0.5px] active:scale-[0.98]',
    'focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50'
  )

  const dockEndButtonStyles = cn(
    'inline-flex items-center justify-center gap-1.5',
    'h-[44px] rounded-full px-4 text-[13px] font-medium tracking-[-0.01em]',
    'bg-[rgba(255,59,48,0.12)]',
    'border border-[rgba(255,59,48,0.25)]',
    'text-[#FF3B30]',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px] hover:bg-[rgba(255,59,48,0.18)] hover:border-[rgba(255,59,48,0.35)]',
    'active:translate-y-[0.5px] active:scale-[0.98] active:bg-[rgba(255,59,48,0.25)]',
    'focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50'
  )

  const dockNewButtonStyles = cn(
    'inline-flex items-center justify-center gap-1.5',
    'h-[44px] rounded-full px-4 text-[13px] font-medium tracking-[-0.01em]',
    'bg-white/[0.06] text-foreground/70',
    'border border-white/[0.04]',
    'shadow-[inset_0_0.5px_0_rgba(255,255,255,0.08),inset_0_-0.5px_0_rgba(0,0,0,0.05)]',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px] hover:bg-white/[0.1] hover:text-foreground/90 hover:border-white/[0.08]',
    'active:translate-y-[0.5px] active:scale-[0.98] active:bg-white/[0.08]',
    'focus-visible:outline-none'
  )

  const dockIconButtonStyles = cn(
    'inline-flex items-center justify-center',
    'h-[44px] w-[44px] rounded-full',
    'text-foreground/40',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px] hover:bg-white/[0.06] hover:text-foreground/60',
    'active:translate-y-[0.5px] active:scale-[0.98] active:bg-white/[0.08]'
  )

  const dockExportButtonStyles = cn(
    'inline-flex items-center justify-center gap-1.5',
    'h-[44px] rounded-full px-5 text-[13px] font-semibold tracking-[-0.01em]',
    'bg-foreground text-background',
    'shadow-[inset_0_0.5px_0_rgba(255,255,255,0.15),0_0_12px_rgba(255,255,255,0.06)]',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px] hover:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.2),0_0_18px_rgba(255,255,255,0.1)]',
    'active:translate-y-[0.5px] active:scale-[0.98]',
    'focus-visible:outline-none'
  )

  const desktopEndButtonStyles = cn(
    'inline-flex items-center justify-center gap-1',
    'h-9 rounded-full px-3 text-[12px] font-medium tracking-[-0.01em]',
    'bg-[rgba(255,59,48,0.10)]',
    'text-[#FF3B30]',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px] hover:bg-[rgba(255,59,48,0.15)]',
    'active:translate-y-[0.5px] active:scale-[0.98] active:bg-[rgba(255,59,48,0.20)]',
    'focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50'
  )

  const desktopNewButtonStyles = cn(
    'inline-flex items-center justify-center gap-1',
    'h-9 rounded-full px-3 text-[12px] font-medium tracking-[-0.01em]',
    'bg-white/[0.04] text-foreground/60',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px] hover:bg-white/[0.08] hover:text-foreground/80',
    'active:translate-y-[0.5px] active:scale-[0.98]',
    'focus-visible:outline-none'
  )

  const desktopIconButtonStyles = cn(
    'inline-flex items-center justify-center',
    'h-9 w-9 rounded-full',
    'text-foreground/40',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px] hover:bg-white/[0.06] hover:text-foreground/60',
    'active:translate-y-[0.5px] active:scale-[0.98]'
  )

  const desktopExportButtonStyles = cn(
    'inline-flex items-center justify-center gap-1',
    'h-9 rounded-full px-4 text-[12px] font-semibold tracking-[-0.01em]',
    'bg-foreground text-background',
    'shadow-[inset_0_0.5px_0_rgba(255,255,255,0.15)]',
    'will-change-transform',
    'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'hover:translate-y-[-1px] hover:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.2),0_0_12px_rgba(255,255,255,0.08)]',
    'active:translate-y-[0.5px] active:scale-[0.98]',
    'focus-visible:outline-none'
  )

  if (variant === 'mobile') {
    return (
      <>
        <div className={cn(mobileDockStyles, 'max-w-full shrink-0')}>
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 50%)',
            }}
          />

          {status === 'ready' && (
            <>
              <motion.button
                onClick={handleStart}
                disabled={isLoading}
                className={cn(
                  dockPrimaryButtonStyles,
                  'relative',
                  'bg-gradient-to-b from-emerald-400 to-emerald-500 text-white',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_12px_rgba(52,211,153,0.3)]',
                  'hover:from-emerald-350 hover:to-emerald-450',
                  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_20px_rgba(52,211,153,0.4)]'
                )}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span>{isLoading ? 'Starting...' : 'Start'}</span>
              </motion.button>

              <div className="h-5 w-px bg-white/[0.08]" />

              <button
                onClick={handleNewDebate}
                className={dockNewButtonStyles}
                aria-label="New debate"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New</span>
              </button>
            </>
          )}

          {status === 'active' && (
            <>
              <button
                onClick={handlePause}
                disabled={isLoading}
                className={cn(
                  dockPrimaryButtonStyles,
                  'bg-white/[0.12] text-foreground',
                  'shadow-[inset_0_0.5px_0_rgba(255,255,255,0.06)]',
                  'hover:bg-white/[0.15] hover:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.1)]'
                )}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.75 3a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75A.75.75 0 015.75 3zm8.5 0a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75a.75.75 0 01.75-.75z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{isLoading ? 'Pausing...' : 'Pause'}</span>
              </button>

              <button
                onClick={() => setShowEndModal(true)}
                disabled={isLoading}
                className={dockEndButtonStyles}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>End</span>
              </button>

              <div className="h-5 w-px bg-white/[0.06]" />

              <button
                onClick={handleNewDebate}
                className={dockNewButtonStyles}
                aria-label="New debate"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New</span>
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button
                onClick={handleResume}
                disabled={isLoading}
                className={cn(
                  dockPrimaryButtonStyles,
                  'bg-gradient-to-b from-amber-400/90 to-amber-500/90 text-white',
                  'shadow-[inset_0_0.5px_0_rgba(255,255,255,0.25),0_0_14px_rgba(245,158,11,0.15)]',
                  'hover:from-amber-400 hover:to-amber-500',
                  'hover:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.3),0_0_18px_rgba(245,158,11,0.2)]'
                )}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span>{isLoading ? 'Resuming...' : 'Resume'}</span>
              </button>

              <button
                onClick={() => setShowEndModal(true)}
                disabled={isLoading}
                className={dockEndButtonStyles}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>End</span>
              </button>

              <div className="h-5 w-px bg-white/[0.06]" />

              <button
                onClick={handleNewDebate}
                className={dockNewButtonStyles}
                aria-label="New debate"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New</span>
              </button>
            </>
          )}

          {status === 'completed' && (
            <>
              <button onClick={openExportModal} className={dockExportButtonStyles}>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span>Export</span>
              </button>

              <div className="h-5 w-px bg-white/[0.06]" />

              <button
                onClick={handleNewDebate}
                className={dockNewButtonStyles}
                aria-label="New debate"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className={dockIconButtonStyles}
                  aria-label="More actions"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM14 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                  </svg>
                </button>

                {showMobileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                    <div className={headerMenuStyles}>
                      <Link
                        href={`/debate/${debateId}/summary`}
                        onClick={() => setShowMobileMenu(false)}
                        className={mobileMenuItemStyles}
                      >
                        <svg
                          className="h-4 w-4 opacity-60"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                          />
                        </svg>
                        <span>View Summary</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <button
                onClick={handleStart}
                disabled={isLoading}
                className={cn(
                  dockPrimaryButtonStyles,
                  'bg-foreground text-background',
                  'shadow-[inset_0_0.5px_0_rgba(255,255,255,0.15),0_0_12px_rgba(255,255,255,0.06)]',
                  'hover:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.2),0_0_16px_rgba(255,255,255,0.1)]'
                )}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{isLoading ? 'Retrying...' : 'Retry'}</span>
              </button>

              <div className="h-5 w-px bg-white/[0.06]" />

              <button
                onClick={handleNewDebate}
                className={dockNewButtonStyles}
                aria-label="New debate"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New</span>
              </button>
            </>
          )}
        </div>

        <ConfirmModal
          isOpen={showEndModal}
          onClose={() => setShowEndModal(false)}
          title="End Debate Early?"
          description="Are you sure you want to end this debate? Claude will provide a summary of the progress so far. This action cannot be undone."
          confirmLabel="End Debate"
          cancelLabel="Continue Debate"
          variant="destructive"
          onConfirm={handleEndDebate}
          isLoading={isLoading}
        />
        <ConfirmModal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          title="Start New Debate?"
          description="You have an active debate in progress. Starting a new debate will end the current one. Would you like to continue?"
          confirmLabel="End & Start New"
          cancelLabel="Keep Current"
          variant="destructive"
          onConfirm={handleConfirmNew}
          isLoading={isLoading}
        />
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      </>
    )
  }

  const menuStyles = variant === 'floating' ? floatingMenuStyles : headerMenuStyles

  return (
    <>
      <div className={cn(desktopDockStyles, 'max-w-full shrink-0', className)}>
        {status === 'ready' && (
          <>
            <motion.button
              onClick={handleStart}
              disabled={isLoading}
              className={cn(
                desktopPrimaryButtonStyles,
                'relative',
                'bg-gradient-to-b from-emerald-400 to-emerald-500 text-white',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_8px_rgba(52,211,153,0.25)]',
                'hover:from-emerald-350 hover:to-emerald-450',
                'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_12px_rgba(52,211,153,0.35)]'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span>{isLoading ? 'Starting...' : 'Start'}</span>
            </motion.button>

            <div className="h-4 w-px bg-white/[0.10]" />

            <button
              onClick={handleNewDebate}
              className={desktopNewButtonStyles}
              aria-label="New debate"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New</span>
            </button>
          </>
        )}

        {status === 'active' && (
          <>
            <button
              onClick={handlePause}
              disabled={isLoading}
              className={cn(
                desktopPrimaryButtonStyles,
                'bg-white/[0.08] text-foreground',
                'hover:bg-white/[0.12]'
              )}
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M5.75 3a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75A.75.75 0 015.75 3zm8.5 0a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{isLoading ? 'Pausing...' : 'Pause'}</span>
            </button>

            <button
              onClick={() => setShowEndModal(true)}
              disabled={isLoading}
              className={desktopEndButtonStyles}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>End</span>
            </button>

            <div className="h-4 w-px bg-white/[0.10]" />

            <button
              onClick={handleNewDebate}
              className={desktopNewButtonStyles}
              aria-label="New debate"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New</span>
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              onClick={handleResume}
              disabled={isLoading}
              className={cn(
                desktopPrimaryButtonStyles,
                'bg-gradient-to-b from-amber-400/90 to-amber-500/90 text-white',
                'shadow-[inset_0_0.5px_0_rgba(255,255,255,0.2),0_1px_8px_rgba(245,158,11,0.15)]',
                'hover:from-amber-400 hover:to-amber-500',
                'hover:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.25),0_2px_12px_rgba(245,158,11,0.2)]'
              )}
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span>{isLoading ? 'Resuming...' : 'Resume'}</span>
            </button>

            <button
              onClick={() => setShowEndModal(true)}
              disabled={isLoading}
              className={desktopEndButtonStyles}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>End</span>
            </button>

            <div className="h-4 w-px bg-white/[0.10]" />

            <button
              onClick={handleNewDebate}
              className={desktopNewButtonStyles}
              aria-label="New debate"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New</span>
            </button>
          </>
        )}

        {status === 'completed' && (
          <>
            <button onClick={openExportModal} className={desktopExportButtonStyles}>
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span>Export</span>
            </button>

            <div className="h-4 w-px bg-white/[0.10]" />

            <button
              onClick={handleNewDebate}
              className={desktopNewButtonStyles}
              aria-label="New debate"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={desktopIconButtonStyles}
                aria-label="More actions"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM14 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                </svg>
              </button>

              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                  <div className={menuStyles}>
                    <Link
                      href={`/debate/${debateId}/summary`}
                      onClick={() => setShowMobileMenu(false)}
                      className={mobileMenuItemStyles}
                    >
                      <svg
                        className="h-4 w-4 opacity-60"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                        />
                      </svg>
                      <span>View Summary</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <button
              onClick={handleStart}
              disabled={isLoading}
              className={cn(
                desktopPrimaryButtonStyles,
                'bg-foreground text-background',
                'shadow-[inset_0_0.5px_0_rgba(255,255,255,0.15)]',
                'hover:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.2),0_0_12px_rgba(255,255,255,0.08)]'
              )}
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{isLoading ? 'Retrying...' : 'Retry'}</span>
            </button>

            <div className="h-4 w-px bg-white/[0.10]" />

            <button
              onClick={handleNewDebate}
              className={desktopNewButtonStyles}
              aria-label="New debate"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New</span>
            </button>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="End Debate Early?"
        description="Are you sure you want to end this debate? Claude will provide a summary of the progress so far. This action cannot be undone."
        confirmLabel="End Debate"
        cancelLabel="Continue Debate"
        variant="destructive"
        onConfirm={handleEndDebate}
        isLoading={isLoading}
      />
      <ConfirmModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Start New Debate?"
        description="You have an active debate in progress. Starting a new debate will end the current one. Would you like to continue?"
        confirmLabel="End & Start New"
        cancelLabel="Keep Current"
        variant="destructive"
        onConfirm={handleConfirmNew}
        isLoading={isLoading}
      />
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </>
  )
}
