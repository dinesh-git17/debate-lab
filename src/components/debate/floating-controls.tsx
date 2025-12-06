// src/components/debate/floating-controls.tsx

'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

import { CommandDock } from './command-dock'

interface FloatingControlsProps {
  debateId: string
}

export function FloatingControls({ debateId }: FloatingControlsProps) {
  return (
    <motion.div
      className={cn(
        // Fixed positioning - centered at bottom
        'fixed bottom-10 left-1/2 z-50 -translate-x-1/2',
        // Responsive adjustments
        'max-w-[calc(100vw-2rem)]'
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Deep Glass Dock - precision form factor */}
      <div
        className={cn(
          // Fixed height - tight skin
          'flex items-center h-12 p-1.5',
          // Pill shape
          'rounded-full',
          // Deep glass surface
          'bg-[#050505]/90 backdrop-blur-xl',
          // Crisp border
          'border border-white/[0.08]',
          // Floating shadow
          'shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
        )}
      >
        <CommandDock debateId={debateId} />
      </div>
    </motion.div>
  )
}
