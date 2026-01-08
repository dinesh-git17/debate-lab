// src/types/security.ts
// Security and rate limiting type definitions

export type SanitizationContext = 'storage' | 'llm' | 'display'

export interface SanitizationOptions {
  maxLength?: number
  allowHtml?: boolean
  stripNewlines?: boolean
  context: SanitizationContext
}

export interface SanitizationResult {
  value: string
  wasModified: boolean
  originalLength: number
  sanitizedLength: number
}

export type ContentFilterSeverity = 'low' | 'medium' | 'high' | 'critical'

export type ContentFilterCategory =
  | 'profanity'
  | 'prompt_injection'
  | 'harmful_content'
  | 'manipulation'
  | 'sensitive_topic'
  | 'pii'
  | 'spam'

export interface ContentFilterMatch {
  category: ContentFilterCategory
  severity: ContentFilterSeverity
  pattern: string
  matchedText: string
  position: number
}

export interface ContentFilterResult {
  passed: boolean
  matches: ContentFilterMatch[]
  sanitizedContent: string | null
  shouldBlock: boolean
  shouldLog: boolean
}

export interface ContentFilterConfig {
  enableProfanityFilter: boolean
  enablePromptInjectionDetection: boolean
  enableHarmfulContentDetection: boolean
  strictMode: boolean
  customBlockPatterns?: string[]
  customAllowPatterns?: string[]
}

export type RateLimitType = 'ip' | 'session' | 'api' | 'debate_creation'

export interface RateLimitConfig {
  type: RateLimitType
  maxRequests: number
  windowMs: number
  keyPrefix: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfterMs: number | null
}

export interface SecurityRateLimitState {
  count: number
  resetAt: number
}

export interface SecurityRateLimitStore {
  get(key: string): Promise<SecurityRateLimitState | null>
  set(key: string, state: SecurityRateLimitState, ttlMs: number): Promise<void>
  increment(key: string, windowMs: number): Promise<SecurityRateLimitState>
}

export interface SecurityHeaders {
  'Content-Security-Policy': string
  'X-Frame-Options'?: string
  'X-Content-Type-Options': string
  'Referrer-Policy': string
  'Permissions-Policy': string
  'Strict-Transport-Security': string
  'X-XSS-Protection': string
}

export interface AbuseLogEntry {
  id: string
  timestamp: Date
  type: 'rate_limit' | 'content_filter' | 'csrf' | 'injection_attempt'
  severity: ContentFilterSeverity
  ip: string
  sessionId: string | null
  endpoint: string
  details: Record<string, unknown>
  userAgent: string | null
}

export interface SecurityContext {
  ip: string
  sessionId: string | null
  userAgent: string | null
  origin: string | null
  referer: string | null
}
