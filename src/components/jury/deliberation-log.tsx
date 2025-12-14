/**
 * Apple-style deliberation log showing juror exchanges.
 * Fixed avatars on each side with messages flowing between them.
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

import { JUROR_CONFIGS } from '@/lib/jury-scoring-rubric'
import { cn } from '@/lib/utils'

import type { DeliberationExchange } from '@/types/jury'

interface DeliberationLogProps {
  exchanges: DeliberationExchange[]
}

interface ExchangeItemProps {
  exchange: DeliberationExchange
  index: number
}

const JUROR_LOGOS: Record<'gemini' | 'deepseek', string> = {
  gemini: '/models/gemini.svg',
  deepseek: '/models/deepseek.svg',
}

function JurorAvatar({ jurorId }: { jurorId: 'gemini' | 'deepseek' }) {
  const config = JUROR_CONFIGS[jurorId]
  const isGemini = jurorId === 'gemini'

  return (
    <div
      className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 p-1.5',
        isGemini ? 'bg-neutral-900' : 'bg-white'
      )}
    >
      <Image
        src={JUROR_LOGOS[jurorId]}
        alt={config.name}
        width={24}
        height={24}
        className="w-full h-full object-contain"
      />
    </div>
  )
}

function ExchangeItem({ exchange, index }: ExchangeItemProps) {
  const config = JUROR_CONFIGS[exchange.speaker]
  const isGemini = exchange.speaker === 'gemini'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 0.61, 0.36, 1],
        delay: index * 0.15,
      }}
      className={cn('flex items-start gap-3', isGemini ? 'flex-row' : 'flex-row-reverse')}
    >
      {/* Avatar inline with message */}
      <JurorAvatar jurorId={exchange.speaker} />

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          'bg-neutral-800/40 border border-neutral-700/30',
          isGemini ? 'rounded-tl-sm' : 'rounded-tr-sm'
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium" style={{ color: config.color }}>
            {config.name}
          </span>
          <span className="text-[10px] text-muted-foreground/40">Round {exchange.round}</span>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed">{exchange.content}</p>

        {exchange.adjustedScores && exchange.adjustedScores.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-neutral-700/30">
            <div className="text-[10px] text-muted-foreground/50 mb-1">Score Adjustments:</div>
            <div className="flex flex-wrap gap-1.5">
              {exchange.adjustedScores.map((adj, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]',
                    'bg-emerald-500/10 text-emerald-400/80'
                  )}
                >
                  {adj.claimId}: {adj.newScore}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function DeliberationLog({ exchanges }: DeliberationLogProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (exchanges.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 text-sm font-semibold text-foreground/90 uppercase tracking-wide',
          'hover:text-foreground transition-colors cursor-pointer'
        )}
      >
        <motion.svg
          className="w-4 h-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </motion.svg>
        Deliberation ({exchanges.length} exchanges)
      </button>

      {/* Chat-style exchanges */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2">
              {exchanges.map((exchange, index) => (
                <ExchangeItem key={index} exchange={exchange} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
