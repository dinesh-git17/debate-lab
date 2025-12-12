// route.ts
/**
 * Web Vitals collection endpoint.
 * Receives and logs Core Web Vitals metrics from client-side RUM instrumentation.
 */

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

    if (!body.name || typeof body.value !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Log the web vital metric
    logger.info('Web Vital recorded', {
      metric: body.name,
      value: body.value,
      rating: body.rating,
    })

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
