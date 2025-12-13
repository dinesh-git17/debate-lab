// src/components/ui/intelligence-console.tsx
/**
 * Premium system console that displays sequential processing steps.
 * Features glass morphism, timeline depth, and smooth completion transitions.
 */
'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export interface LogStep {
  text: string
  duration: number
  /** Optional: marks this step as "meaningful" for slower pacing */
  emphasis?: boolean
}

interface IntelligenceConsoleProps {
  steps: LogStep[]
  onComplete?: (() => void) | undefined
  topic?: string | undefined
  className?: string | undefined
}

const MAX_VISIBLE_LINES = 6
const COMPLETION_HOLD_MS = 400

export function IntelligenceConsole({
  steps,
  onComplete,
  topic,
  className,
}: IntelligenceConsoleProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const hasCalledComplete = useRef(false)
  const prefersReducedMotion = useReducedMotion()

  const processedSteps = useMemo(() => {
    return steps.map((step) => ({
      ...step,
      text: step.text.replace('{topic}', topic || '...'),
    }))
  }, [steps, topic])

  const totalDuration = useMemo(() => {
    return steps.reduce((acc, step) => acc + step.duration, 0)
  }, [steps])

  useEffect(() => {
    if (currentStep >= steps.length) {
      setIsComplete(true)
      setProgress(100)

      const holdTimer = setTimeout(() => {
        setIsExiting(true)
      }, COMPLETION_HOLD_MS)

      const completeTimer = setTimeout(() => {
        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true
          onComplete?.()
        }
      }, COMPLETION_HOLD_MS + 300)

      return () => {
        clearTimeout(holdTimer)
        clearTimeout(completeTimer)
      }
    }

    const currentStepData = steps[currentStep]
    if (!currentStepData) return

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1)
    }, currentStepData.duration)

    const elapsed = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0)
    setProgress((elapsed / totalDuration) * 100)

    return () => clearTimeout(timer)
  }, [currentStep, steps, totalDuration, onComplete])

  const visibleSteps = processedSteps.slice(0, currentStep + 1)
  const displaySteps = visibleSteps.slice(-MAX_VISIBLE_LINES)
  const hiddenCount = Math.max(0, visibleSteps.length - MAX_VISIBLE_LINES)

  return (
    <div className={cn('relative', className)}>
      <motion.div
        className={cn(
          'relative w-full overflow-hidden',
          'rounded-2xl',
          'border border-white/[0.12]'
        )}
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.06) 0%,
              rgba(255, 255, 255, 0.02) 100%
            ),
            rgba(12, 12, 14, 0.85)
          `.replace(/\s+/g, ' '),
          backdropFilter: 'blur(40px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
          boxShadow: `
            0 0 0 0.5px rgba(255, 255, 255, 0.08),
            0 2px 4px rgba(0, 0, 0, 0.1),
            0 8px 24px rgba(0, 0, 0, 0.25),
            0 24px 48px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.06)
          `.replace(/\s+/g, ' '),
        }}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{
          opacity: isExiting ? 0 : 1,
          y: isExiting ? -10 : 0,
          scale: isExiting ? 0.98 : 1,
        }}
        transition={{
          duration: prefersReducedMotion ? 0.15 : 0.5,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-7 py-5">
          {/* Primary: System Status */}
          <div className="flex items-center gap-2.5">
            <motion.div
              className={cn(
                'h-2 w-2 rounded-full',
                isComplete ? 'bg-emerald-400' : 'bg-emerald-500'
              )}
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: isComplete ? 1 : [1, 1.2, 1],
                      opacity: isComplete ? 1 : [0.7, 1, 0.7],
                    }
              }
              transition={{
                duration: 2,
                repeat: isComplete ? 0 : Infinity,
                ease: 'easeInOut',
              }}
            />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
                System Status
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600">
                ·
              </span>
              <motion.span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-[0.08em]',
                  isComplete ? 'text-emerald-400' : 'text-emerald-500/90'
                )}
                animate={
                  isComplete && !prefersReducedMotion
                    ? {
                        textShadow: [
                          '0 0 0px rgba(52, 211, 153, 0)',
                          '0 0 8px rgba(52, 211, 153, 0.5)',
                          '0 0 0px rgba(52, 211, 153, 0)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {isComplete ? 'Ready' : 'Optimal'}
              </motion.span>
            </div>
          </div>

          {/* Secondary: Processing indicator */}
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-600/80">
            {isComplete ? 'Complete' : 'Preparing Debate'}
          </span>
        </div>

        {/* Log List */}
        <div className="relative px-7 py-8">
          <div
            className="space-y-3"
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
            }}
          >
            <AnimatePresence mode="popLayout">
              {displaySteps.map((step, displayIndex) => {
                const actualIndex = hiddenCount + displayIndex
                const isPast = actualIndex < currentStep
                const isCurrent = actualIndex === currentStep
                const isLast = actualIndex === steps.length - 1

                const depthOpacity = isCurrent
                  ? 1
                  : Math.max(0.35, 1 - (currentStep - actualIndex) * 0.15)

                return (
                  <motion.div
                    key={actualIndex}
                    className="flex items-start gap-3"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
                    animate={{ opacity: depthOpacity, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{
                      duration: prefersReducedMotion ? 0.1 : 0.35,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    style={{ opacity: depthOpacity }}
                  >
                    <span
                      className="select-none text-[13px]"
                      style={{ opacity: depthOpacity * 0.5, color: 'rgb(113, 113, 122)' }}
                    >
                      &gt;
                    </span>

                    <span
                      className={cn(
                        'flex-1 text-[13px] leading-[1.7] tracking-[-0.01em]',
                        isPast && 'text-zinc-500',
                        isCurrent && !isLast && 'text-zinc-200',
                        isCurrent && isLast && 'text-emerald-400'
                      )}
                    >
                      {step.text}

                      {isCurrent && !isComplete && (
                        <motion.span
                          className={cn(
                            'ml-1.5 inline-block h-[14px] w-[2px] translate-y-[2px] rounded-full',
                            isLast ? 'bg-emerald-400' : 'bg-zinc-300'
                          )}
                          animate={prefersReducedMotion ? {} : { opacity: [1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut',
                          }}
                        />
                      )}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-[3px] w-full overflow-hidden bg-white/[0.04]">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: isComplete
                ? 'linear-gradient(90deg, rgb(52, 211, 153) 0%, rgb(34, 197, 94) 100%)'
                : 'linear-gradient(90deg, rgb(52, 211, 153) 0%, rgb(6, 182, 212) 100%)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: prefersReducedMotion ? 0.1 : 0.5,
              ease: [0.23, 1, 0.32, 1],
            }}
          />

          {/* Leading edge glow */}
          {!isComplete && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-y-0 w-12 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.4) 50%, rgba(52, 211, 153, 0.6) 100%)',
                filter: 'blur(4px)',
              }}
              initial={{ left: '0%' }}
              animate={{ left: `calc(${progress}% - 24px)` }}
              transition={{
                duration: 0.5,
                ease: [0.23, 1, 0.32, 1],
              }}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}
