// src/components/performance/lazy-component.tsx
// Dynamic import wrapper with loading states and error boundaries

'use client'

import React, {
  Suspense,
  lazy,
  useState,
  useEffect,
  Component,
  type ComponentType,
  type ReactNode,
} from 'react'

import { clientLogger } from '@/lib/client-logger'

interface LazyComponentProps<T extends ComponentType<object>> {
  loader: () => Promise<{ default: T }>
  fallback?: ReactNode
  errorFallback?: ReactNode
  ssr?: boolean
  props?: T extends ComponentType<infer P> ? P : never
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

function DefaultLoadingFallback(): React.ReactElement {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
    </div>
  )
}

function DefaultErrorFallback({ error }: { error: Error | null }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-sm text-red-600">Failed to load component</p>
      {process.env.NODE_ENV === 'development' && error && (
        <p className="mt-2 text-xs text-gray-500">{error.message}</p>
      )}
    </div>
  )
}

interface LazyErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

class LazyErrorBoundary extends Component<LazyErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    clientLogger.error('LazyComponent error', error, { errorInfo })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export function LazyComponent<T extends ComponentType<object>>({
  loader,
  fallback = <DefaultLoadingFallback />,
  errorFallback,
  ssr = false,
  props,
}: LazyComponentProps<T>): React.ReactElement | null {
  const [LoadedComponent, setLoadedComponent] = useState<ComponentType<object> | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted && !ssr) return

    let cancelled = false

    loader()
      .then((module) => {
        if (!cancelled) {
          setLoadedComponent(() => module.default)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      })

    return () => {
      cancelled = true
    }
  }, [loader, mounted, ssr])

  if (!mounted && !ssr) {
    return fallback as React.ReactElement
  }

  if (error) {
    return (errorFallback ?? <DefaultErrorFallback error={error} />) as React.ReactElement
  }

  if (!LoadedComponent) {
    return fallback as React.ReactElement
  }

  return (
    <LazyErrorBoundary fallback={errorFallback ?? <DefaultErrorFallback error={null} />}>
      <LoadedComponent {...(props ?? {})} />
    </LazyErrorBoundary>
  )
}

export function createLazyComponent<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options: { ssr?: boolean; fallback?: ReactNode } = {}
): ComponentType<P> {
  const LazyLoaded = lazy(loader)

  const WrappedComponent = (props: P): React.ReactElement => {
    const [mounted, setMounted] = useState(options.ssr ?? false)

    useEffect(() => {
      setMounted(true)
    }, [])

    if (!mounted) {
      return (options.fallback ?? <DefaultLoadingFallback />) as React.ReactElement
    }

    return (
      <Suspense fallback={options.fallback ?? <DefaultLoadingFallback />}>
        <LazyLoaded {...props} />
      </Suspense>
    )
  }

  WrappedComponent.displayName = `Lazy(${loader.toString().slice(0, 50)})`

  return WrappedComponent
}

export function preloadComponent(loader: () => Promise<{ default: ComponentType<object> }>): void {
  loader().catch(() => {
    // Silently fail preload
  })
}
