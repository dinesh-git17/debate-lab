/**
 * PDF turn block component for individual debate messages.
 * Renders speaker label and content with appropriate styling.
 */

import { View, Text } from '@react-pdf/renderer'

import { styles } from '../styles'

import type { TurnSpeaker } from '@/types/turn'

interface TurnBlockProps {
  speaker: TurnSpeaker
  speakerLabel: string
  content: string
  timestamp?: Date
  includeTimestamp?: boolean
}

export function TurnBlock({
  speaker,
  speakerLabel,
  content,
  timestamp,
  includeTimestamp,
}: TurnBlockProps): React.ReactElement {
  const speakerStyle = {
    for: styles.speakerFor,
    against: styles.speakerAgainst,
    moderator: styles.speakerModerator,
  }[speaker]

  const speakerIndicator = {
    for: 'FOR',
    against: 'AGAINST',
    moderator: 'MODERATOR',
  }[speaker]

  return (
    <View style={styles.turnBlock}>
      <Text style={[styles.speakerLabel, speakerStyle]}>
        {speakerIndicator}: {speakerLabel}
      </Text>
      <Text style={styles.turnContent}>{content}</Text>
      {includeTimestamp && timestamp && (
        <Text style={styles.timestamp}>{timestamp.toLocaleString()}</Text>
      )}
    </View>
  )
}
