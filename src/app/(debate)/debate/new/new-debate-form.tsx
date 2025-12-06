// src/app/(debate)/debate/new/new-debate-form.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { DebateForm, type DebateFormSubmitData } from '@/components/features/debate-form'
import { BanModal, useBanStatus } from '@/components/ui/ban-modal'
import { cn } from '@/lib/utils'

import { createDebate } from './actions'

export function NewDebateForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const banStatus = useBanStatus()
  const [showBanModal, setShowBanModal] = useState(true)

  const handleSubmit = async (data: DebateFormSubmitData) => {
    setIsSubmitting(true)
    setLoadingMessage('Preparing your debate...')

    try {
      // Small delay to let animation start smoothly
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Show appropriate message based on whether topic was already polished
      setLoadingMessage(data.alreadyPolished ? 'Creating debate...' : 'Polishing topic...')
      const result = await createDebate(data)

      if (result.success && result.debateId) {
        setLoadingMessage('Launching debate...')
        // Brief pause before navigation for smooth transition
        await new Promise((resolve) => setTimeout(resolve, 200))
        router.push(`/debate/${result.debateId}`)
        // Don't reset isSubmitting - component will unmount on navigation
        return { success: true }
      }
      setIsSubmitting(false)
      setLoadingMessage('')
      return {
        success: false,
        error: result.error ?? 'Failed to create debate',
        blocked: result.blocked,
        blockReason: result.blockReason,
      }
    } catch {
      setIsSubmitting(false)
      setLoadingMessage('')
      return { success: false, error: 'An unexpected error occurred' }
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

      {/* Loading Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0b]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Breathing background glow */}
            <motion.div
              className="absolute h-[600px] w-[600px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)',
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Loading spinner */}
            <motion.div
              className="relative h-12 w-12 rounded-full border-2 border-white/10 border-t-white/60"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Loading message */}
            <motion.p
              className="mt-6 text-sm font-medium text-zinc-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={loadingMessage}
            >
              {loadingMessage}
            </motion.p>
          </motion.div>
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
