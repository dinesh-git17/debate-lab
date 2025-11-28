// src/test/mocks/handlers.ts
// MSW request handlers for API mocking

import { http, HttpResponse, delay } from 'msw'

import { mockDebateResponse, mockMessagesResponse, mockSummaryResponse } from './fixtures'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

export const handlers = [
  // Create debate
  http.post(`${API_BASE}/api/debate`, async ({ request }) => {
    await delay(100)

    const body = (await request.json()) as { topic?: string }

    if (!body.topic || body.topic.length < 10) {
      return HttpResponse.json({ error: 'Topic must be at least 10 characters' }, { status: 400 })
    }

    return HttpResponse.json(mockDebateResponse())
  }),

  // Get debate by ID
  http.get(`${API_BASE}/api/debate/:id`, async ({ params }) => {
    await delay(50)

    const { id } = params

    if (id === 'not-found') {
      return HttpResponse.json({ error: 'Debate not found' }, { status: 404 })
    }

    if (id === 'error') {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return HttpResponse.json(mockDebateResponse(id as string))
  }),

  // Get debate messages
  http.get(`${API_BASE}/api/debate/:id/messages`, async ({ params }) => {
    await delay(50)

    const { id } = params
    return HttpResponse.json(mockMessagesResponse(id as string))
  }),

  // SSE stream for debate
  http.get(`${API_BASE}/api/debate/:id/stream`, async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const events = [
          {
            type: 'message',
            data: { role: 'assistant', content: 'First response' },
          },
          {
            type: 'message',
            data: { role: 'assistant', content: 'Second response' },
          },
          { type: 'done', data: {} },
        ]

        for (const event of events) {
          await delay(100)
          const chunk = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }

        controller.close()
      },
    })

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }),

  // End debate
  http.post(`${API_BASE}/api/debate/:id/end`, async ({ params }) => {
    await delay(100)
    const { id } = params
    return HttpResponse.json({ success: true, debateId: id })
  }),

  // Get debate summary
  http.get(`${API_BASE}/api/debate/:id/summary`, async ({ params }) => {
    await delay(100)
    const { id } = params
    return HttpResponse.json(mockSummaryResponse(id as string))
  }),

  // Validate custom rules
  http.post(`${API_BASE}/api/validate-rules`, async ({ request }) => {
    await delay(50)

    const body = (await request.json()) as { rules?: string[] }

    if (!body.rules || !Array.isArray(body.rules)) {
      return HttpResponse.json({ error: 'Invalid rules format' }, { status: 400 })
    }

    const invalidRules = body.rules.filter(
      (rule: string) => rule.toLowerCase().includes('ignore') || rule.length > 200
    )

    if (invalidRules.length > 0) {
      return HttpResponse.json({
        valid: false,
        errors: invalidRules.map((rule: string) => ({
          rule,
          error: 'Rule contains prohibited content or exceeds length limit',
        })),
      })
    }

    return HttpResponse.json({ valid: true, errors: [] })
  }),

  // Share debate
  http.post(`${API_BASE}/api/share`, async ({ request }) => {
    await delay(100)

    const body = (await request.json()) as { debateId?: string }

    if (!body.debateId) {
      return HttpResponse.json({ error: 'Debate ID required' }, { status: 400 })
    }

    return HttpResponse.json({
      shareId: `share-${Date.now()}`,
      url: `https://example.com/share/share-${Date.now()}`,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    })
  }),

  // Get shared debate
  http.get(`${API_BASE}/api/share/:shareId`, async ({ params }) => {
    await delay(50)

    const { shareId } = params

    if (shareId === 'expired') {
      return HttpResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    return HttpResponse.json({
      shareId,
      debate: mockDebateResponse(),
      messages: mockMessagesResponse().messages,
      summary: mockSummaryResponse(),
    })
  }),

  // Health check
  http.get(`${API_BASE}/api/health`, async () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: 3600,
    })
  }),

  // Metrics endpoint (requires auth)
  http.get(`${API_BASE}/api/metrics`, async ({ request }) => {
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return new HttpResponse(
      '# HELP debates_total Total debates\ndebates_total{status="completed"} 100',
      { headers: { 'Content-Type': 'text/plain' } }
    )
  }),
]

// Error handlers for testing error scenarios
export const errorHandlers = {
  networkError: http.post(`${API_BASE}/api/debate`, () => {
    return HttpResponse.error()
  }),

  timeout: http.post(`${API_BASE}/api/debate`, async () => {
    await delay(30000)
    return HttpResponse.json({ error: 'Timeout' }, { status: 504 })
  }),

  rateLimited: http.post(`${API_BASE}/api/debate`, () => {
    return HttpResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    )
  }),

  serverError: http.post(`${API_BASE}/api/debate`, () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
  }),
}
