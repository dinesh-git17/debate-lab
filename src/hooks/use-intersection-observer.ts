// use-intersection-observer.ts
/**
 * IntersectionObserver hooks for lazy loading and visibility detection.
 * Provides utilities for prefetching, element visibility, and deferred rendering.
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
  initialIsVisible?: boolean
}

interface UseIntersectionObserverResult {
  ref: (node: Element | null) => void
  isVisible: boolean
  entry: IntersectionObserverEntry | null
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverResult {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
    initialIsVisible = false,
  } = options

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [isVisible, setIsVisible] = useState(initialIsVisible)
  const frozen = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const ref = useCallback(
    (node: Element | null) => {
      if (frozen.current) return

      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      if (node) {
        const observer = new IntersectionObserver(
          ([observerEntry]) => {
            if (!observerEntry) return
            setEntry(observerEntry)
            const visible = observerEntry.isIntersecting
            setIsVisible(visible)

            if (visible && freezeOnceVisible) {
              frozen.current = true
              observer.disconnect()
            }
          },
          { threshold, root, rootMargin }
        )

        observer.observe(node)
        observerRef.current = observer
      }
    },
    [threshold, root, rootMargin, freezeOnceVisible]
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return { ref, isVisible, entry }
}

interface UseLazyLoadOptions extends UseIntersectionObserverOptions {
  onVisible?: () => void
}

export function useLazyLoad(options: UseLazyLoadOptions = {}): {
  ref: (node: Element | null) => void
  isLoaded: boolean
} {
  const { onVisible, ...observerOptions } = options
  const { ref, isVisible } = useIntersectionObserver({
    ...observerOptions,
    freezeOnceVisible: true,
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (isVisible && !isLoaded) {
      setIsLoaded(true)
      onVisible?.()
    }
  }, [isVisible, isLoaded, onVisible])

  return { ref, isLoaded }
}

export function useElementVisibility(
  elementRef: React.RefObject<Element | null>,
  options: Omit<UseIntersectionObserverOptions, 'freezeOnceVisible'> = {}
): boolean {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        if (!observerEntry) return
        setIsVisible(observerEntry.isIntersecting)
      },
      {
        threshold: options.threshold ?? 0,
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? '0px',
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [elementRef, options.threshold, options.root, options.rootMargin])

  return isVisible
}

export function usePrefetchOnVisible(
  prefetchFn: () => void,
  options: UseIntersectionObserverOptions = {}
): (node: Element | null) => void {
  const hasPrefetched = useRef(false)
  const { ref, isVisible } = useIntersectionObserver({
    ...options,
    rootMargin: options.rootMargin ?? '200px',
    freezeOnceVisible: true,
  })

  useEffect(() => {
    if (isVisible && !hasPrefetched.current) {
      hasPrefetched.current = true
      prefetchFn()
    }
  }, [isVisible, prefetchFn])

  return ref
}
