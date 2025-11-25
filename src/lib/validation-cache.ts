// src/lib/validation-cache.ts
import type { ValidationResult } from '@/types/validation'

interface CacheEntry {
  result: ValidationResult
  expires: number
}

const cache = new Map<string, CacheEntry>()

const DEFAULT_TTL_MS = 5 * 60 * 1000

function normalizeRule(rule: string): string {
  return rule.toLowerCase().trim().replace(/\s+/g, ' ')
}

function hashRule(rule: string): string {
  const normalized = normalizeRule(rule)
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `rule_${hash.toString(36)}`
}

export function getCachedValidation(rule: string): ValidationResult | null {
  const key = hashRule(rule)
  const entry = cache.get(key)

  if (!entry) {
    return null
  }

  if (entry.expires < Date.now()) {
    cache.delete(key)
    return null
  }

  return entry.result
}

export function setCachedValidation(
  rule: string,
  result: ValidationResult,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const key = hashRule(rule)
  cache.set(key, {
    result,
    expires: Date.now() + ttlMs,
  })
}

export function clearCachedValidation(rule: string): void {
  const key = hashRule(rule)
  cache.delete(key)
}

export function clearAllValidationCache(): void {
  cache.clear()
}

export function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (entry.expires < now) {
      cache.delete(key)
    }
  }
}
