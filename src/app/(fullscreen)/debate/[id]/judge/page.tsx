// src/app/(debate)/debate/[id]/judge/page.tsx

import { notFound, redirect } from 'next/navigation'

import { isValidDebateId } from '@/lib/id-generator'
import { getSession } from '@/lib/session-store'

import { JudgePageClient } from './client'

import type { Metadata } from 'next'

interface JudgePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: JudgePageProps): Promise<Metadata> {
  const { id } = await params
  const session = await getSession(id)

  if (!session) {
    return { title: 'Debate Not Found' }
  }

  const truncatedTopic =
    session.topic.length > 50 ? `${session.topic.slice(0, 50)}...` : session.topic

  return {
    title: `Judge Analysis: ${truncatedTopic}`,
    description: `Detailed analysis and scoring of AI debate: ${session.topic}`,
    openGraph: {
      title: `AI Debate Analysis: ${truncatedTopic}`,
      description: `Detailed scoring and evaluation of this AI debate on: ${session.topic}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `AI Debate Analysis: ${truncatedTopic}`,
      description: `Detailed scoring and evaluation of this AI debate on: ${session.topic}`,
    },
  }
}

export default async function JudgePage({ params }: JudgePageProps) {
  const { id } = await params

  if (!isValidDebateId(id)) {
    notFound()
  }

  const session = await getSession(id)

  if (!session) {
    notFound()
  }

  if (session.status !== 'completed') {
    redirect(`/debate/${id}`)
  }

  return <JudgePageClient debateId={id} topic={session.topic} />
}
