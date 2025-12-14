// src/app/embed/[id]/embed-widget.tsx
/**
 * Client-side embeddable widget displaying debate summary and scores.
 * Apple-style design with smooth staggered entrance animations.
 */

'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

interface EmbedWidgetProps {
  debateId: string
  topic: string
  format: string
  forModel: string
  againstModel: string
  forProvider: string
  againstProvider: string
  theme: 'light' | 'dark' | 'auto'
  showScores: boolean
}

interface JudgeData {
  forAnalysis: {
    percentage: number
    categoryScores: Array<{ category: string; percentage: number }>
  }
  againstAnalysis: {
    percentage: number
    categoryScores: Array<{ category: string; percentage: number }>
  }
}

const providerLogos: Record<string, string> = {
  anthropic: '/models/claude-logo.svg',
  xai: '/models/grok.svg',
  openai: '/models/chatgpt.svg',
}

const positionConfig = {
  for: {
    badgeBg: 'bg-[hsl(192,25%,22%)]',
    badgeText: 'text-[hsl(192,35%,65%)]',
    badgeBorder: 'border-[hsl(192,20%,30%)]',
    barColor: 'from-teal-600/80 to-teal-500/60',
  },
  against: {
    badgeBg: 'bg-[hsl(25,25%,22%)]',
    badgeText: 'text-[hsl(25,35%,65%)]',
    badgeBorder: 'border-[hsl(25,20%,30%)]',
    barColor: 'from-amber-500/60 to-amber-600/80',
  },
}

const appleEase = [0.25, 0.1, 0.25, 1] as const

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
      duration: 0.6,
      ease: appleEase,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: appleEase,
    },
  },
}

function MetricBar({
  label,
  forValue,
  againstValue,
  delay = 0,
}: {
  label: string
  forValue: number
  againstValue: number
  delay?: number
}) {
  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: appleEase }}
    >
      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/60 w-6 text-right">{forValue}%</span>
          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full bg-gradient-to-r rounded-full', positionConfig.for.barColor)}
              initial={{ width: 0 }}
              animate={{ width: `${forValue}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: appleEase }}
            />
          </div>
        </div>
        <div className="w-px h-3 bg-neutral-700/50" />
        <div className="flex-1 flex items-center gap-1.5">
          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full bg-gradient-to-r rounded-full',
                positionConfig.against.barColor
              )}
              initial={{ width: 0 }}
              animate={{ width: `${againstValue}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: appleEase }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground/60 w-6">{againstValue}%</span>
        </div>
      </div>
    </motion.div>
  )
}

export function EmbedWidget({
  debateId,
  topic,
  format,
  forModel,
  againstModel,
  forProvider,
  againstProvider,
  theme,
  showScores,
}: EmbedWidgetProps) {
  const [judgeData, setJudgeData] = useState<JudgeData | null>(null)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    if (theme === 'dark') {
      setIsDark(true)
    } else if (theme === 'light') {
      setIsDark(false)
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setIsDark(mediaQuery.matches)

      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  useEffect(() => {
    if (showScores) {
      fetch(`/api/debate/${debateId}/judge`)
        .then((res) => res.json())
        .then((data: { analysis?: JudgeData }) => {
          if (data.analysis) {
            setJudgeData(data.analysis)
          }
        })
        .catch(() => {})
    }
  }, [debateId, showScores])

  const displayTopic = topic.length > 70 ? topic.slice(0, 70) + '...' : topic

  const getMetricPair = (category: string) => {
    if (!judgeData) return { forValue: 0, againstValue: 0 }
    const forScore = judgeData.forAnalysis.categoryScores.find((s) => s.category === category)
    const againstScore = judgeData.againstAnalysis.categoryScores.find(
      (s) => s.category === category
    )
    return {
      forValue: forScore?.percentage ?? 0,
      againstValue: againstScore?.percentage ?? 0,
    }
  }

  return (
    <motion.div
      className={cn(
        'w-full h-full min-h-[400px] px-10 py-6 flex flex-col',
        'font-sans',
        isDark ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-900'
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Logo */}
      <motion.div className="flex items-center justify-center mb-2" variants={itemVariants}>
        <Image
          src={isDark ? '/logo/logo-dark.png' : '/logo/logo.png'}
          alt="Debate Lab"
          width={300}
          height={130}
          className="h-[126px] w-auto opacity-90"
        />
      </motion.div>

      {/* Topic */}
      <motion.h1 className="text-base font-semibold mb-4 leading-snug" variants={itemVariants}>
        {displayTopic}
      </motion.h1>

      {/* Model Cards - matching summary page design */}
      <motion.div className="grid grid-cols-2 gap-3 mb-4" variants={itemVariants}>
        {/* FOR Card */}
        <motion.div
          className={cn(
            'relative rounded-2xl overflow-hidden h-40',
            'bg-neutral-800/90 border border-neutral-700/50'
          )}
          variants={cardVariants}
        >
          {/* Position badge */}
          <div
            className={cn(
              'absolute -top-0 left-1/2 -translate-x-1/2 px-2.5 py-0.5 z-10',
              'rounded-b-lg text-[10px] font-semibold border-x border-b',
              positionConfig.for.badgeBg,
              positionConfig.for.badgeText,
              positionConfig.for.badgeBorder
            )}
          >
            FOR
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5 p-4 h-full pt-8">
            {/* Engraved logo container */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-900/60"
              style={{
                boxShadow:
                  'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.05)',
              }}
            >
              <Image
                src={providerLogos[forProvider] || '/models/chatgpt.svg'}
                alt={forModel}
                width={28}
                height={28}
                className="w-7 h-7"
                style={{ filter: isDark ? 'invert(1) brightness(0.85)' : 'none' }}
              />
            </div>

            <div className="text-sm font-semibold text-center text-foreground">{forModel}</div>

            {judgeData && (
              <motion.div
                className={cn('text-lg font-bold', positionConfig.for.badgeText)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6, ease: appleEase }}
              >
                {judgeData.forAnalysis.percentage}%
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* AGAINST Card */}
        <motion.div
          className={cn(
            'relative rounded-2xl overflow-hidden h-40',
            'bg-neutral-800/90 border border-neutral-700/50'
          )}
          variants={cardVariants}
        >
          {/* Position badge */}
          <div
            className={cn(
              'absolute -top-0 left-1/2 -translate-x-1/2 px-2.5 py-0.5 z-10',
              'rounded-b-lg text-[10px] font-semibold border-x border-b',
              positionConfig.against.badgeBg,
              positionConfig.against.badgeText,
              positionConfig.against.badgeBorder
            )}
          >
            AGAINST
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5 p-4 h-full pt-8">
            {/* Engraved logo container */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-900/60"
              style={{
                boxShadow:
                  'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.05)',
              }}
            >
              <Image
                src={providerLogos[againstProvider] || '/models/chatgpt.svg'}
                alt={againstModel}
                width={28}
                height={28}
                className="w-7 h-7"
                style={{ filter: isDark ? 'invert(1) brightness(0.85)' : 'none' }}
              />
            </div>

            <div className="text-sm font-semibold text-center text-foreground">{againstModel}</div>

            {judgeData && (
              <motion.div
                className={cn('text-lg font-bold', positionConfig.against.badgeText)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7, ease: appleEase }}
              >
                {judgeData.againstAnalysis.percentage}%
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Performance Breakdown */}
      {judgeData && (
        <motion.div
          className="flex-1 rounded-xl bg-neutral-900/60 border border-neutral-800/50 p-3 mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: appleEase }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-foreground/80 uppercase tracking-wide">
              Performance
            </span>
            <div className="flex items-center gap-3 text-[9px]">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500/80" />
                <span className="text-muted-foreground">FOR</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                <span className="text-muted-foreground">AGAINST</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <MetricBar label="Structure" {...getMetricPair('argument_quality')} delay={0.6} />
            <MetricBar label="Clarity" {...getMetricPair('clarity_presentation')} delay={0.7} />
            <MetricBar label="Evidence" {...getMetricPair('evidence_support')} delay={0.8} />
            <MetricBar label="Rebuttal" {...getMetricPair('rebuttal_effectiveness')} delay={0.9} />
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div className="flex items-center justify-between mt-auto" variants={itemVariants}>
        <span className="text-[10px] text-neutral-500 capitalize">{format} Format</span>

        <a
          href={`/debate/${debateId}/summary`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-xs font-medium',
            'text-neutral-400 hover:text-white',
            'transition-colors duration-200'
          )}
        >
          View Full Debate
          <svg
            className="inline-block w-3.5 h-3.5 ml-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </motion.div>
    </motion.div>
  )
}
