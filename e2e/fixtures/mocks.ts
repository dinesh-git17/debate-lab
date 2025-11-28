// e2e/fixtures/mocks.ts
// API mocking utilities for E2E tests

import type { Page, Route } from '@playwright/test'

export interface MockDebateResponse {
  id: string
  topic: string
  format: string
  turns: number
  status: 'pending' | 'active' | 'completed'
  forModel: string
  againstModel: string
}

export interface MockMessageResponse {
  id: string
  role: 'for' | 'against' | 'moderator'
  content: string
  turnNumber: number
  tokens: number
}

export function generateDebateId(): string {
  return `debate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createMockDebate(overrides: Partial<MockDebateResponse> = {}): MockDebateResponse {
  return {
    id: generateDebateId(),
    topic: 'Should artificial intelligence be regulated?',
    format: 'standard',
    turns: 4,
    status: 'active',
    forModel: 'gpt-4',
    againstModel: 'grok-2',
    ...overrides,
  }
}

export function createMockMessages(debateId: string, count = 5): MockMessageResponse[] {
  const messages: MockMessageResponse[] = [
    {
      id: `msg-${debateId}-0`,
      role: 'moderator',
      content: 'Welcome to the debate. Please present your opening arguments.',
      turnNumber: 0,
      tokens: 50,
    },
  ]

  for (let i = 1; i < count; i++) {
    const role = i % 2 === 1 ? 'for' : 'against'
    messages.push({
      id: `msg-${debateId}-${i}`,
      role,
      content: `This is ${role === 'for' ? 'an argument in favor' : 'an argument against'} the topic. Turn ${Math.ceil(i / 2)}.`,
      turnNumber: Math.ceil(i / 2),
      tokens: 100 + Math.floor(Math.random() * 50),
    })
  }

  return messages
}

export function createMockSummary(debateId: string): Record<string, unknown> {
  return {
    debateId,
    forArguments: [
      'AI poses potential risks that require oversight',
      'Regulation ensures ethical development',
      'Public trust requires governance',
    ],
    againstArguments: [
      'Over-regulation stifles innovation',
      'Technology evolves faster than laws',
      'Market self-regulation is effective',
    ],
    moderatorNotes: 'Both sides presented strong arguments.',
    overallAssessment: 'A balanced debate with valid points on both sides.',
    scores: { for: 42, against: 40 },
    generatedAt: new Date().toISOString(),
  }
}

export async function mockDebateApi(page: Page): Promise<void> {
  let currentDebate: MockDebateResponse | null = null

  await page.route('**/api/debate', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { topic?: string }

      if (!body.topic || body.topic.length < 10) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Topic must be at least 10 characters' }),
        })
        return
      }

      currentDebate = createMockDebate({ topic: body.topic })
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(currentDebate),
      })
    } else {
      await route.continue()
    }
  })

  await page.route('**/api/debate/*', async (route: Route) => {
    const url = route.request().url()
    const debateId = url.split('/api/debate/')[1]?.split('/')[0] ?? ''

    if (url.includes('/stream')) {
      const messages = createMockMessages(debateId)

      const stream = messages.map((msg, index) => {
        const event = index === messages.length - 1 ? 'done' : 'message'
        return `event: ${event}\ndata: ${JSON.stringify(msg)}\n\n`
      })

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: stream.join(''),
      })
      return
    }

    if (url.includes('/summary')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockSummary(debateId)),
      })
      return
    }

    if (url.includes('/end')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    if (url.includes('/history')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: createMockMessages(debateId),
          currentTurnIndex: 2,
          totalTurns: 4,
        }),
      })
      return
    }

    if (url.includes('/engine')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, status: 'active' }),
      })
      return
    }

    if (url.includes('/judge')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          analysis: {
            overviewSummary: 'This was a well-structured debate on AI regulation.',
          },
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentDebate ?? createMockDebate({ id: debateId })),
    })
  })

  await page.route('**/api/share', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        shareId: `share-${Date.now()}`,
        url: `${page.url()}/share/share-${Date.now()}`,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      }),
    })
  })

  await page.route('**/api/validate-rules', async (route: Route) => {
    const body = route.request().postDataJSON() as { rules?: string[] }

    if (body.rules?.some((r: string) => r.toLowerCase().includes('ignore'))) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: false,
          errors: [{ rule: body.rules[0], error: 'Invalid rule content' }],
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: true, errors: [] }),
    })
  })
}

export async function mockNetworkError(page: Page, endpoint: string): Promise<void> {
  await page.route(`**${endpoint}`, (route: Route) => route.abort('failed'))
}

export async function mockSlowResponse(
  page: Page,
  endpoint: string,
  delayMs: number
): Promise<void> {
  await page.route(`**${endpoint}`, async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    await route.continue()
  })
}

export async function mockRateLimited(page: Page, endpoint: string): Promise<void> {
  await page.route(`**${endpoint}`, async (route: Route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: { 'Retry-After': '60' },
      body: JSON.stringify({ error: 'Too many requests' }),
    })
  })
}

export async function mockServerError(page: Page, endpoint: string): Promise<void> {
  await page.route(`**${endpoint}`, async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    })
  })
}
