// src/components/debate/message-list.tsx
/**
 * Scrollable message container with smart auto-scroll and empty state handling.
 * Orchestrates message display, cascading animations, and scroll position management.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIsMobile } from '@/hooks/use-media-query'
import { ANIMATION_CONFIG } from '@/lib/animation-config'
import { clientLogger } from '@/lib/client-logger'
import { sanitizeTopic } from '@/lib/sanitize-topic'
import { CATEGORY_GRADIENTS, CATEGORY_IMAGES, getTopicGradient } from '@/lib/topic-backgrounds'
import { cn } from '@/lib/utils'
import { useDebateViewStore } from '@/store/debate-view-store'

import { MessageBubble } from './message-bubble'
import { SkeletonCard } from './skeleton-card'
import { SummaryHint } from './summary-hint'

import type { BackgroundCategory } from '@/lib/topic-backgrounds'
import type { DebateMessage } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

/** Spring physics state for smooth scroll centering. */
interface SpringState {
  position: number
  velocity: number
  target: number
}

/**
 * Advances spring physics by one frame.
 * Returns true if spring has settled (velocity and displacement below threshold).
 */
function advanceSpring(
  state: SpringState,
  stiffness: number,
  damping: number,
  mass: number,
  dt: number
): boolean {
  const displacement = state.position - state.target
  const springForce = -stiffness * displacement
  const dampingForce = -damping * state.velocity
  const acceleration = (springForce + dampingForce) / mass

  state.velocity += acceleration * dt
  state.position += state.velocity * dt

  // Settle when both displacement and velocity are tiny
  const isSettled = Math.abs(displacement) < 0.5 && Math.abs(state.velocity) < 0.5
  if (isSettled) {
    state.position = state.target
    state.velocity = 0
  }
  return isSettled
}

const FORMAT_DISPLAY_NAMES: Record<string, string> = {
  standard: 'Standard',
  oxford: 'Oxford Style',
  'lincoln-douglas': 'Lincoln-Douglas',
}

function EmptyState() {
  const [isLoading, setIsLoading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
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

  // Preload background image
  useEffect(() => {
    if (!topicImage) {
      setImageLoaded(true)
      return
    }

    const img = new Image()
    img.onload = () => setImageLoaded(true)
    img.onerror = () => setImageLoaded(true) // Show gradient anyway on error
    img.src = topicImage
  }, [topicImage])

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
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 100%)',
          }}
        />
      )}

      <motion.div
        className="pointer-events-none fixed inset-0 z-[2]"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={imageLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.1 }}
        transition={{ duration: 1.8, delay: topicImage ? 0.8 : 0, ease: [0.22, 0.61, 0.36, 1] }}
        style={{
          background: topicGradient,
          backdropFilter: topicImage ? 'blur(8px) saturate(1.2)' : undefined,
          WebkitBackdropFilter: topicImage ? 'blur(8px) saturate(1.2)' : undefined,
        }}
      />

      <motion.div
        className="relative z-10"
        style={{
          marginBottom: '8px',
          marginTop: '-24px', // Optical centering - accounts for fixed header (~60px) above content
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
        className="relative z-10 mt-7 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 1.2,
          duration: 0.5,
          ease: [0.22, 0.61, 0.36, 1],
        }}
        style={{ minHeight: 52 }}
      >
        {/* Button - fades out when loading */}
        <motion.button
          onClick={handleStart}
          disabled={isLoading}
          className={cn(
            'absolute px-8 py-4',
            'text-sm font-semibold whitespace-nowrap',
            'cursor-pointer',
            'disabled:cursor-not-allowed disabled:pointer-events-none'
          )}
          initial={false}
          animate={{
            opacity: isLoading ? 0 : 1,
            scale: isLoading ? 0.92 : 1,
          }}
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(248,248,250,0.98) 100%)',
            color: 'rgba(0, 0, 0, 0.85)',
            borderRadius: '30px',
            letterSpacing: '-0.01em',
            WebkitFontSmoothing: 'antialiased',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
          whileHover={
            !isLoading ? { scale: 1.015, y: -1, boxShadow: '0 6px 20px rgba(0,0,0,0.18)' } : {}
          }
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
        >
          Start Debate
        </motion.button>

        {/* Standalone spinner - fades in when loading */}
        <motion.div
          className="absolute flex items-center justify-center"
          initial={false}
          animate={{
            opacity: isLoading ? 1 : 0,
            scale: isLoading ? 1 : 0.85,
          }}
          style={{ pointerEvents: 'none' }}
          transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="63"
              strokeDashoffset="47"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: 'center' }}
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}

function WaitingState() {
  const isMobile = useIsMobile()

  // Alternating speaker pattern for skeleton cards
  const skeletonSpeakers: TurnSpeaker[] = ['moderator', 'for', 'against']

  // Top fade mask for consistency with loaded state
  const maskGradient =
    'linear-gradient(to bottom, transparent 0px, transparent 60px, black 76px, black 100%)'

  return (
    <div className="relative h-full">
      <div
        className="overflow-y-auto px-4 h-full"
        style={{
          maskImage: maskGradient,
          WebkitMaskImage: maskGradient,
        }}
      >
        <div
          className={cn('relative flex flex-col', isMobile ? 'pt-36 pb-6 mx-auto' : 'pt-40 pb-6')}
          style={{
            width: isMobile ? 'calc(100vw - 32px)' : undefined,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : 'clamp(480px, 55vw, 680px)',
            marginLeft: isMobile ? undefined : '48.5%',
            transform: isMobile ? undefined : 'translateX(-50%)',
          }}
        >
          <AnimatePresence mode="popLayout">
            {skeletonSpeakers.map((speaker, index) => (
              <SkeletonCard key={`skeleton-${index}`} speaker={speaker} index={index} />
            ))}
          </AnimatePresence>

          {/* Bottom spacer */}
          <div className={cn('h-28', isMobile && 'safe-area-inset-bottom')} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

interface MessageListProps {
  className?: string
  autoScroll?: boolean
  /** Initial status from server - used as fallback before store is hydrated */
  initialStatus?: 'ready' | 'active' | 'completed' | 'error'
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
  const springStateRef = useRef<SpringState>({ position: 0, velocity: 0, target: 0 })
  const lastFrameTimeRef = useRef<number>(0)

  // Track which message is currently hovered (for connector fade effect)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)

  // Callback for MessageBubble to report hover state changes
  const handleMessageHover = useCallback((messageId: string, isHovered: boolean) => {
    setHoveredMessageId(isHovered ? messageId : null)
  }, [])

  // Track previous status to detect transitions
  const previousStatusRef = useRef(status)

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

  // Also check initialStatus to prevent auto-scroll during hydration race conditions
  const shouldAutoScroll =
    autoScroll && hasMessages && status !== 'completed' && initialStatus !== 'completed'

  const smoothScrollTo = useCallback((container: HTMLDivElement, targetScrollTop: number) => {
    // Initialize spring from current position
    springStateRef.current = {
      position: container.scrollTop,
      velocity: 0,
      target: targetScrollTop,
    }
    lastFrameTimeRef.current = performance.now()

    // Cancel any existing smooth scroll
    if (smoothScrollRafRef.current) {
      cancelAnimationFrame(smoothScrollRafRef.current)
    }

    const { SPRING_STIFFNESS, SPRING_DAMPING, SPRING_MASS } = ANIMATION_CONFIG.AUTO_SCROLL

    const animateScroll = (currentTime: number) => {
      const dt = Math.min((currentTime - lastFrameTimeRef.current) / 1000, 0.032) // Cap at ~30fps minimum
      lastFrameTimeRef.current = currentTime

      const isSettled = advanceSpring(
        springStateRef.current,
        SPRING_STIFFNESS,
        SPRING_DAMPING,
        SPRING_MASS,
        dt
      )

      scrollLockUntil.current = Date.now() + 100
      container.scrollTop = springStateRef.current.position

      if (!isSettled) {
        smoothScrollRafRef.current = requestAnimationFrame(animateScroll)
      } else {
        smoothScrollRafRef.current = null
      }
    }

    smoothScrollRafRef.current = requestAnimationFrame(animateScroll)
  }, [])

  // Scroll to reveal SummaryHint when debate completes (status transitions to 'completed')
  useEffect(() => {
    const wasActive = previousStatusRef.current === 'active'
    const isNowCompleted = status === 'completed'
    previousStatusRef.current = status

    // Only trigger on active → completed transition (not on page load)
    if (!wasActive || !isNowCompleted) return

    const container = containerRef.current
    if (!container) return

    // Wait for last message reveal to settle, then scroll to show SummaryHint
    const scrollDelay = ANIMATION_CONFIG.AUTO_SCROLL.PAUSE_AFTER_COMPLETE_MS + 200

    const timeoutId = setTimeout(() => {
      const { scrollHeight, clientHeight } = container
      const maxScroll = scrollHeight - clientHeight

      // Scroll to bottom with eased animation to reveal the hint
      smoothScrollTo(container, maxScroll)
    }, scrollDelay)

    return () => clearTimeout(timeoutId)
  }, [status, smoothScrollTo])

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

          // Check current store status to handle race conditions during hydration
          const currentStatus = useDebateViewStore.getState().status
          if (currentStatus === 'completed' || currentStatus === 'ended') {
            return
          }

          const nextMessageIndex = lastCompletedIndex + 1
          const messageElements = container.querySelectorAll('[role="article"]')
          const nextElement = messageElements[nextMessageIndex] as HTMLElement | undefined

          if (nextElement) {
            const containerRect = container.getBoundingClientRect()
            const usableHeight = containerRect.height - ANIMATION_CONFIG.AUTO_SCROLL.DOCK_CLEARANCE
            const elementTop = nextElement.offsetTop

            const targetScrollTop =
              elementTop - usableHeight * ANIMATION_CONFIG.AUTO_SCROLL.CENTER_OFFSET

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

    const { LERP_FACTOR, CENTER_TARGET, DOCK_CLEARANCE } = ANIMATION_CONFIG.AUTO_SCROLL

    const checkAndScroll = () => {
      if (!isRunning) return

      // Check current store status to handle race conditions during hydration
      const currentStatus = useDebateViewStore.getState().status
      if (currentStatus === 'completed' || currentStatus === 'ended') {
        return
      }

      if (isUserScrolling.current || isPausedForReading.current) {
        rafId = requestAnimationFrame(checkAndScroll)
        return
      }

      // Find the active (last) message element
      const messageElements = container.querySelectorAll('[role="article"]')
      const activeElement = messageElements[messageElements.length - 1] as HTMLElement | undefined

      if (!activeElement) {
        rafId = requestAnimationFrame(checkAndScroll)
        return
      }

      // Calculate target scroll position
      const containerRect = container.getBoundingClientRect()
      const usableHeight = containerRect.height - DOCK_CLEARANCE

      // Option 1: Center the element in the usable viewport
      const elementCenterInContainer = activeElement.offsetTop + activeElement.offsetHeight / 2
      const viewportCenterOffset = usableHeight * CENTER_TARGET
      const centeredScrollTop = elementCenterInContainer - viewportCenterOffset

      // Option 2: Ensure element bottom stays above the dock
      const elementBottom = activeElement.offsetTop + activeElement.offsetHeight
      const bottomClearanceScrollTop = elementBottom - usableHeight

      // Use whichever scrolls more - ensures bottom never goes under dock
      const targetScrollTop = Math.max(centeredScrollTop, bottomClearanceScrollTop)
      const clampedTarget = Math.max(
        0,
        Math.min(targetScrollTop, container.scrollHeight - container.clientHeight)
      )

      const { scrollTop } = container
      const distance = clampedTarget - scrollTop

      // Check if content bottom is currently visible above dock
      const currentBottomPosition = elementBottom - scrollTop
      const isBottomUnderDock = currentBottomPosition > usableHeight

      // Only scroll if we need to move more than 1px
      if (Math.abs(distance) > 1) {
        // Use aggressive scroll when bottom is under/near dock, smooth otherwise
        const lerpFactor = isBottomUnderDock ? 0.4 : LERP_FACTOR
        const newScrollTop = scrollTop + distance * lerpFactor
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
    // Skip scroll tracking for completed debates
    if (!hasMessages || initialStatus === 'completed') return

    const container = containerRef.current
    if (!container) return

    lastScrollTop.current = container.scrollTop

    const handleScroll = () => {
      // Check current store status to avoid stale closure
      const currentStatus = useDebateViewStore.getState().status
      if (currentStatus === 'completed' || currentStatus === 'ended') {
        return
      }

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

        scrollEndTimeoutRef.current = setTimeout(() => {
          // Double-check status before resetting
          const statusNow = useDebateViewStore.getState().status
          if (statusNow !== 'completed' && statusNow !== 'ended') {
            isUserScrolling.current = false
          }
        }, 1500)
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
  }, [hasMessages, initialStatus])

  // Determine which view state to show
  const showEmptyState = messages.length === 0 && status === 'ready'
  const showWaitingState = messages.length === 0 && (status === 'active' || status === 'completed')
  const showMessageList = messages.length > 0

  // Use dvh for dynamic viewport height on mobile (prevents browser chrome jump)
  const heightStyle = isMobile
    ? { height: '100dvh', minHeight: '100vh' } // dvh with vh fallback
    : undefined

  // Top fade only - dock floats freely over content with no bottom mask
  const maskGradient =
    'linear-gradient(to bottom, transparent 0px, transparent 60px, black 76px, black 100%)'

  // Early return for empty state (no transition needed - this is the initial state)
  if (showEmptyState) {
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

  // Material resolution: skeleton becomes ethereal as content sharpens into focus
  const RESOLUTION_TIMING = {
    duration: 0.28,
    ease: [0.22, 0.61, 0.36, 1] as const,
  }

  return (
    <div className={cn('relative', !isMobile && 'h-full', className)} style={heightStyle}>
      {/* Skeleton loading state - dissolves ethereally (blur out, fade) */}
      <AnimatePresence>
        {showWaitingState && (
          <motion.div
            key="waiting-state"
            className="absolute inset-0 z-10"
            initial={{ opacity: 1, filter: 'blur(0px) contrast(1)' }}
            animate={{ opacity: 1, filter: 'blur(0px) contrast(1)' }}
            exit={{
              opacity: 0,
              filter: 'blur(6px) contrast(0.85)',
              transition: RESOLUTION_TIMING,
            }}
          >
            <WaitingState />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message list - sharpens into focus (blur in, gain contrast) */}
      <AnimatePresence>
        {showMessageList && (
          <motion.div
            key="message-list"
            className="h-full"
            initial={{ opacity: 0.4, filter: 'blur(4px) contrast(0.9)' }}
            animate={{ opacity: 1, filter: 'blur(0px) contrast(1)' }}
            transition={RESOLUTION_TIMING}
          >
            <div
              ref={containerRef}
              className="overflow-y-auto px-4"
              style={{
                height: '100%',
                scrollBehavior: 'auto',
                scrollSnapType: status === 'completed' ? 'y proximity' : undefined,
                scrollPaddingTop: status === 'completed' ? (isMobile ? 144 : 160) : undefined,
                maskImage: maskGradient,
                WebkitMaskImage: maskGradient,
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
                      ? status === 'completed'
                        ? 'pt-36 pb-6'
                        : 'pt-20 pb-6'
                      : status === 'completed'
                        ? 'pt-40 pb-6'
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
                  // Cascade animation triggers on initial page load with completed debate only
                  // Material resolution transition uses blur/contrast, not staggered entrance
                  const shouldCascade =
                    isInitialCascade && status === 'completed' && shouldSkipAnimation

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

                <AnimatePresence>
                  {status === 'completed' && <SummaryHint className="-mt-2" />}
                </AnimatePresence>

                {/* Bottom spacer - clears the floating dock */}
                <div
                  className={cn('h-28', isMobile && 'safe-area-inset-bottom')}
                  aria-hidden="true"
                />

                <div id="scroll-anchor" aria-hidden="true" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
