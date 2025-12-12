// src/components/debate/export-modal.tsx
/**
 * Modal dialog for exporting debate transcripts in various formats.
 * Supports markdown, plain text, and JSON with configurable metadata options.
 */

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

import type { ExportFormat, ExportConfig } from '@/types/export'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (config: ExportConfig) => void
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown')
  const [includeTimestamps, setIncludeTimestamps] = useState(true)
  const [includeTokenCounts, setIncludeTokenCounts] = useState(false)
  const [includeModeratorTurns, setIncludeModeratorTurns] = useState(true)
  const [mounted, setMounted] = useState(false)

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
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const handleExport = () => {
    onExport({
      format,
      includeMetadata: true,
      includeTimestamps,
      includeTokenCounts,
      includeModeratorTurns,
    })
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatOptions: { value: ExportFormat; label: string; description: string }[] = [
    {
      value: 'markdown',
      label: 'Markdown (.md)',
      description: 'Formatted with headers and styling',
    },
    {
      value: 'text',
      label: 'Plain Text (.txt)',
      description: 'Simple text with line breaks',
    },
    {
      value: 'json',
      label: 'JSON (.json)',
      description: 'Structured data for developers',
    },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

      <div
        className={cn(
          'animate-scale-in relative z-10 mx-4 w-full max-w-lg',
          'rounded-2xl overflow-hidden',
          'bg-[#0a0a0b]/95 backdrop-blur-2xl',
          'border border-white/[0.08]',
          'shadow-[0_24px_80px_rgba(0,0,0,0.6)]'
        )}
      >
        <div className="p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Export Transcript</h2>
          <p className="mb-6 text-sm text-zinc-400">Choose format and options for your export</p>

          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-zinc-300">Format</label>
            <div className="space-y-2">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
                    format === option.value
                      ? 'border-white/20 bg-white/[0.06]'
                      : 'border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]'
                  )}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={(e) => setFormat(e.target.value as ExportFormat)}
                    className="mt-1 accent-white"
                  />
                  <div>
                    <div className="font-medium text-zinc-100">{option.label}</div>
                    <div className="text-xs text-zinc-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-zinc-300">Options</label>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeModeratorTurns}
                  onChange={(e) => setIncludeModeratorTurns(e.target.checked)}
                  className="rounded accent-white"
                />
                <span className="text-sm text-zinc-300">Include moderator messages</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeTimestamps}
                  onChange={(e) => setIncludeTimestamps(e.target.checked)}
                  className="rounded accent-white"
                />
                <span className="text-sm text-zinc-300">Include timestamps</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeTokenCounts}
                  onChange={(e) => setIncludeTokenCounts(e.target.checked)}
                  className="rounded accent-white"
                />
                <span className="text-sm text-zinc-300">Include token counts</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium',
                'text-zinc-400 hover:text-zinc-200',
                'hover:bg-white/[0.06]',
                'transition-all duration-150'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium',
                'bg-white text-black',
                'hover:bg-zinc-200',
                'transition-all duration-150',
                'active:scale-95'
              )}
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
