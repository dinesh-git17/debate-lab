// src/components/features/debate-details-accordion.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useRef, useState } from 'react'

import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

const details = [
  {
    value: 'turn-structure',
    title: 'Turn Structure',
    content: (
      <>
        <p>Each debate follows a structured format to ensure thorough argumentation:</p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Opening Statements</strong> — Each model
              presents their initial position and core arguments
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Constructive Round</strong> — Models build on
              their arguments with evidence and examples
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Rebuttal Round</strong> — Each side responds to
              the other&apos;s points and defends their position
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Closing Statements</strong> — Final summaries
              and concluding arguments
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    value: 'moderation-rules',
    title: 'Moderation Rules',
    content: (
      <>
        <p>Claude enforces fair and productive discourse by monitoring for:</p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Personal attacks</strong> — Arguments must
              target ideas, not the opposing model
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Topic drift</strong> — Responses must stay
              relevant to the debate topic
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Logical fallacies</strong> — Flagging common
              reasoning errors when they occur
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Equal time</strong> — Ensuring both sides get
              fair opportunity to present
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    value: 'scoring',
    title: 'Scoring Criteria',
    content: (
      <>
        <p>When scoring is enabled, Claude evaluates each side based on:</p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Argument strength</strong> — Quality of
              reasoning and evidence presented
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Rebuttal effectiveness</strong> — How well each
              side addresses opposing points
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Clarity</strong> — How clearly and persuasively
              arguments are communicated
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <strong className="text-foreground/90">Consistency</strong> — Internal logic and
              coherence throughout the debate
            </span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground/80">
          Scoring is optional — you can choose to have debates without a declared winner.
        </p>
      </>
    ),
  },
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

const contentVariants = {
  hidden: {
    opacity: 0,
    height: 0,
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: {
        duration: 0.4,
        ease: appleEase,
      },
      opacity: {
        duration: 0.35,
        ease: appleEase,
        delay: 0.05,
      },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        duration: 0.35,
        ease: appleEase,
      },
      opacity: {
        duration: 0.25,
        ease: appleEase,
      },
    },
  },
}

export function DebateDetailsAccordion() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const toggleItem = (value: string) => {
    setExpandedItem((prev) => (prev === value ? null : value))
  }

  return (
    <div ref={sectionRef}>
      <Section variant="muted" className="relative py-16 md:py-20 lg:py-24">
        {/* Top gradient separator */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background:
              'linear-gradient(to bottom, rgba(100, 130, 255, 0.02) 0%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        <Container>
          {/* Section header - centered */}
          <motion.div
            className="mx-auto max-w-2xl text-center"
            variants={headerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <p className="text-sm font-medium uppercase tracking-widest text-primary/80">
              Deep Dive
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Debate Format Details
            </h2>
          </motion.div>

          <motion.p
            className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-muted-foreground"
            variants={subtitleVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            Learn more about how debates are structured and evaluated
          </motion.p>

          {/* Premium accordion */}
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {details.map((item, index) => {
              const isExpanded = expandedItem === item.value

              return (
                <motion.div
                  key={item.value}
                  className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm"
                  initial={{ opacity: 0, y: 12 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{
                    duration: 0.5,
                    ease: appleEase,
                    delay: 0.2 + index * 0.08,
                  }}
                  whileHover={{
                    borderColor: 'rgba(255,255,255,0.12)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    transition: { duration: 0.2 },
                  }}
                >
                  {/* Accordion trigger */}
                  <motion.button
                    type="button"
                    onClick={() => toggleItem(item.value)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                    aria-expanded={isExpanded}
                  >
                    <span className="text-base font-medium text-foreground transition-colors duration-200 group-hover:text-white">
                      {item.title}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: appleEase }}
                    >
                      <ChevronDown
                        className="h-5 w-5 text-muted-foreground/60 transition-colors duration-200 group-hover:text-muted-foreground"
                        aria-hidden="true"
                      />
                    </motion.div>
                  </motion.button>

                  {/* Accordion content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/[0.06] px-6 pb-6 pt-4 text-sm leading-relaxed text-muted-foreground">
                          {item.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </Container>
      </Section>
    </div>
  )
}
