/**
 * Minimalist document header with centered logo and title.
 * Apple-inspired design replacing the heavy banner approach.
 */

import { Image, Text, View } from '@react-pdf/renderer'

import { styles } from '../styles'

interface DocumentHeaderProps {
  logoUrl: string
}

export function DocumentHeader({ logoUrl }: DocumentHeaderProps): React.ReactElement {
  return (
    <View style={styles.documentHeader}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image doesn't support alt */}
      <Image src={logoUrl} style={styles.documentLogo} />
      <Text style={styles.documentTitle}>AI Debate Report</Text>
    </View>
  )
}
