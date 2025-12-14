/**
 * Help modal explaining the jury deliberation system.
 * Uses step-by-step cards following the how-it-works UI pattern.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaCheckCircle, FaBalanceScale, FaSearch, FaGavel } from 'react-icons/fa'

import { cn } from '@/lib/utils'

interface JuryHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const appleEase = [0.22, 0.61, 0.36, 1] as const

const phases = [
  {
    icon: FaSearch,
    title: 'Evidence Extraction',
    description:
      'Claims are extracted from the debate transcript and normalized into verifiable statements.',
  },
  {
    icon: FaCheckCircle,
    title: 'Independent Scoring',
    description:
      'Gemini and DeepSeek independently score each side based on evidence quality, not persuasiveness.',
  },
  {
    icon: FaBalanceScale,
    title: 'Structured Deliberation',
    description: "Jurors review each other's scores and discuss claim-level disagreements.",
  },
  {
    icon: FaGavel,
    title: 'Arbiter Resolution',
    description:
      'Final scores are resolved using neutral arbitration rules, penalizing unsupported certainty.',
  },
]

const scoringCategories = [
  {
    label: 'Factual Accuracy',
    points: 25,
    description: 'Do claims align with verifiable facts?',
  },
  {
    label: 'Evidence Strength',
    points: 25,
    description: 'Are claims supported by concrete evidence?',
  },
  {
    label: 'Source Quality',
    points: 20,
    description: 'Are sources credible and recent?',
  },
  {
    label: 'Logical Consistency',
    points: 20,
    description: 'Is the argument internally consistent?',
  },
  {
    label: 'Unsupported Claims',
    points: 10,
    description: 'Penalty for assertions without backing.',
    isPenalty: true,
  },
]

export function JuryHelpModal({ isOpen, onClose }: JuryHelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!mounted) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="jury-help-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className={cn(
              'relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto',
              'rounded-2xl',
              'bg-[#0a0a0b]/95 backdrop-blur-2xl',
              'border border-white/[0.08]',
              'shadow-[0_24px_80px_rgba(0,0,0,0.6)]'
            )}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: appleEase }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-white/[0.06]">
              <div>
                <h2 id="jury-help-title" className="text-xl font-semibold text-white">
                  How Evidence Review Works
                </h2>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Independent fact-checking by AI jurors
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  'text-zinc-400 hover:text-zinc-200',
                  'hover:bg-white/[0.06]',
                  'transition-all duration-150'
                )}
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Process Steps */}
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4">
                  The Process
                </h3>
                <div className="grid gap-3">
                  {phases.map((phase, index) => (
                    <motion.div
                      key={phase.title}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-xl',
                        'bg-white/[0.02] border border-white/[0.04]',
                        'hover:bg-white/[0.04] transition-colors'
                      )}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, ease: appleEase }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <phase.icon className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                            Step {index + 1}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-white mt-0.5">{phase.title}</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {phase.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Scoring Rubric */}
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4">
                  Scoring Categories (100 points max)
                </h3>
                <div className="space-y-2">
                  {scoringCategories.map((category) => (
                    <div
                      key={category.label}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg',
                        'bg-white/[0.02] border border-white/[0.04]'
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{category.label}</span>
                          {category.isPenalty && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase">
                              Penalty
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{category.description}</p>
                      </div>
                      <div
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          category.isPenalty ? 'text-amber-400' : 'text-zinc-300'
                        )}
                      >
                        {category.isPenalty ? `-${category.points}` : category.points}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Note */}
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <p className="text-xs text-blue-300/80 leading-relaxed">
                  <strong className="text-blue-300">Note:</strong> This system evaluates evidence
                  quality and factual accuracy, not debate performance or persuasiveness. Scores
                  reflect how well claims are supported by verifiable facts.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
