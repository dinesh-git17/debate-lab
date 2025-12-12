// src/app/api/classify-topic/route.ts
// API route for semantic topic classification

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

  // First try keyword matching (fast)
  let category: BackgroundCategory = getTopicCategory(topic)

  // If no match, try semantic classification (slower but smarter)
  if (category === 'default') {
    category = await classifyTopicSemantically(topic)
  }

  return NextResponse.json({
    category,
    gradient: CATEGORY_GRADIENTS[category],
  })
}
