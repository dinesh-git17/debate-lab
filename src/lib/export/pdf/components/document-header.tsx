/**
 * Document header components for PDF export.
 * PageLogo renders on every page (fixed position).
 * TopicHeader renders only on first page with centered title.
 */

import { Image, Text, View } from '@react-pdf/renderer'

import { styles } from '../styles'

interface PageLogoProps {
  logoUrl: string
}

/**
 * Fixed logo header that appears on every page.
 */
export function PageLogo({ logoUrl }: PageLogoProps): React.ReactElement {
  return (
    <View style={styles.pageLogoContainer} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image doesn't support alt */}
      <Image src={logoUrl} style={styles.pageLogo} />
    </View>
  )
}

interface TopicHeaderProps {
  topic: string
}

/**
 * Centered topic title for the first page.
 */
export function TopicHeader({ topic }: TopicHeaderProps): React.ReactElement {
  return (
    <View style={styles.topicHeader}>
      <Text style={styles.topicTitle}>{topic}</Text>
    </View>
  )
}
