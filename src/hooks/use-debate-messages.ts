// use-debate-messages.ts
/**
 * Paginated message fetching with infinite scroll support.
 * Placeholder pending API route implementation.
 */

import { useInfiniteQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'

import type { Message } from '@/types'

interface MessagesPage {
  messages: Message[]
  nextCursor: string | undefined
}

export function useDebateMessages(debateId: string | null) {
  return useInfiniteQuery<MessagesPage>({
    queryKey: debateId ? queryKeys.debates.messages(debateId) : ['debates', 'messages', null],
    queryFn: async () => {
      return { messages: [], nextCursor: undefined }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: false,
  })
}
