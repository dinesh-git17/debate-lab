// src/hooks/use-in-view.ts
// Simple hook for detecting when an element is in view

'use client'

import { RefObject, useEffect, useState } from 'react'

interface UseInViewOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useInView(ref: RefObject<Element | null>, options: UseInViewOptions = {}): boolean {
  const { threshold = 0.1, rootMargin = '0px', once = false } = options
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // If already in view and once is true, don't re-observe
    if (isInView && once) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        const visible = entry.isIntersecting
        setIsInView(visible)

        // If once is true and element is visible, disconnect
        if (visible && once) {
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref, threshold, rootMargin, once, isInView])

  return isInView
}
