/**
 * src/components/debate/floating-controls.tsx
 * Apple-inspired frosted glass floating dock with roundel buttons
 */

'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

import { CommandDock } from './command-dock'

/**
 * Dock configuration - Apple-inspired dimensions
 */
const DOCK_CONFIG = {
  paddingX: 6, // px - tight horizontal spacing
  paddingY: 6, // px - tight vertical spacing
  borderRadius: 100, // px - full pill shape
  backdropBlur: 24, // px - subtle frosted effect
} as const

interface FloatingControlsProps {
  debateId: string
}

export function FloatingControls({ debateId }: FloatingControlsProps) {
  return (
    <motion.div
      className={cn(
        // Fixed positioning - centered at bottom
        'fixed bottom-8 left-1/2 z-50 -translate-x-1/2',
        // Responsive adjustments
        'max-w-[calc(100vw-2rem)]'
      )}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 28,
        delay: 0.2,
      }}
    >
      {/* Frosted Glass Dock - Apple-style */}
      <div
        className={cn('flex items-center')}
        style={{
          padding: `${DOCK_CONFIG.paddingY}px ${DOCK_CONFIG.paddingX}px`,
          borderRadius: DOCK_CONFIG.borderRadius,
          // Frosted glass background - more subtle
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: `blur(${DOCK_CONFIG.backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${DOCK_CONFIG.backdropBlur}px)`,
          // Subtle border
          border: '1px solid rgba(255, 255, 255, 0.1)',
          // Multi-layer shadow for depth
          boxShadow: [
            'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            '0 4px 24px rgba(0, 0, 0, 0.4)',
            '0 12px 48px rgba(0, 0, 0, 0.3)',
          ].join(', '),
        }}
      >
        <CommandDock debateId={debateId} />
      </div>
    </motion.div>
  )
}
