// src/components/debate/command-dock.tsx

'use client'

import { Download, Pause, Play, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { FaStop } from 'react-icons/fa'

import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { clientLogger } from '@/lib/client-logger'
import { exportTranscript } from '@/lib/export-transcript'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import { ExportModal } from './export-modal'

import type { ExportConfig } from '@/types/export'

interface CommandDockProps {
  debateId: string
}

/**
 * Divider component for button groups
 */
function Divider() {
  return <div className="w-px h-4 bg-white/[0.1] mx-1" aria-hidden="true" />
}

export function CommandDock({ debateId }: CommandDockProps) {
  const router = useRouter()
  const status = useDebateViewStore((s) => s.status)
  const topic = useDebateViewStore((s) => s.topic)
  const format = useDebateViewStore((s) => s.format)
  const messages = useDebateViewStore((s) => s.messages)

  const [isLoading, setIsLoading] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const isActive = status === 'active' || status === 'paused'
  const isRunning = status === 'active'

  // ===== HANDLERS =====

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

  const handlePause = useCallback(async () => {
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
  }, [debateId])

  const handleResume = useCallback(async () => {
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
  }, [debateId])

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

  const handlePlaybackToggle = useCallback(() => {
    if (isRunning) {
      handlePause()
    } else if (status === 'paused') {
      handleResume()
    }
  }, [isRunning, status, handlePause, handleResume])

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
      {
        key: ' ',
        action: handlePlaybackToggle,
        description: 'Pause/Resume',
      },
    ],
    enabled: true,
  })

  // ===== BUTTON STYLES =====

  // Ghost button - default state
  const ghostButtonStyles = cn(
    'group flex items-center gap-2 px-4 py-2 rounded-full',
    'text-sm font-medium text-zinc-100',
    'transition-all duration-150',
    'hover:bg-white/10',
    'active:scale-95',
    'disabled:opacity-50 disabled:pointer-events-none'
  )

  // Danger button - for End
  const dangerButtonStyles = cn(
    'group flex items-center gap-2 px-4 py-2 rounded-full',
    'text-sm font-medium text-zinc-400',
    'transition-all duration-150',
    'hover:text-rose-400 hover:bg-rose-500/10',
    'active:scale-95',
    'disabled:opacity-50 disabled:pointer-events-none'
  )

  // Inverted button - for New (primary action) - tight hover
  const invertedButtonStyles = cn(
    'group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
    'text-sm font-medium text-zinc-100',
    'transition-all duration-150',
    'hover:bg-white hover:text-black',
    'active:scale-95'
  )

  // ===== RENDER =====

  return (
    <>
      {/* ===== READY STATE: Start + New ===== */}
      {status === 'ready' && (
        <>
          <button onClick={handleStart} disabled={isLoading} className={ghostButtonStyles}>
            <Play
              size={16}
              strokeWidth={2}
              className="text-zinc-400 group-hover:text-white transition-colors"
            />
            <span>{isLoading ? 'Starting...' : 'Start'}</span>
          </button>

          <Divider />

          <button onClick={handleNewDebate} className={invertedButtonStyles}>
            <Plus size={16} strokeWidth={2.5} />
            <span>New</span>
          </button>
        </>
      )}

      {/* ===== ACTIVE STATE: Pause + End + New ===== */}
      {status === 'active' && (
        <>
          <button onClick={handlePause} disabled={isLoading} className={ghostButtonStyles}>
            <Pause
              size={16}
              strokeWidth={2}
              className="text-zinc-400 group-hover:text-white transition-colors"
            />
            <span>{isLoading ? 'Pausing...' : 'Pause'}</span>
          </button>

          <Divider />

          <button
            onClick={() => setShowEndModal(true)}
            disabled={isLoading}
            className={dangerButtonStyles}
          >
            <FaStop className="h-3.5 w-3.5" />
            <span>End</span>
          </button>

          <Divider />

          <button onClick={handleNewDebate} className={invertedButtonStyles}>
            <Plus size={16} strokeWidth={2.5} />
            <span>New</span>
          </button>
        </>
      )}

      {/* ===== PAUSED STATE: Resume + End + New ===== */}
      {status === 'paused' && (
        <>
          <button onClick={handleResume} disabled={isLoading} className={ghostButtonStyles}>
            <Play
              size={16}
              strokeWidth={2}
              className="text-zinc-400 group-hover:text-white transition-colors"
            />
            <span>{isLoading ? 'Resuming...' : 'Resume'}</span>
          </button>

          <Divider />

          <button
            onClick={() => setShowEndModal(true)}
            disabled={isLoading}
            className={dangerButtonStyles}
          >
            <FaStop className="h-3.5 w-3.5" />
            <span>End</span>
          </button>

          <Divider />

          <button onClick={handleNewDebate} className={invertedButtonStyles}>
            <Plus size={16} strokeWidth={2.5} />
            <span>New</span>
          </button>
        </>
      )}

      {/* ===== COMPLETED STATE: Summary + Export + New ===== */}
      {status === 'completed' && (
        <>
          <Link href={`/debate/${debateId}/summary`} className={ghostButtonStyles}>
            <svg
              className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
            <span>Summary</span>
          </Link>

          <Divider />

          <button onClick={openExportModal} className={ghostButtonStyles}>
            <Download
              size={16}
              strokeWidth={2}
              className="text-zinc-400 group-hover:text-white transition-colors"
            />
            <span>Export</span>
          </button>

          <Divider />

          <button onClick={handleNewDebate} className={invertedButtonStyles}>
            <Plus size={16} strokeWidth={2.5} />
            <span>New</span>
          </button>
        </>
      )}

      {/* ===== ERROR STATE: Retry + New ===== */}
      {status === 'error' && (
        <>
          <button onClick={handleStart} disabled={isLoading} className={ghostButtonStyles}>
            <svg
              className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                clipRule="evenodd"
              />
            </svg>
            <span>{isLoading ? 'Retrying...' : 'Retry'}</span>
          </button>

          <Divider />

          <button onClick={handleNewDebate} className={invertedButtonStyles}>
            <Plus size={16} strokeWidth={2.5} />
            <span>New</span>
          </button>
        </>
      )}

      {/* ===== MODALS ===== */}
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
