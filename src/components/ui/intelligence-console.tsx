// src/components/ui/intelligence-console.tsx

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

export interface LogStep {
  text: string
  duration: number // ms to show before next step
}

interface IntelligenceConsoleProps {
  steps: LogStep[]
  onComplete?: (() => void) | undefined
  topic?: string | undefined // For dynamic interpolation
  className?: string | undefined
}

export function IntelligenceConsole({
  steps,
  onComplete,
  topic,
  className,
}: IntelligenceConsoleProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  // Interpolate topic into step text
  const processedSteps = useMemo(() => {
    return steps.map((step) => ({
      ...step,
      text: step.text.replace('{topic}', topic || '...'),
    }))
  }, [steps, topic])

  // Calculate total duration for progress bar
  const totalDuration = useMemo(() => {
    return steps.reduce((acc, step) => acc + step.duration, 0)
  }, [steps])

  useEffect(() => {
    if (currentStep >= steps.length) {
      onComplete?.()
      return
    }

    const currentStepData = steps[currentStep]
    if (!currentStepData) return

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1)
    }, currentStepData.duration)

    // Update progress
    const elapsed = steps.slice(0, currentStep + 1).reduce((acc, s) => acc + s.duration, 0)
    setProgress((elapsed / totalDuration) * 100)

    return () => clearTimeout(timer)
  }, [currentStep, steps, totalDuration, onComplete])

  return (
    <div className={cn('relative', className)}>
      {/* Terminal Container - Larger, more theatrical */}
      <motion.div
        className={cn(
          'relative w-full overflow-hidden',
          // Larger container with stronger backdrop
          'bg-black/60 backdrop-blur-xl',
          'border border-white/[0.08]',
          'rounded-2xl',
          // More prominent shadow
          'shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]'
        )}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Header - taller */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          {/* Status Dot - larger */}
          <div className="flex items-center gap-3">
            <motion.div
              className="h-2.5 w-2.5 rounded-full bg-emerald-500"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Processing
            </span>
          </div>

          {/* System Status */}
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-600">
            System Status: <span className="text-emerald-500/80">Optimal</span>
          </span>
        </div>

        {/* Log Content - more padding, larger text */}
        <div className="p-8 font-mono text-sm leading-loose">
          <AnimatePresence mode="popLayout">
            {processedSteps.slice(0, currentStep + 1).map((step, index) => {
              const isPast = index < currentStep
              const isCurrent = index === currentStep
              const isLast = index === steps.length - 1

              return (
                <motion.div
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Prompt Symbol */}
                  <span className={cn('select-none', isPast ? 'text-zinc-700' : 'text-zinc-500')}>
                    &gt;
                  </span>

                  {/* Log Text */}
                  <span
                    className={cn(
                      'flex-1',
                      isPast && 'text-zinc-600',
                      isCurrent && !isLast && 'text-white',
                      isCurrent && isLast && 'text-emerald-400'
                    )}
                  >
                    {step.text}

                    {/* Blinking Cursor */}
                    {isCurrent && (
                      <motion.span
                        className={cn(
                          'ml-1 inline-block h-4 w-2',
                          isLast ? 'bg-emerald-400' : 'bg-white'
                        )}
                        animate={{ opacity: [1, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'linear',
                        }}
                      />
                    )}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Progress Bar - slightly thicker */}
        <div className="h-1 w-full bg-white/[0.03]">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </div>
  )
}
