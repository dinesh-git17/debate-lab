// src/lib/security/abuse-logger.ts
// Abuse logging service for security event tracking

import { nanoid } from 'nanoid'

import { logger } from '@/lib/logging'

import type {
  AbuseLogEntry,
  ContentFilterResult,
  ContentFilterSeverity,
  SecurityContext,
} from '@/types/security'

type AbuseType = AbuseLogEntry['type']

const LOG_BUFFER_SIZE = 1000
const logBuffer: AbuseLogEntry[] = []

function addToBuffer(entry: AbuseLogEntry): void {
  logBuffer.push(entry)
  if (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.shift()
  }
}

function createEntry(
  type: AbuseType,
  severity: ContentFilterSeverity,
  context: SecurityContext,
  endpoint: string,
  details: Record<string, unknown>
): AbuseLogEntry {
  return {
    id: nanoid(),
    timestamp: new Date(),
    type,
    severity,
    ip: context.ip,
    sessionId: context.sessionId,
    endpoint,
    details,
    userAgent: context.userAgent,
  }
}

export function logRateLimitViolation(
  context: SecurityContext,
  endpoint: string,
  limitType: string,
  currentCount: number,
  maxAllowed: number
): void {
  const entry = createEntry(
    'rate_limit',
    currentCount > maxAllowed * 2 ? 'high' : 'medium',
    context,
    endpoint,
    {
      limitType,
      currentCount,
      maxAllowed,
      exceededBy: currentCount - maxAllowed,
    }
  )

  addToBuffer(entry)
  logToConsole(entry)
}

export function logContentFilterViolation(
  context: SecurityContext,
  endpoint: string,
  filterResult: ContentFilterResult,
  originalContent: string
): void {
  const maxSeverity = filterResult.matches.reduce<ContentFilterSeverity>((max, match) => {
    const severityOrder: ContentFilterSeverity[] = ['low', 'medium', 'high', 'critical']
    return severityOrder.indexOf(match.severity) > severityOrder.indexOf(max) ? match.severity : max
  }, 'low')

  const entry = createEntry('content_filter', maxSeverity, context, endpoint, {
    matchCount: filterResult.matches.length,
    categories: [...new Set(filterResult.matches.map((m) => m.category))],
    blocked: filterResult.shouldBlock,
    contentPreview: originalContent.slice(0, 200),
    matches: filterResult.matches.map((m) => ({
      category: m.category,
      severity: m.severity,
      pattern: m.pattern,
    })),
  })

  addToBuffer(entry)
  logToConsole(entry)
}

export function logCsrfViolation(
  context: SecurityContext,
  endpoint: string,
  expectedOrigin: string | null,
  actualOrigin: string | null
): void {
  const entry = createEntry('csrf', 'high', context, endpoint, {
    expectedOrigin,
    actualOrigin,
    referer: context.referer,
  })

  addToBuffer(entry)
  logToConsole(entry)
}

export function logInjectionAttempt(
  context: SecurityContext,
  endpoint: string,
  injectionType: string,
  payload: string
): void {
  const entry = createEntry('injection_attempt', 'critical', context, endpoint, {
    injectionType,
    payloadPreview: payload.slice(0, 500),
    payloadLength: payload.length,
  })

  addToBuffer(entry)
  logToConsole(entry)
}

function logToConsole(entry: AbuseLogEntry): void {
  const context = {
    logCategory: 'security_event',
    entryId: entry.id,
    type: entry.type,
    severity: entry.severity,
    ip: entry.ip,
    endpoint: entry.endpoint,
    details: entry.details,
  }

  if (entry.severity === 'critical') {
    logger.error(`Security event: ${entry.type}`, null, context)
  } else if (entry.severity === 'high') {
    logger.warn(`Security event: ${entry.type}`, context)
  } else {
    logger.info(`Security event: ${entry.type}`, context)
  }
}

export function getRecentLogs(
  options: {
    limit?: number
    type?: AbuseType
    severity?: ContentFilterSeverity
    ip?: string
    since?: Date
  } = {}
): AbuseLogEntry[] {
  const { limit = 100, type, severity, ip, since } = options

  let filtered = [...logBuffer]

  if (type) {
    filtered = filtered.filter((e) => e.type === type)
  }
  if (severity) {
    filtered = filtered.filter((e) => e.severity === severity)
  }
  if (ip) {
    filtered = filtered.filter((e) => e.ip === ip)
  }
  if (since) {
    filtered = filtered.filter((e) => e.timestamp >= since)
  }

  return filtered.slice(-limit).reverse()
}

export function getAbuseStats(since?: Date): {
  total: number
  byType: Record<AbuseType, number>
  bySeverity: Record<ContentFilterSeverity, number>
  topIps: Array<{ ip: string; count: number }>
} {
  const logs = since ? logBuffer.filter((e) => e.timestamp >= since) : logBuffer

  const byType: Record<AbuseType, number> = {
    rate_limit: 0,
    content_filter: 0,
    csrf: 0,
    injection_attempt: 0,
  }

  const bySeverity: Record<ContentFilterSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }

  const ipCounts = new Map<string, number>()

  for (const log of logs) {
    byType[log.type]++
    bySeverity[log.severity]++
    ipCounts.set(log.ip, (ipCounts.get(log.ip) ?? 0) + 1)
  }

  const topIps = [...ipCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }))

  return {
    total: logs.length,
    byType,
    bySeverity,
    topIps,
  }
}

export function extractSecurityContext(request: Request): SecurityContext {
  const headers = request.headers

  return {
    ip:
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headers.get('x-real-ip') ??
      'unknown',
    sessionId: headers.get('x-session-id'),
    userAgent: headers.get('user-agent'),
    origin: headers.get('origin'),
    referer: headers.get('referer'),
  }
}

export function clearLogs(): void {
  logBuffer.length = 0
}
