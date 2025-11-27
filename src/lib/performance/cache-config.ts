// src/lib/performance/cache-config.ts
// Caching configuration for React Query and HTTP responses

import type { CacheConfig } from '@/types/performance'

export const QUERY_CACHE_CONFIGS: Record<string, CacheConfig> = {
  debate: {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
  },
  debateList: {
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  },
  debateMessages: {
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  },
  summary: {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  },
  share: {
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  },
  static: {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  },
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 2,
}

export function getCacheConfig(key: string): CacheConfig {
  return QUERY_CACHE_CONFIGS[key] ?? DEFAULT_CACHE_CONFIG
}

export type CacheControlDirective =
  | 'public'
  | 'private'
  | 'no-cache'
  | 'no-store'
  | 'must-revalidate'
  | 'immutable'

export interface HttpCacheConfig {
  directives: CacheControlDirective[]
  maxAge: number
  sMaxAge?: number
  staleWhileRevalidate?: number
}

export const HTTP_CACHE_CONFIGS: Record<string, HttpCacheConfig> = {
  static: {
    directives: ['public', 'immutable'],
    maxAge: 31536000,
    sMaxAge: 31536000,
  },
  dynamic: {
    directives: ['private', 'no-cache'],
    maxAge: 0,
  },
  api: {
    directives: ['private'],
    maxAge: 60,
    staleWhileRevalidate: 300,
  },
  share: {
    directives: ['public'],
    maxAge: 3600,
    sMaxAge: 86400,
    staleWhileRevalidate: 86400,
  },
  metrics: {
    directives: ['private', 'no-store'],
    maxAge: 0,
  },
}

export function buildCacheControlHeader(config: HttpCacheConfig): string {
  const parts: string[] = [...config.directives]

  if (config.maxAge > 0) {
    parts.push(`max-age=${config.maxAge}`)
  }

  if (config.sMaxAge !== undefined && config.sMaxAge > 0) {
    parts.push(`s-maxage=${config.sMaxAge}`)
  }

  if (config.staleWhileRevalidate !== undefined && config.staleWhileRevalidate > 0) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`)
  }

  return parts.join(', ')
}

const DEFAULT_HTTP_CACHE_CONFIG: HttpCacheConfig = {
  directives: ['private', 'no-cache'],
  maxAge: 0,
}

export function getHttpCacheHeaders(configKey: string): Record<string, string> {
  const config = HTTP_CACHE_CONFIGS[configKey] ?? DEFAULT_HTTP_CACHE_CONFIG

  return {
    'Cache-Control': buildCacheControlHeader(config),
  }
}

export const REVALIDATION_TIMES = {
  landing: 3600,
  howItWorks: 86400,
  about: 86400,
  debate: false as const,
  share: 3600,
} as const

export type RevalidationKey = keyof typeof REVALIDATION_TIMES

export function getRevalidationTime(key: RevalidationKey): number | false {
  return REVALIDATION_TIMES[key]
}
