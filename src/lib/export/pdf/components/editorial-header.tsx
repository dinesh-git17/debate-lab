/**
 * Editorial header component with atmospheric banner and logo.
 * Creates a premium, restrained header treatment for PDF exports.
 */

import { View, Image, Text } from '@react-pdf/renderer'

import { styles } from '../styles'

interface EditorialHeaderProps {
  bannerUrl: string
  logoUrl: string
}

export function EditorialHeader({ bannerUrl, logoUrl }: EditorialHeaderProps): React.ReactElement {
  return (
    <View style={styles.editorialHeader}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- PDF Image component doesn't support alt */}
      <Image style={styles.headerBanner} src={bannerUrl} />
      <View style={styles.headerOverlay} />
      <View style={styles.headerContent}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- PDF Image component doesn't support alt */}
        <Image style={styles.headerLogo} src={logoUrl} />
        <Text style={styles.headerTagline}>AI-Powered Debates</Text>
      </View>
    </View>
  )
}
