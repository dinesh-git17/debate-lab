// src/app/embed/[id]/page.tsx
/**
 * Server component entry point for embeddable debate widgets.
 * Validates debate access and hydrates the client widget with session data.
 */

import { notFound } from 'next/navigation'

import { isValidDebateId } from '@/lib/id-generator'
import { getSession } from '@/lib/session-store'
import { isPubliclyAccessible } from '@/lib/share-store'
import { revealAssignment } from '@/services/debate-service'

import { EmbedWidget } from './embed-widget'

interface EmbedPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ theme?: string; showScores?: string }>
}

export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const { id } = await params
  const { theme, showScores } = await searchParams

  if (!isValidDebateId(id)) {
    notFound()
  }

  const isPublic = await isPubliclyAccessible(id)
  if (!isPublic) {
    notFound()
  }

  const session = await getSession(id)
  if (!session || session.status !== 'completed') {
    notFound()
  }

  const assignment = await revealAssignment(id)

  const resolvedTheme = theme === 'light' || theme === 'dark' ? theme : 'auto'
  const resolvedShowScores = showScores !== 'false'

  return (
    <EmbedWidget
      debateId={id}
      topic={session.topic}
      format={session.format}
      forModel={assignment?.forModel ?? 'AI'}
      againstModel={assignment?.againstModel ?? 'AI'}
      theme={resolvedTheme}
      showScores={resolvedShowScores}
    />
  )
}
