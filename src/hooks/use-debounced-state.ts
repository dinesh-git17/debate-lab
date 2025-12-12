// use-debounced-state.ts
/**
 * State management utilities with debouncing, throttling, and transitions.
 * Optimizes high-frequency state updates for performance.
 */

'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'

export function useDebouncedState<T>(initialValue: T, delay: number): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue)
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [value, debouncedValue, setValue]
}

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [delay]
  )
}

export function useThrottledState<T>(initialValue: T, limit: number): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue)
  const lastRan = useRef<number>(Date.now())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const throttledSetValue = useCallback(
    (newValue: T) => {
      const now = Date.now()

      if (now - lastRan.current >= limit) {
        setValue(newValue)
        lastRan.current = now
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(
          () => {
            setValue(newValue)
            lastRan.current = Date.now()
          },
          limit - (now - lastRan.current)
        )
      }
    },
    [limit]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [value, throttledSetValue]
}

export function useTransitionState<T>(initialValue: T): [T, T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue)
  const [displayValue, setDisplayValue] = useState<T>(initialValue)
  const [isPending, startTransition] = useTransition()

  const setValueWithTransition = useCallback((newValue: T) => {
    setValue(newValue)
    startTransition(() => {
      setDisplayValue(newValue)
    })
  }, [])

  return [value, displayValue, setValueWithTransition, isPending]
}

export function useDeferredUpdate<T>(value: T, delay = 0): T {
  const [deferredValue, setDeferredValue] = useState(value)

  useEffect(() => {
    if (delay === 0) {
      requestAnimationFrame(() => {
        setDeferredValue(value)
      })
    } else {
      const timeout = setTimeout(() => {
        setDeferredValue(value)
      }, delay)
      return () => clearTimeout(timeout)
    }
  }, [value, delay])

  return deferredValue
}
