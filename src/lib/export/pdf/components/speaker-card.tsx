/**
 * Card-based speaker block for debate messages.
 * Features model icon avatar, speaker name, timestamp, and key argument highlights.
 */

import { Image, Text, View } from '@react-pdf/renderer'

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

interface ParsedContent {
  mainText: string
  quotes: string[]
}

function extractQuotes(content: string): ParsedContent {
  const quoteRegex = /[""]([^""]+)[""]|["']([^"']+)["']/g
  const quotes: string[] = []
  let mainText = content

  let match
  while ((match = quoteRegex.exec(content)) !== null) {
    const quoteText = match[1] || match[2]
    if (quoteText && quoteText.length > 30) {
      quotes.push(quoteText)
    }
  }

  if (quotes.length > 0) {
    quotes.forEach((quote) => {
      mainText = mainText.replace(
        new RegExp(`[""\u201C\u201D"']${quote}[""\u201C\u201D"']`, 'g'),
        ''
      )
    })
    mainText = mainText.replace(/\s+/g, ' ').trim()
  }

  return { mainText, quotes }
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function SpeakerCard({
  speaker: _speaker,
  speakerLabel,
  content,
  iconUrl,
  timestamp,
  includeTimestamp,
}: SpeakerCardProps): React.ReactElement {
  const { mainText, quotes } = extractQuotes(content)

  return (
    <View style={styles.speakerCard}>
      <View style={styles.speakerHeader}>
        <View style={styles.speakerIdentity}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image doesn't support alt */}
          <Image src={iconUrl} style={styles.speakerIcon} />
          <Text style={styles.speakerName}>{speakerLabel}</Text>
        </View>
        {includeTimestamp && timestamp && (
          <Text style={styles.speakerTimestamp}>{formatTimestamp(timestamp)}</Text>
        )}
      </View>

      <Text style={styles.speakerContent}>{mainText}</Text>

      {quotes.map((quote, index) => (
        <View key={index} style={styles.keyArgument}>
          <Text style={styles.keyArgumentText}>&ldquo;{quote}&rdquo;</Text>
        </View>
      ))}
    </View>
  )
}
