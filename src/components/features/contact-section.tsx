// contact-section.tsx
/**
 * Contact and feedback section with GitHub integration links.
 * Provides animated CTAs for issue submission and community discussions.
 */
'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle, MessagesSquare } from 'lucide-react'
import { useRef } from 'react'

import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: appleEase,
    },
  },
}

const buttonContainerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: appleEase,
      delay: 0.15,
    },
  },
}

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })

  return (
    <section ref={sectionRef} id="contact" className="scroll-mt-20 py-6 md:py-8">
      {/* Centered layout */}
      <div className="mx-auto max-w-2xl">
        {/* Header - centered */}
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <p className="text-sm font-medium uppercase tracking-widest text-primary/80">Connect</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Get in Touch
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            We would love to hear from you. Whether you have found a bug, have a feature suggestion,
            or just want to share your experience, there are several ways to reach us.
          </p>
        </motion.div>

        {/* Buttons - centered */}
        <motion.div
          className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row"
          variants={buttonContainerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Primary ghost button */}
          <motion.a
            href="https://github.com/dinesh-git17/debate-lab/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.15] bg-white/[0.03] px-6 py-3 text-sm font-medium text-foreground"
            whileHover={{
              scale: 1.015,
              borderColor: 'rgba(255,255,255,0.25)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 0 20px rgba(255,255,255,0.06)',
              transition: { duration: 0.2, ease: appleEase },
            }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="transition-colors duration-200 group-hover:text-white">
              Submit Feedback
            </span>
            <motion.span
              className="inline-block"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight
                className="h-4 w-4 opacity-50 transition-opacity duration-200 group-hover:opacity-80"
                aria-hidden="true"
              />
            </motion.span>
          </motion.a>

          {/* Secondary ghost button */}
          <motion.a
            href="https://github.com/dinesh-git17/debate-lab/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-transparent px-6 py-3 text-sm font-medium text-muted-foreground"
            whileHover={{
              scale: 1.015,
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              transition: { duration: 0.2, ease: appleEase },
            }}
            whileTap={{ scale: 0.98 }}
          >
            <MessagesSquare className="h-4 w-4" aria-hidden="true" />
            <span className="transition-colors duration-200 group-hover:text-foreground">
              Join Discussions
            </span>
            <motion.span
              className="inline-block"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight
                className="h-4 w-4 opacity-50 transition-opacity duration-200 group-hover:opacity-70"
                aria-hidden="true"
              />
            </motion.span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
