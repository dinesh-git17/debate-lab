// src/lib/performance/prefetch.ts
// Route and component prefetching utilities

import { PREFETCH_ROUTES } from './bundle-config'

type PrefetchPriority = 'high' | 'low'

const prefetchedRoutes = new Set<string>()
const prefetchQueue: Array<{ route: string; priority: PrefetchPriority }> = []
let isProcessingQueue = false

export function prefetchRoute(route: string, priority: PrefetchPriority = 'low'): void {
  if (typeof window === 'undefined') return
  if (prefetchedRoutes.has(route)) return

  if (priority === 'high') {
    executePrefetch(route)
  } else {
    prefetchQueue.push({ route, priority })
    processQueue()
  }
}

function executePrefetch(route: string): void {
  if (prefetchedRoutes.has(route)) return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = route
  link.as = 'document'
  document.head.appendChild(link)

  prefetchedRoutes.add(route)
}

function processQueue(): void {
  if (isProcessingQueue || prefetchQueue.length === 0) return

  isProcessingQueue = true

  const processNext = (): void => {
    if (prefetchQueue.length === 0) {
      isProcessingQueue = false
      return
    }

    const item = prefetchQueue.shift()
    if (item) {
      executePrefetch(item.route)
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(processNext, { timeout: 2000 })
    } else {
      setTimeout(processNext, 100)
    }
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(processNext, { timeout: 2000 })
  } else {
    setTimeout(processNext, 100)
  }
}

export function prefetchCriticalRoutes(): void {
  if (typeof window === 'undefined') return

  for (const route of PREFETCH_ROUTES) {
    prefetchRoute(route, 'low')
  }
}

export function prefetchOnHover(route: string): {
  onMouseEnter: () => void
  onFocus: () => void
} {
  let prefetched = false

  const prefetch = (): void => {
    if (prefetched) return
    prefetched = true
    prefetchRoute(route, 'high')
  }

  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
  }
}

export function prefetchImages(urls: string[]): void {
  if (typeof window === 'undefined') return

  for (const url of urls) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    link.as = 'image'
    document.head.appendChild(link)
  }
}

export function preconnect(origins: string[]): void {
  if (typeof window === 'undefined') return

  for (const origin of origins) {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = origin
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }
}

export function dnsPrefetch(origins: string[]): void {
  if (typeof window === 'undefined') return

  for (const origin of origins) {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = origin
    document.head.appendChild(link)
  }
}

export const LLM_API_ORIGINS = [
  'https://api.openai.com',
  'https://api.anthropic.com',
  'https://api.x.ai',
] as const

export function initPrefetching(): void {
  if (typeof window === 'undefined') return

  preconnect([...LLM_API_ORIGINS])

  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        prefetchCriticalRoutes()
      },
      { timeout: 5000 }
    )
  } else {
    setTimeout(prefetchCriticalRoutes, 2000)
  }
}
