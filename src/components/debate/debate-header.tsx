// src/components/debate/debate-header.tsx

'use client'

import { motion, AnimatePresence } from 'framer-motion'

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

// FAANG-style status dot colors (only the dot gets color, chip stays neutral)
const STATUS_DOT_COLORS: Record<string, string> = {
  ready: 'bg-emerald-500',
  active: 'bg-blue-500',
  paused: 'bg-amber-500',
  completed: 'bg-emerald-500',
  error: 'bg-red-500',
}

const STATUS_LABELS: Record<string, string> = {
  ready: 'Ready',
  active: 'Live',
  paused: 'Paused',
  completed: 'Complete',
  error: 'Error',
}

// Glow colors based on status for the radial effect - extremely subtle
const STATUS_GLOW: Record<string, string> = {
  ready: 'from-emerald-500/[0.03] via-transparent to-transparent',
  active: 'from-blue-500/[0.05] via-transparent to-transparent',
  paused: 'from-amber-500/[0.04] via-transparent to-transparent',
  completed: 'from-emerald-500/[0.03] via-transparent to-transparent',
  error: 'from-red-500/[0.04] via-transparent to-transparent',
}

// FAANG-style chip base styles (neutral background, color only in dot)
const chipBaseStyles = cn(
  'inline-flex items-center gap-1.5',
  // Pill shape with 6px radius
  'rounded-md px-2.5 py-1.5',
  'text-[11px] font-medium leading-none tracking-wide',
  // Neutral gray background
  'bg-white/[0.04]',
  'text-foreground/70',
  // Subtle border
  'border border-white/[0.06]',
  // Hover elevation effect
  'will-change-transform',
  'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
  'hover:bg-white/[0.08] hover:border-white/[0.10]',
  'hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
  'hover:translate-y-[-1px]'
)

export function DebateHeader({ debateId, className }: DebateHeaderProps) {
  const topic = useDebateViewStore((s) => s.topic)
  const format = useDebateViewStore((s) => s.format)
  const status = useDebateViewStore((s) => s.status)

  const formatDisplayName = FORMAT_DISPLAY_NAMES[format] ?? format
  const isActive = status === 'active' || status === 'paused'
  const dotColor = STATUS_DOT_COLORS[status] ?? 'bg-muted-foreground'
  const isReadyOrActive = status === 'ready' || status === 'active'
  const statusLabel = STATUS_LABELS[status] ?? status
  const glowGradient = STATUS_GLOW[status] ?? STATUS_GLOW.ready

  return (
    <header
      className={cn(
        'relative overflow-hidden',
        // Apple glassmorphism - frosted translucent background
        'bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent',
        'backdrop-blur-3xl backdrop-saturate-[1.8]',
        // Soft floating elevation with diffused shadow glow
        'shadow-[0_4px_32px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)]',
        // Subtle gradient border for soft edges
        'border-b border-white/[0.05]',
        className
      )}
    >
      {/* Top edge highlight - glass reflection effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

      {/* Ambient radial glow - always present but subtle */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Status-based radial glow - barely perceptible */}
      {isActive && (
        <div
          className={cn(
            'pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full',
            'blur-[120px]',
            glowGradient,
            'opacity-40'
          )}
          style={{
            background: `radial-gradient(circle, var(--tw-gradient-stops))`,
          }}
        />
      )}

      {/* Content container - compact vertical padding */}
      <div className="relative mx-auto max-w-5xl px-6 py-4 md:px-8 md:py-5">
        {/* MOBILE LAYOUT: Centered title with compact controls */}
        <div className="md:hidden">
          {/* Mobile controls row - centered */}
          <div className="flex justify-center">
            <DebateControls debateId={debateId} variant="mobile" />
          </div>

          {/* Hero Title Section */}
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Title with Apple-style typography */}
            <h1
              className={cn(
                'relative inline-block truncate',
                // Apple SF Pro Display style
                'font-semibold tracking-[-0.02em]',
                'transition-all duration-300',
                isActive
                  ? 'text-xl leading-tight text-foreground'
                  : 'text-lg leading-tight text-foreground/90'
              )}
            >
              {topic || 'Loading...'}
              {/* Subtle underline accent */}
              <motion.span
                className="absolute -bottom-1 left-0 h-[2px] rounded-full bg-gradient-to-r from-emerald-500/40 via-blue-500/40 to-emerald-500/40"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              />
            </h1>
          </motion.div>

          {/* Status chips row - centered under title */}
          <div className="mt-3 flex items-center justify-center gap-2.5">
            {/* Format chip - neutral style */}
            <span className={chipBaseStyles}>{formatDisplayName}</span>

            {/* Status chip with animated dot */}
            <AnimatePresence mode="wait">
              <motion.span
                key={status}
                className={chipBaseStyles}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {isReadyOrActive ? (
                  <motion.span
                    className={cn('h-1.5 w-1.5 rounded-full', dotColor)}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: status === 'active' ? 1 : 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ) : (
                  <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
                )}
                {statusLabel}
              </motion.span>
            </AnimatePresence>

            {/* Connection status */}
            <ConnectionStatus />
          </div>
        </div>

        {/* DESKTOP LAYOUT: Original horizontal layout */}
        <div className="hidden md:block">
          {/* Primary row: Metadata + Controls - baseline aligned */}
          <div className="flex items-center justify-between gap-8">
            {/* Left: Metadata row with FAANG-style chips */}
            <div className="flex items-center gap-2.5">
              {/* Format chip - neutral style */}
              <span className={chipBaseStyles}>{formatDisplayName}</span>

              {/* Status chip with animated switching */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={status}
                  className={chipBaseStyles}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {isReadyOrActive ? (
                    <motion.span
                      className={cn('h-1.5 w-1.5 rounded-full', dotColor)}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: status === 'active' ? 1 : 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  ) : (
                    <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
                  )}
                  {statusLabel}
                </motion.span>
              </AnimatePresence>

              {/* Connection status */}
              <ConnectionStatus />
            </div>

            {/* Right: Controls */}
            <div className="flex shrink-0 items-center">
              <DebateControls debateId={debateId} />
            </div>
          </div>

          {/* Hero Title Section */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Title with Apple-style typography */}
            <h1
              className={cn(
                'relative inline-block max-w-full truncate',
                // Apple SF Pro Display style - weight 600, tight tracking
                'font-semibold tracking-[-0.025em]',
                'transition-all duration-300',
                isActive
                  ? 'text-[26px] leading-tight text-foreground md:text-[28px]'
                  : 'text-2xl leading-tight text-foreground/90 md:text-[26px]'
              )}
            >
              {topic || 'Loading...'}
              {/* Subtle underline accent with gradient */}
              <motion.span
                className="absolute -bottom-1.5 left-0 h-[2px] rounded-full bg-gradient-to-r from-emerald-500/50 via-blue-500/50 to-emerald-500/50"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              />
            </h1>
          </motion.div>
        </div>

        {/* Progress section */}
        <div className="mt-5">
          <ProgressBar />
        </div>
      </div>

      {/* Bottom edge - subtle divider line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </header>
  )
}
