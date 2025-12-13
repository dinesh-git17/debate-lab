// src/components/debate/message-list.tsx
/**
 * Scrollable message container with smart auto-scroll and empty state handling.
 * Orchestrates message display, cascading animations, and scroll position management.
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIsMobile } from '@/hooks/use-media-query'
import { ANIMATION_CONFIG } from '@/lib/animation-config'
import { clientLogger } from '@/lib/client-logger'
import { sanitizeTopic } from '@/lib/sanitize-topic'
import { CATEGORY_GRADIENTS, CATEGORY_IMAGES, getTopicGradient } from '@/lib/topic-backgrounds'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import { MessageBubble } from './message-bubble'

import type { BackgroundCategory } from '@/lib/topic-backgrounds'
import type { DebateMessage } from '@/types/debate-ui'

function easeOutCubic(t: number): number {
  const [_x1, y1, _x2, y2] = ANIMATION_CONFIG.AUTO_SCROLL.SCROLL_EASING
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
  const backgroundCategory = useDebateViewStore((s) => s.backgroundCategory)
  const setStatus = useDebateViewStore((s) => s.setStatus)
  const setError = useDebateViewStore((s) => s.setError)

  const formatDisplayName = FORMAT_DISPLAY_NAMES[format] ?? format

  const category = backgroundCategory as BackgroundCategory | undefined
  const topicGradient = category
    ? (CATEGORY_GRADIENTS[category] ?? getTopicGradient(topic))
    : getTopicGradient(topic)
  const topicImage = category ? CATEGORY_IMAGES[category] : null

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
    <div className="relative flex h-full flex-col items-center justify-center px-8 md:px-16 lg:px-24 overflow-hidden">
      {topicImage && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-0"
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 0.4, scale: 1.05 }}
          transition={{ duration: 2, ease: [0.22, 0.61, 0.36, 1] }}
          style={{
            backgroundImage: `url(${topicImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px)',
          }}
        />
      )}

      {topicImage && (
        <div
          className="pointer-events-none fixed inset-0 z-[1]"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)',
          }}
        />
      )}

      <motion.div
        className="pointer-events-none fixed inset-0 z-[2]"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, delay: topicImage ? 0.2 : 0, ease: [0.22, 0.61, 0.36, 1] }}
        style={{
          background: topicGradient,
        }}
      />

      <motion.div
        className="relative z-10"
        style={{
          marginBottom: '8px',
          marginTop: '-72px', // Optical centering - shifts content up for visual balance (24px additional lift)
        }}
        initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <h1
          className="relative text-center text-4xl font-semibold tracking-tight text-gradient-cinematic sm:text-5xl md:text-6xl"
          style={{
            textWrap: 'balance',
            lineHeight: 1.18,
            maxWidth: '20ch',
            marginLeft: 'auto',
            marginRight: 'auto',
            letterSpacing: '0.005em',
            paddingBottom: '8px',
          }}
        >
          {sanitizeTopic(topic)}
        </h1>
      </motion.div>

      <motion.div
        className="relative z-10 mt-5 flex gap-3"
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

      <motion.div
        className="relative z-10 mt-7 group"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 1.2,
          duration: 0.5,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        <motion.button
          onClick={handleStart}
          disabled={isLoading}
          className={cn(
            'relative px-8 py-4 overflow-hidden',
            'text-sm font-semibold',
            'cursor-pointer',
            'disabled:cursor-not-allowed'
          )}
          animate={{
            scale: isLoading ? 0.985 : 1,
            background: isLoading
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.94) 0%, rgba(250,250,250,0.90) 100%)'
              : 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(248,248,250,0.98) 100%)',
          }}
          style={{
            color: 'rgba(0, 0, 0, 0.85)',
            borderRadius: '30px',
            letterSpacing: '-0.01em',
            WebkitFontSmoothing: 'antialiased',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
          whileHover={
            !isLoading
              ? {
                  scale: 1.012,
                  y: -1.5,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.20)',
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
  const isMobile = useIsMobile()

  // Subscribe to messages, displayedMessageIds, and status to trigger re-renders
  const allMessages = useDebateViewStore((s) => s.messages)
  const displayedIds = useDebateViewStore((s) => s.displayedMessageIds)
  const storeStatus = useDebateViewStore((s) => s.status)

  // Use initialStatus as fallback when store hasn't been hydrated yet
  // This prevents showing EmptyState on page refresh for completed debates
  const status = storeStatus === 'ready' && initialStatus ? initialStatus : storeStatus
  const markMessageDisplayed = useDebateViewStore((s) => s.markMessageDisplayed)

  // Track initial mount for cascading entrance animation
  // Only applies when page loads with hydrated messages (e.g., completed debate refresh)
  const isInitialMountRef = useRef(true)
  const [isInitialCascade, setIsInitialCascade] = useState(true)

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

  // Track which message is currently hovered (for connector fade effect)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)

  // Callback for MessageBubble to report hover state changes
  const handleMessageHover = useCallback((messageId: string, isHovered: boolean) => {
    setHoveredMessageId(isHovered ? messageId : null)
  }, [])

  // Initial mount: scroll to top and trigger cascade animation for completed debates
  useEffect(() => {
    // Don't do anything until we have messages (wait for hydration)
    if (allMessages.length === 0) return

    // Only run cascade logic once when messages first arrive
    if (!isInitialMountRef.current) return
    isInitialMountRef.current = false

    const container = containerRef.current

    if (status === 'completed' && container) {
      container.scrollTop = 0

      const totalCascadeTime =
        allMessages.length * ANIMATION_CONFIG.CARD_ENTRANCE.STAGGER_MS +
        ANIMATION_CONFIG.CARD_ENTRANCE.DURATION_MS +
        100 // buffer

      setTimeout(() => {
        setIsInitialCascade(false)
      }, totalCascadeTime)
    } else {
      // Not a completed debate, disable cascade immediately
      setIsInitialCascade(false)
    }
  }, [status, allMessages.length])

  const hasMessages = messages.length > 0

  const shouldAutoScroll = autoScroll && hasMessages && status !== 'completed'

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

  useEffect(() => {
    if (!shouldAutoScroll) return

    const container = containerRef.current
    if (!container) return

    // Find the last completed message
    const completedMessages = messages.filter((m) => m.isComplete)
    const lastCompleted = completedMessages[completedMessages.length - 1]

    if (lastCompleted && lastCompleted.id !== lastCompletedMessageId.current) {
      lastCompletedMessageId.current = lastCompleted.id

      const lastCompletedIndex = messages.findIndex((m) => m.id === lastCompleted.id)
      const hasNextMessage = lastCompletedIndex < messages.length - 1

      if (hasNextMessage) {
        isPausedForReading.current = true

        setTimeout(() => {
          isPausedForReading.current = false

          const nextMessageIndex = lastCompletedIndex + 1
          const messageElements = container.querySelectorAll('[role="article"]')
          const nextElement = messageElements[nextMessageIndex] as HTMLElement | undefined

          if (nextElement) {
            const containerRect = container.getBoundingClientRect()
            const elementTop = nextElement.offsetTop

            const targetScrollTop =
              elementTop - containerRect.height * ANIMATION_CONFIG.AUTO_SCROLL.CENTER_OFFSET

            if (targetScrollTop > container.scrollTop) {
              smoothScrollTo(container, targetScrollTop)
            }
          }
        }, ANIMATION_CONFIG.AUTO_SCROLL.PAUSE_AFTER_COMPLETE_MS)
      }
    }
  }, [messages, shouldAutoScroll, smoothScrollTo])

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

      if (!isUserScrolling.current && !isPausedForReading.current && distanceFromBottom > 1) {
        const lerpFactor = ANIMATION_CONFIG.AUTO_SCROLL.LERP_FACTOR
        const newScrollTop = scrollTop + distanceFromBottom * lerpFactor

        scrollLockUntil.current = Date.now() + 50
        container.scrollTop = newScrollTop
      }

      rafId = requestAnimationFrame(checkAndScroll)
    }

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

  useEffect(() => {
    if (!hasMessages) return

    const container = containerRef.current
    if (!container) return

    lastScrollTop.current = container.scrollTop

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const now = Date.now()

      if (now < scrollLockUntil.current) {
        lastScrollTop.current = scrollTop
        return
      }

      const scrollDelta = scrollTop - lastScrollTop.current
      const scrolledUp = scrollDelta < -5
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      if (scrolledUp && distanceFromBottom > 200) {
        isUserScrolling.current = true

        // Clear any existing timeout
        if (scrollEndTimeoutRef.current) {
          clearTimeout(scrollEndTimeoutRef.current)
        }

        if (status !== 'completed') {
          scrollEndTimeoutRef.current = setTimeout(() => {
            isUserScrolling.current = false
          }, 1500)
        }
      } else if (distanceFromBottom < 100) {
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

  // Use dvh for dynamic viewport height on mobile (prevents browser chrome jump)
  const heightStyle = isMobile
    ? { height: '100dvh', minHeight: '100vh' } // dvh with vh fallback
    : undefined

  return (
    <div className={cn('relative', !isMobile && 'h-full', className)} style={heightStyle}>
      <div
        ref={containerRef}
        className="overflow-y-auto px-4 h-full"
        style={{
          scrollBehavior: 'auto',
          scrollSnapType: status === 'completed' ? 'y proximity' : undefined,
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
            messages.length === 1
              ? 'min-h-full justify-center'
              : isMobile
                ? 'pt-20 pb-6'
                : 'pt-24 pb-6',
            isMobile && 'mx-auto'
          )}
          style={{
            width: isMobile ? 'calc(100vw - 32px)' : undefined,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : 'clamp(480px, 55vw, 680px)',
            marginLeft: isMobile ? undefined : '48.5%',
            transform: isMobile ? undefined : 'translateX(-50%)',
          }}
        >
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1
            const isFirstMessage = index === 0
            const shouldSkipAnimation = displayedIds.has(message.id)
            const depthIndex = status === 'completed' ? 0 : messages.length - 1 - index
            const previousMessage = index > 0 ? messages[index - 1] : null
            const isPreviousCardHovered = previousMessage
              ? hoveredMessageId === previousMessage.id
              : false
            const shouldCascade = isInitialCascade && status === 'completed' && shouldSkipAnimation

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
                onHoverChange={handleMessageHover}
                isPreviousCardHovered={isPreviousCardHovered}
                {...(shouldCascade ? { cascadeIndex: index } : {})}
              />
            )
          })}

          <div className="h-24" aria-hidden="true" />

          <div id="scroll-anchor" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
