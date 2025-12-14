/**
 * PDF header component with debate title and metadata.
 * Renders the document title block with branding.
 */

import { View, Text } from '@react-pdf/renderer'

import { styles } from '../styles'

interface HeaderProps {
  topic: string
  format: string
  exportedAt: Date
}

export function Header({ topic, format, exportedAt }: HeaderProps): React.ReactElement {
  const formattedDate = exportedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <View style={styles.header}>
      <Text style={styles.brandText}>Debate Lab</Text>
      <Text style={styles.title}>{topic}</Text>
      <Text style={styles.metadata}>
        {format} Format • Exported {formattedDate}
      </Text>
    </View>
  )
}
