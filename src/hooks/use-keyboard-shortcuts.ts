// use-keyboard-shortcuts.ts
/**
 * Global keyboard shortcut handler with modifier key support.
 * Automatically skips input elements to avoid conflicts.
 */

import { useEffect, useCallback } from 'react'

export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  action: () => void
  description: string
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      for (const shortcut of shortcuts) {
        const ctrlOrMeta = shortcut.ctrl || shortcut.meta
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const modifierMatches = ctrlOrMeta
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey

        if (keyMatches && modifierMatches && shiftMatches) {
          event.preventDefault()
          shortcut.action()
          return
        }
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/** Formats shortcut for display with platform-appropriate symbols. */
export function formatShortcut(shortcut: ShortcutConfig): string {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
  const parts: string[] = []

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift')
  }
  parts.push(shortcut.key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}
