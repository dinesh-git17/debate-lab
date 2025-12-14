/**
 * PDF design tokens and shared styles.
 * Print-optimized typography and layout constants for debate exports.
 */

import { StyleSheet } from '@react-pdf/renderer'

export const colors = {
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    muted: '#999999',
  },
  speaker: {
    for: '#2563eb',
    against: '#dc2626',
    moderator: '#7c3aed',
  },
  border: '#e5e5e5',
  background: '#ffffff',
} as const

export const typography = {
  fontFamily: 'Helvetica',
  fontSize: {
    title: 24,
    subtitle: 14,
    sectionHeader: 16,
    speakerLabel: 11,
    body: 11,
    caption: 9,
    footer: 8,
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.6,
    relaxed: 1.8,
  },
} as const

export const spacing = {
  page: {
    top: 60,
    bottom: 60,
    left: 60,
    right: 60,
  },
  section: 24,
  paragraph: 12,
  small: 6,
} as const

export const styles = StyleSheet.create({
  page: {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    backgroundColor: colors.background,
    paddingTop: spacing.page.top,
    paddingBottom: spacing.page.bottom,
    paddingLeft: 0,
    paddingRight: 0,
  },
  editorialHeader: {
    position: 'relative',
    height: 140,
    marginTop: -spacing.page.top,
    marginBottom: spacing.section,
  },
  headerBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    objectFit: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.page.left,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 'auto',
    marginBottom: 8,
  },
  headerTagline: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  contentWrapper: {
    paddingHorizontal: spacing.page.left,
  },
  header: {
    marginBottom: spacing.section,
  },
  brandText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.paragraph,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: 'bold',
    color: colors.text.primary,
    lineHeight: typography.lineHeight.tight,
    marginBottom: spacing.small,
  },
  metadata: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginTop: spacing.small,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    marginVertical: spacing.section,
  },
  sectionGroup: {
    marginTop: spacing.section,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sectionHeader,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.paragraph,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  turnBlock: {
    marginBottom: spacing.section,
  },
  speakerLabel: {
    fontSize: typography.fontSize.speakerLabel,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  speakerFor: {
    color: colors.speaker.for,
  },
  speakerAgainst: {
    color: colors.speaker.against,
  },
  speakerModerator: {
    color: colors.speaker.moderator,
  },
  turnContent: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.primary,
    textAlign: 'justify',
  },
  timestamp: {
    fontSize: typography.fontSize.caption,
    color: colors.text.muted,
    marginTop: spacing.small,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: spacing.page.left,
    right: spacing.page.right,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: typography.fontSize.footer,
    color: colors.text.muted,
  },
  pageNumber: {
    fontSize: typography.fontSize.footer,
    color: colors.text.muted,
  },
  summarySection: {
    marginTop: spacing.section,
    paddingTop: spacing.paragraph,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: 'solid',
  },
  summaryTitle: {
    fontSize: typography.fontSize.sectionHeader,
    fontWeight: 'bold',
    color: colors.speaker.moderator,
    marginBottom: spacing.paragraph,
  },
  summaryContent: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.primary,
  },
})
