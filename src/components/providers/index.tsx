// src/components/providers/index.tsx
/**
 * Composite provider that wraps the application with all required context providers.
 * Establishes query client, theming, and performance monitoring at the root level.
 */

'use client'

import { PerformanceProvider } from './performance-provider'
import { QueryProvider } from './query-provider'
import { ThemeProvider } from './theme-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <PerformanceProvider>{children}</PerformanceProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
