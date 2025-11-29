// src/components/features/process-timeline.tsx
'use client'

import { motion } from 'framer-motion'
import { Lightbulb, MessageSquare, Shuffle, Trophy } from 'lucide-react'
import { useRef, useState } from 'react'

import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

const steps = [
  {
    step: 1,
    title: 'Pick a Topic',
    icon: Lightbulb,
    content:
      'Enter any debate topic you are curious about. Politics, technology, philosophy, pop culture — anything goes. You can optionally set custom rules to guide how the debate unfolds.',
  },
  {
    step: 2,
    title: 'Models Take Sides',
    icon: Shuffle,
    content:
      'ChatGPT and Grok are randomly assigned to argue FOR or AGAINST your topic. Neither you nor they know which side they will get until the debate begins — ensuring unbiased arguments.',
  },
  {
    step: 3,
    title: 'Watch the Debate',
    icon: MessageSquare,
    content:
      'Each model presents opening arguments, rebuttals, and closing statements. Claude monitors the conversation as a neutral moderator, ensuring fair play and professional discourse throughout.',
  },
  {
    step: 4,
    title: 'Review the Results',
    icon: Trophy,
    content:
      'Claude summarizes the key arguments from both sides and provides a final analysis. Download the full transcript or share a link so others can see the debate unfold.',
  },
] as const

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

const subtitleVariants = {
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
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: appleEase,
      delay: 0.15 + i * 0.1, // 100ms stagger
    },
  }),
}

const iconVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: appleEase,
      delay: 0.2 + i * 0.1,
    },
  }),
}

export function ProcessTimeline() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div ref={sectionRef}>
      <Section className="relative pt-2 pb-16 md:pt-3 md:pb-20 lg:pt-2 lg:pb-24">
        {/* Soft ambient glow behind the grid */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, ease: appleEase }}
          aria-hidden="true"
        >
          <div
            className="h-[600px] w-[900px] blur-[140px]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(100, 130, 255, 0.04) 0%, transparent 60%)',
            }}
          />
        </motion.div>

        <Container>
          {/* Section header - centered */}
          <motion.div
            className="mx-auto max-w-2xl text-center"
            variants={headerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <p className="text-sm font-medium uppercase tracking-widest text-primary/80">
              The Process
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              The Debate Journey
            </h2>
          </motion.div>

          <motion.p
            className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-muted-foreground"
            variants={subtitleVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            Four steps from curiosity to insight
          </motion.p>

          {/* Premium 4-card grid */}
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm"
                variants={cardVariants}
                custom={index}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                whileHover={{
                  scale: 1.02,
                  y: -6,
                  borderColor: 'rgba(255,255,255,0.15)',
                  transition: { duration: 0.25, ease: appleEase },
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Hover glow effect */}
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background:
                      'radial-gradient(400px circle at 50% 0%, rgba(120, 150, 255, 0.06), transparent 70%)',
                  }}
                  aria-hidden="true"
                />

                <div className="relative flex flex-col items-center text-center">
                  {/* Step number badge */}
                  <motion.span
                    className="mb-3 text-xs font-medium uppercase tracking-wide text-primary/70"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4, ease: appleEase, delay: 0.25 + index * 0.1 }}
                  >
                    Step {item.step}
                  </motion.span>

                  {/* Icon container */}
                  <motion.div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08]"
                    variants={iconVariants}
                    custom={index}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    whileHover={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      boxShadow: '0 4px 20px rgba(255,255,255,0.08)',
                      transition: { duration: 0.2 },
                    }}
                  >
                    <item.icon
                      className="h-6 w-6 text-foreground/80 transition-colors duration-300 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-white">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {item.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  )
}
