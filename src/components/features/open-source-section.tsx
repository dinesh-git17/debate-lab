// open-source-section.tsx
/**
 * Open source community section with GitHub links.
 * Showcases repository and issue tracker with animated link cards.
 */
'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Bug, Github } from 'lucide-react'
import { useRef, useState } from 'react'

import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

const links = [
  {
    title: 'View on GitHub',
    description: 'Explore the source code, star the repo, or fork it for your own projects.',
    icon: Github,
    href: 'https://github.com/dinesh-git17/debate-lab',
  },
  {
    title: 'Report an Issue',
    description: 'Found a bug or have a feature request? Let us know on GitHub Issues.',
    icon: Bug,
    href: 'https://github.com/dinesh-git17/debate-lab/issues',
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
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: appleEase,
      delay: 0.15 + i * 0.12, // 120ms stagger
    },
  }),
}

export function OpenSourceSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section ref={sectionRef} id="open-source" className="scroll-mt-20 py-6 md:py-8">
      {/* Section header - centered */}
      <motion.div
        className="mx-auto max-w-2xl text-center"
        variants={headerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <p className="text-sm font-medium uppercase tracking-widest text-primary/80">Community</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Open Source
        </h2>
      </motion.div>

      {/* Intro text - centered */}
      <motion.div
        className="mx-auto mt-4 max-w-2xl space-y-3 text-center"
        variants={introVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <p className="text-base leading-relaxed text-muted-foreground">
          Debate Lab is open source. We believe in transparency not just in our AI debates, but in
          our code as well. You can view the source code, report issues, or contribute improvements
          on GitHub.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          The project is built with modern web technologies and follows best practices for
          accessibility, performance, and security. We welcome contributions from the community.
        </p>
      </motion.div>

      {/* Frosted link cards - centered */}
      <div className="mx-auto mt-6 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        {links.map((link, index) => (
          <motion.a
            key={link.title}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm"
            variants={cardVariants}
            custom={index}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
            whileHover={{
              scale: 1.02,
              y: -4,
              borderColor: 'rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              transition: { duration: 0.25, ease: appleEase },
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Hover glow */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background:
                  'radial-gradient(400px circle at 50% 0%, rgba(120, 150, 255, 0.04), transparent 70%)',
              }}
              aria-hidden="true"
            />

            <div className="relative flex items-start justify-between">
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08]"
                animate={{
                  backgroundColor:
                    hoveredIndex === index ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                }}
                transition={{ duration: 0.2 }}
              >
                <link.icon
                  className="h-5 w-5 text-foreground/80 transition-colors duration-200 group-hover:text-foreground"
                  aria-hidden="true"
                />
              </motion.div>
              <motion.div
                animate={{
                  x: hoveredIndex === index ? 2 : 0,
                  y: hoveredIndex === index ? -2 : 0,
                }}
                transition={{ duration: 0.2, ease: appleEase }}
              >
                <ArrowUpRight
                  className="h-5 w-5 text-muted-foreground/50 transition-colors duration-200 group-hover:text-foreground/70"
                  aria-hidden="true"
                />
              </motion.div>
            </div>

            <h3 className="mt-4 font-medium text-foreground transition-colors duration-200 group-hover:text-white">
              {link.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{link.description}</p>
          </motion.a>
        ))}
      </div>
    </section>
  )
}
