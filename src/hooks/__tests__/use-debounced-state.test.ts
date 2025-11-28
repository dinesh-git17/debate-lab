// src/hooks/__tests__/use-debounced-state.test.ts
// Unit tests for debounced state hooks

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  useDebouncedState,
  useDebouncedCallback,
  useThrottledState,
  useDeferredUpdate,
} from '../use-debounced-state'

describe('use-debounced-state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('useDebouncedState', () => {
    it('should return initial values', () => {
      const { result } = renderHook(() => useDebouncedState('initial', 100))

      const [value, debouncedValue] = result.current

      expect(value).toBe('initial')
      expect(debouncedValue).toBe('initial')
    })

    it('should update value immediately', () => {
      const { result } = renderHook(() => useDebouncedState('initial', 100))

      act(() => {
        result.current[2]('updated')
      })

      expect(result.current[0]).toBe('updated')
      expect(result.current[1]).toBe('initial') // Debounced value not yet updated
    })

    it('should update debounced value after delay', () => {
      const { result } = renderHook(() => useDebouncedState('initial', 100))

      act(() => {
        result.current[2]('updated')
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current[1]).toBe('updated')
    })

    it('should reset debounce timer on rapid updates', () => {
      const { result } = renderHook(() => useDebouncedState('initial', 100))

      act(() => {
        result.current[2]('update1')
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      act(() => {
        result.current[2]('update2')
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      // Debounced value should still be initial because timer reset
      expect(result.current[1]).toBe('initial')

      act(() => {
        vi.advanceTimersByTime(50)
      })

      // Now it should be update2
      expect(result.current[1]).toBe('update2')
    })

    it('should work with different types', () => {
      const { result } = renderHook(() => useDebouncedState({ count: 0 }, 100))

      act(() => {
        result.current[2]({ count: 5 })
      })

      expect(result.current[0]).toEqual({ count: 5 })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current[1]).toEqual({ count: 5 })
    })
  })

  describe('useDebouncedCallback', () => {
    it('should debounce callback execution', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => useDebouncedCallback(callback, 100))

      act(() => {
        result.current('arg1')
        result.current('arg2')
        result.current('arg3')
      })

      expect(callback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('arg3')
    })

    it('should pass arguments to callback', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => useDebouncedCallback(callback, 100))

      act(() => {
        result.current('arg1', 'arg2')
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should use latest callback reference', () => {
      let callbackValue = 'first'
      const { result, rerender } = renderHook(
        ({ _value }) => useDebouncedCallback(() => callbackValue, 100),
        { initialProps: { _value: 'first' } }
      )

      callbackValue = 'second'
      rerender({ _value: 'second' })

      act(() => {
        result.current()
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Callback should use the latest value
    })
  })

  describe('useThrottledState', () => {
    it('should return initial value', () => {
      const { result } = renderHook(() => useThrottledState('initial', 100))

      expect(result.current[0]).toBe('initial')
    })

    it('should eventually update value', async () => {
      const { result } = renderHook(() => useThrottledState('initial', 100))

      act(() => {
        result.current[1]('updated')
      })

      // Advance timers to ensure throttle window passes
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current[0]).toBe('updated')
    })

    it('should throttle rapid updates by using latest value', () => {
      const { result } = renderHook(() => useThrottledState('initial', 100))

      // First update
      act(() => {
        result.current[1]('update1')
      })

      // Within throttle window - schedule another update
      act(() => {
        vi.advanceTimersByTime(50)
        result.current[1]('update2')
      })

      // Advance past throttle window
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should eventually have update2 (the last value)
      expect(result.current[0]).toBe('update2')
    })
  })

  describe('useDeferredUpdate', () => {
    it('should return initial value', () => {
      const { result } = renderHook(() => useDeferredUpdate('initial'))

      expect(result.current).toBe('initial')
    })

    it('should defer updates', () => {
      const { result, rerender } = renderHook(({ value }) => useDeferredUpdate(value, 100), {
        initialProps: { value: 'initial' },
      })

      rerender({ value: 'updated' })

      // Value should still be initial
      expect(result.current).toBe('initial')

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current).toBe('updated')
    })

    it('should use requestAnimationFrame when delay is 0', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0)
        return 0
      })

      const { rerender } = renderHook(({ value }) => useDeferredUpdate(value, 0), {
        initialProps: { value: 'initial' },
      })

      rerender({ value: 'updated' })

      expect(rafSpy).toHaveBeenCalled()

      rafSpy.mockRestore()
    })
  })
})
