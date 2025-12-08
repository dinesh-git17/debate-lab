// src/components/debate/message-list.tsx

'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { clientLogger } from '@/lib/client-logger'
import { sanitizeTopic } from '@/lib/sanitize-topic'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import { MessageBubble } from './message-bubble'

import type { DebateMessage } from '@/types/debate-ui'

const FORMAT_DISPLAY_NAMES: Record<string, string> = {
  standard: 'Standard',
  oxford: 'Oxford Style',
  'lincoln-douglas': 'Lincoln-Douglas',
}

function EmptyState() {
  const [isLoading, setIsLoading] = useState(false)
  const debateId = useDebateViewStore((s) => s.debateId)
  const topic = useDebateViewStore((s) => s.topic)
  const format = useDebateViewStore((s) => s.format)
  const setStatus = useDebateViewStore((s) => s.setStatus)
  const setError = useDebateViewStore((s) => s.setError)

  const formatDisplayName = FORMAT_DISPLAY_NAMES[format] ?? format

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
    <div className="relative flex h-full flex-col items-center justify-center px-8 md:px-16 lg:px-24">
      {/* God Ray - gradient-only approach (no blur filter) */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 800,
          height: 800,
          background:
            'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.025) 0%, transparent 70%)',
        }}
        initial={{ opacity: 0, scale: 1 }}
        animate={{
          opacity: 1,
          scale: [1, 1.05, 1],
        }}
        transition={{
          opacity: { duration: 1.2, ease: 'easeOut' },
          scale: {
            duration: 8,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
            delay: 1.2,
          },
        }}
      />

      {/* Title - blur-in effect */}
      <motion.h1
        className="text-center text-5xl font-semibold tracking-tighter md:text-7xl bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent"
        style={{ textWrap: 'balance' }}
        initial={{ opacity: 0, y: 20, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      >
        {sanitizeTopic(topic)}
      </motion.h1>

      {/* Metadata - spring waterfall pills */}
      <motion.div
        className="mt-6 flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          className={cn(
            'flex h-8 items-center justify-center rounded-full px-4',
            'bg-white/[0.03]',
            'backdrop-blur-md',
            'text-xs font-medium uppercase tracking-wide text-zinc-400'
          )}
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.4,
            type: 'spring',
            stiffness: 100,
            damping: 20,
          }}
        >
          {formatDisplayName}
        </motion.div>
        <motion.div
          className={cn(
            'flex h-8 items-center justify-center rounded-full px-4',
            'bg-white/[0.03]',
            'backdrop-blur-md',
            'text-xs font-medium uppercase tracking-wide text-zinc-400'
          )}
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            type: 'spring',
            stiffness: 100,
            damping: 20,
          }}
        >
          2 Agents
        </motion.div>
      </motion.div>

      {/* CTA - spring scale entrance */}
      <motion.div
        className="relative mt-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.6,
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
      >
        <motion.button
          onClick={handleStart}
          disabled={isLoading}
          className={cn(
            'relative rounded-full bg-white px-8 py-4',
            'text-sm font-semibold text-black',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          style={{
            filter: 'drop-shadow(0 0 25px rgba(255, 255, 255, 0.15))',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? 'Starting...' : 'Start Debate'}
        </motion.button>
      </motion.div>
    </div>
  )
}

function WaitingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Pulsing dot indicator */}
        <motion.div
          className="flex gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-zinc-500"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.85, 1, 0.85],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
        <motion.p
          className="text-sm text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Waiting for messages...
        </motion.p>
      </motion.div>
    </div>
  )
}

interface MessageListProps {
  className?: string
  autoScroll?: boolean
  /** Initial status from server - used as fallback before store is hydrated */
  initialStatus?: 'ready' | 'active' | 'paused' | 'completed' | 'error'
}

export function MessageList({ className, autoScroll = true, initialStatus }: MessageListProps) {
  // Subscribe to messages, displayedMessageIds, and status to trigger re-renders
  const allMessages = useDebateViewStore((s) => s.messages)
  const displayedIds = useDebateViewStore((s) => s.displayedMessageIds)
  const storeStatus = useDebateViewStore((s) => s.status)

  // Use initialStatus as fallback when store hasn't been hydrated yet
  // This prevents showing EmptyState on page refresh for completed debates
  const status = storeStatus === 'ready' && initialStatus ? initialStatus : storeStatus
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
  const lastScrollTop = useRef(0)
  const scrollLockUntil = useRef(0)
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track if we have messages to determine when container becomes available
  const hasMessages = messages.length > 0

  // Only auto-scroll during active debate, not after completion
  const shouldAutoScroll = autoScroll && hasMessages && status !== 'completed'

  // RAF-based continuous scroll - single source of truth for auto-scrolling
  // Keeps content visible above the safe zone during text reveal
  useEffect(() => {
    if (!shouldAutoScroll) return

    const container = containerRef.current
    if (!container) return

    let rafId: number | null = null
    let isRunning = true

    const checkAndScroll = () => {
      if (!isRunning) return

      const { scrollTop, scrollHeight, clientHeight } = container
      const targetScrollTop = scrollHeight - clientHeight
      const distanceFromBottom = targetScrollTop - scrollTop

      // Skip if user is manually scrolling
      if (!isUserScrolling.current && distanceFromBottom > 1) {
        // Smooth lerp towards bottom - lower = smoother, higher = snappier
        const lerpFactor = 0.08
        const newScrollTop = scrollTop + distanceFromBottom * lerpFactor

        // Lock scroll detection briefly to prevent false user-scroll detection
        scrollLockUntil.current = Date.now() + 50
        container.scrollTop = newScrollTop
      }

      rafId = requestAnimationFrame(checkAndScroll)
    }

    // Start the RAF loop
    rafId = requestAnimationFrame(checkAndScroll)

    return () => {
      isRunning = false
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [shouldAutoScroll])

  // User scroll detection - detect when user intentionally scrolls away
  // During active debate: snap back after user stops scrolling
  useEffect(() => {
    if (!hasMessages) return

    const container = containerRef.current
    if (!container) return

    // Initialize lastScrollTop to current position
    lastScrollTop.current = container.scrollTop

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const now = Date.now()

      // Skip if we're in the lock period after a programmatic scroll
      if (now < scrollLockUntil.current) {
        lastScrollTop.current = scrollTop
        return
      }

      // Detect user scrolling UP (away from content)
      const scrollDelta = scrollTop - lastScrollTop.current
      const scrolledUp = scrollDelta < -5 // Small threshold to ignore micro-movements
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      // User is scrolling if they scrolled up significantly and are far from bottom
      if (scrolledUp && distanceFromBottom > 200) {
        isUserScrolling.current = true

        // Clear any existing timeout
        if (scrollEndTimeoutRef.current) {
          clearTimeout(scrollEndTimeoutRef.current)
        }

        // Set timeout to snap back after user stops scrolling (only during active debate)
        if (status !== 'completed') {
          scrollEndTimeoutRef.current = setTimeout(() => {
            isUserScrolling.current = false
          }, 1500) // Snap back 1.5s after user stops scrolling
        }
      } else if (distanceFromBottom < 100) {
        // User scrolled back to bottom - re-enable auto-scroll
        isUserScrolling.current = false
        if (scrollEndTimeoutRef.current) {
          clearTimeout(scrollEndTimeoutRef.current)
          scrollEndTimeoutRef.current = null
        }
      }

      lastScrollTop.current = scrollTop
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current)
      }
    }
  }, [hasMessages, status])

  if (messages.length === 0) {
    // Show empty state with "Start Debate" only when debate hasn't started
    if (status === 'ready') {
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

    // Show waiting state when debate is active/paused/completed but messages haven't loaded yet
    // This handles the case where page is refreshed - messages are being hydrated from server
    if (status === 'active' || status === 'paused' || status === 'completed') {
      return (
        <div
          className={cn('h-full', className)}
          role="status"
          aria-live="polite"
          aria-label="Loading debate messages"
        >
          <WaitingState />
        </div>
      )
    }
  }

  return (
    <div className={cn('relative h-full', className)}>
      {/* Bottom gradient mask - fades content into dock area */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24"
        style={{
          background:
            'linear-gradient(to top, #0a0a0b 0%, rgba(10, 10, 11, 0.9) 40%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        className="overflow-y-auto px-4 h-full"
        style={{ scrollBehavior: 'auto' }}
        role="log"
        aria-live="polite"
        aria-label="Debate messages"
      >
        <div
          className={cn(
            'relative flex flex-col',
            // Center content when only 1 message, otherwise align to start
            messages.length === 1 ? 'min-h-full justify-center' : 'py-6'
          )}
          style={{
            maxWidth: 'clamp(480px, 55vw, 680px)',
            marginLeft: '48.5%',
            transform: 'translateX(-50%)',
          }}
        >
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1
            const isFirstMessage = index === 0
            // Skip animation for messages that were already displayed (hydrated from server)
            const shouldSkipAnimation = displayedIds.has(message.id)
            // Calculate depth index: 0 = active (last), 1 = adjacent, 2+ = distant
            // In completed state, all cards should be fully focused (depthIndex = 0)
            const depthIndex = status === 'completed' ? 0 : messages.length - 1 - index
            return (
              <MessageBubble
                key={message.id}
                message={message}
                showTimestamp={message.isComplete}
                onAnimationComplete={() => handleAnimationComplete(message.id)}
                isActive={isLastMessage || status === 'completed'}
                isFirst={isFirstMessage}
                skipAnimation={shouldSkipAnimation}
                depthIndex={depthIndex}
              />
            )
          })}

          {/* Safe zone padding for floating dock */}
          <div className="h-24" aria-hidden="true" />

          <div id="scroll-anchor" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
