// src/lib/security/sanitizer.ts
// Input sanitization utilities for XSS prevention and text cleaning

import DOMPurify from 'isomorphic-dompurify'

import type { SanitizationOptions, SanitizationResult } from '@/types/security'

const DEFAULT_MAX_LENGTHS = {
  topic: 500,
  customRule: 200,
  message: 10000,
  username: 50,
  default: 1000,
} as const

const LLM_DANGEROUS_PATTERNS = [
  /\{\{.*?\}\}/g,
  /\[\[.*?\]\]/g,
  /<\|.*?\|>/g,
  /```system/gi,
  /```assistant/gi,
  /```user/gi,
  /<system>/gi,
  /<\/system>/gi,
  /<assistant>/gi,
  /<\/assistant>/gi,
  /<user>/gi,
  /<\/user>/gi,
  /\bsystem:\s*/gi,
  /\bassistant:\s*/gi,
  /\buser:\s*/gi,
  /\bignore\s+(previous|above|all)\s+instructions?\b/gi,
  /\bdisregard\s+(previous|above|all)\s+instructions?\b/gi,
  /\bforget\s+(previous|above|all)\s+instructions?\b/gi,
  /\boverride\s+(previous|above|all)\s+instructions?\b/gi,
  /\bjailbreak\b/gi,
  /\bdan\s+mode\b/gi,
  /\bdeveloper\s+mode\b/gi,
]

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char)
}

function stripHtml(str: string): string {
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

function sanitizeForLlm(str: string): string {
  let result = str
  for (const pattern of LLM_DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '')
  }
  result = result
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  return result.trim()
}

function sanitizeForStorage(str: string): string {
  const stripped = stripHtml(str)
  return stripped
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\u0000/g, '')
    .trim()
}

function sanitizeForDisplay(str: string, allowHtml: boolean): string {
  if (allowHtml) {
    return DOMPurify.sanitize(str, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
    })
  }
  return escapeHtml(stripHtml(str))
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength)
}

export function sanitize(input: string, options: SanitizationOptions): SanitizationResult {
  const { maxLength, allowHtml = false, stripNewlines = false, context } = options
  const originalLength = input.length
  let value = input

  switch (context) {
    case 'storage':
      value = sanitizeForStorage(value)
      break
    case 'llm':
      value = sanitizeForLlm(sanitizeForStorage(value))
      break
    case 'display':
      value = sanitizeForDisplay(value, allowHtml)
      break
  }

  if (stripNewlines) {
    value = value.replace(/\n+/g, ' ').replace(/\s+/g, ' ')
  }

  const effectiveMaxLength = maxLength ?? DEFAULT_MAX_LENGTHS.default
  value = truncate(value, effectiveMaxLength)

  return {
    value,
    wasModified: value !== input,
    originalLength,
    sanitizedLength: value.length,
  }
}

export function sanitizeTopic(input: string): SanitizationResult {
  return sanitize(input, {
    context: 'llm',
    maxLength: DEFAULT_MAX_LENGTHS.topic,
    stripNewlines: true,
  })
}

export function sanitizeCustomRule(input: string): SanitizationResult {
  return sanitize(input, {
    context: 'llm',
    maxLength: DEFAULT_MAX_LENGTHS.customRule,
    stripNewlines: true,
  })
}

export function sanitizeMessage(input: string): SanitizationResult {
  return sanitize(input, {
    context: 'storage',
    maxLength: DEFAULT_MAX_LENGTHS.message,
  })
}

export function sanitizeForRendering(input: string, allowHtml = false): SanitizationResult {
  return sanitize(input, {
    context: 'display',
    allowHtml,
  })
}

export function containsDangerousPatterns(input: string): boolean {
  return LLM_DANGEROUS_PATTERNS.some((pattern) => pattern.test(input))
}

export function escapeForJson(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}
