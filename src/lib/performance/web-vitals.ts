// src/lib/performance/web-vitals.ts
// Web Vitals monitoring and reporting

import type { WebVitalsMetric, PerformanceReport } from '@/types/performance'

type WebVitalsCallback = (metric: WebVitalsMetric) => void

const WEB_VITALS_THRESHOLDS: Record<WebVitalsMetric['name'], { good: number; poor: number }> = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
}

function getRating(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
  const thresholds = WEB_VITALS_THRESHOLDS[name]
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

const metricsBuffer: WebVitalsMetric[] = []
let flushTimeout: ReturnType<typeof setTimeout> | null = null

function bufferMetric(metric: WebVitalsMetric): void {
  metricsBuffer.push(metric)

  if (flushTimeout) {
    clearTimeout(flushTimeout)
  }

  flushTimeout = setTimeout(() => {
    flushMetrics()
  }, 5000)
}

function flushMetrics(): void {
  if (metricsBuffer.length === 0) return

  const metrics = [...metricsBuffer]
  metricsBuffer.length = 0

  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT
  if (endpoint) {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics, url: window.location.href }),
      keepalive: true,
    }).catch(() => {
      // Silently fail analytics
    })
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.table(
      metrics.map((m) => ({
        name: m.name,
        value: m.name === 'CLS' ? m.value.toFixed(3) : `${m.value.toFixed(0)}ms`,
        rating: m.rating,
      }))
    )
  }
}

export async function initWebVitals(callback?: WebVitalsCallback): Promise<void> {
  if (typeof window === 'undefined') return

  // Note: FID is deprecated in web-vitals v4, INP replaces it
  const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals')

  const handleMetric = (metric: {
    name: string
    id: string
    value: number
    delta: number
    navigationType: string
  }): void => {
    const webVitalMetric: WebVitalsMetric = {
      id: metric.id,
      name: metric.name as WebVitalsMetric['name'],
      value: metric.value,
      rating: getRating(metric.name as WebVitalsMetric['name'], metric.value),
      delta: metric.delta,
      navigationType: metric.navigationType as WebVitalsMetric['navigationType'],
    }

    bufferMetric(webVitalMetric)
    callback?.(webVitalMetric)
  }

  onCLS(handleMetric)
  onFCP(handleMetric)
  onINP(handleMetric)
  onLCP(handleMetric)
  onTTFB(handleMetric)
}

export function measurePerformance(name: string): () => number {
  const start = performance.now()

  return (): number => {
    const duration = performance.now() - start

    if (typeof window !== 'undefined') {
      performance.mark(`${name}-end`)
      try {
        performance.measure(name, { start, duration })
      } catch {
        // Fallback for browsers with limited Performance API
      }
    }

    return duration
  }
}

export function markPerformance(name: string, metadata?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return

  performance.mark(name, {
    detail: metadata,
  })
}

export function getPerformanceReport(): PerformanceReport {
  const report: PerformanceReport = {
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: Date.now(),
    webVitals: {},
    resourceTimings: [],
    customMarkers: [],
  }

  if (typeof window === 'undefined') return report

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  report.resourceTimings = entries.slice(-50).map((entry) => ({
    name: entry.name,
    initiatorType: entry.initiatorType,
    duration: entry.duration,
    transferSize: entry.transferSize,
    decodedBodySize: entry.decodedBodySize,
  }))

  const marks = performance.getEntriesByType('mark') as PerformanceMark[]
  report.customMarkers = marks.map((mark) => {
    const detail = mark.detail as Record<string, unknown> | undefined
    return {
      name: mark.name,
      startTime: mark.startTime,
      metadata: detail ?? undefined,
    }
  })

  if ('memory' in performance) {
    const memory = (
      performance as Performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }
    ).memory
    report.memoryUsage = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
    }
  }

  return report
}

export function clearPerformanceMarks(): void {
  if (typeof window === 'undefined') return
  performance.clearMarks()
  performance.clearMeasures()
}
