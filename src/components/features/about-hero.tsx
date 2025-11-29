// src/components/features/about-hero.tsx
'use client'

import { motion } from 'framer-motion'

import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

// Animation variants for staggered reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: appleEase,
    },
  },
}

const dividerVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: appleEase,
      delay: 0.5,
    },
  },
}

export function AboutHero() {
  return (
    <Section className="relative overflow-hidden pt-28 pb-10 md:pt-36 md:pb-12 lg:pt-40 lg:pb-14">
      {/* Ambient radial glow - subtle, cool-tinted, massive */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: appleEase }}
          style={{
            width: '1800px',
            height: '1200px',
            background:
              'radial-gradient(ellipse at center, rgba(120, 150, 255, 0.03) 0%, transparent 70%)',
          }}
        />
      </div>

      <Container>
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow label */}
          <motion.p
            className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground/70"
            variants={itemVariants}
          >
            About
          </motion.p>

          {/* Main title - Apple-style light, tight typography */}
          <motion.h1
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            variants={itemVariants}
          >
            Debate Lab
          </motion.h1>

          {/* Subtitle with generous spacing */}
          <motion.p
            className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-2xl lg:leading-relaxed"
            variants={itemVariants}
          >
            An experimental platform exploring AI discourse and reasoning
          </motion.p>
        </motion.div>

        {/* Thin line divider */}
        <motion.div
          className="mx-auto mt-10 h-px w-24 md:mt-12"
          variants={dividerVariants}
          initial="hidden"
          animate="visible"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          }}
        />
      </Container>
    </Section>
  )
}
