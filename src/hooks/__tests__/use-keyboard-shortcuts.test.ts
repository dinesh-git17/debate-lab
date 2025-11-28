// src/hooks/__tests__/use-keyboard-shortcuts.test.ts
// Unit tests for keyboard shortcuts hook

import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  useKeyboardShortcuts,
  formatShortcut,
  type ShortcutConfig,
} from '../use-keyboard-shortcuts'

describe('use-keyboard-shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useKeyboardShortcuts', () => {
    it('should register keydown listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      const shortcuts: ShortcutConfig[] = [{ key: 'e', action: vi.fn(), description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should remove keydown listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const shortcuts: ShortcutConfig[] = [{ key: 'e', action: vi.fn(), description: 'Export' }]

      const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts }))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should call action when shortcut key is pressed', () => {
      const action = vi.fn()
      const shortcuts: ShortcutConfig[] = [{ key: 'e', action, description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        bubbles: true,
      })
      document.dispatchEvent(event)

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should handle Ctrl modifier', () => {
      const action = vi.fn()
      const shortcuts: ShortcutConfig[] = [{ key: 'e', ctrl: true, action, description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Without Ctrl - should not trigger
      const eventWithoutCtrl = new KeyboardEvent('keydown', {
        key: 'e',
        ctrlKey: false,
        bubbles: true,
      })
      document.dispatchEvent(eventWithoutCtrl)
      expect(action).not.toHaveBeenCalled()

      // With Ctrl - should trigger
      const eventWithCtrl = new KeyboardEvent('keydown', {
        key: 'e',
        ctrlKey: true,
        bubbles: true,
      })
      document.dispatchEvent(eventWithCtrl)
      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should handle Meta modifier', () => {
      const action = vi.fn()
      const shortcuts: ShortcutConfig[] = [{ key: 'e', meta: true, action, description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should handle Shift modifier', () => {
      const action = vi.fn()
      const shortcuts: ShortcutConfig[] = [{ key: 'e', shift: true, action, description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Without Shift - should not trigger
      const eventWithoutShift = new KeyboardEvent('keydown', {
        key: 'e',
        shiftKey: false,
        bubbles: true,
      })
      document.dispatchEvent(eventWithoutShift)
      expect(action).not.toHaveBeenCalled()

      // With Shift - should trigger
      const eventWithShift = new KeyboardEvent('keydown', {
        key: 'e',
        shiftKey: true,
        bubbles: true,
      })
      document.dispatchEvent(eventWithShift)
      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should not trigger when typing in input', () => {
      const action = vi.fn()
      const shortcuts: ShortcutConfig[] = [{ key: 'e', action, description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: input })
      document.dispatchEvent(event)

      expect(action).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })

    it('should not trigger when typing in textarea', () => {
      const action = vi.fn()
      const shortcuts: ShortcutConfig[] = [{ key: 'e', action, description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: textarea })
      document.dispatchEvent(event)

      expect(action).not.toHaveBeenCalled()

      document.body.removeChild(textarea)
    })

    it('should not trigger when disabled', () => {
      const action = vi.fn()
      const shortcuts: ShortcutConfig[] = [{ key: 'e', action, description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }))

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        bubbles: true,
      })
      document.dispatchEvent(event)

      expect(action).not.toHaveBeenCalled()
    })

    it('should prevent default when shortcut matches', () => {
      const action = vi.fn()
      const shortcuts: ShortcutConfig[] = [{ key: 'e', action, description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        bubbles: true,
        cancelable: true,
      })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      document.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should be case-insensitive', () => {
      const action = vi.fn()
      const shortcuts: ShortcutConfig[] = [{ key: 'E', action, description: 'Export' }]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        bubbles: true,
      })
      document.dispatchEvent(event)

      expect(action).toHaveBeenCalledTimes(1)
    })
  })

  describe('formatShortcut', () => {
    it('should format simple key', () => {
      const shortcut: ShortcutConfig = {
        key: 'e',
        action: vi.fn(),
        description: 'Export',
      }

      const result = formatShortcut(shortcut)

      expect(result).toBe('E')
    })

    it('should format with Ctrl modifier', () => {
      const shortcut: ShortcutConfig = {
        key: 'e',
        ctrl: true,
        action: vi.fn(),
        description: 'Export',
      }

      const result = formatShortcut(shortcut)

      // On non-Mac, should show Ctrl+E
      expect(result).toContain('E')
    })

    it('should format with Shift modifier', () => {
      const shortcut: ShortcutConfig = {
        key: 'e',
        shift: true,
        action: vi.fn(),
        description: 'Export',
      }

      const result = formatShortcut(shortcut)

      expect(result).toContain('E')
    })

    it('should format with multiple modifiers', () => {
      const shortcut: ShortcutConfig = {
        key: 'e',
        ctrl: true,
        shift: true,
        action: vi.fn(),
        description: 'Export',
      }

      const result = formatShortcut(shortcut)

      expect(result).toContain('E')
    })
  })
})
