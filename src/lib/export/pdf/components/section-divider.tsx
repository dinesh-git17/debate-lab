/**
 * PDF section divider with optional title.
 * Used to separate debate phases (Opening, Rebuttal, Closing).
 */

import { View, Text } from '@react-pdf/renderer'

import { styles } from '../styles'

interface SectionDividerProps {
  title?: string | undefined
}

export function SectionDivider({ title }: SectionDividerProps): React.ReactElement {
  return (
    <View>
      <View style={styles.divider} />
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
    </View>
  )
}
