// src/components/debate/summary-hint.tsx
/**
 * Subtle hint text shown after natural debate completion.
 * Guides users to view the detailed summary for judge's analysis.
 */

'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FaInfoCircle } from 'react-icons/fa'

import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

interface SummaryHintProps {
  className?: string
}

export function SummaryHint({ className }: SummaryHintProps) {
  const prefersReducedMotion = useReducedMotion()
  const setIsSummaryHintHovered = useDebateViewStore((s) => s.setIsSummaryHintHovered)

  return (
    <motion.div
      className={cn(
        'flex items-center justify-center gap-2',
        'text-[13px] text-white/40',
        'cursor-pointer transition-colors duration-150',
        'hover:text-white/60',
        className
      )}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 0.61, 0.36, 1],
        delay: 0.5,
      }}
      onMouseEnter={() => setIsSummaryHintHovered(true)}
      onMouseLeave={() => setIsSummaryHintHovered(false)}
    >
      <FaInfoCircle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>View the summary below for the judge&apos;s detailed analysis</span>
    </motion.div>
  )
}
