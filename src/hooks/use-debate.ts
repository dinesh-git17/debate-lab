// use-debate.ts
/**
 * Query hook for fetching debate details by ID.
 * Placeholder pending API route implementation.
 */

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'

import type { Debate } from '@/types'

export function useDebate(id: string | null) {
  return useQuery<Debate | null>({
    queryKey: id ? queryKeys.debates.detail(id) : ['debates', 'detail', null],
    queryFn: async () => {
      if (!id) return null
      return null
    },
    enabled: false,
  })
}
