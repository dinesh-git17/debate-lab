// abuse-tracker.ts
/**
 * Core abuse tracking with Supabase integration.
 * Edge Runtime compatible - cannot use Node.js-only imports (e.g., pino).
 * Handles IP tracking, bans, flagging, and abuse event logging.
 */

import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

import { hashIP, getClientIP, getClientMetadata } from './ip-hash'

// Edge-compatible structured logging (can't use pino logger in Edge Runtime)
/* eslint-disable no-console */
function edgeLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, unknown>
): void {
  const logData = { level, message, ...context, timestamp: new Date().toISOString() }
  if (level === 'error') console.error(JSON.stringify(logData))
  else if (level === 'warn') console.warn(JSON.stringify(logData))
  else console.info(JSON.stringify(logData))
}
/* eslint-enable no-console */

import type {
  IPTrackingRecord,
  IPBan,
  BanCheckResult,
  BanType,
  BanReason,
  BanDuration,
  FlagReason,
  AbuseEventType,
  AbuseSeverity,
  TrackingResult,
  IPMetadata,
} from '@/types/abuse-tracking'

const BAN_DURATION_MS: Record<BanDuration, number | null> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  permanent: null,
}

const DEFAULT_BAN_DURATIONS: Record<BanReason, BanDuration> = {
  rate_limit_abuse: '1h',
  content_filter_violation: '24h',
  prompt_injection: '24h',
  spam: '7d',
  harassment: '30d',
  illegal_content: 'permanent',
  bot_activity: '7d',
  manual: '24h',
}

const FLAG_THRESHOLDS = {
  contentViolations: 3,
  rateLimitHits: 10,
  promptInjections: 2,
}

const AUTOBAN_THRESHOLDS = {
  flagsForTempBan: 3,
  flagsForPermaBan: 10,
}

export async function trackVisit(request: Request): Promise<TrackingResult> {
  const ip = getClientIP(request)
  const ipHash = await hashIP(ip)
  const metadata = getClientMetadata(request)

  edgeLog('info', 'trackVisit called', {
    ipHashPrefix: ipHash.substring(0, 16) + '...',
    hasUserAgent: !!metadata.userAgent,
  })

  if (!isSupabaseConfigured()) {
    edgeLog('warn', 'trackVisit: Supabase not configured, skipping', {})
    return {
      ipHash,
      isNewVisitor: false,
      isFlagged: false,
      isBanned: false,
    }
  }

  const supabase = getSupabaseAdmin()

  const banCheck = await checkBan(ipHash)
  if (banCheck.isBanned) {
    await logAbuseEvent(ipHash, 'ban_bypass_attempt', 'medium', {
      banId: banCheck.ban?.id,
      banReason: banCheck.ban?.reason,
    })

    return {
      ipHash,
      isNewVisitor: false,
      isFlagged: true,
      isBanned: true,
      ban: banCheck.ban,
    }
  }

  const { data: existing, error: selectError } = await supabase
    .from('ip_tracking')
    .select('*')
    .eq('ip_hash', ipHash)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = no rows returned (expected for new visitors)
    edgeLog('error', 'trackVisit: Failed to query ip_tracking', {
      errorCode: selectError.code,
      errorMessage: selectError.message,
    })
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('ip_tracking')
      .update({
        last_seen: new Date().toISOString(),
        visit_count: existing.visit_count + 1,
        metadata: {
          ...existing.metadata,
          ...metadata,
        },
      })
      .eq('ip_hash', ipHash)
      .select()
      .single()

    if (updateError) {
      edgeLog('error', 'trackVisit: Failed to update ip_tracking', {
        errorCode: updateError.code,
        errorMessage: updateError.message,
      })
    } else {
      edgeLog('info', 'trackVisit: Updated existing visitor', {
        visitCount: updated?.visit_count,
        ipHashPrefix: ipHash.substring(0, 16) + '...',
      })
    }

    return {
      ipHash,
      isNewVisitor: false,
      isFlagged: updated?.is_flagged ?? false,
      isBanned: false,
    }
  }

  const { error: insertError } = await supabase.from('ip_tracking').insert({
    ip_hash: ipHash,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    visit_count: 1,
    flag_count: 0,
    is_flagged: false,
    flag_reasons: [],
    metadata: {
      ...metadata,
      debatesCreated: 0,
    },
  })

  if (insertError) {
    edgeLog('error', 'trackVisit: Failed to insert new visitor', {
      errorCode: insertError.code,
      errorMessage: insertError.message,
    })
  } else {
    edgeLog('info', 'trackVisit: Created new visitor record', {
      ipHashPrefix: ipHash.substring(0, 16) + '...',
    })
  }

  return {
    ipHash,
    isNewVisitor: true,
    isFlagged: false,
    isBanned: false,
  }
}

/**
 * Track visit from Server Actions using headers directly
 * Use this when you don't have access to the full Request object
 */
export async function trackVisitFromHeaders(
  ip: string,
  userAgent?: string | null
): Promise<TrackingResult> {
  const ipHash = await hashIP(ip)
  const metadata: IPMetadata = {
    debatesCreated: 0,
    ...(userAgent ? { userAgent } : {}),
  }

  edgeLog('info', 'trackVisitFromHeaders called', {
    ipHashPrefix: ipHash.substring(0, 16) + '...',
    hasUserAgent: !!userAgent,
  })

  if (!isSupabaseConfigured()) {
    edgeLog('warn', 'trackVisitFromHeaders: Supabase not configured, skipping', {})
    return {
      ipHash,
      isNewVisitor: false,
      isFlagged: false,
      isBanned: false,
    }
  }

  const supabase = getSupabaseAdmin()

  const banCheck = await checkBan(ipHash)
  if (banCheck.isBanned) {
    return {
      ipHash,
      isNewVisitor: false,
      isFlagged: true,
      isBanned: true,
      ban: banCheck.ban,
    }
  }

  const { data: existing, error: selectError } = await supabase
    .from('ip_tracking')
    .select('*')
    .eq('ip_hash', ipHash)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    edgeLog('error', 'trackVisitFromHeaders: Failed to query ip_tracking', {
      errorCode: selectError.code,
      errorMessage: selectError.message,
    })
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('ip_tracking')
      .update({
        last_seen: new Date().toISOString(),
        visit_count: existing.visit_count + 1,
        metadata: {
          ...existing.metadata,
          ...metadata,
        },
      })
      .eq('ip_hash', ipHash)
      .select()
      .single()

    if (updateError) {
      edgeLog('error', 'trackVisitFromHeaders: Failed to update ip_tracking', {
        errorCode: updateError.code,
        errorMessage: updateError.message,
      })
    } else {
      edgeLog('info', 'trackVisitFromHeaders: Updated existing visitor', {
        visitCount: updated?.visit_count,
        ipHashPrefix: ipHash.substring(0, 16) + '...',
      })
    }

    return {
      ipHash,
      isNewVisitor: false,
      isFlagged: updated?.is_flagged ?? false,
      isBanned: false,
    }
  }

  const { error: insertError } = await supabase.from('ip_tracking').insert({
    ip_hash: ipHash,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    visit_count: 1,
    flag_count: 0,
    is_flagged: false,
    flag_reasons: [],
    metadata: {
      ...metadata,
      debatesCreated: 0,
    },
  })

  if (insertError) {
    edgeLog('error', 'trackVisitFromHeaders: Failed to insert new visitor', {
      errorCode: insertError.code,
      errorMessage: insertError.message,
    })
  } else {
    edgeLog('info', 'trackVisitFromHeaders: Created new visitor record', {
      ipHashPrefix: ipHash.substring(0, 16) + '...',
    })
  }

  return {
    ipHash,
    isNewVisitor: true,
    isFlagged: false,
    isBanned: false,
  }
}

export async function checkBan(ipHash: string): Promise<BanCheckResult> {
  if (!isSupabaseConfigured()) {
    return { isBanned: false }
  }

  const supabase = getSupabaseAdmin()

  // Deactivate expired bans first
  try {
    await supabase.rpc('deactivate_expired_bans')
  } catch {
    // RPC might not exist yet if migration hasn't run
  }

  const { data: ban } = await supabase
    .from('ip_bans')
    .select('*')
    .eq('ip_hash', ipHash)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!ban) {
    return { isBanned: false }
  }

  const remainingTime = ban.expires_at ? new Date(ban.expires_at).getTime() - Date.now() : undefined

  return {
    isBanned: true,
    ban: {
      id: ban.id,
      ipHash: ban.ip_hash,
      banType: ban.ban_type as BanType,
      reason: ban.reason as BanReason,
      description: ban.description,
      expiresAt: ban.expires_at ? new Date(ban.expires_at) : undefined,
      createdAt: new Date(ban.created_at),
      createdBy: ban.created_by,
      isActive: ban.is_active,
    },
    remainingTime: remainingTime && remainingTime > 0 ? remainingTime : undefined,
  }
}

export async function banIP(
  ipHash: string,
  reason: BanReason,
  options: {
    banType?: BanType
    duration?: BanDuration
    description?: string
    createdBy?: string
  } = {}
): Promise<IPBan> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const supabase = getSupabaseAdmin()

  // Check for existing active ban to prevent duplicates
  const existingBan = await checkBan(ipHash)
  if (existingBan.isBanned && existingBan.ban) {
    edgeLog('info', 'banIP: Active ban already exists, skipping duplicate', {
      ipHashPrefix: ipHash.substring(0, 16) + '...',
      existingBanId: existingBan.ban.id,
      existingBanReason: existingBan.ban.reason,
    })
    return existingBan.ban
  }

  const {
    banType = 'temporary',
    duration = DEFAULT_BAN_DURATIONS[reason],
    description,
    createdBy = 'system',
  } = options

  const durationMs = BAN_DURATION_MS[duration]
  const expiresAt = durationMs ? new Date(Date.now() + durationMs).toISOString() : null

  const { data: ban, error } = await supabase
    .from('ip_bans')
    .insert({
      ip_hash: ipHash,
      ban_type: banType,
      reason,
      description,
      expires_at: expiresAt,
      created_by: createdBy,
      is_active: true,
    })
    .select()
    .single()

  if (error || !ban) {
    throw new Error(`Failed to create ban: ${error?.message}`)
  }

  edgeLog('info', 'banIP: New ban created', {
    ipHashPrefix: ipHash.substring(0, 16) + '...',
    banId: ban.id,
    reason,
    duration,
    banType,
  })

  await logAbuseEvent(ipHash, 'manual_flag', 'high', {
    banId: ban.id,
    reason,
    duration,
    banType,
  })

  return {
    id: ban.id,
    ipHash: ban.ip_hash,
    banType: ban.ban_type as BanType,
    reason: ban.reason as BanReason,
    description: ban.description,
    expiresAt: ban.expires_at ? new Date(ban.expires_at) : undefined,
    createdAt: new Date(ban.created_at),
    createdBy: ban.created_by,
    isActive: ban.is_active,
  }
}

export async function unbanIP(ipHash: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('ip_bans')
    .update({ is_active: false })
    .eq('ip_hash', ipHash)
    .eq('is_active', true)

  return !error
}

export async function flagIP(
  ipHash: string,
  reason: FlagReason,
  details?: Record<string, unknown>
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return
  }

  const supabase = getSupabaseAdmin()

  const { data: tracking } = await supabase
    .from('ip_tracking')
    .select('*')
    .eq('ip_hash', ipHash)
    .single()

  if (!tracking) {
    return
  }

  const existingReasons: FlagReason[] = tracking.flag_reasons ?? []
  const newFlagCount = tracking.flag_count + 1
  const updatedReasons = existingReasons.includes(reason)
    ? existingReasons
    : [...existingReasons, reason]

  await supabase
    .from('ip_tracking')
    .update({
      flag_count: newFlagCount,
      is_flagged: true,
      flag_reasons: updatedReasons,
    })
    .eq('ip_hash', ipHash)

  await logAbuseEvent(
    ipHash,
    'manual_flag',
    newFlagCount >= AUTOBAN_THRESHOLDS.flagsForTempBan ? 'high' : 'medium',
    { reason, ...details }
  )

  if (newFlagCount >= AUTOBAN_THRESHOLDS.flagsForPermaBan) {
    await banIP(ipHash, 'manual', {
      banType: 'permanent',
      description: `Auto-banned after ${newFlagCount} flags`,
    })
  } else if (newFlagCount >= AUTOBAN_THRESHOLDS.flagsForTempBan) {
    await banIP(ipHash, 'manual', {
      banType: 'temporary',
      duration: '24h',
      description: `Auto-banned after ${newFlagCount} flags`,
    })
  }
}

export async function logAbuseEvent(
  ipHash: string,
  eventType: AbuseEventType,
  severity: AbuseSeverity,
  details: Record<string, unknown>,
  endpoint?: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    edgeLog('warn', 'logAbuseEvent: Supabase not configured, skipping', { eventType, severity })
    return
  }

  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('abuse_logs').insert({
    ip_hash: ipHash,
    event_type: eventType,
    severity,
    details,
    endpoint,
  })

  if (error) {
    edgeLog('error', 'Failed to insert abuse log to Supabase', {
      eventType,
      severity,
      endpoint,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
    })
  } else {
    edgeLog('info', 'Abuse event logged to Supabase', {
      eventType,
      severity,
      endpoint,
      ipHashPrefix: ipHash.substring(0, 16) + '...',
    })
  }
}

export async function recordContentViolation(
  ipHash: string,
  details: Record<string, unknown>,
  endpoint?: string
): Promise<void> {
  edgeLog('info', 'recordContentViolation called', {
    ipHashPrefix: ipHash.substring(0, 16) + '...',
    endpoint,
    detailsType: details.type,
  })

  if (!isSupabaseConfigured()) {
    edgeLog('warn', 'recordContentViolation: Supabase not configured', {})
    return
  }

  const supabase = getSupabaseAdmin()
  edgeLog('info', 'recordContentViolation: About to call logAbuseEvent', { endpoint })

  await logAbuseEvent(ipHash, 'content_violation', 'medium', details, endpoint)
  edgeLog('info', 'recordContentViolation: logAbuseEvent completed', { endpoint })

  const { count } = await supabase
    .from('abuse_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('event_type', 'content_violation')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (count && count >= FLAG_THRESHOLDS.contentViolations) {
    await flagIP(ipHash, 'multiple_content_violations', {
      violationCount: count,
      threshold: FLAG_THRESHOLDS.contentViolations,
    })
  }
}

export async function recordPromptInjection(
  ipHash: string,
  details: Record<string, unknown>,
  endpoint?: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return
  }

  const supabase = getSupabaseAdmin()

  await logAbuseEvent(ipHash, 'prompt_injection', 'high', details, endpoint)

  const { count } = await supabase
    .from('abuse_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('event_type', 'prompt_injection')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (count && count >= FLAG_THRESHOLDS.promptInjections) {
    await banIP(ipHash, 'prompt_injection', {
      banType: 'temporary',
      duration: '24h',
      description: `Auto-banned after ${count} prompt injection attempts`,
    })
  }
}

export async function recordRateLimitHit(ipHash: string, endpoint: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return
  }

  const supabase = getSupabaseAdmin()

  await logAbuseEvent(ipHash, 'rate_limit_hit', 'low', { endpoint }, endpoint)

  const { count } = await supabase
    .from('abuse_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('event_type', 'rate_limit_hit')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

  if (count && count >= FLAG_THRESHOLDS.rateLimitHits) {
    await banIP(ipHash, 'rate_limit_abuse', {
      banType: 'temporary',
      duration: '1h',
      description: `Auto-banned after ${count} rate limit hits in 1 hour`,
    })
  }
}

export async function incrementDebateCount(ipHash: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return
  }

  const supabase = getSupabaseAdmin()

  const { data: tracking } = await supabase
    .from('ip_tracking')
    .select('metadata')
    .eq('ip_hash', ipHash)
    .single()

  if (tracking) {
    const metadata = tracking.metadata as IPMetadata
    await supabase
      .from('ip_tracking')
      .update({
        metadata: {
          ...metadata,
          debatesCreated: (metadata.debatesCreated ?? 0) + 1,
          lastDebateAt: new Date().toISOString(),
        },
      })
      .eq('ip_hash', ipHash)
  }
}

export async function getTrackingRecord(ipHash: string): Promise<IPTrackingRecord | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = getSupabaseAdmin()

  const { data } = await supabase.from('ip_tracking').select('*').eq('ip_hash', ipHash).single()

  if (!data) {
    return null
  }

  return {
    id: data.id,
    ipHash: data.ip_hash,
    firstSeen: new Date(data.first_seen),
    lastSeen: new Date(data.last_seen),
    visitCount: data.visit_count,
    flagCount: data.flag_count,
    isFlagged: data.is_flagged,
    flagReasons: data.flag_reasons as FlagReason[],
    metadata: data.metadata as IPMetadata,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

export async function getAbuseStatsForIP(ipHash: string): Promise<{
  totalEvents: number
  last24h: number
  bySeverity: Record<AbuseSeverity, number>
  byType: Record<AbuseEventType, number>
}> {
  if (!isSupabaseConfigured()) {
    return {
      totalEvents: 0,
      last24h: 0,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: {
        content_violation: 0,
        rate_limit_hit: 0,
        prompt_injection: 0,
        ban_bypass_attempt: 0,
        suspicious_pattern: 0,
        manual_flag: 0,
      },
    }
  }

  const supabase = getSupabaseAdmin()

  const { data: logs } = await supabase
    .from('abuse_logs')
    .select('*')
    .eq('ip_hash', ipHash)
    .order('created_at', { ascending: false })

  if (!logs || logs.length === 0) {
    return {
      totalEvents: 0,
      last24h: 0,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: {
        content_violation: 0,
        rate_limit_hit: 0,
        prompt_injection: 0,
        ban_bypass_attempt: 0,
        suspicious_pattern: 0,
        manual_flag: 0,
      },
    }
  }

  const now = Date.now()
  const last24h = logs.filter(
    (log) => new Date(log.created_at).getTime() > now - 24 * 60 * 60 * 1000
  ).length

  const bySeverity = logs.reduce(
    (acc, log) => {
      acc[log.severity as AbuseSeverity]++
      return acc
    },
    { low: 0, medium: 0, high: 0, critical: 0 } as Record<AbuseSeverity, number>
  )

  const byType = logs.reduce(
    (acc, log) => {
      acc[log.event_type as AbuseEventType]++
      return acc
    },
    {
      content_violation: 0,
      rate_limit_hit: 0,
      prompt_injection: 0,
      ban_bypass_attempt: 0,
      suspicious_pattern: 0,
      manual_flag: 0,
    } as Record<AbuseEventType, number>
  )

  return {
    totalEvents: logs.length,
    last24h,
    bySeverity,
    byType,
  }
}

export { hashIP, getClientIP } from './ip-hash'
