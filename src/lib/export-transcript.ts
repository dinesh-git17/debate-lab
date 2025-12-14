/**
 * Debate transcript export utilities.
 * Supports Markdown, PDF, and JSON formats with configurable content options.
 */

import { pdf } from '@react-pdf/renderer'

import { DebateDocument } from '@/lib/export/pdf'

import type { DebateMessage } from '@/types/debate-ui'
import type { ExportConfig, ExportedTranscript, ExportedTurn } from '@/types/export'

export function generateFilename(topic: string, format: 'markdown' | 'pdf' | 'json'): string {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

  const date = new Date().toISOString().split('T')[0]
  const extension = format === 'markdown' ? 'md' : format

  return `debate-${slug}-${date}.${extension}`
}

export function exportAsMarkdown(
  topic: string,
  format: string,
  messages: DebateMessage[],
  config: ExportConfig,
  summary?: string
): string {
  const lines: string[] = []

  lines.push(`# AI Debate: ${topic}`)
  lines.push('')
  lines.push(`**Format:** ${format}`)
  lines.push(`**Exported:** ${new Date().toLocaleString()}`)
  lines.push(`**Total Turns:** ${messages.length}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('## Debate Transcript')
  lines.push('')

  for (const message of messages) {
    if (!config.includeModeratorTurns && message.speaker === 'moderator') {
      continue
    }

    const speakerEmoji =
      message.speaker === 'for' ? '🔵' : message.speaker === 'against' ? '🔴' : '🟡'

    lines.push(`### ${speakerEmoji} ${message.speakerLabel}`)
    lines.push('')

    if (config.includeTimestamps && message.timestamp) {
      lines.push(`*${message.timestamp.toLocaleString()}*`)
      lines.push('')
    }

    lines.push(message.content)
    lines.push('')

    lines.push('---')
    lines.push('')
  }

  if (summary) {
    lines.push('## Moderator Summary')
    lines.push('')
    lines.push(summary)
    lines.push('')
  }

  return lines.join('\n')
}

export async function exportAsPDF(
  topic: string,
  format: string,
  messages: DebateMessage[],
  config: ExportConfig,
  summary?: string | undefined
): Promise<Blob> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const document = DebateDocument({
    topic,
    format,
    messages,
    config,
    summary,
    baseUrl,
  })

  // Type assertion required for @react-pdf/renderer generic constraints
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(document as any).toBlob()
  return blob
}

export function exportAsJSON(
  debateId: string,
  topic: string,
  format: string,
  status: string,
  messages: DebateMessage[],
  config: ExportConfig,
  summary?: string
): string {
  const turns: ExportedTurn[] = messages
    .filter((m) => config.includeModeratorTurns || m.speaker !== 'moderator')
    .map((message, index) => {
      const turn: ExportedTurn = {
        turnNumber: index + 1,
        speaker: message.speaker,
        speakerLabel: message.speakerLabel,
        turnType: message.turnType,
        content: message.content,
      }

      if (config.includeTimestamps && message.timestamp) {
        turn.timestamp = message.timestamp.toISOString()
      }

      return turn
    })

  const totalTokens = messages.reduce((sum, m) => sum + (m.tokenCount ?? 0), 0)

  const exported: ExportedTranscript = {
    metadata: {
      debateId,
      topic,
      format,
      status,
      exportedAt: new Date().toISOString(),
      totalTurns: turns.length,
      totalTokens,
    },
    turns,
    summary,
  }

  return JSON.stringify(exported, null, 2)
}

export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export async function exportTranscript(
  debateId: string,
  topic: string,
  format: string,
  status: string,
  messages: DebateMessage[],
  config: ExportConfig,
  summary?: string
): Promise<void> {
  let content: string | Blob
  let mimeType: string

  switch (config.format) {
    case 'markdown':
      content = exportAsMarkdown(topic, format, messages, config, summary)
      mimeType = 'text/markdown'
      break
    case 'pdf':
      content = await exportAsPDF(topic, format, messages, config, summary)
      mimeType = 'application/pdf'
      break
    case 'json':
      content = exportAsJSON(debateId, topic, format, status, messages, config, summary)
      mimeType = 'application/json'
      break
    default:
      throw new Error(`Unknown format: ${config.format}`)
  }

  const filename = generateFilename(topic, config.format)
  downloadFile(content, filename, mimeType)
}
