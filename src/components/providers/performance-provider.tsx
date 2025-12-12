// src/components/providers/performance-provider.tsx
/**
 * Initializes client-side performance monitoring and optimizations.
 * Configures Web Vitals reporting and link prefetching on mount.
 */

'use client'

import React, { useEffect, type ReactNode } from 'react'

import { initWebVitals, initPrefetching } from '@/lib/performance'

interface PerformanceProviderProps {
  children: ReactNode
  enableWebVitals?: boolean
  enablePrefetching?: boolean
  onWebVital?: (metric: { name: string; value: number; rating: string }) => void
}

export function PerformanceProvider({
  children,
  enableWebVitals = true,
  enablePrefetching = true,
  onWebVital,
}: PerformanceProviderProps): React.ReactElement {
  useEffect(() => {
    if (enableWebVitals) {
      initWebVitals(onWebVital)
    }
  }, [enableWebVitals, onWebVital])

  useEffect(() => {
    if (enablePrefetching) {
      initPrefetching()
    }
  }, [enablePrefetching])

  return <>{children}</>
}

export function useReportWebVitals(): void {
  useEffect(() => {
    initWebVitals((metric) => {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
      })

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/vitals', body)
      } else {
        fetch('/api/analytics/vitals', {
          method: 'POST',
          body,
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => {
          // Silently fail
        })
      }
    })
  }, [])
}
