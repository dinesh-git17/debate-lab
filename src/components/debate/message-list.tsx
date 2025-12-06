// src/components/debate/message-list.tsx

'use client'

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
    <div className="flex h-full flex-col items-center justify-center">
      {/* Title */}
      <h1 className="text-center text-5xl font-semibold tracking-tighter text-white md:text-7xl">
        {sanitizeTopic(topic)}
      </h1>

      {/* Metadata Pills */}
      <div className="mt-6 flex gap-3">
        <div className="flex h-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] px-4 text-xs font-medium uppercase tracking-wide text-zinc-400">
          {formatDisplayName}
        </div>
        <div className="flex h-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] px-4 text-xs font-medium uppercase tracking-wide text-zinc-400">
          2 Agents
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleStart}
        disabled={isLoading}
        className="mt-10 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-white/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isLoading ? 'Starting...' : 'Start Debate'}
      </button>
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
