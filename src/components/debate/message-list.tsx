// src/components/debate/message-list.tsx

'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef } from 'react'

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

// VS Badge component
function VSBadge() {
  return (
    <motion.div
      className="relative mx-6"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
    >
      <motion.div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          'bg-white/5 backdrop-blur-sm',
          'border border-white/10',
          'text-xs font-bold tracking-wider text-white/60'
        )}
        animate={{
          boxShadow: [
            '0 0 20px rgba(255,255,255,0.05)',
            '0 0 30px rgba(255,255,255,0.1)',
            '0 0 20px rgba(255,255,255,0.05)',
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        VS
      </motion.div>
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

// Animated arrow pointing to Start button
function DirectionalHint() {
  return (
    <motion.div
      className="mt-8 flex items-center gap-2 text-sm text-muted-foreground/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <span>Press Start to begin the debate</span>
      <motion.svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        animate={{
          x: [0, 4, 0],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
        />
      </motion.svg>
    </motion.div>
  )
}

// Main Empty State Component
function EmptyState() {
  return (
    <motion.div
      className="relative flex h-full flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Left emerald glow */}
        <motion.div
          className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Right blue glow */}
        <motion.div
          className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-500/[0.08] blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
        {/* Center subtle glow */}
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-[80px]" />
      </div>

      {/* Content container with optical vertical adjustment */}
      <div className="relative -mt-8 flex flex-col items-center">
        {/* VS Layout with AI Avatars */}
        <div className="flex items-center">
          <AIAvatar side="left" delay={0} />
          <VSBadge />
          <AIAvatar side="right" delay={0.15} />
        </div>

        {/* Typography */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-medium tracking-tight text-foreground">Ready to Debate</h2>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Two AI perspectives will engage in structured discourse
          </p>
        </motion.div>

        {/* Skeleton message previews */}
        <motion.div
          className="mt-10 w-full max-w-md space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SkeletonMessage side="left" width="75%" delay={0.6} />
          <SkeletonMessage side="right" width="65%" delay={0.7} />
          <SkeletonMessage side="left" width="55%" delay={0.8} />
        </motion.div>

        {/* Directional hint */}
        <DirectionalHint />
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
