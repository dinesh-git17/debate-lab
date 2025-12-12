// src/app/(fullscreen)/debate/[id]/page.tsx

import { notFound } from 'next/navigation'

import { isValidDebateId } from '@/lib/id-generator'
import { getDebateSession } from '@/services/debate-service'

import { DebatePageClient } from './client'

import type { Metadata } from 'next'

// Ensure page is always dynamically rendered (no caching)
export const dynamic = 'force-dynamic'

interface DebatePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: DebatePageProps): Promise<Metadata> {
  const { id } = await params
  const session = await getDebateSession(id)

  if (!session) {
    return { title: 'Debate Not Found' }
  }

  const truncatedTopic =
    session.topic.length > 50 ? `${session.topic.slice(0, 50)}...` : session.topic

  return {
    title: `Debate: ${truncatedTopic}`,
    description: `AI debate on: ${session.topic}`,
  }
}

export default async function DebatePage({ params }: DebatePageProps) {
  const { id } = await params

  if (!isValidDebateId(id)) {
    notFound()
  }

  const session = await getDebateSession(id)

  if (!session) {
    notFound()
  }

  return (
    <DebatePageClient
      debateId={id}
      initialTopic={session.topic}
      initialFormat={session.format}
      initialStatus={session.status}
      initialBackgroundCategory={session.backgroundCategory}
    />
  )
}
