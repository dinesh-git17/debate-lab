/**
 * Markdown renderer for react-pdf.
 * Converts markdown syntax to styled Text components for PDF export.
 */

import { StyleSheet, Text, View } from '@react-pdf/renderer'

import { colors, typography } from '../styles'

/**
 * Strips emoji characters from text. React-pdf cannot render emojis,
 * so they appear as garbage characters (e.g., 🎙️ becomes <™).
 * Preserves whitespace and newlines to maintain markdown structure.
 */
function stripEmojis(text: string): string {
  return text.replace(
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{FE0F}]|[\u{200D}]/gu,
    ''
  )
}

/**
 * Margin values provide breathing room when content breaks across pages.
 * Top margins ensure elements don't appear flush against card edges at break points.
 * Matches card's internal padding (14pt) for consistency at page breaks.
 */
const BREAK_BREATHING_ROOM = 14

const markdownStyles = StyleSheet.create({
  paragraph: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.primary,
    marginTop: BREAK_BREATHING_ROOM,
    marginBottom: 4,
  },
  heading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: BREAK_BREATHING_ROOM + 2,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  boldItalic: {
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    borderLeftStyle: 'solid',
    paddingLeft: 10,
    marginTop: BREAK_BREATHING_ROOM,
    marginBottom: 6,
  },
  blockquoteText: {
    fontSize: typography.fontSize.body,
    fontStyle: 'italic',
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal,
  },
  horizontalRule: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    marginVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 2,
  },
  listBullet: {
    width: 12,
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
  },
  listContent: {
    flex: 1,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.primary,
  },
})

interface TextSegment {
  text: string
  bold: boolean
  italic: boolean
}

/**
 * Parses inline markdown (bold, italic) within a text string.
 * Returns an array of segments with formatting flags.
 */
function parseInlineMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = []

  // Combined regex for bold and italic patterns
  // Handles **bold**, __bold__, *italic*, _italic_
  const regex = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3/g

  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false, italic: false })
    }

    if (match[1] && match[2]) {
      // Bold match (**text** or __text__)
      segments.push({ text: match[2], bold: true, italic: false })
    } else if (match[3] && match[4]) {
      // Italic match (*text* or _text_)
      segments.push({ text: match[4], bold: false, italic: true })
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false, italic: false })
  }

  return segments.length > 0 ? segments : [{ text, bold: false, italic: false }]
}

/**
 * Renders a text segment with appropriate styling.
 */
function StyledSegment({
  segment,
  segmentKey,
}: {
  segment: TextSegment
  segmentKey: number
}): React.ReactElement {
  if (segment.bold && segment.italic) {
    return (
      <Text key={segmentKey} style={markdownStyles.boldItalic}>
        {segment.text}
      </Text>
    )
  }
  if (segment.bold) {
    return (
      <Text key={segmentKey} style={markdownStyles.bold}>
        {segment.text}
      </Text>
    )
  }
  if (segment.italic) {
    return (
      <Text key={segmentKey} style={markdownStyles.italic}>
        {segment.text}
      </Text>
    )
  }
  return <Text key={segmentKey}>{segment.text}</Text>
}

/**
 * Renders inline markdown segments within a parent Text component.
 */
function renderInlineSegments(text: string): React.ReactElement[] {
  const segments = parseInlineMarkdown(text)
  return segments.map((segment, index) => (
    <StyledSegment key={index} segment={segment} segmentKey={index} />
  ))
}

interface MarkdownBlock {
  type: 'paragraph' | 'heading' | 'blockquote' | 'hr' | 'list-item'
  content: string
}

/**
 * Parses markdown content into block-level elements.
 */
function parseBlocks(content: string): MarkdownBlock[] {
  const lines = content.split('\n')
  const blocks: MarkdownBlock[] = []
  let currentParagraph: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({
        type: 'paragraph',
        content: currentParagraph.join(' ').trim(),
      })
      currentParagraph = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Empty line - flush paragraph
    if (!trimmed) {
      flushParagraph()
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph()
      blocks.push({ type: 'hr', content: '' })
      continue
    }

    // Heading (### text)
    if (/^#{1,6}\s/.test(trimmed)) {
      flushParagraph()
      const headingContent = trimmed.replace(/^#{1,6}\s+/, '')
      blocks.push({ type: 'heading', content: headingContent })
      continue
    }

    // Blockquote (> text)
    if (trimmed.startsWith('>')) {
      flushParagraph()
      const quoteContent = trimmed.replace(/^>\s*/, '')
      blocks.push({ type: 'blockquote', content: quoteContent })
      continue
    }

    // List item (- text, * text, or • text at start)
    if (/^[-*•]\s/.test(trimmed)) {
      flushParagraph()
      const listContent = trimmed.replace(/^[-*•]\s*/, '')
      blocks.push({ type: 'list-item', content: listContent })
      continue
    }

    // Regular text - add to current paragraph
    currentParagraph.push(trimmed)
  }

  flushParagraph()
  return blocks
}

interface MarkdownRendererProps {
  content: string
}

/**
 * Renders markdown content as styled react-pdf components.
 * Supports: bold, italic, headings, blockquotes, horizontal rules, list items.
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps): React.ReactElement {
  const sanitizedContent = stripEmojis(content)
  const blocks = parseBlocks(sanitizedContent)

  return (
    <View>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <Text key={index} style={markdownStyles.heading}>
                {renderInlineSegments(block.content)}
              </Text>
            )

          case 'blockquote':
            return (
              <View key={index} style={markdownStyles.blockquote}>
                <Text style={markdownStyles.blockquoteText}>
                  {renderInlineSegments(block.content)}
                </Text>
              </View>
            )

          case 'hr':
            return <View key={index} style={markdownStyles.horizontalRule} />

          case 'list-item':
            return (
              <View key={index} style={markdownStyles.listItem}>
                <Text style={markdownStyles.listBullet}>•</Text>
                <Text style={markdownStyles.listContent}>
                  {renderInlineSegments(block.content)}
                </Text>
              </View>
            )

          case 'paragraph':
          default:
            return (
              <Text key={index} style={markdownStyles.paragraph}>
                {renderInlineSegments(block.content)}
              </Text>
            )
        }
      })}
    </View>
  )
}
