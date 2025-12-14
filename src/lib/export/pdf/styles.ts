/**
 * PDF design tokens and shared styles.
 * Apple-inspired typography and layout constants for debate exports.
 */

import { StyleSheet } from '@react-pdf/renderer'

export const colors = {
  text: {
    primary: '#1d1d1f',
    secondary: '#424245',
    muted: '#86868b',
  },
  speaker: {
    for: '#2563eb',
    against: '#dc2626',
    moderator: '#7c3aed',
  },
  border: '#E5E5EA',
  background: '#ffffff',
  card: '#F5F5F7',
  accent: '#007AFF',
} as const

export const typography = {
  fontFamily: 'Helvetica',
  fontSize: {
    title: 28,
    subtitle: 12,
    sectionHeader: 11,
    speakerName: 10,
    body: 10,
    caption: 9,
    brandSmall: 9,
    footer: 8,
    timestamp: 8,
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.5,
    relaxed: 1.6,
  },
  letterSpacing: {
    wide: 0.08,
  },
} as const

export const spacing = {
  page: {
    top: 88, // Clears fixed logo header: 24 (top) + 48 (height) + 16 (margin)
    bottom: 50,
    left: 48,
    right: 48,
  },
  section: 16,
  paragraph: 8,
  small: 4,
  card: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 8,
  },
  metadata: {
    rowGap: 4,
    marginBottom: 20,
  },
  footer: {
    paddingTop: 10,
  },
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
  contentWrapper: {
    paddingHorizontal: spacing.page.left,
  },

  // Fixed Page Logo (appears on every page)
  pageLogoContainer: {
    position: 'absolute',
    top: 24,
    left: 16,
  },
  pageLogo: {
    width: 72,
    height: 48, // 3:2 aspect ratio (1536x1024 source)
    opacity: 0.4,
  },

  // Topic Header (first page only, centered)
  topicHeader: {
    alignItems: 'center',
    marginBottom: spacing.section,
  },
  topicTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: 'bold',
    color: colors.text.primary,
    lineHeight: typography.lineHeight.tight,
    textAlign: 'center',
  },

  // Metadata Block (stacked vertical layout)
  metadataBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    paddingVertical: 10,
    marginBottom: spacing.metadata.marginBottom,
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: spacing.metadata.rowGap,
  },
  metadataRowLast: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  metadataLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: 'bold',
    color: colors.text.secondary,
    width: 70,
  },
  metadataValue: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    flex: 1,
  },

  // Speaker Card
  speakerCardWrapper: {
    // Wrapper for pagination control - allows cards to break gracefully
    marginBottom: 0,
  },
  speakerCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.card.borderRadius,
    // Split padding: no paddingTop - handled by content marginTop for page break survival
    paddingBottom: spacing.card.padding,
    paddingHorizontal: spacing.card.padding,
    marginBottom: spacing.card.marginBottom,
  },
  speakerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.card.padding, // Provides top spacing (survives page breaks better than card padding)
    marginBottom: 8,
  },
  speakerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  speakerName: {
    fontSize: typography.fontSize.speakerName,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  speakerTimestamp: {
    fontSize: typography.fontSize.timestamp,
    color: colors.text.muted,
  },
  speakerContent: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.primary,
  },
  keyArgument: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    borderLeftStyle: 'solid',
    paddingLeft: 10,
    marginTop: 8,
  },
  keyArgumentText: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.normal,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },

  // Section styles
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
    color: colors.text.muted,
    marginBottom: spacing.paragraph,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: spacing.page.left,
    right: spacing.page.right,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: 'solid',
    paddingTop: spacing.footer.paddingTop,
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

  // Summary Card (matches speaker card styling)
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.card.borderRadius,
    // Split padding: no paddingTop - MarkdownRenderer elements have marginTop for page break survival
    paddingBottom: spacing.card.padding,
    paddingHorizontal: spacing.card.padding,
    marginBottom: spacing.card.marginBottom,
  },

  // Thank You Card (end of document)
  thankYouCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.card.borderRadius,
    paddingVertical: 20,
    paddingHorizontal: spacing.card.padding,
    alignItems: 'center',
  },
  thankYouTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  thankYouText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  thankYouLink: {
    fontSize: typography.fontSize.caption,
    color: colors.accent,
  },
})
