// src/components/debate/shortcuts-help.tsx
/**
 * Keyboard shortcuts reference panel with available debate actions.
 * Displays in a dismissible popover with platform-aware key formatting.
 */

'use client'

import { useState, useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { formatShortcut } from '@/hooks/use-keyboard-shortcuts'
import { cn } from '@/lib/utils'

import type { ShortcutConfig } from '@/hooks/use-keyboard-shortcuts'

const SHORTCUTS: Omit<ShortcutConfig, 'action'>[] = [
  { key: 'e', ctrl: true, description: 'Export transcript' },
  { key: 'N', shift: true, description: 'New debate' },
  { key: 'Escape', description: 'Close modal' },
]

interface ShortcutsHelpProps {
  className?: string
}

export function ShortcutsHelp({ className }: ShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-muted-foreground"
      >
        ⌨️ Shortcuts
      </Button>

      {isOpen && (
        <div className="animate-scale-in absolute bottom-full right-0 mb-2 w-64 rounded-lg border bg-card p-4 shadow-lg">
          <h3 className="mb-3 text-sm font-semibold">Keyboard Shortcuts</h3>
          <ul className="space-y-2">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{shortcut.description}</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                  {formatShortcut({ ...shortcut, action: () => {} })}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
