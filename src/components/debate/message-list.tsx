// src/components/debate/message-list.tsx

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { clientLogger } from '@/lib/client-logger'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import { MessageBubble } from './message-bubble'

import type { DebateMessage } from '@/types/debate-ui'

// Animated AI Avatar component for VS layout
function AIAvatar({ side, delay = 0 }: { side: 'left' | 'right'; delay?: number }) {
  const isLeft = side === 'left'

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.8, x: isLeft ? -20 : 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Outer glow ring with pulse */}
      <motion.div
        className={cn(
          'absolute -inset-3 rounded-full',
          isLeft
            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10'
            : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10'
        )}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay + 0.2,
        }}
      />

      {/* Avatar container */}
      <motion.div
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-full',
          'bg-gradient-to-br shadow-lg',
          isLeft
            ? 'from-emerald-500/30 to-teal-600/20 shadow-emerald-500/10'
            : 'from-blue-500/30 to-indigo-600/20 shadow-blue-500/10',
          'border border-white/10 backdrop-blur-sm'
        )}
        animate={{
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        }}
      >
        {/* Inner icon - speech bubble silhouette */}
        <motion.svg
          className={cn('h-7 w-7', isLeft ? 'text-emerald-400/80' : 'text-blue-400/80')}
          fill="currentColor"
          viewBox="0 0 24 24"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: delay + 0.5,
          }}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l4.93-1.38C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.64 0-3.17-.47-4.47-1.27l-.32-.19-3.28.92.92-3.28-.19-.32C3.47 14.83 3 13.3 3 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}

// VS Badge component with subtle glow
function VSBadge() {
  return (
    <motion.div
      className="relative mx-6"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Outer glow ring - very subtle 2px blur */}
      <motion.div
        className="absolute -inset-1 rounded-full bg-white/5 blur-[2px]"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main badge */}
      <div
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-full',
          'bg-white/[0.04] backdrop-blur-sm',
          'border border-white/[0.08]',
          'text-[10px] font-bold tracking-widest text-white/50'
        )}
      >
        VS
      </div>
    </motion.div>
  )
}

// Skeleton message bubble component
function SkeletonMessage({
  side,
  width,
  delay,
}: {
  side: 'left' | 'right'
  width: string
  delay: number
}) {
  const isLeft = side === 'left'

  return (
    <motion.div
      className={cn('flex', isLeft ? 'justify-start' : 'justify-end')}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl px-4 py-3',
          isLeft ? 'rounded-bl-md' : 'rounded-br-md',
          'bg-white/[0.03] border border-white/[0.04]'
        )}
        style={{ width }}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 -translate-x-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
          }}
          animate={{
            translateX: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: delay + 0.2,
          }}
        />

        {/* Skeleton lines */}
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-white/[0.06]" />
          <div className="h-2 w-3/4 rounded bg-white/[0.04]" />
        </div>
      </div>
    </motion.div>
  )
}

// Main Empty State Component
function EmptyState() {
  const [isLoading, setIsLoading] = useState(false)
  const debateId = useDebateViewStore((s) => s.debateId)
  const setStatus = useDebateViewStore((s) => s.setStatus)
  const setError = useDebateViewStore((s) => s.setError)

  const handleStart = async () => {
    if (!debateId || isLoading) return
    setIsLoading(true)

    try {
      const response = await fetch(`/api/debate/${debateId}/engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          throw new Error(data.error ?? 'Failed to start debate')
        } catch {
          throw new Error(text || 'Failed to start debate')
        }
      }

      // Consume stream in background
      const reader = response.body?.getReader()
      if (reader) {
        void (async () => {
          try {
            while (true) {
              const { done } = await reader.read()
              if (done) break
            }
          } catch {
            // Stream closed
          }
        })()
      }

      setStatus('active')
    } catch (error) {
      clientLogger.error('Debate start failed', error)
      setError(error instanceof Error ? error.message : 'Failed to start debate')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="relative flex h-full flex-col items-center justify-center px-4 sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Centered card container with glass morphism */}
      <motion.div
        className={cn(
          'relative w-full max-w-lg',
          // Glass card styling
          'rounded-3xl',
          'bg-white/[0.02]',
          'border border-white/[0.06]',
          'backdrop-blur-xl',
          // Subtle shadow for depth
          'shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.04)]',
          // Padding with tighter vertical spacing
          'px-6 py-8 sm:px-10 sm:py-10'
        )}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Gradient backdrop glow behind card */}
        <div className="pointer-events-none absolute -inset-px overflow-hidden rounded-3xl">
          {/* Top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          {/* Vignette effect inside card */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(52,211,153,0.08) 0%, transparent 50%), radial-gradient(ellipse 80% 50% at 50% 100%, rgba(59,130,246,0.06) 0%, transparent 50%)',
            }}
          />
        </div>

        {/* Hero Section: Title → Description (clear hierarchy) */}
        <motion.div
          className="relative text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
            Ready to Debate
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground/70 sm:text-sm">
            Two AI perspectives will engage in structured discourse
          </p>
        </motion.div>

        {/* VS Layout with AI Avatars - tighter spacing */}
        <motion.div
          className="relative mt-8 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AIAvatar side="left" delay={0.25} />
          <VSBadge />
          <AIAvatar side="right" delay={0.35} />
        </motion.div>

        {/* Skeleton message previews */}
        <motion.div
          className="relative mt-8 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SkeletonMessage side="left" width="80%" delay={0.5} />
          <SkeletonMessage side="right" width="70%" delay={0.6} />
          <SkeletonMessage side="left" width="60%" delay={0.7} />
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="relative mt-8 flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {/* Primary CTA - Start Button */}
          <motion.button
            onClick={handleStart}
            disabled={isLoading}
            className={cn(
              'group relative inline-flex items-center justify-center gap-2',
              // Pill shape with generous padding
              'h-12 rounded-full px-8',
              // Typography
              'text-[15px] font-semibold tracking-[-0.01em] text-white',
              // Gradient background
              'bg-gradient-to-b from-emerald-400 to-emerald-500',
              // Elevated shadow with color glow
              'shadow-[0_4px_20px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]',
              // GPU acceleration
              'will-change-transform',
              // Transitions
              'transition-shadow duration-300 ease-out',
              // Disabled state
              'disabled:opacity-70 disabled:cursor-not-allowed'
            )}
            whileHover={
              isLoading
                ? {}
                : {
                    y: -2,
                    scale: 1.02,
                    boxShadow:
                      '0 8px 30px rgba(52,211,153,0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }
            }
            whileTap={isLoading ? {} : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Pulsing glow behind button */}
            <motion.span
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 blur-lg"
              animate={{
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Play icon or loading spinner */}
            {isLoading ? (
              <motion.span
                className="relative h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <svg
                className="relative h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
            <span className="relative">{isLoading ? 'Starting...' : 'Start Debate'}</span>
          </motion.button>

          {/* Secondary CTA - Learn more link */}
          <Link
            href="/how-it-works"
            className={cn(
              'inline-flex items-center gap-1.5',
              'text-[13px] text-muted-foreground/60',
              'transition-all duration-200',
              'hover:text-muted-foreground/90 hover:gap-2'
            )}
          >
            <span>Learn how debates work</span>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>

      {/* Ambient background glow - behind card */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Left emerald glow */}
        <motion.div
          className="absolute left-1/4 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.06] blur-[100px]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Right blue glow */}
        <motion.div
          className="absolute right-1/4 top-1/2 h-[300px] w-[300px] -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-[100px]"
          animate={{
            scale: [1.15, 1, 1.15],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </div>
    </motion.div>
  )
}

interface MessageListProps {
  className?: string
  autoScroll?: boolean
}

export function MessageList({ className, autoScroll = true }: MessageListProps) {
  // Subscribe to both messages and displayedMessageIds to trigger re-renders
  const allMessages = useDebateViewStore((s) => s.messages)
  const displayedIds = useDebateViewStore((s) => s.displayedMessageIds)
  const currentTurnId = useDebateViewStore((s) => s.currentTurnId)
  const markMessageDisplayed = useDebateViewStore((s) => s.markMessageDisplayed)

  // Get visible messages: all displayed + the first non-displayed (currently animating)
  // Memoize to prevent unnecessary re-renders and useEffect triggers
  const messages = useMemo(() => {
    const result: DebateMessage[] = []
    for (const msg of allMessages) {
      result.push(msg)
      if (!displayedIds.has(msg.id)) break
    }
    return result
  }, [allMessages, displayedIds])

  // Create stable callback for marking messages as displayed
  const handleAnimationComplete = useCallback(
    (messageId: string) => {
      markMessageDisplayed(messageId)
    },
    [markMessageDisplayed]
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const isUserScrolling = useRef(false)
  const lastMessageCount = useRef(0)

  useEffect(() => {
    if (!autoScroll || isUserScrolling.current) return

    const container = containerRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: messages.length > lastMessageCount.current ? 'smooth' : 'auto',
      })
    }

    lastMessageCount.current = messages.length
  }, [messages, currentTurnId, autoScroll])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100

      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      scrollTimeout = setTimeout(() => {
        isUserScrolling.current = !isAtBottom
      }, 150)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [])

  if (messages.length === 0) {
    return (
      <div
        className={cn('h-full', className)}
        role="status"
        aria-live="polite"
        aria-label="Waiting for debate to begin"
      >
        <EmptyState />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('scroll-smooth overflow-y-auto px-4 py-6', className)}
      role="log"
      aria-live="polite"
      aria-label="Debate messages"
    >
      <div className="mx-auto max-w-4xl">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showTimestamp={message.isComplete}
            onAnimationComplete={() => handleAnimationComplete(message.id)}
          />
        ))}

        <div id="scroll-anchor" aria-hidden="true" />
      </div>
    </div>
  )
}
