/**
 * PDF page footer with branding and page numbers.
 * Renders at the bottom of each page.
 */

import { View, Text } from '@react-pdf/renderer'

import { styles } from '../styles'

export function PageFooter(): React.ReactElement {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerBrand}>Debate Lab</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  )
}
