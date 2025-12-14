/**
 * Stacked metadata block displaying debate context.
 * Renders purpose, date, format, and participants in vertical rows.
 */

import { Text, View } from '@react-pdf/renderer'

import { styles } from '../styles'

interface MetadataBarProps {
  date: Date
  format: string
  participants: {
    aiA: string
    aiB: string
    moderator?: string | undefined
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatParticipants(participants: MetadataBarProps['participants']): string {
  const list = [participants.aiA, participants.aiB]
  if (participants.moderator) {
    list.push(participants.moderator)
  }
  return list.join(', ')
}

export function MetadataBar({ date, format, participants }: MetadataBarProps): React.ReactElement {
  return (
    <View style={styles.metadataBlock}>
      <View style={styles.metadataRow}>
        <Text style={styles.metadataLabel}>Purpose</Text>
        <Text style={styles.metadataValue}>AI debate report</Text>
      </View>
      <View style={styles.metadataRow}>
        <Text style={styles.metadataLabel}>Date</Text>
        <Text style={styles.metadataValue}>{formatDate(date)}</Text>
      </View>
      <View style={styles.metadataRow}>
        <Text style={styles.metadataLabel}>Format</Text>
        <Text style={styles.metadataValue}>{format}</Text>
      </View>
      <View style={styles.metadataRowLast}>
        <Text style={styles.metadataLabel}>Participants</Text>
        <Text style={styles.metadataValue}>{formatParticipants(participants)}</Text>
      </View>
    </View>
  )
}
