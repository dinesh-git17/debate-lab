// src/lib/logging/request-context.ts
// Async local storage for request context propagation

import { AsyncLocalStorage } from 'async_hooks'

import { nanoid } from 'nanoid'

import type { RequestTrace, TraceSpan } from '@/types/logging'

interface RequestContext {
  requestId: string
  debateId?: string
  sessionId?: string
  startTime: number
  spans: TraceSpan[]
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

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
  return asyncLocalStorage.run(context, fn)
}

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore()
}

export function getRequestId(): string | undefined {
  return asyncLocalStorage.getStore()?.requestId
}

export function setDebateId(debateId: string): void {
  const context = asyncLocalStorage.getStore()
  if (context) {
    context.debateId = debateId
  }
}

export function setSessionId(sessionId: string): void {
  const context = asyncLocalStorage.getStore()
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

  const context = asyncLocalStorage.getStore()
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
  const context = asyncLocalStorage.getStore()
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
  const context = asyncLocalStorage.getStore()
  if (!context) {
    return 0
  }
  return Date.now() - context.startTime
}
