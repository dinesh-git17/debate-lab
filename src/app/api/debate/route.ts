// src/app/api/debate/route.ts
import { NextResponse } from 'next/server'

import { generateRequestId, runWithRequestContext, logRequest, logger } from '@/lib/logging'
import { debateFormSchema } from '@/lib/schemas/debate-schema'
import { extractSecurityContext, validateAndSanitizeDebateConfig } from '@/lib/security'
import { createDebateSession } from '@/services/debate-service'

import type { DebateFormat } from '@/types/debate'
import type { NextRequest } from 'next/server'

/**
 * POST /api/debate
 * Create a new debate session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId()
  const startTime = Date.now()

  return runWithRequestContext(requestId, async () => {
    try {
      const body: unknown = await request.json()

      // First pass: Zod schema validation
      const validated = debateFormSchema.safeParse(body)

      if (!validated.success) {
        logRequest(requestId, 'POST', '/api/debate', 400, Date.now() - startTime)
        return NextResponse.json(
          {
            error: 'Invalid form data',
            fieldErrors: validated.error.flatten().fieldErrors,
          },
          { status: 400 }
        )
      }

      // Second pass: Security validation and sanitization
      const securityContext = extractSecurityContext(request)
      const securityValidation = validateAndSanitizeDebateConfig(
        {
          topic: validated.data.topic,
          turns: validated.data.turns,
          format: validated.data.format,
          customRules: validated.data.customRules,
        },
        securityContext
      )

      if (!securityValidation.valid || !securityValidation.sanitizedConfig) {
        logRequest(requestId, 'POST', '/api/debate', 400, Date.now() - startTime)
        return NextResponse.json(
          {
            error: 'Content validation failed',
            fieldErrors: { topic: securityValidation.errors },
          },
          { status: 400 }
        )
      }

      // Use sanitized config for debate creation
      const result = await createDebateSession({
        topic: securityValidation.sanitizedConfig.topic,
        turns: securityValidation.sanitizedConfig.turns,
        format: securityValidation.sanitizedConfig.format as DebateFormat,
        customRules: securityValidation.sanitizedConfig.customRules,
      })

      if (!result.success) {
        logRequest(requestId, 'POST', '/api/debate', 500, Date.now() - startTime)
        return NextResponse.json(
          { error: result.error ?? 'Failed to create debate' },
          { status: 500 }
        )
      }

      logRequest(requestId, 'POST', '/api/debate', 200, Date.now() - startTime, {
        debateId: result.debateId,
      })

      return NextResponse.json({
        success: true,
        debateId: result.debateId,
        session: result.session,
      })
    } catch (error) {
      logger.error('Debate creation error', error instanceof Error ? error : null, {
        requestId,
      })
      logRequest(requestId, 'POST', '/api/debate', 500, Date.now() - startTime)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }) as Promise<NextResponse>
}
