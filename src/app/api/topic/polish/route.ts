// route.ts
/**
 * Topic polishing endpoint.
 * Sanitizes and refines user-provided debate topics for clarity and safety.
 */

import { NextRequest, NextResponse } from 'next/server'

import { sanitizeTopic } from '@/services/topic-sanitizer'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { topic?: string }
    const { topic } = body

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    if (topic.length > 500) {
      return NextResponse.json({ error: 'Topic too long' }, { status: 400 })
    }

    const result = await sanitizeTopic(topic)

    return NextResponse.json({
      success: result.success,
      polishedTopic: result.sanitizedTopic,
      originalTopic: result.originalTopic,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to polish topic' }, { status: 500 })
  }
}
