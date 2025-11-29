// src/types/abuse-tracking.ts
// Abuse tracking and IP ban type definitions

export interface HashedIP {
  hash: string
  createdAt: Date
}

export interface IPTrackingRecord {
  id: string
  ipHash: string
  firstSeen: Date
  lastSeen: Date
  visitCount: number
  flagCount: number
  isFlagged: boolean
  flagReasons: FlagReason[]
  metadata: IPMetadata
  createdAt: Date
  updatedAt: Date
}

export interface IPMetadata {
  userAgent?: string
  country?: string
  debatesCreated: number
  lastDebateAt?: Date
}

export interface IPBan {
  id: string
  ipHash: string
  banType: BanType
  reason: BanReason
  description?: string | undefined
  expiresAt?: Date | undefined
  createdAt: Date
  createdBy: string
  isActive: boolean
}

export type BanType = 'temporary' | 'permanent' | 'shadow'

export type BanDuration = '1h' | '24h' | '7d' | '30d' | 'permanent'

export type BanReason =
  | 'rate_limit_abuse'
  | 'content_filter_violation'
  | 'prompt_injection'
  | 'spam'
  | 'harassment'
  | 'illegal_content'
  | 'bot_activity'
  | 'manual'

export type FlagReason =
  | 'multiple_content_violations'
  | 'rate_limit_exceeded'
  | 'prompt_injection_attempt'
  | 'suspicious_activity'
  | 'reported_by_system'

export interface AbuseLog {
  id: string
  ipHash: string
  eventType: AbuseEventType
  severity: AbuseSeverity
  details: Record<string, unknown>
  endpoint?: string
  createdAt: Date
}

export type AbuseEventType =
  | 'content_violation'
  | 'rate_limit_hit'
  | 'prompt_injection'
  | 'ban_bypass_attempt'
  | 'suspicious_pattern'
  | 'manual_flag'

export type AbuseSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface BanCheckResult {
  isBanned: boolean
  ban?: IPBan | undefined
  remainingTime?: number | undefined
}

export interface AbuseTrackingConfig {
  hashSalt: string
  flagThresholds: {
    contentViolations: number
    rateLimitHits: number
    promptInjections: number
  }
  autobanThresholds: {
    flagsForTempBan: number
    flagsForPermaBan: number
  }
  defaultBanDurations: Record<BanReason, BanDuration>
}

export interface TrackingResult {
  ipHash: string
  isNewVisitor: boolean
  isFlagged: boolean
  isBanned: boolean
  ban?: IPBan | undefined
}
