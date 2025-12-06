// src/components/ui/confirm-modal.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure we only render portal on client
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    confirmButtonRef.current?.focus()

    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Render via portal to escape parent positioning context
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop - strong blur to lock background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

      {/* Modal - dark glass styling */}
      <div
        ref={modalRef}
        className={cn(
          'animate-scale-in relative z-10 mx-4 w-full max-w-md',
          'rounded-2xl overflow-hidden',
          'bg-[#0a0a0b]/95 backdrop-blur-2xl',
          'border border-white/[0.08]',
          'shadow-[0_24px_80px_rgba(0,0,0,0.6)]'
        )}
      >
        <div className="p-6">
          {/* Header */}
          <h2 id="modal-title" className="mb-2 text-lg font-semibold text-white">
            {title}
          </h2>

          {/* Description */}
          <p className="mb-6 text-zinc-400">{description}</p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium',
                'text-zinc-400 hover:text-zinc-200',
                'hover:bg-white/[0.06]',
                'transition-all duration-150',
                'disabled:opacity-50'
              )}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium',
                'transition-all duration-150',
                'active:scale-95',
                'disabled:opacity-50',
                variant === 'destructive'
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-white text-black hover:bg-zinc-200'
              )}
            >
              {isLoading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
