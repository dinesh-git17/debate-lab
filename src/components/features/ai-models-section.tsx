// src/components/features/ai-models-section.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRef } from 'react'

import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

const models = [
  {
    name: 'ChatGPT',
    provider: 'OpenAI',
    role: 'Debater',
    description:
      'One of the most widely-used large language models, known for its broad knowledge and conversational abilities. Randomly assigned to argue FOR or AGAINST.',
    version: 'GPT-5.1',
    logo: '/models/chatgpt.svg',
    isModerator: false,
  },
  {
    name: 'Grok',
    provider: 'xAI',
    role: 'Debater',
    description:
      'Built to be maximally helpful and truthful, with real-time knowledge access. Randomly assigned to argue the opposite side of ChatGPT.',
    version: 'Grok-4-1 Fast Reasoning',
    logo: '/models/grok.svg',
    isModerator: false,
  },
  {
    name: 'Claude',
    provider: 'Anthropic',
    role: 'Moderator',
    description:
      'Known for nuanced reasoning and safety focus. Serves as the neutral moderator, ensuring fair play and providing final analysis.',
    version: 'Claude Sonnet 4',
    logo: '/models/claude-logo.svg',
    isModerator: true,
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

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: appleEase,
      delay: 0.1 + i * 0.12, // 120ms stagger left → right
    },
  }),
}

const logoVariants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: appleEase,
      delay: 0.15 + i * 0.12,
    },
  }),
}

export function AiModelsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })

  return (
    <section ref={sectionRef} id="ai-models" className="scroll-mt-20 py-6 md:py-8">
      {/* Section header - centered */}
      <motion.div
        className="mx-auto max-w-2xl text-center"
        variants={headerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <p className="text-sm font-medium uppercase tracking-widest text-primary/80">The Players</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The AI Models
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Three leading AI models, each with a distinct role in every debate
        </p>
      </motion.div>

      {/* Premium model cards - centered content */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {models.map((model, index) => (
          <motion.div
            key={model.name}
            className={cn(
              'group relative flex flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center backdrop-blur-sm',
              model.isModerator && 'border-primary/20 bg-primary/[0.02]'
            )}
            variants={cardVariants}
            custom={index}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            whileHover={{
              scale: 1.015,
              y: -4,
              borderColor: 'rgba(255,255,255,0.15)',
              transition: { duration: 0.18, ease: appleEase },
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Subtle glow effect on hover */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                background:
                  'radial-gradient(400px circle at 50% 0%, rgba(255,255,255,0.04), transparent 70%)',
              }}
              aria-hidden="true"
            />

            <div className="relative flex flex-1 flex-col items-center">
              {/* Role badge - centered above logo */}
              <motion.span
                className={cn(
                  'mb-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide',
                  model.isModerator
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/10 text-foreground/80 ring-1 ring-white/[0.08]'
                )}
                initial={{ opacity: 0, y: -8 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                transition={{
                  duration: 0.4,
                  ease: appleEase,
                  delay: 0.2 + index * 0.12,
                }}
              >
                {model.role}
              </motion.span>

              {/* White circular logo container with bloom effect */}
              <motion.div
                className={cn(
                  'mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white',
                  model.isModerator && 'ring-2 ring-primary/20'
                )}
                variants={logoVariants}
                custom={index}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                whileHover={{
                  boxShadow: '0 4px 20px rgba(255,255,255,0.15), 0 0 30px rgba(255,255,255,0.08)',
                  transition: { duration: 0.18 },
                }}
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
              >
                <Image
                  src={model.logo}
                  alt={`${model.name} logo`}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              </motion.div>

              {/* Model name and provider */}
              <h3 className="text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-white">
                {model.name}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{model.provider}</p>

              {/* Description */}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {model.description}
              </p>

              {/* Model version */}
              <div className="mt-4 w-full border-t border-white/[0.06] pt-3">
                <p className="text-xs text-muted-foreground/70">
                  <span className="font-medium text-muted-foreground">Model:</span> {model.version}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
