/**
 * src/components/debate/floating-controls.tsx
 * VisionOS-style frosted glass floating dock with premium glass effects
 */

'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

import { CommandDock } from './command-dock'

/**
 * VisionOS Glass Dock Configuration
 * Inspired by Apple's spatial computing UI language
 */
const GLASS_DOCK = {
  padding: { x: 8, y: 8 }, // px - breathing room
  borderRadius: 100, // px - full pill shape
  backdropBlur: 40, // px - heavy frosted glass effect
  // Glass material layers
  glass: {
    base: 'rgba(38, 38, 42, 0.65)', // Dark translucent base
    tint: 'rgba(255, 255, 255, 0.04)', // Subtle white overlay
  },
  // VisionOS edge lighting
  edgeLighting: {
    top: 'rgba(255, 255, 255, 0.20)', // Bright top rim
    sides: 'rgba(255, 255, 255, 0.08)', // Subtle side edges
    bottom: 'rgba(120, 160, 255, 0.10)', // Cool blue bottom refraction
  },
  // Floating shadow system
  shadow: {
    ambient: '0 20px 50px rgba(0, 0, 0, 0.35)', // Wide diffused shadow
    close: '0 8px 24px rgba(0, 0, 0, 0.25)', // Closer contact shadow
  },
} as const

interface FloatingControlsProps {
  debateId: string
}

export function FloatingControls({ debateId }: FloatingControlsProps) {
  return (
    <motion.div
      className={cn(
        // Fixed positioning - visually centered to match card alignment
        'fixed bottom-8 z-50',
        // Responsive adjustments
        'max-w-[calc(100vw-2rem)]'
      )}
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
      {/* VisionOS Glass Dock - multi-layer glass system */}
      <div className="relative">
        {/* LAYER 1: Floating shadow (separate for better rendering) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: GLASS_DOCK.borderRadius,
            boxShadow: `${GLASS_DOCK.shadow.ambient}, ${GLASS_DOCK.shadow.close}`,
          }}
          aria-hidden="true"
        />

        {/* LAYER 2: Main glass container */}
        <div
          className="relative flex items-center"
          style={{
            padding: `${GLASS_DOCK.padding.y}px ${GLASS_DOCK.padding.x}px`,
            borderRadius: GLASS_DOCK.borderRadius,
            // Multi-layer glass background
            background: `
              linear-gradient(180deg, ${GLASS_DOCK.glass.tint} 0%, transparent 50%),
              ${GLASS_DOCK.glass.base}
            `.replace(/\s+/g, ' '),
            // Heavy frosted blur
            backdropFilter: `blur(${GLASS_DOCK.backdropBlur}px) saturate(1.2)`,
            WebkitBackdropFilter: `blur(${GLASS_DOCK.backdropBlur}px) saturate(1.2)`,
          }}
        >
          {/* LAYER 3: VisionOS edge lighting - 0.5px inner strokes */}
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

          {/* LAYER 4: Inner glow for depth */}
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

          {/* LAYER 5: Specular highlight - top left corner */}
          <div
            className="absolute top-0 left-4 right-4 h-[1px] pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)',
              borderRadius: GLASS_DOCK.borderRadius,
            }}
            aria-hidden="true"
          />

          {/* Content */}
          <div className="relative z-10">
            <CommandDock debateId={debateId} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
