// src/components/debate/debate-ended-card.tsx
/**
 * Card shown when accessing a debate that was ended early.
 * Calm, informative design that explains the state without judgment.
 */

'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'

const CARD_CONFIG = {
  backdropBlur: 32,
  borderRadius: {
    css: '32px',
  },
  tint: {
    base: 'rgba(255, 255, 255, 0.06)',
    gradientTop: 'rgba(255, 255, 255, 0.08)',
    gradientBottom: 'rgba(255, 255, 255, 0.03)',
  },
  shadow: {
    ambient: '0 32px 64px rgba(0, 0, 0, 0.28)',
    contact: '0 8px 24px rgba(0, 0, 0, 0.18)',
    highlight: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.12)',
  },
  padding: {
    x: 40,
    y: 36,
  },
} as const

const ANIMATION = {
  duration: 0.28,
  easing: [0.22, 0.61, 0.36, 1] as const,
  translateY: 6,
  scaleStart: 0.96,
} as const

interface DebateEndedCardProps {
  className?: string
}

export function DebateEndedCard({ className }: DebateEndedCardProps) {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const handleReturnHome = () => {
    router.push('/')
  }

  const cardBackground = `
    linear-gradient(
      to bottom,
      ${CARD_CONFIG.tint.gradientTop} 0%,
      ${CARD_CONFIG.tint.base} 50%,
      ${CARD_CONFIG.tint.gradientBottom} 100%
    )
  `

  const boxShadow = `
    ${CARD_CONFIG.shadow.ambient},
    ${CARD_CONFIG.shadow.contact},
    ${CARD_CONFIG.shadow.highlight}
  `

  const edgeLighting = `
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    inset 0 -1px 0 rgba(120, 160, 255, 0.06),
    inset 1px 0 0 rgba(255, 255, 255, 0.04),
    inset -1px 0 0 rgba(255, 255, 255, 0.04)
  `

  return (
    <motion.div
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-full max-w-md mx-auto',
        className
      )}
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: ANIMATION.scaleStart,
              y: ANIMATION.translateY,
            }
      }
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: ANIMATION.duration,
        ease: ANIMATION.easing,
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          borderRadius: CARD_CONFIG.borderRadius.css,
          background: cardBackground,
          backdropFilter: `blur(${CARD_CONFIG.backdropBlur}px) saturate(1.4)`,
          WebkitBackdropFilter: `blur(${CARD_CONFIG.backdropBlur}px) saturate(1.4)`,
          boxShadow: `${boxShadow}, ${edgeLighting}`,
          padding: `${CARD_CONFIG.padding.y}px ${CARD_CONFIG.padding.x}px`,
        }}
      >
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Headline */}
          <h2
            className="text-xl font-medium text-foreground/90 tracking-tight"
            style={{ letterSpacing: '-0.01em' }}
          >
            This debate was ended early
          </h2>

          {/* Supporting text */}
          <p
            className="mt-3 text-sm text-foreground/50 leading-relaxed"
            style={{ maxWidth: '30ch' }}
          >
            The conversation was stopped before completion and is no longer available to view.
          </p>

          {/* Actions */}
          <div className="mt-7 flex flex-col items-center gap-3 w-full">
            {/* Primary action */}
            <Link
              href="/debate/new"
              className={cn(
                'w-full max-w-[200px]',
                'inline-flex items-center justify-center gap-2',
                'h-12 rounded-full px-6',
                'text-sm font-semibold tracking-tight',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                'transition-all duration-150',
                'hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]'
              )}
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                boxShadow: `
                  0 4px 16px rgba(0, 0, 0, 0.15),
                  0 0 0 0.5px rgba(255, 255, 255, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.12),
                  0 0 24px rgba(255, 255, 255, 0.04)
                `,
                color: 'rgba(255, 255, 255, 0.95)',
                letterSpacing: '-0.01em',
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Start a new debate</span>
            </Link>

            {/* Secondary action */}
            <button
              onClick={handleReturnHome}
              className={cn(
                'text-[13px] font-medium text-foreground/40',
                'hover:text-foreground/60',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:text-foreground/60'
              )}
            >
              Return home
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
