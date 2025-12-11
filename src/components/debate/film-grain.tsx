/**
 * src/components/debate/film-grain.tsx
 * Cinematic film grain overlay with configurable opacity
 */

'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

// Animation timing
const GRAIN_TIMING = {
  coarseTick: 66, // ms, ~15fps film cadence
  fineTick: 50, // ms, offset phase
} as const

// SVG noise pattern data URL
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`

interface FilmGrainProps {
  className?: string
  /** Opacity multiplier for the grain effect (0-1, default 1) */
  opacity?: number
}

export function FilmGrain({ className, opacity = 1 }: FilmGrainProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Base opacity values scaled by the opacity prop
  const coarseOpacity = 0.025 * opacity
  const fineOpacity = 0.02 * opacity
  const [coarseOffset, setCoarseOffset] = useState({ x: 0, y: 0 })
  const [fineOffset, setFineOffset] = useState({ x: 0, y: 0 })

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Handle visibility API - pause when tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Coarse grain animation (~15fps)
  useEffect(() => {
    if (prefersReducedMotion || !isVisible) return

    const interval = setInterval(() => {
      setCoarseOffset({
        x: Math.random() * 100,
        y: Math.random() * 100,
      })
    }, GRAIN_TIMING.coarseTick)

    return () => clearInterval(interval)
  }, [prefersReducedMotion, isVisible])

  // Fine grain animation (offset phase)
  useEffect(() => {
    if (prefersReducedMotion || !isVisible) return

    const interval = setInterval(() => {
      setFineOffset({
        x: Math.random() * 100,
        y: Math.random() * 100,
      })
    }, GRAIN_TIMING.fineTick)

    return () => clearInterval(interval)
  }, [prefersReducedMotion, isVisible])

  return (
    <div className={cn('pointer-events-none fixed inset-0', className)}>
      {/* Coarse grain layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: NOISE_SVG,
          backgroundPosition: prefersReducedMotion
            ? '0 0'
            : `${coarseOffset.x}px ${coarseOffset.y}px`,
          opacity: coarseOpacity,
          mixBlendMode: 'soft-light',
          willChange: prefersReducedMotion ? 'auto' : 'background-position',
        }}
        aria-hidden="true"
      />

      {/* Fine grain layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: NOISE_SVG,
          backgroundPosition: prefersReducedMotion
            ? '50px 50px'
            : `${fineOffset.x}px ${fineOffset.y}px`,
          opacity: fineOpacity,
          mixBlendMode: 'soft-light',
          backgroundSize: '200px 200px',
          willChange: prefersReducedMotion ? 'auto' : 'background-position',
        }}
        aria-hidden="true"
      />
    </div>
  )
}
