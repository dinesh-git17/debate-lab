// route.ts
/**
 * Topic classification endpoint.
 * Categorizes debate topics using keyword matching and semantic analysis for themed backgrounds.
 */

import { NextResponse } from 'next/server'

import {
  CATEGORY_GRADIENTS,
  getTopicCategory,
  classifyTopicSemantically,
} from '@/lib/topic-backgrounds'

import type { BackgroundCategory } from '@/lib/topic-backgrounds'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const topic = searchParams.get('topic')

  if (!topic) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  let category: BackgroundCategory = getTopicCategory(topic)

  if (category === 'default') {
    category = await classifyTopicSemantically(topic)
  }

  return NextResponse.json({
    category,
    gradient: CATEGORY_GRADIENTS[category],
  })
}
