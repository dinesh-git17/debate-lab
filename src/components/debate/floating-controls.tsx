// src/components/debate/floating-controls.tsx
/**
 * Floating dock container with frosted glass effect for debate controls.
 * Positioned at viewport bottom with multi-layer visual depth system.
 */

'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

import { CommandDock } from './command-dock'

const GLASS_DOCK = {
  padding: { x: 8, y: 8 },
  borderRadius: 100,
  backdropBlur: 32,
  backdropSaturate: 1.8,
  glass: {
    // Match header: dark:bg-zinc-900/60 (zinc-900 = #18181b)
    base: 'rgba(24, 24, 27, 0.60)',
    tint: 'rgba(255, 255, 255, 0.04)',
  },
  border: 'rgba(255, 255, 255, 0.12)',
  edgeLighting: {
    top: 'rgba(255, 255, 255, 0.12)',
    sides: 'rgba(255, 255, 255, 0.06)',
    bottom: 'rgba(120, 160, 255, 0.08)',
  },
  shadow: {
    // Match header shadow style
    ambient: '0 8px 32px rgba(0, 0, 0, 0.4)',
    highlight: '0 0 1px rgba(255, 255, 255, 0.08)',
  },
} as const

interface FloatingControlsProps {
  debateId: string
}

export function FloatingControls({ debateId }: FloatingControlsProps) {
  return (
    <motion.div
      className={cn('fixed bottom-8 z-50', 'max-w-[calc(100vw-2rem)]')}
      style={{
        left: '48.5%',
      }}
      initial={{ opacity: 0, y: 16, scale: 0.96, x: '-50%' }}
      animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 28,
        delay: 0.2,
      }}
    >
      <div className="relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: GLASS_DOCK.borderRadius,
            boxShadow: `${GLASS_DOCK.shadow.ambient}, ${GLASS_DOCK.shadow.highlight}`,
          }}
          aria-hidden="true"
        />

        <div
          className="relative flex items-center"
          style={{
            padding: `${GLASS_DOCK.padding.y}px ${GLASS_DOCK.padding.x}px`,
            borderRadius: GLASS_DOCK.borderRadius,
            background: `
              linear-gradient(180deg, ${GLASS_DOCK.glass.tint} 0%, transparent 50%),
              ${GLASS_DOCK.glass.base}
            `.replace(/\s+/g, ' '),
            border: `1px solid ${GLASS_DOCK.border}`,
            backdropFilter: `blur(${GLASS_DOCK.backdropBlur}px) saturate(${GLASS_DOCK.backdropSaturate})`,
            WebkitBackdropFilter: `blur(${GLASS_DOCK.backdropBlur}px) saturate(${GLASS_DOCK.backdropSaturate})`,
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: GLASS_DOCK.borderRadius,
              boxShadow: `
                inset 0 0.5px 0 0 ${GLASS_DOCK.edgeLighting.top},
                inset 0.5px 0 0 0 ${GLASS_DOCK.edgeLighting.sides},
                inset -0.5px 0 0 0 ${GLASS_DOCK.edgeLighting.sides},
                inset 0 -0.5px 0 0 ${GLASS_DOCK.edgeLighting.bottom}
              `.replace(/\s+/g, ' '),
            }}
            aria-hidden="true"
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: GLASS_DOCK.borderRadius,
              boxShadow: `
                inset 0 1px 12px rgba(255, 255, 255, 0.06),
                inset 0 -1px 8px rgba(0, 0, 0, 0.12)
              `.replace(/\s+/g, ' '),
            }}
            aria-hidden="true"
          />

          <div
            className="absolute top-0 left-4 right-4 h-[1px] pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)',
              borderRadius: GLASS_DOCK.borderRadius,
            }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            <CommandDock debateId={debateId} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
