// src/app/api/og/route.tsx

import { ImageResponse } from 'next/og'

import type { NextRequest } from 'next/server'

export const runtime = 'edge'

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const topic = searchParams.get('topic') ?? 'AI Debate'
  const format = searchParams.get('format') ?? 'Standard'
  const forModel = searchParams.get('for') ?? 'AI'
  const againstModel = searchParams.get('against') ?? 'AI'
  const status = searchParams.get('status') ?? 'completed'
  const turns = searchParams.get('turns') ?? '0'
  const date = searchParams.get('date') ?? new Date().toLocaleDateString()

  const displayTopic = topic.length > 80 ? topic.slice(0, 80) + '...' : topic

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '32px' }}>⚖️</span>
            <span
              style={{
                fontSize: '24px',
                color: '#a1a1aa',
                fontWeight: 600,
              }}
            >
              Debate Lab
            </span>
          </div>
          <div
            style={{
              backgroundColor: status === 'completed' ? '#22c55e' : '#eab308',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            {status === 'completed' ? 'Completed' : 'In Progress'}
          </div>
        </div>

        {/* Topic */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#fafafa',
            lineHeight: 1.2,
            marginBottom: '40px',
            display: 'flex',
          }}
        >
          {displayTopic}
        </div>

        {/* Models */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {/* FOR */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#1e3a5f',
              padding: '24px 32px',
              borderRadius: '16px',
              flex: 1,
            }}
          >
            <span style={{ fontSize: '40px', marginBottom: '8px' }}>{getModelEmoji(forModel)}</span>
            <span style={{ fontSize: '20px', color: '#60a5fa', fontWeight: 600 }}>FOR</span>
            <span style={{ fontSize: '24px', color: '#fafafa', fontWeight: 700 }}>{forModel}</span>
          </div>

          {/* VS */}
          <div
            style={{
              fontSize: '32px',
              color: '#71717a',
              fontWeight: 700,
            }}
          >
            VS
          </div>

          {/* AGAINST */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#5f1e1e',
              padding: '24px 32px',
              borderRadius: '16px',
              flex: 1,
            }}
          >
            <span style={{ fontSize: '40px', marginBottom: '8px' }}>
              {getModelEmoji(againstModel)}
            </span>
            <span style={{ fontSize: '20px', color: '#f87171', fontWeight: 600 }}>AGAINST</span>
            <span style={{ fontSize: '24px', color: '#fafafa', fontWeight: 700 }}>
              {againstModel}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            color: '#71717a',
            fontSize: '18px',
          }}
        >
          <span>
            {format} Format • {turns} Turns
          </span>
          <span>{date}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
