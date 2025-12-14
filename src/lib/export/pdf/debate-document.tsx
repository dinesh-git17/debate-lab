/**
 * Main PDF document component for debate transcript exports.
 * Assembles header, turns, and footer into a complete document.
 */

import { Document, Page, View, Text } from '@react-pdf/renderer'

import { EditorialHeader, Header, PageFooter, TurnBlock } from './components'
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

const PHASE_ORDER: Record<string, number> = {
  Introduction: 0,
  'Opening Arguments': 1,
  Constructive: 2,
  'Cross-Examination': 3,
  Rebuttals: 4,
  'Closing Arguments': 5,
  Summary: 6,
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

export function DebateDocument({
  topic,
  format,
  messages,
  config,
  summary,
  baseUrl,
}: DebateDocumentProps): React.ReactElement {
  const filteredMessages = config.includeModeratorTurns
    ? messages
    : messages.filter((m) => m.speaker !== 'moderator')

  const groupedMessages = groupMessagesByPhase(filteredMessages)

  const bannerUrl = `${baseUrl}/logo/pdf_banner.jpg`
  const logoUrl = `${baseUrl}/logo/logo-dark.png`

  return (
    <Document title={`Debate: ${topic}`} author="Debate Lab" subject={topic}>
      <Page size="LETTER" style={styles.page}>
        <EditorialHeader bannerUrl={bannerUrl} logoUrl={logoUrl} />

        <View style={styles.contentWrapper}>
          <Header topic={topic} format={format} exportedAt={new Date()} />

          {groupedMessages.map((group, groupIndex) => (
            <View key={group.phase} style={styles.sectionGroup}>
              {groupIndex > 0 && <View style={styles.divider} minPresenceAhead={100} />}
              {groupIndex > 0 && (
                <Text style={styles.sectionTitle} minPresenceAhead={80}>
                  {group.phase}
                </Text>
              )}
              {group.messages.map((message) => (
                <View key={message.id} wrap={false}>
                  <TurnBlock
                    speaker={message.speaker}
                    speakerLabel={message.speakerLabel}
                    content={message.content}
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

        <PageFooter />
      </Page>
    </Document>
  )
}
