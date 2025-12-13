// query-keys.ts
/**
 * TanStack Query key factory for type-safe cache management.
 * Provides hierarchical keys for debates, rules, and share data.
 */

import type { DebateFilters } from '@/types'

export const queryKeys = {
  debates: {
    all: ['debates'] as const,
    lists: () => [...queryKeys.debates.all, 'list'] as const,
    list: (filters: DebateFilters) => [...queryKeys.debates.lists(), filters] as const,
    details: () => [...queryKeys.debates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.debates.details(), id] as const,
    messages: (id: string) => [...queryKeys.debates.detail(id), 'messages'] as const,
    summary: (id: string) => [...queryKeys.debates.detail(id), 'summary'] as const,
  },
  rules: {
    all: ['rules'] as const,
    defaults: () => [...queryKeys.rules.all, 'defaults'] as const,
    validation: (rules: string[]) => [...queryKeys.rules.all, 'validation', rules] as const,
  },
  share: {
    all: ['share'] as const,
    link: (shareId: string) => [...queryKeys.share.all, shareId] as const,
  },
} as const
