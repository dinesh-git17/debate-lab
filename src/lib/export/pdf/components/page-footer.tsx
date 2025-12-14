/**
 * PDF page footer with branding, format, and page numbers.
 * Renders at the bottom of each page with top border separator.
 */

import { Text, View } from '@react-pdf/renderer'

import { styles } from '../styles'

interface PageFooterProps {
  format: string
}

export function PageFooter({ format }: PageFooterProps): React.ReactElement {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerBrand}>Debate Lab • {format}</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  )
}
