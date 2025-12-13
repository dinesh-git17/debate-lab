// src/components/ui/console-overlay.tsx
/**
 * Full-screen overlay that displays IntelligenceConsole with cinematic background effects.
 * Features vignette focus, ambient glow, and smooth exit transitions.
 */
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'

import { IntelligenceConsole, type LogStep } from './intelligence-console'

interface ConsoleOverlayProps {
  steps: LogStep[]
  topic?: string | undefined
  onComplete?: (() => void) | undefined
}

export function ConsoleOverlay({ steps, topic, onComplete }: ConsoleOverlayProps) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.4 }}
    >
      {/* Base background */}
      <div className="absolute inset-0 bg-[#050506]" />

      {/* Ambient glow */}
      {!prefersReducedMotion && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'radial-gradient(circle at center, rgba(52, 211, 153, 0.03) 0%, rgba(6, 182, 212, 0.02) 30%, transparent 60%)',
          }}
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Vignette - stronger for focus */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at center, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 80%, rgba(0,0,0,0.95) 100%)',
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Console container */}
      <motion.div
        className="relative z-10 w-full max-w-[640px]"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: prefersReducedMotion ? 0.15 : 0.5,
          delay: prefersReducedMotion ? 0 : 0.15,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        <IntelligenceConsole steps={steps} topic={topic} onComplete={onComplete} />
      </motion.div>
    </motion.div>
  )
}
