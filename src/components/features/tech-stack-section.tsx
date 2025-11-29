// src/components/features/tech-stack-section.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRef } from 'react'
import { FaReact } from 'react-icons/fa'
import { SiNextdotjs, SiSupabase, SiTailwindcss, SiTypescript, SiVercel } from 'react-icons/si'

import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

type Technology = {
  name: string
  description: string
  href: string
} & (
  | { icon: React.ComponentType<{ className?: string }>; logo?: never }
  | { logo: string; icon?: never }
)

const technologies: Technology[] = [
  {
    name: 'Next.js 15',
    description: 'React framework for production-grade web applications',
    icon: SiNextdotjs,
    href: 'https://nextjs.org',
  },
  {
    name: 'React',
    description: 'Library for building interactive user interfaces',
    icon: FaReact,
    href: 'https://react.dev',
  },
  {
    name: 'TypeScript',
    description: 'Type-safe JavaScript for reliable code',
    icon: SiTypescript,
    href: 'https://www.typescriptlang.org',
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first styling for rapid UI development',
    icon: SiTailwindcss,
    href: 'https://tailwindcss.com',
  },
  {
    name: 'Vercel',
    description: 'Deployment and hosting platform',
    icon: SiVercel,
    href: 'https://vercel.com',
  },
  {
    name: 'Supabase',
    description: 'Open source backend with Postgres database',
    icon: SiSupabase,
    href: 'https://supabase.com',
  },
  {
    name: 'OpenAI API',
    description: 'Powers the ChatGPT debater',
    logo: '/models/chatgpt.svg',
    href: 'https://platform.openai.com',
  },
  {
    name: 'xAI API',
    description: 'Powers the Grok debater',
    logo: '/models/grok.svg',
    href: 'https://x.ai',
  },
  {
    name: 'Anthropic API',
    description: 'Powers Claude, our neutral moderator',
    logo: '/models/claude-logo.svg',
    href: 'https://www.anthropic.com',
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

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: appleEase,
      delay: 0.1 + i * 0.06, // 60ms stagger
    },
  }),
}

export function TechStackSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })

  return (
    <section ref={sectionRef} id="tech-stack" className="scroll-mt-20 py-6 md:py-8">
      {/* Section header - centered */}
      <motion.div
        className="mx-auto max-w-2xl text-center"
        variants={headerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <p className="text-sm font-medium uppercase tracking-widest text-primary/80">Technology</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Built With
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Modern technologies powering a seamless experience
        </p>
      </motion.div>

      {/* Premium feature grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {technologies.map((tech, index) => (
          <motion.a
            key={tech.name}
            href={tech.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-sm"
            variants={cardVariants}
            custom={index}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            whileHover={{
              scale: 1.015,
              y: -4,
              transition: { duration: 0.25, ease: appleEase },
            }}
            style={{
              boxShadow: '0 0 0 0 rgba(255,255,255,0)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Subtle glow on hover */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                background:
                  'radial-gradient(400px circle at 50% 0%, rgba(255,255,255,0.04), transparent 70%)',
                boxShadow: '0 0 20px rgba(255,255,255,0.06)',
              }}
              aria-hidden="true"
            />

            <div className="relative">
              {/* Icon or Logo */}
              <motion.div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08]"
                whileHover={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transition: { duration: 0.2 },
                }}
              >
                {tech.icon ? (
                  <tech.icon
                    className="h-5 w-5 text-foreground/80 transition-colors duration-300 group-hover:text-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <Image
                    src={tech.logo}
                    alt={`${tech.name} logo`}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain brightness-0 invert opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                  />
                )}
              </motion.div>

              {/* Title */}
              <h3 className="font-medium text-foreground transition-colors duration-300 group-hover:text-white">
                {tech.name}
              </h3>

              {/* Description */}
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {tech.description}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  )
}
