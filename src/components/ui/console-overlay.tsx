// src/components/ui/console-overlay.tsx

'use client'

import { motion } from 'framer-motion'

import { IntelligenceConsole, type LogStep } from './intelligence-console'

interface ConsoleOverlayProps {
  steps: LogStep[]
  topic?: string
  onComplete?: () => void
}

export function ConsoleOverlay({ steps, topic, onComplete }: ConsoleOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Darkened background */}
      <div className="absolute inset-0 bg-[#0a0a0b]" />

      {/* Dimmed God Ray */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255, 255, 255, 0.04) 0%, transparent 50%)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Enhanced Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Film Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Console */}
      <IntelligenceConsole
        steps={steps}
        topic={topic}
        onComplete={onComplete}
        className="relative z-10"
      />
    </motion.div>
  )
}
