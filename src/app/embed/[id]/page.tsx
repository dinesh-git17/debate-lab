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

  // Extract provider from model string (format: "provider:model")
  const forModelRaw = assignment?.forModel ?? 'AI'
  const againstModelRaw = assignment?.againstModel ?? 'AI'

  const forParts = forModelRaw.split(':')
  const againstParts = againstModelRaw.split(':')

  const forProvider = forParts.length > 1 ? (forParts[0] ?? 'openai') : 'openai'
  const againstProvider = againstParts.length > 1 ? (againstParts[0] ?? 'openai') : 'openai'

  // Get display name (model part only)
  const forDisplayName = forParts.length > 1 ? (forParts[1] ?? forModelRaw) : forModelRaw
  const againstDisplayName =
    againstParts.length > 1 ? (againstParts[1] ?? againstModelRaw) : againstModelRaw

  return (
    <EmbedWidget
      debateId={id}
      topic={session.topic}
      format={session.format}
      forModel={forDisplayName}
      againstModel={againstDisplayName}
      forProvider={forProvider}
      againstProvider={againstProvider}
      theme={resolvedTheme}
      showScores={resolvedShowScores}
    />
  )
}
