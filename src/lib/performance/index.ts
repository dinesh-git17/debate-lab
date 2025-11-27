// src/lib/performance/index.ts
// Performance module barrel export

export {
  initWebVitals,
  measurePerformance,
  markPerformance,
  getPerformanceReport,
  clearPerformanceMarks,
} from './web-vitals'

export {
  PERFORMANCE_BUDGETS,
  HEAVY_MODULES,
  DYNAMIC_IMPORT_PATHS,
  PREFETCH_ROUTES,
  CRITICAL_ROUTES,
  shouldDynamicImport,
  getChunkName,
  estimateModuleSize,
  EXTERNAL_PACKAGES,
  BROWSER_EXCLUDE_PACKAGES,
} from './bundle-config'

export {
  QUERY_CACHE_CONFIGS,
  getCacheConfig,
  HTTP_CACHE_CONFIGS,
  buildCacheControlHeader,
  getHttpCacheHeaders,
  REVALIDATION_TIMES,
  getRevalidationTime,
  type HttpCacheConfig,
  type CacheControlDirective,
  type RevalidationKey,
} from './cache-config'

export {
  IMAGE_CONFIG,
  REMOTE_PATTERNS,
  COMMON_IMAGE_SIZES,
  buildSizesAttribute,
  getImageSizes,
  BLUR_PLACEHOLDER_CONFIG,
  generateBlurDataUrl,
  getImagePriority,
  type ResponsiveImageSizes,
  type ImagePriority,
} from './image-config'

export {
  prefetchRoute,
  prefetchCriticalRoutes,
  prefetchOnHover,
  prefetchImages,
  preconnect,
  dnsPrefetch,
  LLM_API_ORIGINS,
  initPrefetching,
} from './prefetch'

export type {
  WebVitalsMetric,
  PerformanceBudget,
  BundleAnalysis,
  ChunkInfo,
  ModuleInfo,
  ImageOptimizationConfig,
  CacheConfig,
  VirtualListConfig,
  PerformanceMarker,
  ResourceTiming,
  PerformanceReport,
  LazyComponentConfig,
  PrefetchConfig,
} from '@/types/performance'
