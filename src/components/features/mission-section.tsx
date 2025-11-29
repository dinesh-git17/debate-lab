// src/components/features/mission-section.tsx
'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'

import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

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

const leadParagraphVariants = {
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

const paragraphVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: appleEase,
      delay: 0.16 + i * 0.07, // Staggered 70ms apart
    },
  }),
}

export function MissionSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })

  return (
    <section ref={sectionRef} id="mission" className="relative scroll-mt-20 py-6 md:py-8">
      {/* Faint lit background panel */}
      <motion.div
        className="pointer-events-none absolute inset-0 -mx-4 rounded-3xl md:-mx-8"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, ease: appleEase }}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
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
            Our Purpose
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Why We Built This
          </h2>
        </motion.div>

        {/* Lead paragraph - centered */}
        <motion.div
          className="mx-auto mt-6 max-w-3xl text-center"
          variants={leadParagraphVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <p className="text-xl leading-relaxed text-foreground/90 lg:text-2xl lg:leading-relaxed">
            Debate Lab was born from a simple curiosity: what happens when you pit two of the
            world&apos;s most capable AI models against each other in structured debate?
          </p>
        </motion.div>

        {/* Two-column supporting content */}
        <div className="mx-auto mt-6 grid max-w-4xl gap-5 lg:grid-cols-2 lg:gap-8">
          <motion.p
            className="text-base leading-relaxed text-muted-foreground"
            variants={paragraphVariants}
            custom={0}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            This platform is an experiment in AI discourse. By watching models argue opposing
            positions on topics you care about, you gain insight into how large language models
            reason, persuade, and sometimes stumble. It&apos;s a window into the capabilities and
            limitations of modern AI.
          </motion.p>
          <motion.p
            className="text-base leading-relaxed text-muted-foreground"
            variants={paragraphVariants}
            custom={1}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            Our goal is not to crown a &quot;winner&quot; — it&apos;s to make AI more transparent,
            accessible, and perhaps a little entertaining. Whether you&apos;re a researcher studying
            AI behavior, a student learning about argumentation, or just someone curious about how
            these models think, we hope you find value here.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
