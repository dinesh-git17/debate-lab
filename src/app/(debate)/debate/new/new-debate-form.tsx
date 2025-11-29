// src/app/(debate)/debate/new/new-debate-form.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { DebateForm } from '@/components/features/debate-form'
import { cn } from '@/lib/utils'

import { createDebate } from './actions'

import type { DebateFormValues } from '@/lib/schemas/debate-schema'

export function NewDebateForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: DebateFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await createDebate(data)
      if (result.success && result.debateId) {
        router.push(`/debate/${result.debateId}`)
        return { success: true }
      }
      return { success: false, error: result.error ?? 'Failed to create debate' }
    } catch {
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
  )
}
