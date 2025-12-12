// src/lib/logging/request-context.ts
// Async local storage for request context propagation
// Uses dependency injection for testability

import { nanoid } from 'nanoid'

import type { RequestTrace, TraceSpan } from '@/types/logging'

// ============================================
// TYPES
// ============================================

interface RequestContext {
  requestId: string
  debateId?: string
  sessionId?: string
  startTime: number
  spans: TraceSpan[]
}

/**
 * Storage interface - abstracts AsyncLocalStorage for testability
 */
interface ContextStorage<T> {
  run<R>(store: T, callback: () => R): R
  getStore(): T | undefined
}

// ============================================
// STORAGE IMPLEMENTATIONS
// ============================================

/**
 * In-memory implementation for environments without async_hooks (tests, browser)
 * Uses a simple variable to store context. Handles async callbacks by
 * detecting Promise returns and deferring cleanup until resolution.
 */
function createInMemoryStorage<T>(): ContextStorage<T> {
  let currentStore: T | undefined

  return {
    run<R>(store: T, callback: () => R): R {
      const previousStore = currentStore
      currentStore = store
      let isAsync = false

      try {
        const result = callback()
        // Handle async callbacks - defer cleanup until Promise resolves
        if (result instanceof Promise) {
          isAsync = true
          return result.finally(() => {
            currentStore = previousStore
          }) as R
        }
        return result
      } finally {
        // Only restore for sync callbacks (async cleanup is deferred)
        if (!isAsync) {
          currentStore = previousStore
        }
      }
    },
    getStore(): T | undefined {
      return currentStore
    },
  }
}

/**
 * Node.js AsyncLocalStorage implementation
 * Dynamically imports async_hooks to avoid bundler issues
 * Uses variable for module name to prevent Vite static analysis
 */
async function createNodeStorage<T>(): Promise<ContextStorage<T>> {
  // Use variable to prevent Vite/bundler from statically analyzing this import
  const moduleName = 'async_hooks'
  const asyncHooks = (await import(/* @vite-ignore */ moduleName)) as typeof import('async_hooks')
  const storage = new asyncHooks.AsyncLocalStorage<T>()

  return {
    run<R>(store: T, callback: () => R): R {
      return storage.run(store, callback)
    },
    getStore(): T | undefined {
      return storage.getStore()
    },
  }
}

// ============================================
// STORAGE FACTORY
// ============================================

let contextStorage: ContextStorage<RequestContext> | null = null
let storageInitPromise: Promise<void> | null = null

/**
 * Detects if we're in a Node.js environment with async_hooks support
 */
function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions?.node !== undefined &&
    typeof globalThis.window === 'undefined'
  )
}

/**
 * Initializes the storage implementation based on environment
 */
async function initStorage(): Promise<void> {
  if (contextStorage) return

  if (isNodeEnvironment()) {
    try {
      contextStorage = await createNodeStorage<RequestContext>()
    } catch {
      // Fallback to in-memory if async_hooks fails (e.g., edge runtime)
      contextStorage = createInMemoryStorage<RequestContext>()
    }
  } else {
    contextStorage = createInMemoryStorage<RequestContext>()
  }
}

/**
 * Gets the storage, initializing if needed (sync version for hot path)
 * Falls back to in-memory if not initialized yet
 */
function getStorage(): ContextStorage<RequestContext> {
  if (!contextStorage) {
    // Initialize synchronously with in-memory for immediate use
    // The async init will upgrade to AsyncLocalStorage if available
    contextStorage = createInMemoryStorage<RequestContext>()

    // Trigger async upgrade in background (for Node.js)
    if (isNodeEnvironment() && !storageInitPromise) {
      storageInitPromise = initStorage()
    }
  }
  return contextStorage
}

/**
 * For testing: allows injecting a mock storage implementation
 */
export function _setStorageForTesting(storage: ContextStorage<RequestContext> | null): void {
  contextStorage = storage
}

/**
 * For testing: resets storage to default state
 */
export function _resetStorage(): void {
  contextStorage = null
  storageInitPromise = null
}

// ============================================
// PUBLIC API
// ============================================

export function generateRequestId(): string {
  return nanoid(21)
}

export function runWithRequestContext<T>(
  requestId: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const context: RequestContext = {
    requestId,
    startTime: Date.now(),
    spans: [],
  }
  return getStorage().run(context, fn)
}

export function getRequestContext(): RequestContext | undefined {
  return getStorage().getStore()
}

export function getRequestId(): string | undefined {
  return getStorage().getStore()?.requestId
}

export function setDebateId(debateId: string): void {
  const context = getStorage().getStore()
  if (context) {
    context.debateId = debateId
  }
}

export function setSessionId(sessionId: string): void {
  const context = getStorage().getStore()
  if (context) {
    context.sessionId = sessionId
  }
}

export function startSpan(name: string, attributes: Record<string, unknown> = {}): TraceSpan {
  const span: TraceSpan = {
    name,
    startTime: Date.now(),
    attributes,
    status: 'ok',
  }

  const context = getStorage().getStore()
  if (context) {
    context.spans.push(span)
  }

  return span
}

export function endSpan(span: TraceSpan, status: 'ok' | 'error' = 'ok', error?: string): void {
  span.endTime = Date.now()
  span.status = status
  if (error) {
    span.error = error
  }
}

export function withSpan<T>(
  name: string,
  fn: () => T,
  attributes: Record<string, unknown> = {}
): T {
  const span = startSpan(name, attributes)
  try {
    const result = fn()
    endSpan(span, 'ok')
    return result
  } catch (error) {
    endSpan(span, 'error', error instanceof Error ? error.message : String(error))
    throw error
  }
}

export async function withSpanAsync<T>(
  name: string,
  fn: () => Promise<T>,
  attributes: Record<string, unknown> = {}
): Promise<T> {
  const span = startSpan(name, attributes)
  try {
    const result = await fn()
    endSpan(span, 'ok')
    return result
  } catch (error) {
    endSpan(span, 'error', error instanceof Error ? error.message : String(error))
    throw error
  }
}

export function getRequestTrace(): RequestTrace | null {
  const context = getStorage().getStore()
  if (!context) {
    return null
  }

  return {
    requestId: context.requestId,
    startTime: context.startTime,
    endpoint: '',
    method: '',
    debateId: context.debateId,
    spans: context.spans,
  }
}

export function getElapsedTime(): number {
  const context = getStorage().getStore()
  if (!context) {
    return 0
  }
  return Date.now() - context.startTime
}

// Export type for testing
export type { ContextStorage, RequestContext }
