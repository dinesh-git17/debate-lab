// src/types/performance.ts
// Performance monitoring and optimization type definitions

export interface WebVitalsMetric {
  id: string
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender'
}

export interface PerformanceBudget {
  metric: string
  budget: number
  unit: 'ms' | 'kb' | 'score'
}

export interface BundleAnalysis {
  totalSize: number
  gzippedSize: number
  chunks: ChunkInfo[]
  largestModules: ModuleInfo[]
}

export interface ChunkInfo {
  name: string
  size: number
  gzippedSize: number
  modules: number
  isInitial: boolean
}

export interface ModuleInfo {
  name: string
  size: number
  percentage: number
}

export interface ImageOptimizationConfig {
  deviceSizes: number[]
  imageSizes: number[]
  formats: ('image/avif' | 'image/webp')[]
  minimumCacheTTL: number
  dangerouslyAllowSVG: boolean
}

export interface CacheConfig {
  staleTime: number
  gcTime: number
  refetchOnWindowFocus: boolean
  refetchOnReconnect: boolean
  retry: number | boolean
}

export interface VirtualListConfig {
  itemHeight: number
  overscan: number
  initialScrollOffset?: number
}

export interface PerformanceMarker {
  name: string
  startTime: number
  duration?: number | undefined
  metadata?: Record<string, unknown> | undefined
}

export interface ResourceTiming {
  name: string
  initiatorType: string
  duration: number
  transferSize: number
  decodedBodySize: number
}

export interface PerformanceReport {
  url: string
  timestamp: number
  webVitals: Partial<Record<WebVitalsMetric['name'], number>>
  resourceTimings: ResourceTiming[]
  customMarkers: PerformanceMarker[]
  memoryUsage?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
  }
}

export interface LazyComponentConfig {
  loading?: React.ComponentType
  ssr?: boolean
  suspense?: boolean
}

export interface PrefetchConfig {
  routes: string[]
  priority: 'high' | 'low'
  when: 'hover' | 'visible' | 'immediate'
}
