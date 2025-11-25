// src/types/validation.ts

export type ValidationCategory = 'approved' | 'needs_revision' | 'rejected'

export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'error'

export interface ValidationResult {
  ruleIndex: number
  rule: string
  isValid: boolean
  issues: string[]
  suggestion?: string | undefined
  category: ValidationCategory
  reasoning?: string | undefined
}

export interface ValidationResponse {
  success: boolean
  results: ValidationResult[]
  error?: string | undefined
}

export interface RuleInputState {
  value: string
  status: ValidationStatus
  result?: ValidationResult | undefined
  error?: string | undefined
}

export interface ValidateRulesRequest {
  rules: string[]
}
