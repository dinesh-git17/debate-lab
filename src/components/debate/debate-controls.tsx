// src/components/debate/debate-controls.tsx

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useKeyboardShortcuts, formatShortcut } from '@/hooks/use-keyboard-shortcuts'
import { clientLogger } from '@/lib/client-logger'
import { exportTranscript } from '@/lib/export-transcript'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import { ExportModal } from './export-modal'

import type { ExportConfig } from '@/types/export'

interface DebateControlsProps {
  debateId: string
  className?: string
  variant?: 'header' | 'floating'
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

  const isActive = status === 'active' || status === 'paused'

  const handleStart = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debate/${debateId}/engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Failed to start debate')
      }
    } catch (error) {
      clientLogger.error('Debate start failed', error)
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

  const floatingStyles =
    variant === 'floating'
      ? 'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur border rounded-full shadow-lg px-4 py-2'
      : ''

  return (
    <>
      <div className={cn('flex items-center gap-2', floatingStyles, className)}>
        {/* Start button */}
        {status === 'ready' && (
          <Button onClick={handleStart} disabled={isLoading} variant="primary">
            {isLoading ? 'Starting...' : '▶ Start Debate'}
          </Button>
        )}

        {/* Active controls */}
        {status === 'active' && (
          <>
            <Button variant="outline" onClick={handlePause} disabled={isLoading} size="sm">
              ⏸ Pause
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowEndModal(true)}
              disabled={isLoading}
              size="sm"
            >
              ⏹ End
            </Button>
          </>
        )}

        {/* Paused controls */}
        {status === 'paused' && (
          <>
            <Button onClick={handleResume} disabled={isLoading} variant="primary" size="sm">
              ▶ Resume
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowEndModal(true)}
              disabled={isLoading}
              size="sm"
            >
              ⏹ End
            </Button>
          </>
        )}

        {/* Export button (if messages exist) */}
        {messages.length > 0 && (
          <Button
            variant="outline"
            onClick={openExportModal}
            size="sm"
            title={`Export transcript (${formatShortcut({ key: 'e', ctrl: true, action: () => {}, description: '' })})`}
          >
            📥 Export
          </Button>
        )}

        {/* New debate button */}
        <Button
          variant="outline"
          onClick={handleNewDebate}
          size="sm"
          title={`New debate (${formatShortcut({ key: 'n', ctrl: true, action: () => {}, description: '' })})`}
        >
          ➕ New
        </Button>

        {/* Completed: View summary */}
        {status === 'completed' && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/debate/${debateId}/summary`}>📊 Summary</Link>
          </Button>
        )}

        {/* Error: Retry */}
        {status === 'error' && (
          <Button onClick={handleStart} disabled={isLoading} variant="primary" size="sm">
            {isLoading ? 'Retrying...' : '🔄 Retry'}
          </Button>
        )}
      </div>

      {/* End Debate Modal */}
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

      {/* New Debate Modal (when active) */}
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

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </>
  )
}
