/**
 * Main PDF document component for debate transcript exports.
 * Assembles header, metadata, speaker cards, and footer into a complete document.
 */

import { Document, Page, Text, View } from '@react-pdf/renderer'

import { DocumentHeader, MetadataBar, PageFooter, SpeakerCard } from './components'
import { styles } from './styles'

import type { DebateMessage } from '@/types/debate-ui'
import type { ExportConfig } from '@/types/export'
import type { TurnType } from '@/types/turn'

interface DebateDocumentProps {
  topic: string
  format: string
  messages: DebateMessage[]
  config: ExportConfig
  summary?: string | undefined
  baseUrl: string
}

type PhaseGroup = {
  phase: string
  messages: DebateMessage[]
}

interface Participants {
  aiA: string
  aiB: string
  moderator?: string | undefined
}

const PHASE_ORDER: Record<string, number> = {
  Introduction: 0,
  'Opening Arguments': 1,
  Constructive: 2,
  'Cross-Examination': 3,
  Rebuttals: 4,
  'Closing Arguments': 5,
  Transitions: 6,
  Interventions: 7,
}

function getTurnPhase(turnType: TurnType): string {
  const phaseMap: Record<TurnType, string> = {
    moderator_intro: 'Introduction',
    opening: 'Opening Arguments',
    constructive: 'Constructive',
    cross_examination: 'Cross-Examination',
    rebuttal: 'Rebuttals',
    closing: 'Closing Arguments',
    moderator_transition: 'Transitions',
    moderator_intervention: 'Interventions',
    moderator_summary: 'Summary',
  }
  return phaseMap[turnType] || 'Other'
}

function groupMessagesByPhase(messages: DebateMessage[]): PhaseGroup[] {
  const groups = new Map<string, DebateMessage[]>()

  for (const message of messages) {
    const phase = getTurnPhase(message.turnType)
    const existing = groups.get(phase) || []
    groups.set(phase, [...existing, message])
  }

  return Array.from(groups.entries())
    .map(([phase, msgs]) => ({ phase, messages: msgs }))
    .sort((a, b) => (PHASE_ORDER[a.phase] ?? 99) - (PHASE_ORDER[b.phase] ?? 99))
}

function getParticipants(includeModeratorTurns: boolean): Participants {
  return {
    aiA: 'ChatGPT (FOR)',
    aiB: 'Grok (AGAINST)',
    moderator: includeModeratorTurns ? 'Claude (Moderator)' : undefined,
  }
}

function getSpeakerIcon(speaker: 'for' | 'against' | 'moderator', baseUrl: string): string {
  const iconMap = {
    for: '/models/chatgpt.png',
    against: '/models/grok.png',
    moderator: '/models/claude-logo.png',
  }
  return `${baseUrl}${iconMap[speaker]}`
}

export function DebateDocument({
  topic,
  format,
  messages,
  config,
  summary,
  baseUrl,
}: DebateDocumentProps): React.ReactElement {
  const filteredMessages = config.includeModeratorTurns
    ? messages.filter((m) => m.turnType !== 'moderator_summary')
    : messages.filter((m) => m.speaker !== 'moderator')

  const groupedMessages = groupMessagesByPhase(filteredMessages)
  const participants = getParticipants(config.includeModeratorTurns)

  const logoUrl = `${baseUrl}/logo/logo.png`

  return (
    <Document title={`Debate: ${topic}`} author="Debate Lab" subject={topic}>
      <Page size="LETTER" style={styles.page}>
        <DocumentHeader logoUrl={logoUrl} />

        <View style={styles.contentWrapper}>
          <MetadataBar
            topic={topic}
            date={new Date()}
            format={format}
            participants={participants}
          />

          {groupedMessages.map((group, groupIndex) => (
            <View key={group.phase} style={styles.sectionGroup}>
              {groupIndex > 0 && <View style={styles.divider} minPresenceAhead={100} />}
              <Text style={styles.sectionTitle} minPresenceAhead={80}>
                {group.phase}
              </Text>
              {group.messages.map((message) => (
                <View key={message.id} wrap={false}>
                  <SpeakerCard
                    speaker={message.speaker}
                    speakerLabel={message.speakerLabel}
                    content={message.content}
                    iconUrl={getSpeakerIcon(message.speaker, baseUrl)}
                    timestamp={message.timestamp}
                    includeTimestamp={config.includeTimestamps}
                  />
                </View>
              ))}
            </View>
          ))}

          {summary && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Moderator Summary</Text>
              <Text style={styles.summaryContent}>{summary}</Text>
            </View>
          )}
        </View>

        <PageFooter format={format} />
      </Page>
    </Document>
  )
}
