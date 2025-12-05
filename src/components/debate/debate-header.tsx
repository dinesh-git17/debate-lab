// src/components/debate/debate-header.tsx

'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import { ConnectionStatus } from './connection-status'
import { DebateControls } from './debate-controls'
import { ProgressBar } from './progress-bar'

interface DebateHeaderProps {
  debateId: string
  className?: string
}

const FORMAT_DISPLAY_NAMES: Record<string, string> = {
  standard: 'Standard',
  oxford: 'Oxford Style',
  'lincoln-douglas': 'Lincoln-Douglas',
}

// Status chip configuration with enhanced styling
const STATUS_CHIP_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; shadow: string; border: string }
> = {
  ready: {
    bg: 'bg-emerald-500/12 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    shadow: 'shadow-[0_2px_8px_rgba(52,211,153,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]',
    border: 'border-emerald-500/20',
  },
  active: {
    bg: 'bg-blue-500/12 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    shadow: 'shadow-[0_2px_8px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]',
    border: 'border-blue-500/20',
  },
  paused: {
    bg: 'bg-amber-500/12 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    shadow: 'shadow-[0_2px_8px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]',
    border: 'border-amber-500/20',
  },
  completed: {
    bg: 'bg-emerald-500/12 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    shadow: 'shadow-[0_2px_8px_rgba(52,211,153,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]',
    border: 'border-emerald-500/20',
  },
  error: {
    bg: 'bg-red-500/12 dark:bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    shadow: 'shadow-[0_2px_8px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]',
    border: 'border-red-500/20',
  },
}

const STATUS_LABELS: Record<string, string> = {
  ready: 'Ready',
  active: 'Live',
  paused: 'Paused',
  completed: 'Complete',
  error: 'Error',
}

// Glow colors based on status for the radial effect
const STATUS_GLOW: Record<string, string> = {
  ready: 'from-emerald-500/8 via-transparent to-transparent',
  active: 'from-blue-500/10 via-transparent to-transparent',
  paused: 'from-amber-500/8 via-transparent to-transparent',
  completed: 'from-emerald-500/8 via-transparent to-transparent',
  error: 'from-red-500/8 via-transparent to-transparent',
}

export function DebateHeader({ debateId, className }: DebateHeaderProps) {
  const topic = useDebateViewStore((s) => s.topic)
  const format = useDebateViewStore((s) => s.format)
  const status = useDebateViewStore((s) => s.status)

  const formatDisplayName = FORMAT_DISPLAY_NAMES[format] ?? format
  const isActive = status === 'active' || status === 'paused'
  const chipStyle = STATUS_CHIP_STYLES[status] ?? {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
    shadow: '',
    border: 'border-white/10',
  }
  const isReadyOrActive = status === 'ready' || status === 'active'
  const statusLabel = STATUS_LABELS[status] ?? status
  const glowGradient = STATUS_GLOW[status] ?? STATUS_GLOW.ready

  return (
    <header
      className={cn(
        'relative overflow-hidden',
        // Apple-grade layered surface
        'border-b border-white/[0.04]',
        'bg-card/95',
        'backdrop-blur-2xl backdrop-saturate-150',
        // Inset shadow for depth instead of outward
        'shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]',
        className
      )}
    >
      {/* Subtle top highlight for glass depth - very faint */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Radial glow behind content */}
      <div
        className={cn(
          'pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-radial-gradient opacity-60 blur-3xl transition-opacity duration-700',
          glowGradient,
          isActive ? 'opacity-80' : 'opacity-40'
        )}
        style={{
          background: `radial-gradient(circle, var(--tw-gradient-stops))`,
        }}
      />

      {/* Content container with consistent grid alignment */}
      <div className="relative mx-auto max-w-5xl px-6 py-6 md:px-8 md:py-8">
        {/* MOBILE LAYOUT: Centered title with compact controls */}
        <div className="md:hidden">
          {/* Mobile controls row - centered */}
          <div className="flex justify-center">
            <DebateControls debateId={debateId} variant="mobile" />
          </div>

          {/* Centered title */}
          <div className="mt-4 text-center">
            <h1
              className={cn(
                'truncate transition-all duration-300',
                isActive
                  ? 'text-xl font-semibold leading-tight text-foreground'
                  : 'text-lg font-semibold leading-tight text-foreground/85'
              )}
            >
              {topic || 'Loading...'}
            </h1>
          </div>

          {/* Metadata chips row - centered under title */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {/* Format chip */}
            <span className="rounded-md bg-muted/50 px-2 py-1 text-[11px] leading-none text-muted-foreground/70">
              {formatDisplayName}
            </span>
            {/* Status chip with enhanced styling */}
            <motion.span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5',
                'text-[11px] font-medium leading-none',
                'border backdrop-blur-sm',
                'transition-all duration-150',
                chipStyle.bg,
                chipStyle.text,
                chipStyle.shadow,
                chipStyle.border
              )}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {isReadyOrActive ? (
                <motion.span
                  className={cn('h-1.5 w-1.5 rounded-full', chipStyle.dot)}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: status === 'active' ? 1 : 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ) : (
                <span className={cn('h-1.5 w-1.5 rounded-full', chipStyle.dot)} />
              )}
              {statusLabel}
            </motion.span>
            {/* Connection status */}
            <ConnectionStatus />
          </div>
        </div>

        {/* DESKTOP LAYOUT: Original horizontal layout */}
        <div className="hidden md:block">
          {/* Primary row: Metadata + Controls - baseline aligned */}
          <div className="flex items-center justify-between gap-8">
            {/* Left: Metadata row */}
            <div className="flex items-center gap-3">
              {/* Format label */}
              <span className="text-[13px] leading-none tracking-wide text-muted-foreground/60">
                {formatDisplayName}
              </span>
              <span className="text-muted-foreground/20">·</span>
              {/* Status chip with enhanced styling */}
              <motion.span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5',
                  'text-[11px] font-medium leading-none',
                  'border backdrop-blur-sm',
                  'transition-all duration-150',
                  chipStyle.bg,
                  chipStyle.text,
                  chipStyle.shadow,
                  chipStyle.border
                )}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {isReadyOrActive ? (
                  <motion.span
                    className={cn('h-1.5 w-1.5 rounded-full', chipStyle.dot)}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: status === 'active' ? 1 : 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ) : (
                  <span className={cn('h-1.5 w-1.5 rounded-full', chipStyle.dot)} />
                )}
                {statusLabel}
              </motion.span>
              <span className="text-muted-foreground/20">·</span>
              <ConnectionStatus />
            </div>

            {/* Right: Controls */}
            <div className="flex shrink-0 items-center">
              <DebateControls debateId={debateId} />
            </div>
          </div>

          {/* Topic title row */}
          <div className="mt-4">
            <h1
              className={cn(
                'truncate transition-all duration-300',
                isActive
                  ? 'text-[22px] font-semibold leading-tight text-foreground md:text-2xl'
                  : 'text-xl font-semibold leading-tight text-foreground/85 md:text-[22px]'
              )}
            >
              {topic || 'Loading...'}
            </h1>
          </div>
        </div>

        {/* Progress section - generous spacing creates hierarchy without separator */}
        <div className="mt-8">
          <ProgressBar />
        </div>
      </div>

      {/* Bottom edge - subtle inner shadow line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-black/[0.08] dark:bg-black/20" />
    </header>
  )
}
