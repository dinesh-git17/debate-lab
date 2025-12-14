/**
 * Main PDF document component for debate transcript exports.
 * Assembles header, metadata, speaker cards, and footer into a complete document.
 *
 * Uses content-aware pagination to ensure:
 * - Section headers never appear alone at page bottom
 * - Related content blocks stay together when possible
 * - Orphan/widow prevention for professional layout
 */

import { Document, Font, Page, Text, View } from '@react-pdf/renderer'

// Disable hyphenation globally to prevent mid-word breaks (e.g., "civiliza-tion")
Font.registerHyphenationCallback((word) => [word])

import {
  MarkdownRenderer,
  MetadataBar,
  PageFooter,
  PageLogo,
  SpeakerCard,
  TopicHeader,
} from './components'
import { styles } from './styles'

import type { DebateMessage } from '@/types/debate-ui'
import type { ExportConfig } from '@/types/export'
import type { TurnType } from '@/types/turn'

/**
 * Pagination thresholds for content-aware layout.
 * Controls when elements push to next page vs. break gracefully.
 */
const PAGINATION = {
  // Section headers need enough content to not appear orphaned
  SECTION_HEADER_MIN_AHEAD: 80,
  // Summary title needs content to follow
  SUMMARY_TITLE_MIN_AHEAD: 60,
  // Speaker card wrapper - just needs enough to start the card header
  // Lower values prevent pushing entire cards to next page (they can wrap instead)
  SPEAKER_CARD_MIN_AHEAD: 50,
} as const

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
        <PageLogo logoUrl={logoUrl} />

        <View style={styles.contentWrapper}>
          <TopicHeader topic={topic} />
          <MetadataBar date={new Date()} format={format} participants={participants} />

          {groupedMessages.map((group) => (
            <View key={group.phase} style={styles.sectionGroup}>
              {/* Section header with lookahead - ensures content follows */}
              <Text
                style={styles.sectionTitle}
                minPresenceAhead={PAGINATION.SECTION_HEADER_MIN_AHEAD}
              >
                {group.phase}
              </Text>

              {group.messages.map((message) => (
                <View
                  key={message.id}
                  style={styles.speakerCardWrapper}
                  wrap={true}
                  minPresenceAhead={PAGINATION.SPEAKER_CARD_MIN_AHEAD}
                >
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

          {/* Summary section - wrapped in card panel like speaker cards */}
          {summary && (
            <View style={styles.sectionGroup}>
              <Text
                style={styles.sectionTitle}
                minPresenceAhead={PAGINATION.SECTION_HEADER_MIN_AHEAD}
              >
                Moderator Summary
              </Text>
              <View
                style={styles.speakerCardWrapper}
                wrap={true}
                minPresenceAhead={PAGINATION.SPEAKER_CARD_MIN_AHEAD}
              >
                <View style={styles.summaryCard}>
                  <MarkdownRenderer content={summary} />
                </View>
              </View>
            </View>
          )}

          {/* Thank You Card */}
          <View style={styles.sectionGroup}>
            <View style={styles.thankYouCard}>
              <Text style={styles.thankYouTitle}>Thank you for reading.</Text>
              <Text style={styles.thankYouText}>
                Debate Lab is an experiment in structured AI debate.
              </Text>
              <Text style={styles.thankYouLink}>debatelab.dineshd.dev</Text>
            </View>
          </View>
        </View>

        <PageFooter format={format} />
      </Page>
    </Document>
  )
}
