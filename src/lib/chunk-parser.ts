// chunk-parser.ts
/**
 * Markdown-aware chunking for streaming content display.
 * Finds safe boundaries to avoid breaking formatting mid-render.
 */

interface ChunkOptions {
  minChunkSize?: number | undefined
  maxChunkSize?: number | undefined
}

const DEFAULT_MIN_CHUNK_SIZE = 20
const DEFAULT_MAX_CHUNK_SIZE = 300

function isInsideCodeBlock(content: string): boolean {
  const codeBlockMatches = content.match(/```/g)
  return codeBlockMatches !== null && codeBlockMatches.length % 2 === 1
}

function hasUnclosedInlineFormatting(content: string): boolean {
  const boldMatches = content.match(/\*\*/g)
  if (boldMatches && boldMatches.length % 2 === 1) return true

  const withoutBold = content.replace(/\*\*/g, '')
  const italicMatches = withoutBold.match(/\*/g)
  if (italicMatches && italicMatches.length % 2 === 1) return true

  const backtickMatches = content.match(/`/g)
  if (backtickMatches && backtickMatches.length % 2 === 1) return true

  return false
}

/**
 * Finds the next safe chunk boundary for reveal animation.
 * Returns null if no safe boundary found (continue buffering).
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

  // Handle code blocks: wait for closing fence
  if (isInsideCodeBlock(revealedContent + unrevealed.slice(0, Math.min(unrevealed.length, 10)))) {
    const closingCodeBlock = unrevealed.indexOf('```')
    if (closingCodeBlock !== -1) {
      const afterClose = unrevealed.indexOf('\n', closingCodeBlock + 3)
      if (afterClose !== -1) {
        const potentialContent = revealedContent + unrevealed.slice(0, afterClose + 1)
        if (!isInsideCodeBlock(potentialContent)) {
          return potentialContent
        }
      }
    }
    return null
  }

  // Priority 1: Paragraph break
  const paragraphBreak = unrevealed.indexOf('\n\n')
  if (paragraphBreak !== -1 && paragraphBreak >= minChunkSize) {
    const potentialContent = revealedContent + unrevealed.slice(0, paragraphBreak + 2)
    if (!hasUnclosedInlineFormatting(potentialContent)) {
      return potentialContent
    }
  }

  // Priority 2: Complete list item
  const listItemMatch = unrevealed.match(/^([-*]|\d+\.)\s+[^\n]+\n/)
  if (listItemMatch && listItemMatch[0].length >= minChunkSize) {
    const potentialContent = revealedContent + listItemMatch[0]
    if (!hasUnclosedInlineFormatting(potentialContent)) {
      return potentialContent
    }
  }

  // Priority 3: Sentence end
  const sentenceMatch = unrevealed.match(/^[^.!?]*[.!?](?:\s|$)/)
  if (sentenceMatch && sentenceMatch[0].length >= minChunkSize) {
    const potentialContent = revealedContent + sentenceMatch[0]
    if (!hasUnclosedInlineFormatting(potentialContent)) {
      return potentialContent
    }
  }

  // Priority 4: Clause break for long buffers
  if (unrevealed.length > 100) {
    const clauseMatch = unrevealed.match(/^[^,;]*[,;]\s/)
    if (clauseMatch && clauseMatch[0].length >= minChunkSize) {
      const potentialContent = revealedContent + clauseMatch[0]
      if (!hasUnclosedInlineFormatting(potentialContent)) {
        return potentialContent
      }
    }
  }

  // Priority 5: Force break at max size
  if (unrevealed.length > maxChunkSize) {
    const searchArea = unrevealed.slice(0, maxChunkSize)
    const lastSpace = searchArea.lastIndexOf(' ')
    if (lastSpace > minChunkSize) {
      const potentialContent = revealedContent + unrevealed.slice(0, lastSpace + 1)
      return potentialContent
    }
    return revealedContent + unrevealed.slice(0, maxChunkSize)
  }

  return null
}

export function getFinalContent(rawContent: string): string {
  return rawContent
}

export function calculateProgress(rawContent: string, revealedContent: string): number {
  if (rawContent.length === 0) return 100
  return Math.round((revealedContent.length / rawContent.length) * 100)
}
