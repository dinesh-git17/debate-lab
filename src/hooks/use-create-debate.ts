// use-create-debate.ts
/**
 * Mutation hook for debate creation.
 * Placeholder pending API route implementation.
 */

import { useMutation } from '@tanstack/react-query'

import type { CreateDebateInput, Debate } from '@/types'

export function useCreateDebate() {
  return useMutation<Debate, Error, CreateDebateInput>({
    mutationFn: async (_input) => {
      throw new Error('Not implemented: API routes pending Phase 4')
    },
  })
}
