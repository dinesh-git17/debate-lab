// src/test/utils/hooks.tsx
// Hook testing utilities

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, type RenderHookOptions, type RenderHookResult } from '@testing-library/react'
import { type ReactNode } from 'react'

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface HookWrapperProps {
  children: ReactNode
}

function createHookWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient()

  return function HookWrapper({ children }: HookWrapperProps): ReactNode {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

interface CustomRenderHookOptions<TProps> extends Omit<RenderHookOptions<TProps>, 'wrapper'> {
  queryClient?: QueryClient
}

export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: CustomRenderHookOptions<TProps> = {}
): RenderHookResult<TResult, TProps> & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  const result = renderHook(hook, {
    wrapper: createHookWrapper(queryClient),
    ...renderOptions,
  })

  return {
    ...result,
    queryClient,
  }
}

export { renderHook } from '@testing-library/react'
