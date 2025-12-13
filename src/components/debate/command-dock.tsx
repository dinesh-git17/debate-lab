// src/components/debate/command-dock.tsx
/**
 * Icon-based command dock for debate controls with hover-reveal labels.
 * Renders context-aware actions based on current debate status.
 */

'use client'

import { motion } from 'framer-motion'
import { Download, Pause, Play, Plus, FileText, RotateCcw } from 'lucide-react'
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

const BUTTON_CONFIG = {
  height: 36,
  iconSize: 18,
  paddingX: 14,
  gap: 6,
  fontSize: 12,
} as const

interface CommandDockProps {
  debateId: string
}

function Divider() {
  return <div className="w-px h-5 bg-white/[0.1] mx-1" aria-hidden="true" />
}

interface PillButtonProps {
  icon: React.ReactNode
  label?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'danger'
  isLoading?: boolean
}

function PillButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = 'default',
  isLoading = false,
}: PillButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const baseColor = variant === 'danger' ? 'rgb(251, 113, 133)' : 'rgba(255, 255, 255, 0.6)'
  const hoverColor = variant === 'danger' ? 'rgb(255, 140, 160)' : 'rgba(255, 255, 255, 1)'

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex items-center justify-center rounded-full overflow-hidden cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        'disabled:opacity-40 disabled:cursor-not-allowed'
      )}
      style={{
        height: BUTTON_CONFIG.height,
        paddingLeft: BUTTON_CONFIG.paddingX,
        paddingRight: BUTTON_CONFIG.paddingX,
        color: isHovered ? hoverColor : baseColor,
        transition: 'color 0.15s ease-out',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {icon}
      <motion.span
        initial={false}
        animate={{
          width: isHovered && label ? 'auto' : 0,
          marginLeft: isHovered && label ? BUTTON_CONFIG.gap : 0,
          opacity: isHovered && label ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
          mass: 0.8,
          opacity: { duration: 0.15, ease: 'easeOut' },
        }}
        style={{
          fontSize: BUTTON_CONFIG.fontSize,
          fontWeight: 500,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {isLoading ? '...' : label}
      </motion.span>
    </motion.button>
  )
}

interface PillLinkProps {
  href: string
  icon: React.ReactNode
  label?: string
}

function PillLink({ href, icon, label }: PillLinkProps) {
  const [isHovered, setIsHovered] = useState(false)

  const baseColor = 'rgba(255, 255, 255, 0.6)'
  const hoverColor = 'rgba(255, 255, 255, 1)'

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-full"
    >
      <Link
        href={href}
        className="flex items-center justify-center rounded-full cursor-pointer"
        style={{
          height: BUTTON_CONFIG.height,
          paddingLeft: BUTTON_CONFIG.paddingX,
          paddingRight: BUTTON_CONFIG.paddingX,
          color: isHovered ? hoverColor : baseColor,
          transition: 'color 0.15s ease-out',
        }}
      >
        {icon}
        <motion.span
          initial={false}
          animate={{
            width: isHovered && label ? 'auto' : 0,
            marginLeft: isHovered && label ? BUTTON_CONFIG.gap : 0,
            opacity: isHovered && label ? 1 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
            mass: 0.8,
            opacity: { duration: 0.15, ease: 'easeOut' },
          }}
          style={{
            fontSize: BUTTON_CONFIG.fontSize,
            fontWeight: 500,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {label}
        </motion.span>
      </Link>
    </motion.div>
  )
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
        key: 'N',
        shift: true,
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

  const iconSize = BUTTON_CONFIG.iconSize

  return (
    <>
      {status === 'ready' && (
        <div className="flex items-center gap-1">
          <PillButton
            icon={<Play size={iconSize} strokeWidth={2} />}
            label="Start"
            onClick={handleStart}
            disabled={isLoading}
            isLoading={isLoading}
          />
          <Divider />
          <PillButton
            icon={<Plus size={iconSize} strokeWidth={2} />}
            label="New"
            onClick={handleNewDebate}
          />
        </div>
      )}

      {status === 'active' && (
        <div className="flex items-center gap-1">
          <PillButton
            icon={<Pause size={iconSize} strokeWidth={2} />}
            label="Pause"
            onClick={handlePause}
            disabled={isLoading}
            isLoading={isLoading}
          />
          <Divider />
          <PillButton
            icon={<FaStop size={iconSize - 4} />}
            label="End"
            onClick={() => setShowEndModal(true)}
            disabled={isLoading}
            variant="danger"
          />
          <Divider />
          <PillButton
            icon={<Plus size={iconSize} strokeWidth={2} />}
            label="New"
            onClick={handleNewDebate}
          />
        </div>
      )}

      {status === 'paused' && (
        <div className="flex items-center gap-1">
          <PillButton
            icon={<Play size={iconSize} strokeWidth={2} />}
            label="Resume"
            onClick={handleResume}
            disabled={isLoading}
            isLoading={isLoading}
          />
          <Divider />
          <PillButton
            icon={<FaStop size={iconSize - 4} />}
            label="End"
            onClick={() => setShowEndModal(true)}
            disabled={isLoading}
            variant="danger"
          />
          <Divider />
          <PillButton
            icon={<Plus size={iconSize} strokeWidth={2} />}
            label="New"
            onClick={handleNewDebate}
          />
        </div>
      )}

      {status === 'completed' && (
        <div className="flex items-center gap-1">
          <PillLink
            href={`/debate/${debateId}/summary`}
            icon={<FileText size={iconSize} strokeWidth={1.5} />}
            label="Summary"
          />
          <Divider />
          <PillButton
            icon={<Download size={iconSize} strokeWidth={2} />}
            label="Export"
            onClick={openExportModal}
          />
          <Divider />
          <PillButton
            icon={<Plus size={iconSize} strokeWidth={2} />}
            label="New"
            onClick={handleNewDebate}
          />
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-1">
          <PillButton
            icon={<RotateCcw size={iconSize} strokeWidth={2} />}
            label="Retry"
            onClick={handleStart}
            disabled={isLoading}
            isLoading={isLoading}
          />
          <Divider />
          <PillButton
            icon={<Plus size={iconSize} strokeWidth={2} />}
            label="New"
            onClick={handleNewDebate}
          />
        </div>
      )}

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
