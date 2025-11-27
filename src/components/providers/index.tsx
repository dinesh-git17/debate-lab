// src/components/providers/index.tsx
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
