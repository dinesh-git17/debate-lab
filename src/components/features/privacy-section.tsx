// privacy-section.tsx
/**
 * Condensed privacy commitment section for About page.
 * Highlights data protection principles with animated pills and content.
 */
'use client'

import { motion } from 'framer-motion'
import { Ban, Database, Eye, Shield } from 'lucide-react'
import { useRef } from 'react'

import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

const privacyPromises = [
  { icon: Ban, text: 'No data selling' },
  { icon: Database, text: 'No AI training' },
  { icon: Eye, text: 'No cross-site tracking' },
  { icon: Shield, text: 'No personal info required' },
]

const bulletPoints = [
  'We do not sell your data',
  'We do not use your debates to train AI models',
  'We do not track you across websites',
  'We do not require personal information',
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

const pillVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: appleEase,
      delay: 0.1 + i * 0.06,
    },
  }),
}

const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: appleEase,
      delay: 0.15 + i * 0.08,
    },
  }),
}

const bulletVariants = {
  hidden: { opacity: 0, x: 0 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.45,
      ease: appleEase,
      delay: 0.35 + i * 0.06,
    },
  }),
}

export function PrivacySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })

  return (
    <section
      ref={sectionRef}
      id="privacy"
      className="relative scroll-mt-20 -mx-4 px-4 py-8 md:-mx-8 md:px-8 md:py-10 lg:-mx-12 lg:px-12"
    >
      {/* Dark panel background with subtle gradient and noise */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, ease: appleEase }}
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)',
        }}
        aria-hidden="true"
      />
      {/* Noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
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
            Data Protection
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your Privacy
          </h2>
        </motion.div>

        {/* Privacy promises pills - centered */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {privacyPromises.map((promise, index) => (
            <motion.div
              key={promise.text}
              className="flex items-center gap-2 rounded-full bg-white/[0.05] px-4 py-2 ring-1 ring-white/[0.08]"
              variants={pillVariants}
              custom={index}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              whileHover={{
                scale: 1.02,
                backgroundColor: 'rgba(255,255,255,0.08)',
                transition: { duration: 0.2 },
              }}
            >
              <promise.icon className="h-4 w-4 text-primary/80" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground/90">{promise.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Content blocks */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-6">
            <motion.p
              className="text-base leading-relaxed text-muted-foreground"
              variants={contentVariants}
              custom={0}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              We believe in minimal data collection. You do not need an account to use Debate Lab —
              just pick a topic and start debating.
            </motion.p>
            <motion.p
              className="text-base leading-relaxed text-muted-foreground"
              variants={contentVariants}
              custom={1}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              When you create a debate, your topic and any custom rules are sent to AI providers
              (OpenAI, xAI, Anthropic) to generate responses. These providers have their own privacy
              policies governing how they handle API requests.
            </motion.p>
          </div>

          <div className="space-y-6">
            <motion.p
              className="text-base leading-relaxed text-muted-foreground"
              variants={contentVariants}
              custom={2}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              Debate transcripts are stored temporarily and automatically deleted after 72 hours.
              Shared links expire on the same schedule. We do not maintain long-term records of your
              debates.
            </motion.p>

            {/* What we don't do - emphasized */}
            <motion.div
              className="rounded-xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06]"
              variants={contentVariants}
              custom={3}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <p className="mb-3 text-sm font-semibold text-foreground">What we do not do:</p>
              <ul className="space-y-2">
                {bulletPoints.map((item, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    variants={bulletVariants}
                    custom={index}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                  >
                    <span className="h-1 w-1 rounded-full bg-primary/60" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
