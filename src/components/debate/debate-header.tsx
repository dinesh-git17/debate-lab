// src/components/debate/debate-header.tsx
// Floating pill-shaped header matching landing page navbar design language

'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import Link from 'next/link'

import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

interface DebateHeaderProps {
  debateId?: string
  className?: string
}

const STATUS_LABELS: Record<string, string> = {
  ready: 'Ready',
  active: 'Live',
  paused: 'Paused',
  completed: 'Complete',
  error: 'Error',
}

export function DebateHeader({ className }: DebateHeaderProps) {
  const status = useDebateViewStore((s) => s.status)

  const statusLabel = STATUS_LABELS[status] ?? status

  return (
    <motion.nav
      role="navigation"
      aria-label="Debate navigation"
      className={cn(
        // Floating pill position - matches landing navbar exactly
        'fixed top-5 left-1/2 -translate-x-1/2 z-50',
        'max-w-[1100px] w-[90%]',
        'rounded-full',
        // Padding matching landing navbar
        'px-5 md:px-6 lg:px-8 py-3',
        // Frosted glass material - identical to navbar
        'bg-white/75 dark:bg-white/[0.03]',
        'backdrop-blur-[28px] backdrop-saturate-[1.9]',
        'border border-neutral-200/60 dark:border-white/[0.08]',
        // Multi-layer shadow system - matches navbar exactly
        'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04)]',
        'dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_2px_12px_rgba(0,0,0,0.25),inset_0_0_0_0.5px_rgba(255,255,255,0.05)]',
        // Layout
        'flex items-center justify-between',
        'transition-all duration-300 ease-out',
        className
      )}
      initial={{ opacity: 0, y: -8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {/* Left: Logo - negative margins allow logo to extend beyond navbar */}
      <div className="flex items-center -my-12 mr-8">
        <Logo size="md" />
      </div>

      {/* Center: Status badge - positioned absolutely for true center */}
      <div className="absolute left-1/2 -translate-x-1/2 h-9 flex items-center">
        <motion.div
          className={cn(
            'inline-flex items-center gap-2 px-4 h-9',
            'rounded-full',
            // Light/dark mode backgrounds matching navbar button style
            'bg-gradient-to-b from-neutral-100/80 via-neutral-100/60 to-neutral-100/40',
            'dark:from-white/[0.06] dark:via-white/[0.03] dark:to-white/[0.01]',
            'border border-neutral-200/60 dark:border-white/[0.08]',
            'shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.06)]',
            'transition-all duration-300 ease-out'
          )}
          whileHover={{
            scale: 1.02,
          }}
          transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <motion.span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: status === 'active' ? '#34D399' : 'rgba(74,222,168,0.65)',
              boxShadow:
                status === 'active'
                  ? '0 0 8px rgba(52,211,153,0.5)'
                  : '0 0 4px rgba(52,211,153,0.25)',
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.12, 1], opacity: [0, 1, 1] }}
            transition={{
              duration: 0.4,
              delay: 0.6,
              ease: [0.22, 0.61, 0.36, 1],
              times: [0, 0.5, 1],
            }}
          />
          <span
            className={cn(
              'text-[11px] font-medium uppercase tracking-[0.08em]',
              'text-neutral-500 dark:text-white/70'
            )}
            style={{ WebkitFontSmoothing: 'antialiased' }}
          >
            {statusLabel}
          </span>
        </motion.div>
      </div>

      {/* Right: New debate action - matches landing navbar CTA style exactly */}
      <div className="flex items-center h-9">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <Link
            href="/debate/new"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 h-9',
              'rounded-full',
              // Two-layer frost depth with micro gradient - light/dark
              'bg-gradient-to-b from-white/[0.08] via-white/[0.05] to-white/[0.02]',
              'dark:from-white/[0.06] dark:via-white/[0.03] dark:to-white/[0.01]',
              'backdrop-blur-md',
              // Inner inset stroke + micro glow - light/dark
              'border-0',
              'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
              'dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_14px_rgba(255,255,255,0.025)]',
              // Typography - matches navbar exactly
              'text-neutral-700 dark:text-white/90 text-sm font-medium tracking-tight',
              'transition-all duration-300 ease-out',
              // Hover state - light/dark
              'hover:bg-gradient-to-b hover:from-white/[0.12] hover:via-white/[0.08] hover:to-white/[0.04]',
              'dark:hover:from-white/[0.08] dark:hover:via-white/[0.05] dark:hover:to-white/[0.02]',
              'hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.06)]',
              'dark:hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_0_18px_rgba(255,255,255,0.04)]',
              'hover:text-neutral-900 dark:hover:text-white',
              'hover:scale-[1.01]',
              'hover:[filter:brightness(1.05)_saturate(1.02)]',
              'active:scale-[0.98]'
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span>New</span>
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  )
}
