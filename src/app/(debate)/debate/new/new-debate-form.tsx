// src/app/(debate)/debate/new/new-debate-form.tsx
'use client'

import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  const [mounted, setMounted] = useState(false)
  const pendingDebateId = useRef<string | null>(null)
  const pendingError = useRef<{
    error: string
    blocked?: boolean | undefined
    blockReason?: string | undefined
  } | null>(null)
  const banStatus = useBanStatus()
  const [showBanModal, setShowBanModal] = useState(true)

  // Required for portal rendering to document.body
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (data: DebateFormSubmitData) => {
    setIsSubmitting(true)
    setConsoleTopic(data.topic)
    setShowConsole(true)
    pendingDebateId.current = null
    pendingError.current = null

    try {
      const result = await createDebate(data)

      if (result.success && result.debateId) {
        pendingDebateId.current = result.debateId
        return { success: true }
      }

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
      setShowConsole(false)
      setIsSubmitting(false)
    } else {
      // Poll for API completion if console animation finishes first
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

      setTimeout(() => {
        clearInterval(checkInterval)
        if (!pendingDebateId.current) {
          setShowConsole(false)
          setIsSubmitting(false)
        }
      }, 10000)
    }
  }

  const handleBanModalClose = () => {
    setShowBanModal(false)
  }

  return (
    <>
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

      {mounted &&
        showConsole &&
        createPortal(
          <AnimatePresence>
            <ConsoleOverlay
              steps={getRandomizedScript(DEBATE_CREATION_SCRIPT)}
              topic={consoleTopic}
              onComplete={handleConsoleComplete}
            />
          </AnimatePresence>,
          document.body
        )}

      <div
        className={cn(
          'relative rounded-2xl',
          'p-6 sm:p-8 md:p-10',
          'bg-white',
          'border border-neutral-200/60',
          'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)]',
          'dark:bg-white/[0.02]',
          'dark:border-white/[0.08]',
          'dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_0_0.5px_rgba(255,255,255,0.05)]',
          'animate-[fadeSlideUp_0.6s_ease-out_0.15s_forwards] opacity-0'
        )}
      >
        <DebateForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </>
  )
}
