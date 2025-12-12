// safety-section.tsx
/**
 * Content moderation and safety policy display component.
 * Presents moderator rules and prohibited content with animated checklists.
 */
'use client'

import { motion } from 'framer-motion'
import { Check, ShieldCheck, X } from 'lucide-react'
import { useRef } from 'react'

import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

const moderatorRules = [
  'Arguments must target ideas, not the opposing model',
  'Responses must stay relevant to the debate topic',
  'Common logical fallacies are flagged when they occur',
  'Both sides receive equal opportunity to present their case',
]

const contentPolicy = [
  'No hate speech, harassment, or discriminatory content',
  'No illegal activities or harmful instructions',
  'No explicit or adult content',
  'No personal attacks or threats',
]

// Animation variants
const headerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: appleEase,
    },
  },
}

const introVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: appleEase,
      delay: 0.08,
    },
  },
}

const cardVariants = {
  hidden: (direction: 'left' | 'right') => ({
    opacity: 0,
    y: 16,
    x: direction === 'left' ? -12 : 12,
  }),
  visible: (direction: 'left' | 'right') => ({
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      duration: 0.55,
      ease: appleEase,
      delay: direction === 'left' ? 0.15 : 0.22,
    },
  }),
}

const checklistItemVariants = {
  hidden: (direction: 'left' | 'right') => ({
    opacity: 0,
    x: direction === 'left' ? -12 : 12,
  }),
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.45,
      ease: appleEase,
      delay: 0.25 + i * 0.06,
    },
  }),
}

const footerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: appleEase,
      delay: 0.45,
    },
  },
}

export function SafetySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })

  return (
    <section ref={sectionRef} id="safety" className="relative scroll-mt-20 py-6 md:py-8">
      {/* Soft radial highlight behind title */}
      <motion.div
        className="pointer-events-none absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 1, ease: appleEase }}
        style={{
          background: 'radial-gradient(circle, rgba(120, 150, 255, 0.03) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative">
        {/* Section header - centered */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <p className="text-sm font-medium uppercase tracking-widest text-primary/80">
            Moderation
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Safe &amp; Fair Debates
          </h2>
        </motion.div>

        {/* Intro paragraph - centered */}
        <motion.p
          className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-muted-foreground"
          variants={introVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Every debate is moderated by Claude, Anthropic&apos;s AI assistant known for its
          thoughtful and safety-conscious approach. The moderator ensures discussions remain
          productive and civil.
        </motion.p>

        {/* Two-column checklist layout */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-5">
          {/* Moderator rules - slides from left */}
          <motion.div
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
            variants={cardVariants}
            custom="left"
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            whileHover={{
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              transition: { duration: 0.2 },
            }}
          >
            <div className="mb-5 flex items-center gap-3">
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: appleEase, delay: 0.2 }}
              >
                <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              </motion.div>
              <h3 className="font-semibold text-foreground">What the moderator enforces</h3>
            </div>
            <ul className="space-y-3">
              {moderatorRules.map((rule, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                  variants={checklistItemVariants}
                  custom={index}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? 'visible' : 'hidden'}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                  </span>
                  <span className="leading-relaxed">{rule}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Content policy - slides from right */}
          <motion.div
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
            variants={cardVariants}
            custom="right"
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            whileHover={{
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              transition: { duration: 0.2 },
            }}
          >
            <div className="mb-5 flex items-center gap-3">
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: appleEase, delay: 0.27 }}
              >
                <X className="h-5 w-5 text-red-500" aria-hidden="true" />
              </motion.div>
              <h3 className="font-semibold text-foreground">Content policy</h3>
            </div>
            <ul className="space-y-3">
              {contentPolicy.map((policy, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                  variants={checklistItemVariants}
                  custom={index}
                  initial={{ opacity: 0, x: 12 }}
                  animate={isInView ? 'visible' : 'hidden'}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
                    <X className="h-3 w-3 text-red-500" aria-hidden="true" />
                  </span>
                  <span className="leading-relaxed">{policy}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Footer note - centered */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground/80"
          variants={footerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Topics that violate our content policy will be rejected before the debate begins. Users
          can end any debate at any time if they feel uncomfortable with the direction of the
          discussion.
        </motion.p>
      </div>
    </section>
  )
}
