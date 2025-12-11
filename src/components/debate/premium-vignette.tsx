/**
 * src/components/debate/premium-vignette.tsx
 * Premium vignette - Cross-browser optimized
 *
 * Key principles:
 * - Single combined gradient (no stacked layers that Safari composites differently)
 * - Explicit hsla() colors (no CSS variable alpha math that Safari mishandles)
 * - Many smooth color stops to prevent banding
 */

'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'

import { cn } from '@/lib/utils'

interface PremiumVignetteProps {
  focusTrigger?: number
  className?: string
}

const FOCUS_CONTRACT_DURATION = 0.2
const FOCUS_HOLD_DURATION = 0.1
const FOCUS_RELAX_DURATION = 0.4

const EASING = {
  focusContract: [0.4, 0, 1, 1] as const,
  focusRelax: [0.4, 0, 0.2, 1] as const,
}

export function PremiumVignette({ focusTrigger = 0, className }: PremiumVignetteProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const focusControls = useAnimation()
  const previousTrigger = useRef(focusTrigger)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    if (focusTrigger === previousTrigger.current) return
    if (focusTrigger === 0) {
      previousTrigger.current = focusTrigger
      return
    }
    previousTrigger.current = focusTrigger

    const runFocusAnimation = async () => {
      await focusControls.start({
        scale: 0.97,
        opacity: 1,
        transition: { duration: FOCUS_CONTRACT_DURATION, ease: EASING.focusContract },
      })
      await new Promise((resolve) => setTimeout(resolve, FOCUS_HOLD_DURATION * 1000))
      await focusControls.start({
        scale: 1,
        opacity: 1,
        transition: { duration: FOCUS_RELAX_DURATION, ease: EASING.focusRelax },
      })
    }
    runFocusAnimation()
  }, [focusTrigger, focusControls, prefersReducedMotion])

  const shouldAnimate = !prefersReducedMotion

  return (
    <motion.div
      className={cn('pointer-events-none fixed inset-0', className)}
      style={{
        willChange: shouldAnimate ? 'transform, opacity' : 'auto',
        contain: 'layout style paint',
      }}
      aria-hidden="true"
      animate={focusControls}
      initial={{ scale: 1, opacity: 1 }}
    >
      {/* Single combined vignette - dark mode
          Uses explicit hsla colors for cross-browser consistency */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `
            radial-gradient(
              ellipse 85% 75% at 50% 50%,
              transparent 0%,
              transparent 35%,
              hsla(225, 12%, 6%, 0.03) 45%,
              hsla(225, 12%, 6%, 0.08) 55%,
              hsla(225, 12%, 6%, 0.15) 65%,
              hsla(225, 12%, 6%, 0.25) 75%,
              hsla(225, 12%, 6%, 0.40) 85%,
              hsla(225, 12%, 6%, 0.55) 92%,
              hsla(225, 12%, 6%, 0.70) 100%
            )
          `,
          transition: 'background 0.4s ease',
        }}
      />

      {/* Single combined vignette - light mode */}
      <div
        className="absolute inset-0 block dark:hidden"
        style={{
          background: `
            radial-gradient(
              ellipse 85% 75% at 50% 50%,
              transparent 0%,
              transparent 40%,
              hsla(40, 15%, 98%, 0.02) 50%,
              hsla(40, 15%, 98%, 0.05) 60%,
              hsla(40, 15%, 98%, 0.10) 70%,
              hsla(40, 15%, 98%, 0.18) 80%,
              hsla(40, 15%, 98%, 0.28) 90%,
              hsla(40, 15%, 98%, 0.40) 100%
            )
          `,
          transition: 'background 0.4s ease',
        }}
      />
    </motion.div>
  )
}
