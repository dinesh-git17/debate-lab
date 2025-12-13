// request-context.ts
/**
 * Request context propagation using AsyncLocalStorage.
 * Provides request ID tracking, span tracing, and environment-agnostic storage.
 */

import { nanoid } from 'nanoid'

import type { RequestTrace, TraceSpan } from '@/types/logging'

interface RequestContext {
  requestId: string
  debateId?: string
  sessionId?: string
  startTime: number
  spans: TraceSpan[]
}

interface ContextStorage<T> {
  run<R>(store: T, callback: () => R): R
  getStore(): T | undefined
}

function createInMemoryStorage<T>(): ContextStorage<T> {
  let currentStore: T | undefined

  return {
    run<R>(store: T, callback: () => R): R {
      const previousStore = currentStore
      currentStore = store
      let isAsync = false

      try {
        const result = callback()
        if (result instanceof Promise) {
          isAsync = true
          return result.finally(() => {
            currentStore = previousStore
          }) as R
        }
        return result
      } finally {
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

async function createNodeStorage<T>(): Promise<ContextStorage<T>> {
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

let contextStorage: ContextStorage<RequestContext> | null = null
let storageInitPromise: Promise<void> | null = null

function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions?.node !== undefined &&
    typeof globalThis.window === 'undefined'
  )
}

async function initStorage(): Promise<void> {
  if (contextStorage) return

  if (isNodeEnvironment()) {
    try {
      contextStorage = await createNodeStorage<RequestContext>()
    } catch {
      contextStorage = createInMemoryStorage<RequestContext>()
    }
  } else {
    contextStorage = createInMemoryStorage<RequestContext>()
  }
}

function getStorage(): ContextStorage<RequestContext> {
  if (!contextStorage) {
    contextStorage = createInMemoryStorage<RequestContext>()

    if (isNodeEnvironment() && !storageInitPromise) {
      storageInitPromise = initStorage()
    }
  }
  return contextStorage
}

export function _setStorageForTesting(storage: ContextStorage<RequestContext> | null): void {
  contextStorage = storage
}

export function _resetStorage(): void {
  contextStorage = null
  storageInitPromise = null
}

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

export type { ContextStorage, RequestContext }
