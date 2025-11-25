// src/services/rule-validation-service.ts
import Anthropic from '@anthropic-ai/sdk'

import {
  buildRuleValidationPrompt,
  extractDefaultRuleSummaries,
} from '@/lib/prompts/rule-validation-prompt'

import type { ValidationResponse, ValidationResult } from '@/types/validation'

interface ClaudeValidationResult {
  ruleIndex: number
  isValid: boolean
  issues: string[]
  suggestion: string | null
  category: 'approved' | 'needs_revision' | 'rejected'
  reasoning: string
}

interface ClaudeResponse {
  results: ClaudeValidationResult[]
}

const MAX_RULE_LENGTH = 200
const MAX_RULES = 5
const MIN_RULE_LENGTH = 5

function sanitizeRule(rule: string): string {
  return rule
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')
    .slice(0, MAX_RULE_LENGTH)
}

function validateInputRules(rules: string[]): { valid: boolean; error?: string } {
  if (!Array.isArray(rules)) {
    return { valid: false, error: 'Rules must be an array' }
  }

  if (rules.length === 0) {
    return { valid: false, error: 'At least one rule is required' }
  }

  if (rules.length > MAX_RULES) {
    return { valid: false, error: `Maximum ${MAX_RULES} rules allowed` }
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (typeof rule !== 'string') {
      return { valid: false, error: `Rule ${i + 1} must be a string` }
    }

    const trimmed = rule.trim()
    if (trimmed.length < MIN_RULE_LENGTH) {
      return { valid: false, error: `Rule ${i + 1} must be at least ${MIN_RULE_LENGTH} characters` }
    }

    if (trimmed.length > MAX_RULE_LENGTH) {
      return { valid: false, error: `Rule ${i + 1} exceeds maximum length of ${MAX_RULE_LENGTH}` }
    }
  }

  return { valid: true }
}

function parseClaudeResponse(content: string, originalRules: string[]): ValidationResult[] {
  const parsed = JSON.parse(content) as ClaudeResponse

  if (!parsed.results || !Array.isArray(parsed.results)) {
    throw new Error('Invalid response structure: missing results array')
  }

  return parsed.results.map((result, index) => ({
    ruleIndex: result.ruleIndex ?? index,
    rule: originalRules[result.ruleIndex ?? index] ?? '',
    isValid: result.category === 'approved',
    issues: result.issues ?? [],
    suggestion: result.suggestion ?? undefined,
    category: result.category,
    reasoning: result.reasoning,
  }))
}

export async function validateCustomRules(rules: string[]): Promise<ValidationResponse> {
  const inputValidation = validateInputRules(rules)
  if (!inputValidation.valid) {
    return {
      success: false,
      results: [],
      error: inputValidation.error,
    }
  }

  const sanitizedRules = rules.map(sanitizeRule)
  const defaultRules = extractDefaultRuleSummaries()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not configured')
    return {
      success: false,
      results: [],
      error: 'Validation service is not configured',
    }
  }

  const client = new Anthropic({ apiKey })
  const prompt = buildRuleValidationPrompt(sanitizedRules, defaultRules)

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const results = parseClaudeResponse(textBlock.text, sanitizedRules)

    if (results.length !== sanitizedRules.length) {
      console.warn('Mismatch between input rules and validation results')
    }

    return {
      success: true,
      results,
    }
  } catch (error) {
    console.error('Rule validation error:', error)

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return {
          success: false,
          results: [],
          error: 'Too many requests. Please wait a moment and try again.',
        }
      }

      if (error.status === 401) {
        return {
          success: false,
          results: [],
          error: 'Validation service unavailable.',
        }
      }
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        results: [],
        error: 'Validation failed. Please try again.',
      }
    }

    return {
      success: false,
      results: [],
      error: 'Connection error. Please try again.',
    }
  }
}
