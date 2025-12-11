// src/components/debate/message-list.tsx

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ANIMATION_CONFIG } from '@/lib/animation-config'
import { clientLogger } from '@/lib/client-logger'
import { sanitizeTopic } from '@/lib/sanitize-topic'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import { MessageBubble } from './message-bubble'

import type { DebateMessage } from '@/types/debate-ui'

/**
 * Easing function for smooth scroll animation
 * Uses Apple-style cubic-bezier curve
 */
function easeOutCubic(t: number): number {
  const [_x1, y1, _x2, y2] = ANIMATION_CONFIG.AUTO_SCROLL.SCROLL_EASING
  // Simplified cubic bezier approximation
  return 1 - Math.pow(1 - t, 3) * (1 - y2) + Math.pow(t, 3) * y1
}

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
      {/* Title - Apple-style blur-in with refined typography */}
      <motion.div
        className="relative"
        style={{
          marginBottom: '8px',
          marginTop: '-72px', // Optical centering - shifts content up for visual balance (24px additional lift)
        }}
        initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {/* Title spotlight - subtle radial for perceived contrast (700ms → 1100ms) */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '140%',
            height: '180%',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
          aria-hidden="true"
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background:
                'radial-gradient(ellipse at center, rgba(255,255,255,0.055) 0%, transparent 55%)',
            }}
          />
        </motion.div>
        <h1
          className="relative text-center text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          style={{
            textWrap: 'balance',
            lineHeight: 1.18,
            maxWidth: '20ch',
            marginLeft: 'auto',
            marginRight: 'auto',
            background:
              'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgb(200,200,205) 45%, rgb(130,130,135) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 -1px 2px rgba(255,255,255,0.22), 0 2px 6px rgba(0,0,0,0.25)',
            WebkitFontSmoothing: 'antialiased',
            textRendering: 'optimizeLegibility',
            letterSpacing: '0.005em',
            paddingBottom: '8px',
          }}
        >
          {/* Text content with cinematic light sweep overlay */}
          <span className="relative inline-block">
            {sanitizeTopic(topic)}
            {/* Cinematic light sweep - affects TEXT ONLY via mix-blend-mode */}
            <motion.span
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%, transparent 100%)',
                mixBlendMode: 'soft-light',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 1.4,
                delay: 2.0,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              aria-hidden="true"
            />
          </span>
        </h1>
      </motion.div>

      {/* Metadata - Apple translucent capsules (staggered entrance) */}
      <motion.div
        className="mt-5 flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <motion.div
          className={cn(
            'flex h-8 items-center justify-center px-5',
            'text-[11px] font-medium uppercase text-white/80'
          )}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '20px',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)',
            letterSpacing: '0.05em',
          }}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: 0.95,
            duration: 0.4,
            ease: [0.22, 0.61, 0.36, 1],
          }}
        >
          {formatDisplayName}
        </motion.div>
        <motion.div
          className={cn(
            'flex h-8 items-center justify-center px-5',
            'text-[11px] font-medium uppercase text-white/80'
          )}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '20px',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)',
            letterSpacing: '0.05em',
          }}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: 1.05,
            duration: 0.4,
            ease: [0.22, 0.61, 0.36, 1],
          }}
        >
          Dual Debate
        </motion.div>
      </motion.div>

      {/* CTA - Apple premium capsule button (landing animation) */}
      <motion.div
        className="relative mt-7 group"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 1.2,
          duration: 0.5,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        {/* Soft radial glow under button - intensifies on hover and loading */}
        <div
          className={cn(
            'pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'transition-all duration-300 ease-out',
            isLoading ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 group-hover:scale-110'
          )}
          style={{
            width: '200px',
            height: '100px',
            background: isLoading
              ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <motion.button
          onClick={handleStart}
          disabled={isLoading}
          className={cn(
            'relative px-8 py-4 overflow-hidden',
            'text-sm font-semibold',
            'cursor-pointer',
            'disabled:cursor-not-allowed'
          )}
          initial={{
            boxShadow:
              'inset 0 1px 2px rgba(255,255,255,1), inset 0 -1px 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.05)',
          }}
          animate={{
            scale: isLoading ? 0.985 : 1,
            background: isLoading
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.94) 0%, rgba(250,250,250,0.90) 100%)'
              : 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(248,248,250,0.98) 100%)',
            boxShadow: isLoading
              ? 'inset 0 1px 2px rgba(255,255,255,1), inset 0 -1px 1px rgba(0,0,0,0.02), 0 4px 20px rgba(0,0,0,0.10)'
              : 'inset 0 1px 2px rgba(255,255,255,1), inset 0 -1px 1px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.08)',
          }}
          style={{
            color: 'rgba(0, 0, 0, 0.80)',
            borderRadius: '30px',
            letterSpacing: '-0.01em',
            WebkitFontSmoothing: 'antialiased',
            border: '1px solid rgba(255,255,255,0.5)',
            backdropFilter: isLoading ? 'blur(12px)' : 'none',
          }}
          whileHover={
            !isLoading
              ? {
                  scale: 1.012,
                  y: -1.5,
                  boxShadow:
                    'inset 0 1px 2px rgba(255,255,255,1), inset 0 -1px 1px rgba(0,0,0,0.03), 0 12px 36px rgba(0,0,0,0.22), 0 4px 14px rgba(0,0,0,0.12), 0 0 24px rgba(255,255,255,0.06)',
                }
              : {}
          }
          whileTap={!isLoading ? { scale: 0.985, y: 0 } : {}}
          transition={{ type: 'tween', ease: [0.22, 0.61, 0.36, 1], duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="spinner"
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.14, ease: [0.22, 0.61, 0.36, 1] }}
              >
                {/* Apple-style circular spinner */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  style={{ opacity: 0.7 }}
                >
                  <motion.circle
                    cx="9"
                    cy="9"
                    r="7"
                    stroke="rgba(0,0,0,0.25)"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <motion.circle
                    cx="9"
                    cy="9"
                    r="7"
                    stroke="rgba(0,0,0,0.82)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="44"
                    strokeDashoffset="33"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{ transformOrigin: 'center' }}
                  />
                </svg>
              </motion.div>
            ) : (
              <motion.span
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12, ease: [0.22, 0.61, 0.36, 1] }}
              >
                Start Debate
              </motion.span>
            )}
          </AnimatePresence>
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
  const lastCompletedMessageId = useRef<string | null>(null)
  const isPausedForReading = useRef(false)
  const smoothScrollRafRef = useRef<number | null>(null)

  // Track if we have messages to determine when container becomes available
  const hasMessages = messages.length > 0

  // Only auto-scroll during active debate, not after completion
  const shouldAutoScroll = autoScroll && hasMessages && status !== 'completed'

  // Smooth scroll to a target position with Apple-style easing
  const smoothScrollTo = useCallback((container: HTMLDivElement, targetScrollTop: number) => {
    const startScrollTop = container.scrollTop
    const distance = targetScrollTop - startScrollTop
    const duration = ANIMATION_CONFIG.AUTO_SCROLL.SCROLL_DURATION_MS
    const startTime = performance.now()

    // Cancel any existing smooth scroll
    if (smoothScrollRafRef.current) {
      cancelAnimationFrame(smoothScrollRafRef.current)
    }

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      const newScrollTop = startScrollTop + distance * easedProgress
      scrollLockUntil.current = Date.now() + 100
      container.scrollTop = newScrollTop

      if (progress < 1) {
        smoothScrollRafRef.current = requestAnimationFrame(animateScroll)
      } else {
        smoothScrollRafRef.current = null
      }
    }

    smoothScrollRafRef.current = requestAnimationFrame(animateScroll)
  }, [])

  // Detect when a message completes and trigger cinematic pause + scroll
  useEffect(() => {
    if (!shouldAutoScroll) return

    const container = containerRef.current
    if (!container) return

    // Find the last completed message
    const completedMessages = messages.filter((m) => m.isComplete)
    const lastCompleted = completedMessages[completedMessages.length - 1]

    if (lastCompleted && lastCompleted.id !== lastCompletedMessageId.current) {
      lastCompletedMessageId.current = lastCompleted.id

      // Check if there's a next message being streamed
      const lastCompletedIndex = messages.findIndex((m) => m.id === lastCompleted.id)
      const hasNextMessage = lastCompletedIndex < messages.length - 1

      if (hasNextMessage) {
        // Pause for reading time before scrolling to next
        isPausedForReading.current = true

        setTimeout(() => {
          isPausedForReading.current = false

          // Find the next message element and scroll to center it
          const nextMessageIndex = lastCompletedIndex + 1
          const messageElements = container.querySelectorAll('[role="article"]')
          const nextElement = messageElements[nextMessageIndex] as HTMLElement | undefined

          if (nextElement) {
            const containerRect = container.getBoundingClientRect()
            const elementTop = nextElement.offsetTop

            // Calculate target scroll to position element at CENTER_OFFSET from top
            const targetScrollTop =
              elementTop - containerRect.height * ANIMATION_CONFIG.AUTO_SCROLL.CENTER_OFFSET

            // Only scroll if we need to move down (don't scroll up)
            if (targetScrollTop > container.scrollTop) {
              smoothScrollTo(container, targetScrollTop)
            }
          }
        }, ANIMATION_CONFIG.AUTO_SCROLL.PAUSE_AFTER_COMPLETE_MS)
      }
    }
  }, [messages, shouldAutoScroll, smoothScrollTo])

  // RAF-based continuous scroll - gentle follow during streaming
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

      // Skip if user is manually scrolling or paused for reading
      if (!isUserScrolling.current && !isPausedForReading.current && distanceFromBottom > 1) {
        // Gentler lerp for streaming follow - smoother than before
        const lerpFactor = ANIMATION_CONFIG.AUTO_SCROLL.LERP_FACTOR
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
      if (smoothScrollRafRef.current) {
        cancelAnimationFrame(smoothScrollRafRef.current)
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
      <div
        ref={containerRef}
        className="overflow-y-auto px-4 h-full"
        style={{
          scrollBehavior: 'auto',
          // Fade content at top (under header) and bottom (above dock)
          // Content behind header (0-60px): fully hidden
          // Fade zone (60px-76px): ultra-thin 16px fade
          // Below 76px: fully visible
          maskImage:
            'linear-gradient(to bottom, transparent 0px, transparent 60px, black 76px, black calc(100% - 96px), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0px, transparent 60px, black 76px, black calc(100% - 96px), transparent 100%)',
        }}
        role="log"
        aria-live="polite"
        aria-label="Debate messages"
      >
        <div
          className={cn(
            'relative flex flex-col',
            // Center content when only 1 message, otherwise align to start
            // pt-24 provides breathing room below the fixed header
            messages.length === 1 ? 'min-h-full justify-center' : 'pt-24 pb-6'
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
                isCompleted={status === 'completed'}
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
