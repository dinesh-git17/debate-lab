// src/lib/chunk-parser.ts

/**
 * Chunk Parser Utility
 * Finds safe markdown boundaries for controlled content release during streaming.
 */

interface ChunkOptions {
  /** Don't create chunks smaller than this (default: 20) */
  minChunkSize?: number | undefined
  /** Force break if chunk gets too large (default: 300) */
  maxChunkSize?: number | undefined
}

const DEFAULT_MIN_CHUNK_SIZE = 20
const DEFAULT_MAX_CHUNK_SIZE = 300

/**
 * Check if we're inside an unclosed code block
 */
function isInsideCodeBlock(content: string): boolean {
  const codeBlockMatches = content.match(/```/g)
  return codeBlockMatches !== null && codeBlockMatches.length % 2 === 1
}

/**
 * Check if we're inside unclosed inline formatting
 * (bold **, italic *, etc.)
 */
function hasUnclosedInlineFormatting(content: string): boolean {
  // Check for unclosed bold (**)
  const boldMatches = content.match(/\*\*/g)
  if (boldMatches && boldMatches.length % 2 === 1) return true

  // Check for unclosed italic (single * not part of **)
  // This is tricky - we need to count single asterisks not adjacent to another
  const withoutBold = content.replace(/\*\*/g, '')
  const italicMatches = withoutBold.match(/\*/g)
  if (italicMatches && italicMatches.length % 2 === 1) return true

  // Check for unclosed backticks (inline code)
  const backtickMatches = content.match(/`/g)
  if (backtickMatches && backtickMatches.length % 2 === 1) return true

  return false
}

/**
 * Given raw content and already-revealed content, find the next safe chunk to reveal.
 * Returns the new display content (revealed + next chunk).
 * Returns null if no safe boundary found yet (keep buffering).
 */
export function getNextChunk(
  rawContent: string,
  revealedContent: string,
  options?: ChunkOptions
): string | null {
  const minChunkSize = options?.minChunkSize ?? DEFAULT_MIN_CHUNK_SIZE
  const maxChunkSize = options?.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE

  const unrevealed = rawContent.slice(revealedContent.length)
  if (!unrevealed || unrevealed.length === 0) return null

  // If we're inside a code block, wait for it to close
  if (isInsideCodeBlock(revealedContent + unrevealed.slice(0, Math.min(unrevealed.length, 10)))) {
    // Look for the closing ```
    const closingCodeBlock = unrevealed.indexOf('```')
    if (closingCodeBlock !== -1) {
      // Find the newline after the closing ```
      const afterClose = unrevealed.indexOf('\n', closingCodeBlock + 3)
      if (afterClose !== -1) {
        const potentialContent = revealedContent + unrevealed.slice(0, afterClose + 1)
        // Make sure the code block is now closed
        if (!isInsideCodeBlock(potentialContent)) {
          return potentialContent
        }
      }
    }
    // Code block not closed yet, keep buffering
    return null
  }

  // Priority 1: Paragraph break (\n\n)
  const paragraphBreak = unrevealed.indexOf('\n\n')
  if (paragraphBreak !== -1 && paragraphBreak >= minChunkSize) {
    const potentialContent = revealedContent + unrevealed.slice(0, paragraphBreak + 2)
    if (!hasUnclosedInlineFormatting(potentialContent)) {
      return potentialContent
    }
  }

  // Priority 2: List item end (newline after content that started with list marker)
  // Match a complete list item: marker + content + newline
  const listItemMatch = unrevealed.match(/^([-*]|\d+\.)\s+[^\n]+\n/)
  if (listItemMatch && listItemMatch[0].length >= minChunkSize) {
    const potentialContent = revealedContent + listItemMatch[0]
    if (!hasUnclosedInlineFormatting(potentialContent)) {
      return potentialContent
    }
  }

  // Priority 3: Sentence end (. ! ? followed by space or newline)
  const sentenceMatch = unrevealed.match(/^[^.!?]*[.!?](?:\s|$)/)
  if (sentenceMatch && sentenceMatch[0].length >= minChunkSize) {
    const potentialContent = revealedContent + sentenceMatch[0]
    if (!hasUnclosedInlineFormatting(potentialContent)) {
      return potentialContent
    }
  }

  // Priority 4: Comma/semicolon break for long buffers (clause break)
  if (unrevealed.length > 100) {
    const clauseMatch = unrevealed.match(/^[^,;]*[,;]\s/)
    if (clauseMatch && clauseMatch[0].length >= minChunkSize) {
      const potentialContent = revealedContent + clauseMatch[0]
      if (!hasUnclosedInlineFormatting(potentialContent)) {
        return potentialContent
      }
    }
  }

  // Priority 5: Force break at max size (find last space before max)
  if (unrevealed.length > maxChunkSize) {
    const searchArea = unrevealed.slice(0, maxChunkSize)
    const lastSpace = searchArea.lastIndexOf(' ')
    if (lastSpace > minChunkSize) {
      const potentialContent = revealedContent + unrevealed.slice(0, lastSpace + 1)
      // For forced breaks, we accept even if there's unclosed formatting
      // The next chunk will complete it
      return potentialContent
    }
    // No good space found, just break at max
    return revealedContent + unrevealed.slice(0, maxChunkSize)
  }

  // No safe boundary yet - keep buffering
  return null
}

/**
 * When streaming completes, we may have leftover content.
 * This returns the final content to display.
 */
export function getFinalContent(rawContent: string): string {
  return rawContent
}

/**
 * Calculate the reveal progress as a percentage
 */
export function calculateProgress(rawContent: string, revealedContent: string): number {
  if (rawContent.length === 0) return 100
  return Math.round((revealedContent.length / rawContent.length) * 100)
}
