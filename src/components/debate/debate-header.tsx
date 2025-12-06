// src/components/debate/debate-header.tsx

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
    <motion.header
      className={cn(
        'relative h-16',
        'bg-[#0A0A0A]/60',
        'backdrop-blur-xl',
        'border-b border-white/[0.06]',
        'z-50',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
    >
      {/* Nav row */}
      <div className="relative mx-auto flex h-full max-w-5xl items-center justify-between px-6 md:px-8">
        {/* Left: Logo navigation */}
        <Logo size="md" />

        {/* Center: Status badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                status === 'active' ? 'bg-emerald-500' : 'bg-emerald-500/70'
              )}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Right: New debate action */}
        <Link
          href="/debate/new"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </Link>
      </div>
    </motion.header>
  )
}
