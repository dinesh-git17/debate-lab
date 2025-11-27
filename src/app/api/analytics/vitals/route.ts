// src/app/api/analytics/vitals/route.ts
// Web Vitals collection endpoint

import { NextResponse } from 'next/server'

import { logger } from '@/lib/logging'
import { getHttpCacheHeaders } from '@/lib/performance'

interface WebVitalPayload {
  name: string
  value: number
  rating: string
  id: string
  navigationType: string
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as WebVitalPayload

    // Validate required fields
    if (!body.name || typeof body.value !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Log the web vital metric
    logger.info('Web Vital recorded', {
      metric: body.name,
      value: body.value,
      rating: body.rating,
    })

    // Return success with no-store cache headers
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: getHttpCacheHeaders('metrics'),
      }
    )
  } catch (error) {
    logger.error('Failed to record web vital', error instanceof Error ? error : null)

    return NextResponse.json({ error: 'Failed to record metric' }, { status: 500 })
  }
}

// Preflight for CORS if needed
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
