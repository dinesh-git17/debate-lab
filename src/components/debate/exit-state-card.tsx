// src/components/debate/exit-state-card.tsx
/**
 * Exit state surface shown when user ends a debate prematurely.
 * Calm, intentional design that acknowledges user action without judgment.
 */

'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'

const EXIT_CARD_CONFIG = {
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

interface ExitStateCardProps {
  onStartNew: () => void
  className?: string
}

export function ExitStateCard({ onStartNew, className }: ExitStateCardProps) {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const handleReturnHome = () => {
    router.push('/')
  }

  const cardBackground = `
    linear-gradient(
      to bottom,
      ${EXIT_CARD_CONFIG.tint.gradientTop} 0%,
      ${EXIT_CARD_CONFIG.tint.base} 50%,
      ${EXIT_CARD_CONFIG.tint.gradientBottom} 100%
    )
  `

  const boxShadow = `
    ${EXIT_CARD_CONFIG.shadow.ambient},
    ${EXIT_CARD_CONFIG.shadow.contact},
    ${EXIT_CARD_CONFIG.shadow.highlight}
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
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: ANIMATION.scaleStart,
              y: ANIMATION.translateY,
            }
      }
      transition={{
        duration: ANIMATION.duration,
        ease: ANIMATION.easing,
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          borderRadius: EXIT_CARD_CONFIG.borderRadius.css,
          background: cardBackground,
          backdropFilter: `blur(${EXIT_CARD_CONFIG.backdropBlur}px) saturate(1.4)`,
          WebkitBackdropFilter: `blur(${EXIT_CARD_CONFIG.backdropBlur}px) saturate(1.4)`,
          boxShadow: `${boxShadow}, ${edgeLighting}`,
          padding: `${EXIT_CARD_CONFIG.padding.y}px ${EXIT_CARD_CONFIG.padding.x}px`,
        }}
      >
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Headline */}
          <h2
            className="text-xl font-medium text-foreground/90 tracking-tight"
            style={{ letterSpacing: '-0.01em' }}
          >
            Debate ended
          </h2>

          {/* Supporting text */}
          <p
            className="mt-3 text-sm text-foreground/50 leading-relaxed"
            style={{ maxWidth: '28ch' }}
          >
            You can start a new discussion or explore a different question.
          </p>

          {/* Actions */}
          <div className="mt-7 flex flex-col items-center gap-3 w-full">
            {/* Primary action */}
            <motion.button
              onClick={onStartNew}
              className={cn(
                'w-full max-w-[200px]',
                'inline-flex items-center justify-center gap-2',
                'h-12 rounded-full px-6',
                'text-sm font-semibold tracking-tight',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
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
              whileHover={{
                scale: 1.02,
                y: -1,
                boxShadow: `
                  0 6px 20px rgba(0, 0, 0, 0.2),
                  0 0 0 0.5px rgba(255, 255, 255, 0.12),
                  inset 0 1px 0 rgba(255, 255, 255, 0.15),
                  0 0 32px rgba(255, 255, 255, 0.08)
                `,
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
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
            </motion.button>

            {/* Secondary actions row */}
            <div className="flex items-center gap-4 mt-1">
              <Link
                href="/debate/new"
                className={cn(
                  'text-[13px] font-medium text-foreground/40',
                  'hover:text-foreground/60',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:text-foreground/60'
                )}
              >
                Change the topic
              </Link>

              <span className="text-foreground/20">·</span>

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
      </div>
    </motion.div>
  )
}
