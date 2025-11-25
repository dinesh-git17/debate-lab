// src/app/api/validate-rules/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { validateCustomRules } from '@/services/rule-validation-service'

import type { ValidationResponse } from '@/types/validation'
import type { NextRequest } from 'next/server'

const requestSchema = z.object({
  rules: z
    .array(
      z
        .string()
        .min(5, 'Rule must be at least 5 characters')
        .max(200, 'Rule cannot exceed 200 characters')
        .trim()
    )
    .min(1, 'At least one rule is required')
    .max(5, 'Maximum 5 rules allowed'),
})

export async function POST(request: NextRequest): Promise<NextResponse<ValidationResponse>> {
  try {
    const body: unknown = await request.json()

    const parseResult = requestSchema.safeParse(body)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      return NextResponse.json(
        {
          success: false,
          results: [],
          error: firstIssue?.message ?? 'Invalid request',
        },
        { status: 400 }
      )
    }

    const { rules } = parseResult.data
    const response = await validateCustomRules(rules)

    if (!response.success) {
      return NextResponse.json(response, { status: 400 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Validate rules API error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          results: [],
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        results: [],
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
