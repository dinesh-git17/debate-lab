// src/test/utils/render.tsx
// Custom render function with providers for testing

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialState?: Record<string, unknown>
}

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

interface ProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
}

function Providers({ children, queryClient }: ProvidersProps): ReactElement {
  const client = queryClient ?? createTestQueryClient()

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof render> & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  const result = render(ui, {
    wrapper: ({ children }) => <Providers queryClient={queryClient}>{children}</Providers>,
    ...renderOptions,
  })

  return {
    ...result,
    queryClient,
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render, createTestQueryClient }
