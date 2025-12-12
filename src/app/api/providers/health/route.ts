// route.ts
/**
 * LLM provider health check endpoint.
 * Verifies connectivity and configuration status for all AI providers.
 */

import { NextResponse } from 'next/server'

import { checkAllProvidersHealth, getConfiguredProviders } from '@/services/llm'

export async function GET() {
  const configured = getConfiguredProviders()
  const health = await checkAllProvidersHealth()

  return NextResponse.json({
    configured,
    health,
    timestamp: new Date().toISOString(),
  })
}
