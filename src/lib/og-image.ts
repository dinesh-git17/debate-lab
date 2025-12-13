// og-image.ts
/**
 * Open Graph image URL generation for social sharing.
 * Builds share metadata for debate pages.
 */

import type { OGImageParams } from '@/types/share'

export function getOGImageUrl(params: OGImageParams, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const searchParams = new URLSearchParams()

  searchParams.set('topic', params.topic.slice(0, 100))
  searchParams.set('format', params.format)
  searchParams.set('for', params.forModel)
  searchParams.set('against', params.againstModel)
  searchParams.set('status', params.status)
  searchParams.set('turns', String(params.turnCount))
  searchParams.set('date', params.date)

  return `${base}/api/og?${searchParams.toString()}`
}

export function buildShareMetadata(
  debateId: string,
  topic: string,
  format: string,
  forModel: string,
  againstModel: string,
  status: string,
  turnCount: number,
  baseUrl?: string
): {
  title: string
  description: string
  imageUrl: string
  url: string
} {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''

  const title = `AI Debate: ${topic.slice(0, 60)}${topic.length > 60 ? '...' : ''}`

  const description = `Watch ${forModel} and ${againstModel} debate "${topic.slice(0, 80)}${topic.length > 80 ? '...' : ''}" in this ${format} format AI debate with ${turnCount} turns.`

  const imageUrl = getOGImageUrl(
    {
      topic,
      format,
      forModel,
      againstModel,
      status: status === 'completed' ? 'completed' : 'in_progress',
      turnCount,
      date: new Date().toLocaleDateString(),
    },
    base
  )

  const url = `${base}/debate/${debateId}/summary`

  return { title, description, imageUrl, url }
}
