/**
 * Help modal explaining the judge scoring system.
 * Describes what each scoring category measures and how scores are calculated.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaLightbulb, FaComments, FaSearch, FaShieldAlt } from 'react-icons/fa'

import { cn } from '@/lib/utils'

interface JudgeHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const appleEase = [0.22, 0.61, 0.36, 1] as const

const scoringCategories = [
  {
    icon: FaLightbulb,
    label: 'Structure',
    key: 'argument_quality',
    description:
      'Logical organization, clear thesis, well-developed points with supporting reasoning.',
  },
  {
    icon: FaComments,
    label: 'Clarity',
    key: 'clarity_presentation',
    description:
      'Clear communication, accessible language, effective articulation of complex ideas.',
  },
  {
    icon: FaSearch,
    label: 'Evidence',
    key: 'evidence_support',
    description: 'Use of examples, data, and supporting material to strengthen arguments.',
  },
  {
    icon: FaShieldAlt,
    label: 'Rebuttal',
    key: 'rebuttal_effectiveness',
    description: 'Ability to address opposing points and defend position under challenge.',
  },
]

const importantNotes = [
  'Scores reflect rhetorical structure and reasoning quality, not factual accuracy.',
  'Models are assigned positions randomly and argue from that stance regardless of personal "beliefs".',
  'High scores indicate strong debate technique, not endorsement of the position argued.',
]

export function JudgeHelpModal({ isOpen, onClose }: JudgeHelpModalProps) {
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
          aria-labelledby="judge-help-title"
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
                <h2 id="judge-help-title" className="text-xl font-semibold text-white">
                  How Scoring Works
                </h2>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Understanding the performance breakdown
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
              {/* Scoring Categories */}
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4">
                  Scoring Categories
                </h3>
                <div className="grid gap-3">
                  {scoringCategories.map((category, index) => (
                    <motion.div
                      key={category.key}
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
                        <category.icon className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">{category.label}</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* How Bars Work */}
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4">
                  Reading the Bars
                </h3>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-teal-500/80" />
                    <span className="text-sm text-zinc-300">FOR position score</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="text-sm text-zinc-300">AGAINST position score</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Each bar shows the percentage score (0-100%) for that category. Longer bars
                    indicate stronger performance in that area.
                  </p>
                </div>
              </div>

              {/* Important Notes */}
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <h3 className="text-sm font-medium text-blue-300 mb-3">Important Notes</h3>
                <ul className="space-y-2">
                  {importantNotes.map((note, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-xs text-blue-300/80 leading-relaxed"
                    >
                      <span className="mt-1 w-1 h-1 rounded-full bg-blue-400/60 flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
