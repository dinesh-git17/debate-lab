// src/components/ui/console-overlay.tsx

'use client'

import { motion } from 'framer-motion'
import { useEffect } from 'react'

import { IntelligenceConsole, type LogStep } from './intelligence-console'

interface ConsoleOverlayProps {
  steps: LogStep[]
  topic?: string | undefined
  onComplete?: (() => void) | undefined
}

export function ConsoleOverlay({ steps, topic, onComplete }: ConsoleOverlayProps) {
  // Lock body scroll when mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Solid background - completely opaque, hides everything */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* Dimmed God Ray - centered, subtle */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 50%)',
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Heavy Vignette - tunnels focus to center */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)',
        }}
      />

      {/* Film Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Console - Larger, more prominent with entrance animation */}
      <motion.div
        className="relative z-10 w-full max-w-xl px-6"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        <IntelligenceConsole steps={steps} topic={topic} onComplete={onComplete} />
      </motion.div>
    </motion.div>
  )
}
