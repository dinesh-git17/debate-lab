/**
 * Card-based speaker block for debate messages.
 * Features model icon avatar, speaker name, timestamp, and markdown content rendering.
 */

import { Image, Text, View } from '@react-pdf/renderer'

import { MarkdownRenderer } from './markdown-renderer'
import { styles } from '../styles'

import type { TurnSpeaker } from '@/types/turn'

interface SpeakerCardProps {
  speaker: TurnSpeaker
  speakerLabel: string
  content: string
  iconUrl: string
  timestamp?: Date
  includeTimestamp?: boolean
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/** Minimum content (in points) that must follow a speaker header to prevent orphaning */
const SPEAKER_HEADER_MIN_CONTENT = 50

export function SpeakerCard({
  speaker: _speaker,
  speakerLabel,
  content,
  iconUrl,
  timestamp,
  includeTimestamp,
}: SpeakerCardProps): React.ReactElement {
  return (
    <View style={styles.speakerCard}>
      <View style={styles.speakerHeader} minPresenceAhead={SPEAKER_HEADER_MIN_CONTENT}>
        <View style={styles.speakerIdentity}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image doesn't support alt */}
          <Image src={iconUrl} style={styles.speakerIcon} />
          <Text style={styles.speakerName}>{speakerLabel}</Text>
        </View>
        {includeTimestamp && timestamp && (
          <Text style={styles.speakerTimestamp}>{formatTimestamp(timestamp)}</Text>
        )}
      </View>

      <MarkdownRenderer content={content} />
    </View>
  )
}
