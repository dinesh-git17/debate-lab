// src/app/embed/[id]/embed-widget.tsx

'use client'

import { useEffect, useState } from 'react'

interface EmbedWidgetProps {
  debateId: string
  topic: string
  format: string
  forModel: string
  againstModel: string
  theme: 'light' | 'dark' | 'auto'
  showScores: boolean
}

function getModelEmoji(model: string): string {
  const lower = model.toLowerCase()
  if (lower.includes('gpt') || lower.includes('openai') || lower.includes('chatgpt')) {
    return '🤖'
  }
  if (lower.includes('claude') || lower.includes('anthropic')) {
    return '🎭'
  }
  if (lower.includes('grok') || lower.includes('xai')) {
    return '⚡'
  }
  return '🤖'
}

export function EmbedWidget({
  debateId,
  topic,
  format,
  forModel,
  againstModel,
  theme,
  showScores,
}: EmbedWidgetProps) {
  const [scores, setScores] = useState<{ for: number; against: number } | null>(null)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (theme === 'dark') {
      setIsDark(true)
    } else if (theme === 'light') {
      setIsDark(false)
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setIsDark(mediaQuery.matches)

      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  useEffect(() => {
    if (showScores) {
      fetch(`/api/debate/${debateId}/judge`)
        .then((res) => res.json())
        .then(
          (data: {
            analysis?: {
              forAnalysis: { percentage: number }
              againstAnalysis: { percentage: number }
            }
          }) => {
            if (data.analysis) {
              setScores({
                for: data.analysis.forAnalysis.percentage,
                against: data.analysis.againstAnalysis.percentage,
              })
            }
          }
        )
        .catch(() => {})
    }
  }, [debateId, showScores])

  const displayTopic = topic.length > 60 ? topic.slice(0, 60) + '...' : topic

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 300,
        padding: 24,
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        color: isDark ? '#fafafa' : '#18181b',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 24 }}>⚖️</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: isDark ? '#a1a1aa' : '#71717a',
          }}
        >
          Debate Lab
        </span>
      </div>

      {/* Topic */}
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 20,
          lineHeight: 1.3,
          margin: '0 0 20px 0',
        }}
      >
        {displayTopic}
      </h1>

      {/* Models */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* FOR */}
        <div
          style={{
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>{getModelEmoji(forModel)}</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#3b82f6',
              marginBottom: 4,
            }}
          >
            FOR
          </div>
          <div style={{ fontWeight: 700 }}>{forModel}</div>
          {scores && (
            <div
              style={{
                marginTop: 8,
                fontSize: 24,
                fontWeight: 700,
                color: '#3b82f6',
              }}
            >
              {scores.for}%
            </div>
          )}
        </div>

        {/* AGAINST */}
        <div
          style={{
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>{getModelEmoji(againstModel)}</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#ef4444',
              marginBottom: 4,
            }}
          >
            AGAINST
          </div>
          <div style={{ fontWeight: 700 }}>{againstModel}</div>
          {scores && (
            <div
              style={{
                marginTop: 8,
                fontSize: 24,
                fontWeight: 700,
                color: '#ef4444',
              }}
            >
              {scores.against}%
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: isDark ? '#71717a' : '#a1a1aa',
          }}
        >
          {format} Format
        </span>

        <a
          href={`/debate/${debateId}/summary`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#3b82f6',
            textDecoration: 'none',
          }}
        >
          View Full Debate →
        </a>
      </div>
    </div>
  )
}
