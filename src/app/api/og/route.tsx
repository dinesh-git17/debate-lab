/**
 * Dynamic OG image generation for social sharing.
 * Renders a premium Apple-inspired design with glassmorphic cards and model logos.
 */

import { ImageResponse } from 'next/og'

import type { NextRequest } from 'next/server'

export const runtime = 'edge'

type ModelInfo = {
  logo: React.ReactElement | null
  name: string
}

function getModelInfo(model: string): ModelInfo {
  const lower = model.toLowerCase()

  if (lower.includes('gpt') || lower.includes('openai') || lower.includes('chatgpt')) {
    return { logo: <ChatGPTLogo />, name: 'ChatGPT' }
  }
  if (lower.includes('claude') || lower.includes('anthropic')) {
    return { logo: <ClaudeLogo />, name: 'Claude' }
  }
  if (lower.includes('grok') || lower.includes('xai')) {
    return { logo: <GrokLogo />, name: 'Grok' }
  }

  return { logo: <GenericAILogo />, name: model }
}

function GenericAILogo(): React.ReactElement {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
      <path
        d="M12 6v2M12 16v2M6 12h2M16 12h2"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" fill="white" />
    </svg>
  )
}

function ChatGPTLogo(): React.ReactElement {
  return (
    <svg width="48" height="48" viewBox="-0.17 0.48 41.14 40.03" fill="none">
      <path
        d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.01L7.04 23.856a7.504 7.504 0 0 1-2.743-10.237zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.01l8.052 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.65-1.132zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18z"
        fill="white"
      />
    </svg>
  )
}

function ClaudeLogo(): React.ReactElement {
  return (
    <svg width="48" height="48" viewBox="0 -.01 39.5 39.53" fill="none">
      <path
        d="m7.75 26.27 7.77-4.36.13-.38-.13-.21h-.38l-1.3-.08-4.44-.12-3.85-.16-3.73-.2-.94-.2-.88-1.16.09-.58.79-.53 1.13.1 2.5.17 3.75.26 2.72.16 4.03.42h.64l.09-.26-.22-.16-.17-.16-3.88-2.63-4.2-2.78-2.2-1.6-1.19-.81-.6-.76-.26-1.66 1.08-1.19 1.45.1.37.1 1.47 1.13 3.14 2.43 4.1 3.02.6.5.24-.17.03-.12-.27-.45-2.23-4.03-2.38-4.1-1.06-1.7-.28-1.02c-.1-.42-.17-.77-.17-1.2l1.23-1.67.68-.22 1.64.22.69.6 1.02 2.33 1.65 3.67 2.56 4.99.75 1.48.4 1.37.15.42h.26v-.24l.21-2.81.39-3.45.38-4.44.13-1.25.62-1.5 1.23-.81.96.46.79 1.13-.11.73-.47 3.05-.92 4.78-.6 3.2h.35l.4-.4 1.62-2.15 2.72-3.4 1.2-1.35 1.4-1.49.9-.71h1.7l1.25 1.86-.56 1.92-1.75 2.22-1.45 1.88-2.08 2.8-1.3 2.24.12.18.31-.03 4.7-1 2.54-.46 3.03-.52 1.37.64.15.65-.54 1.33-3.24.8-3.8.76-5.66 1.34-.07.05.08.1 2.55.24 1.09.06h2.67l4.97.37 1.3.86.78 1.05-.13.8-2 1.02-2.7-.64-6.3-1.5-2.16-.54h-.3v.18l1.8 1.76 3.3 2.98 4.13 3.84.21.95-.53.75-.56-.08-3.63-2.73-1.4-1.23-3.17-2.67h-.21v.28l.73 1.07 3.86 5.8.2 1.78-.28.58-1 .35-1.1-.2-2.26-3.17-2.33-3.57-1.88-3.2-.23.13-1.11 11.95-.52.61-1.2.46-1-.76-.53-1.23.53-2.43.64-3.17.52-2.52.47-3.13.28-1.04-.02-.07-.23.03-2.36 3.24-3.59 4.85-2.84 3.04-.68.27-1.18-.61.11-1.09.66-.97 3.93-5 2.37-3.1 1.53-1.79-.01-.26h-.09l-10.44 6.78-1.86.24-.8-.75.1-1.23.38-.4 3.14-2.16z"
        fill="white"
      />
    </svg>
  )
}

function GrokLogo(): React.ReactElement {
  return (
    <svg width="48" height="48" viewBox="0 1 48 46" fill="none">
      <path
        d="m18.542 30.532 15.956-11.776c.783-.576 1.902-.354 2.274.545 1.962 4.728 1.084 10.411-2.819 14.315-3.903 3.901-9.333 4.756-14.299 2.808l-5.423 2.511c7.778 5.315 17.224 4 23.125-1.903 4.682-4.679 6.131-11.058 4.775-16.812l.011.011c-1.966-8.452.482-11.829 5.501-18.735.116-.164.237-.33.357-.496l-6.602 6.599v-.022l-22.86 22.958m-3.29 2.857c-5.582-5.329-4.619-13.579.142-18.339 3.521-3.522 9.294-4.958 14.331-2.847l5.412-2.497c-.974-.704-2.224-1.46-3.659-1.994-6.478-2.666-14.238-1.34-19.505 3.922-5.065 5.064-6.659 12.851-3.924 19.496 2.044 4.965-1.307 8.48-4.682 12.023-1.199 1.255-2.396 2.514-3.363 3.844l15.241-13.608"
        fill="white"
      />
    </svg>
  )
}

export async function GET(request: NextRequest): Promise<ImageResponse> {
  const { searchParams } = new URL(request.url)

  const topic = searchParams.get('topic') ?? 'AI Debate'
  const forModel = searchParams.get('for') ?? 'AI'
  const againstModel = searchParams.get('against') ?? 'AI'
  const forScore = searchParams.get('forScore') ? parseInt(searchParams.get('forScore')!, 10) : null
  const againstScore = searchParams.get('againstScore')
    ? parseInt(searchParams.get('againstScore')!, 10)
    : null

  const forModelInfo = getModelInfo(forModel)
  const againstModelInfo = getModelInfo(againstModel)

  const hasScores = forScore !== null && againstScore !== null
  const forWins = hasScores && forScore > againstScore
  const againstWins = hasScores && againstScore > forScore

  const topicLength = topic.length
  let fontSize = 52
  if (topicLength > 60) fontSize = 44
  if (topicLength > 80) fontSize = 38

  const displayTopic = topic.length > 100 ? topic.slice(0, 100) + '...' : topic

  const baseUrl = new URL(request.url).origin
  const logoUrl = `${baseUrl}/logo/logo-dark.png`

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Background layers */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#0a0a0a',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(30,30,30,0.8) 0%, transparent 100%)',
          display: 'flex',
        }}
      />

      {/* Logo - absolute positioned top-left */}
      <div
        style={{
          position: 'absolute',
          top: -35,
          left: -10,
          display: 'flex',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="Debate Lab"
          width={1536}
          height={1024}
          style={{
            width: '255px',
            height: '170px',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Content container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          padding: '48px',
          position: 'relative',
        }}
      >
        {/* Topic - centered */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '-24px',
          }}
        >
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.1,
              textAlign: 'center',
              maxWidth: '1000px',
              letterSpacing: '-0.03em',
              display: 'flex',
              textShadow: '0 2px 20px rgba(255,255,255,0.15), 0 4px 40px rgba(255,255,255,0.1)',
            }}
          >
            {displayTopic}
          </div>

          {/* Model cards */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              marginTop: '48px',
            }}
          >
            {/* FOR card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '220px',
                height: '200px',
                borderRadius: '24px',
                background: forWins
                  ? 'linear-gradient(145deg, rgba(34,197,94,0.3) 0%, rgba(22,163,74,0.15) 100%)'
                  : 'linear-gradient(145deg, rgba(100,116,139,0.4) 0%, rgba(71,85,105,0.2) 100%)',
                border: forWins
                  ? '1px solid rgba(34,197,94,0.4)'
                  : '1px solid rgba(255,255,255,0.1)',
                boxShadow: forWins
                  ? '0 8px 32px rgba(34,197,94,0.3), 0 0 60px rgba(34,197,94,0.15)'
                  : '0 8px 32px rgba(0,0,0,0.4)',
                position: 'relative',
              }}
            >
              {forWins && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#22c55e',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  WINNER
                </div>
              )}
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '8px',
                  display: 'flex',
                }}
              >
                FOR
              </span>
              {forModelInfo.logo}
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#fafafa',
                  marginTop: '8px',
                  display: 'flex',
                }}
              >
                {forModelInfo.name}
              </span>
              {hasScores && (
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: forWins ? '#22c55e' : '#fafafa',
                    marginTop: '4px',
                    display: 'flex',
                    textShadow: forWins ? '0 0 20px rgba(34,197,94,0.5)' : 'none',
                  }}
                >
                  {forScore}
                </span>
              )}
            </div>

            {/* VS */}
            <span
              style={{
                fontSize: '24px',
                fontWeight: 500,
                color: '#71717a',
                display: 'flex',
              }}
            >
              VS
            </span>

            {/* AGAINST card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '220px',
                height: '200px',
                borderRadius: '24px',
                background: againstWins
                  ? 'linear-gradient(145deg, rgba(34,197,94,0.3) 0%, rgba(22,163,74,0.15) 100%)'
                  : 'linear-gradient(145deg, rgba(120,113,108,0.4) 0%, rgba(87,83,78,0.2) 100%)',
                border: againstWins
                  ? '1px solid rgba(34,197,94,0.4)'
                  : '1px solid rgba(255,255,255,0.1)',
                boxShadow: againstWins
                  ? '0 8px 32px rgba(34,197,94,0.3), 0 0 60px rgba(34,197,94,0.15)'
                  : '0 8px 32px rgba(0,0,0,0.4)',
                position: 'relative',
              }}
            >
              {againstWins && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#22c55e',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  WINNER
                </div>
              )}
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '8px',
                  display: 'flex',
                }}
              >
                AGAINST
              </span>
              {againstModelInfo.logo}
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#fafafa',
                  marginTop: '8px',
                  display: 'flex',
                }}
              >
                {againstModelInfo.name}
              </span>
              {hasScores && (
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: againstWins ? '#22c55e' : '#fafafa',
                    marginTop: '4px',
                    display: 'flex',
                    textShadow: againstWins ? '0 0 20px rgba(34,197,94,0.5)' : 'none',
                  }}
                >
                  {againstScore}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              letterSpacing: '0.01em',
            }}
          >
            — One side is wrong. Is it yours?
          </span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  )
}
