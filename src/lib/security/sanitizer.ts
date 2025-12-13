// sanitizer.ts
/**
 * Input sanitization for XSS prevention and LLM prompt safety.
 * Strips dangerous patterns, HTML, and control characters from user input.
 */

import sanitizeHtml from 'sanitize-html'

import type { SanitizationOptions, SanitizationResult } from '@/types/security'

const DEFAULT_MAX_LENGTHS = {
  topic: 500,
  customRule: 200,
  message: 10000,
  username: 50,
  default: 1000,
} as const

const LLM_DANGEROUS_PATTERNS = [
  // Template and tag injection patterns
  /\{\{[\s\S]+?\}\}/g,
  /\[\[[\s\S]+?\]\]/g,
  /<\|[\s\S]*?\|>/g,
  /```(system|assistant|user|developer|command)/gi,
  /<(system|assistant|user|developer)>/gi,
  /<\/(system|assistant|user|developer)>/gi,
  /#\s*system/gi,
  /#\s*assistant/gi,
  // Role manipulation patterns
  /\bas\s+an?\s+ai\b/gi,
  /\byou\s+are\s+chatgpt\b/gi,
  /\byou\s+are\s+now\b/gi,
  /\byou\s+must\s+act\s+as\b/gi,
  /\bpretend\s+to\s+be\b/gi,
  // System prompt references
  /\bsystem\s+prompt\b/gi,
  /\bbase\s+prompt\b/gi,
  /\binitial\s+instructions?\b/gi,
  /\bpersona\b/gi,
  // Policy override patterns
  /\bignore\s+the\s+(guidelines|rules|policy)\b/gi,
  /\bno\s+longer\s+follow\b/gi,
  /\bdisregard\s+(the|all|any)\s+(instructions|policies)\b/gi,
  /\boverride\s+(your|the)\s+(settings|instructions)\b/gi,
  /\bplease?\s+(break|bypass)\b/gi,
  // Instruction override patterns
  /\bignore\s+(previous|above|all|any)\s+instructions?\b/gi,
  /\bdisregard\s+(previous|above|all|any)\s+instructions?\b/gi,
  /\bforget\s+(previous|above|all|any)\s+instructions?\b/gi,
  /\boverride\s+(previous|above|all|any)\s+instructions?\b/gi,
  /\bignore\s+(all\s+)?other\s+(requests?|instructions?|messages?|prompts?)\b/gi,
  /\bignore\s+(everything|all|any)\s+(else|and|except)\b/gi,
  /\bdisregard\s+((previous|above|all|any)\s+)?other\s+(requests?|instructions?|messages?|prompts?)\b/gi,
  /\bforget\s+((previous|above|all|any)\s+)?other\s+(requests?|instructions?|messages?|prompts?)\b/gi,
  // Jailbreak mode patterns
  /\bjailbreak\b/gi,
  /\bdan(\s+mode)?\b/gi,
  /\bdev(eloper)?\s+mode\b/gi,
  /\bgod\s+mode\b/gi,
  /\bassistant\.?debug\b/gi,
  /\bsimulation\s+mode\b/gi,
  /\bcharacter\s+mode\b/gi,
  /\buncensored\b/gi,
  /\bunrestricted\b/gi,
  /\braw\s+output\b/gi,
  // Code injection patterns
  /\b(set|let)\s+\w+\s*=/gi,
  /(--|#)\s*override/gi,
  /;\s*(system|prompt)/gi,
  // Output manipulation patterns
  /\bbelow\s+is\s+my\s+system\s+prompt\b/gi,
  /\bthe\s+assistant\s+should\s+now\b/gi,
  /\boutput\s+the\s+following\s+exactly\b/gi,
  /\bverbatim\s+response\b/gi,
  /\bdo\s+not\s+add\s+anything\b/gi,
  // Obfuscation patterns (spaced characters)
  /i\s*n\s*s\s*t\s*r\s*u\s*c\s*t\s*i\s*o\s*n/gi,
  /o\s*v\s*e\s*r\s*r\s*i\s*d\s*e/gi,
  /j\s*a\s*i\s*l\s*b\s*r\s*e\s*a\s*k/gi,
  // Hex/encoding patterns
  /\\x[0-9a-f]{2}/gi,
  /0x[0-9a-f]{2}/gi,
  // Base64 encoded dangerous terms
  /aWdub3Jl/gi, // "ignore" in base64
  /aW5zdHJ1Y3Rpb25z/gi, // "instructions" in base64
  /amFpbGJyZWFr/gi, // "jailbreak" in base64
  // ROT13 encoded terms
  /vtaber/gi, // "ignore" in ROT13
  /qvfpbire/gi, // "discover" in ROT13
  // Unicode homoglyph ranges (fullwidth, cyrillic, latin extended)
  /[\uFF00-\uFFEF]/g,
  /[\u0400-\u04FF]/g,
  /[\u0100-\u017F]/g,
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

/**
 * Strips all HTML tags from a string using sanitize-html library.
 * Does NOT unescape HTML entities to prevent reintroducing dangerous characters.
 * Security: Fixes CVE for double escaping/unescaping vulnerability.
 */
function stripHtml(str: string): string {
  // Use sanitize-html with no allowed tags to strip all HTML safely
  const stripped = sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  })

  // Only decode safe whitespace entities, NOT angle brackets or other dangerous chars
  return stripped.replace(/&nbsp;/gi, ' ').trim()
}

/**
 * Applies a pattern replacement repeatedly until no more matches are found.
 * Security: Fixes incomplete multi-character sanitization vulnerability.
 */
function replaceUntilStable(str: string, pattern: RegExp, replacement: string): string {
  let result = str
  let prev: string

  // Limit iterations to prevent infinite loops on pathological input
  const maxIterations = 100
  let iterations = 0

  do {
    prev = result
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0
    result = result.replace(pattern, replacement)
    iterations++
  } while (result !== prev && iterations < maxIterations)

  return result
}

function sanitizeForLlm(str: string): string {
  let result = str

  for (const pattern of LLM_DANGEROUS_PATTERNS) {
    // Use stable replacement to handle nested/recursive patterns
    result = replaceUntilStable(result, pattern, '')
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

/**
 * Sanitizes HTML for display using sanitize-html library.
 * Security: Fixes bad HTML filtering regexp vulnerability by using a proper parser.
 */
function sanitizeForDisplay(str: string, allowHtml: boolean): string {
  if (allowHtml) {
    // Use sanitize-html with a whitelist of safe tags
    return sanitizeHtml(str, {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      allowedAttributes: {}, // No attributes allowed
      disallowedTagsMode: 'discard',
      // Explicitly disallow dangerous tags and their contents
      exclusiveFilter: (frame) => {
        return frame.tag === 'script' || frame.tag === 'style'
      },
    }).trim()
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
  return LLM_DANGEROUS_PATTERNS.some((pattern) => {
    // Reset lastIndex to avoid global regex state issues
    pattern.lastIndex = 0
    return pattern.test(input)
  })
}

export function escapeForJson(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}
