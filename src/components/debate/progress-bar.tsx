// src/components/debate/progress-bar.tsx
/**
 * Animated progress indicator displaying debate turn count and completion status.
 * Features state-driven styling with smooth transitions between debate phases.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import type { DebateViewStatus } from '@/types/debate-ui'

interface ProgressBarProps {
  className?: string
}

const STATUS_LABELS: Record<DebateViewStatus, string> = {
  ready: 'Ready to start',
  active: 'In progress',
  completed: 'Complete',
  error: 'Error',
}

const STATUS_GRADIENTS: Record<DebateViewStatus, string> = {
  ready: 'from-emerald-400/60 to-emerald-500/60',
  active: 'from-blue-400 to-blue-600',
  completed: 'from-emerald-400 to-emerald-600',
  error: 'from-red-400 to-red-500',
}

const STATUS_BADGE_STYLES: Record<DebateViewStatus, { bg: string; text: string; glow: string }> = {
  ready: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  active: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  completed: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  error: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
}

export function ProgressBar({ className }: ProgressBarProps) {
  const progress = useDebateViewStore((s) => s.progress)
  const status = useDebateViewStore((s) => s.status)

  const getStatusLabel = (): string => {
    if (status === 'active' && progress.totalTurns > 0) {
      return `Turn ${progress.currentTurn} of ${progress.totalTurns}`
    }
    return STATUS_LABELS[status]
  }

  const gradient = STATUS_GRADIENTS[status] ?? STATUS_GRADIENTS.ready
  const badgeStyle = STATUS_BADGE_STYLES[status] ?? STATUS_BADGE_STYLES.ready
  const isReady = status === 'ready'

  return (
    <div
      className={cn('w-full', className)}
      role="progressbar"
      aria-valuenow={progress.percentComplete}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Debate progress"
    >
      <div className="mb-3 flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
              'text-[11px] font-medium leading-none',
              'backdrop-blur-sm',
              'shadow-sm',
              badgeStyle.bg,
              badgeStyle.text,
              badgeStyle.glow
            )}
          >
            {isReady && (
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-current"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            {!isReady && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
            {getStatusLabel()}
          </motion.span>
        </AnimatePresence>
        <motion.span
          className="text-[13px] tabular-nums leading-none text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {progress.percentComplete}%
        </motion.span>
      </div>

      <motion.div
        className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
        animate={
          isReady
            ? {
                boxShadow: [
                  'inset 0 0 0 rgba(52, 211, 153, 0)',
                  'inset 0 0 8px rgba(52, 211, 153, 0.15)',
                  'inset 0 0 0 rgba(52, 211, 153, 0)',
                ],
              }
            : {}
        }
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {isReady && (
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(52, 211, 153, 0.15) 50%, transparent 100%)',
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {isReady && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              background:
                'linear-gradient(90deg, rgba(52, 211, 153, 0.2) 0%, transparent 15%, transparent 85%, rgba(52, 211, 153, 0.2) 100%)',
            }}
          />
        )}

        <motion.div
          className={cn(
            'h-full rounded-full bg-gradient-to-r',
            gradient,
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
          )}
          initial={{ width: 0 }}
          animate={{
            width: `${Math.max(progress.percentComplete, isReady ? 0 : 0)}%`,
          }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </motion.div>
    </div>
  )
}
