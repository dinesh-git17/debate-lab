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
    <div className="relative flex h-full flex-col items-center justify-center">
      {/* God Ray - entrance fade + heartbeat */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[1800px] w-[1800px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.015) 30%, rgba(255, 255, 255, 0) 70%)',
        }}
        initial={{ opacity: 0, scale: 1 }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
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
        {/* Static glow layer */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: '0 0 120px -20px rgba(255, 255, 255, 0.25)',
          }}
        />
        <motion.button
          onClick={handleStart}
          disabled={isLoading}
          className={cn(
            'relative rounded-full bg-white px-8 py-4',
            'text-sm font-semibold text-black',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? 'Starting...' : 'Start Debate'}
        </motion.button>
      </motion.div>
    </div>
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
