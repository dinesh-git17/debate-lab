// src/app/(debate)/debate/new/new-debate-form.tsx
'use client'

import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { DebateForm, type DebateFormSubmitData } from '@/components/features/debate-form'
import { BanModal, useBanStatus } from '@/components/ui/ban-modal'
import { ConsoleOverlay } from '@/components/ui/console-overlay'
import { DEBATE_CREATION_SCRIPT, getRandomizedScript } from '@/lib/console-scripts'
import { cn } from '@/lib/utils'

import { createDebate } from './actions'

export function NewDebateForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  const [consoleTopic, setConsoleTopic] = useState('')
  const pendingDebateId = useRef<string | null>(null)
  const pendingError = useRef<{
    error: string
    blocked?: boolean | undefined
    blockReason?: string | undefined
  } | null>(null)
  const banStatus = useBanStatus()
  const [showBanModal, setShowBanModal] = useState(true)

  const handleSubmit = async (data: DebateFormSubmitData) => {
    setIsSubmitting(true)
    setConsoleTopic(data.topic)
    setShowConsole(true)
    pendingDebateId.current = null
    pendingError.current = null

    try {
      // API call runs in parallel with console animation
      const result = await createDebate(data)

      if (result.success && result.debateId) {
        pendingDebateId.current = result.debateId
        // Console onComplete will handle navigation
        return { success: true }
      }

      // Store error for console completion handler
      pendingError.current = {
        error: result.error ?? 'Failed to create debate',
        blocked: result.blocked,
        blockReason: result.blockReason,
      }
      return {
        success: false,
        error: result.error ?? 'Failed to create debate',
        blocked: result.blocked,
        blockReason: result.blockReason,
      }
    } catch {
      pendingError.current = { error: 'An unexpected error occurred' }
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const handleConsoleComplete = () => {
    if (pendingDebateId.current) {
      router.push(`/debate/${pendingDebateId.current}`)
    } else if (pendingError.current) {
      // Error occurred, hide console and show error
      setShowConsole(false)
      setIsSubmitting(false)
    } else {
      // API still loading, wait a bit more
      const checkInterval = setInterval(() => {
        if (pendingDebateId.current) {
          clearInterval(checkInterval)
          router.push(`/debate/${pendingDebateId.current}`)
        } else if (pendingError.current) {
          clearInterval(checkInterval)
          setShowConsole(false)
          setIsSubmitting(false)
        }
      }, 100)

      // Timeout after 10s
      setTimeout(() => {
        clearInterval(checkInterval)
        if (!pendingDebateId.current) {
          setShowConsole(false)
          setIsSubmitting(false)
        }
      }, 10000)
    }
  }

  // Handle ban modal close (only when ban expires)
  const handleBanModalClose = () => {
    setShowBanModal(false)
  }

  return (
    <>
      {/* Ban Modal - shown if user is banned */}
      {banStatus.isBanned && banStatus.banType && showBanModal && (
        <BanModal
          isOpen={true}
          onClose={handleBanModalClose}
          banType={banStatus.banType}
          reason={banStatus.reason ?? 'Policy violation'}
          expiresAt={banStatus.expiresAt}
          remainingMs={banStatus.remainingMs}
        />
      )}

      {/* Intelligence Console Loading Overlay */}
      <AnimatePresence>
        {showConsole && (
          <ConsoleOverlay
            steps={getRandomizedScript(DEBATE_CREATION_SCRIPT)}
            topic={consoleTopic}
            onComplete={handleConsoleComplete}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          // Apple-style card with subtle elevation
          'relative rounded-2xl',
          'p-6 sm:p-8 md:p-10',
          // Light mode - clean white with subtle shadow
          'bg-white',
          'border border-neutral-200/60',
          'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)]',
          // Dark mode - elevated surface
          'dark:bg-white/[0.02]',
          'dark:border-white/[0.08]',
          'dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_0_0.5px_rgba(255,255,255,0.05)]',
          // Animation
          'animate-[fadeSlideUp_0.6s_ease-out_0.15s_forwards] opacity-0'
        )}
      >
        <DebateForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </>
  )
}
