// src/components/summary/model-card.tsx
/**
 * Animated card component for revealing AI model identities.
 * Uses neutral glassmorphic material with subtle temperature accents.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { FaLock } from 'react-icons/fa'

import SpotlightCard from '@/components/SpotlightCard'
import { cn } from '@/lib/utils'

import type { ModelIdentity } from '@/types/summary'
import type { TurnSpeaker } from '@/types/turn'

interface ModelCardProps {
  position: TurnSpeaker
  identity: ModelIdentity | null
  isRevealed: boolean
  isRevealing: boolean
  className?: string
}

/**
 * Neutral config with subtle temperature shifts.
 * FOR: cool graphite, AGAINST: warm graphite - both low saturation.
 */
const positionConfig = {
  for: {
    label: 'FOR',
    hiddenLabel: 'Debater A',
    iconColor: 'text-[hsl(200,8%,58%)]',
    textColor: 'text-[hsl(200,6%,62%)]',
    spotlightColor: 'rgba(160, 170, 180, 0.15)' as const,
    // Muted teal for badge
    badgeBg: 'bg-[hsl(192,25%,22%)]',
    badgeText: 'text-[hsl(192,35%,65%)]',
    badgeBorder: 'border-[hsl(192,20%,30%)]',
  },
  against: {
    label: 'AGAINST',
    hiddenLabel: 'Debater B',
    iconColor: 'text-[hsl(25,8%,58%)]',
    textColor: 'text-[hsl(25,6%,62%)]',
    spotlightColor: 'rgba(180, 170, 160, 0.15)' as const,
    // Muted amber for badge
    badgeBg: 'bg-[hsl(25,25%,22%)]',
    badgeText: 'text-[hsl(25,35%,65%)]',
    badgeBorder: 'border-[hsl(25,20%,30%)]',
  },
  moderator: {
    label: 'MODERATOR',
    hiddenLabel: 'Moderator',
    iconColor: 'text-[hsl(220,6%,58%)]',
    textColor: 'text-[hsl(220,4%,62%)]',
    spotlightColor: 'rgba(160, 160, 165, 0.15)' as const,
    badgeBg: 'bg-neutral-800/90',
    badgeText: 'text-neutral-400',
    badgeBorder: 'border-neutral-700/50',
  },
}

const providerLogos: Record<string, string> = {
  anthropic: '/models/claude-logo.svg',
  xai: '/models/grok.svg',
  openai: '/models/chatgpt.svg',
}

const flipTransition = {
  duration: 0.8,
  ease: [0.23, 1, 0.32, 1] as const,
}

const fadeInTransition = {
  duration: 0.5,
  ease: [0.22, 0.61, 0.36, 1] as const,
}

export function ModelCard({
  position,
  identity,
  isRevealed,
  isRevealing,
  className,
}: ModelCardProps) {
  const config = positionConfig[position]
  const showRevealed = isRevealing || isRevealed

  return (
    <div className={cn('relative w-full max-w-xs', className)} style={{ perspective: 1200 }}>
      <div className="relative w-full h-48" style={{ transformStyle: 'preserve-3d' }}>
        {/* Front face - Hidden state */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          initial={false}
          animate={{ rotateY: showRevealed ? 180 : 0 }}
          transition={flipTransition}
          style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}
        >
          <SpotlightCard
            className={cn(
              'w-full h-full !rounded-2xl !p-0',
              'flex flex-col items-center justify-center gap-3',
              '!bg-neutral-900/90 !border-neutral-800/60'
            )}
            spotlightColor={config.spotlightColor}
          >
            <FaLock className={cn('w-10 h-10', config.iconColor)} />
            <div className={cn('text-sm font-semibold uppercase tracking-wider', config.textColor)}>
              {config.label}
            </div>
            <div className="text-lg font-medium text-foreground/70">{config.hiddenLabel}</div>
          </SpotlightCard>
        </motion.div>

        {/* Back face - Revealed state (flat like SpotlightCard) */}
        <motion.div
          className={cn(
            'absolute inset-0 w-full h-full rounded-2xl overflow-hidden',
            'bg-neutral-800/90 border border-neutral-700/50'
          )}
          initial={false}
          animate={{ rotateY: showRevealed ? 0 : -180 }}
          transition={flipTransition}
          style={{
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Light sweep animation on reveal */}
          <AnimatePresence>
            {isRevealing && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: [0, 0.3, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                  width: '50%',
                }}
              />
            )}
          </AnimatePresence>

          {/* Content with staggered fade-in */}
          <div className="flex flex-col items-center justify-center gap-2 p-6 h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: showRevealed ? 1 : 0, scale: showRevealed ? 1 : 0.9 }}
              transition={{ ...fadeInTransition, delay: 0.3 }}
            >
              {/* Engraved logo container */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center bg-neutral-900/60"
                style={{
                  boxShadow:
                    'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.05)',
                }}
              >
                <Image
                  src={providerLogos[identity?.provider ?? 'openai'] || '/models/chatgpt.svg'}
                  alt={identity?.displayName ?? 'AI Model'}
                  width={40}
                  height={40}
                  className="w-10 h-10"
                  style={{ filter: 'invert(1) brightness(0.85)' }}
                />
              </div>
            </motion.div>

            <motion.div
              className="text-xl font-semibold text-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: showRevealed ? 1 : 0, y: showRevealed ? 0 : 8 }}
              transition={{ ...fadeInTransition, delay: 0.45 }}
            >
              {identity?.displayName ?? 'Unknown'}
            </motion.div>

            <motion.div
              className="text-sm text-muted-foreground/80"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: showRevealed ? 1 : 0, y: showRevealed ? 0 : 6 }}
              transition={{ ...fadeInTransition, delay: 0.55 }}
            >
              {identity?.model ?? ''}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Position badge with distinct color */}
      <div
        className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1',
          'rounded-full text-xs font-semibold border',
          config.badgeBg,
          config.badgeText,
          config.badgeBorder
        )}
      >
        {config.label}
      </div>
    </div>
  )
}
