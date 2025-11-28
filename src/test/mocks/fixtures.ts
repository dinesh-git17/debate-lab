// src/test/mocks/fixtures.ts
// Test data fixtures for mocking API responses

import { nanoid } from 'nanoid'

export interface MockDebate {
  id: string
  topic: string
  format: string
  turns: number
  status: 'pending' | 'active' | 'completed' | 'error'
  forModel: string
  againstModel: string
  createdAt: string
  updatedAt: string
}

export interface MockMessage {
  id: string
  debateId: string
  role: 'for' | 'against' | 'moderator' | 'system'
  content: string
  turnNumber: number
  tokens: number
  timestamp: string
}

export interface MockSummary {
  debateId: string
  forArguments: string[]
  againstArguments: string[]
  moderatorNotes: string
  overallAssessment: string
  scores?: {
    for: number
    against: number
  }
  generatedAt: string
}

export function mockDebateResponse(id?: string): MockDebate {
  return {
    id: id ?? nanoid(),
    topic: 'Should artificial intelligence be regulated by governments?',
    format: 'standard',
    turns: 4,
    status: 'active',
    forModel: 'gpt-4',
    againstModel: 'grok-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function mockMessagesResponse(debateId?: string): {
  messages: MockMessage[]
} {
  const id = debateId ?? nanoid()
  return {
    messages: [
      {
        id: nanoid(),
        debateId: id,
        role: 'moderator',
        content: 'Welcome to the debate. The topic is: Should AI be regulated?',
        turnNumber: 0,
        tokens: 50,
        timestamp: new Date().toISOString(),
      },
      {
        id: nanoid(),
        debateId: id,
        role: 'for',
        content: 'I argue in favor of AI regulation because...',
        turnNumber: 1,
        tokens: 150,
        timestamp: new Date().toISOString(),
      },
      {
        id: nanoid(),
        debateId: id,
        role: 'against',
        content: 'I argue against strict AI regulation because...',
        turnNumber: 1,
        tokens: 145,
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

export function mockSummaryResponse(debateId?: string): MockSummary {
  return {
    debateId: debateId ?? nanoid(),
    forArguments: [
      'AI poses potential safety risks that require oversight',
      'Regulation can ensure fair and ethical AI development',
      'Public trust requires transparent AI governance',
    ],
    againstArguments: [
      'Over-regulation could stifle innovation',
      'Technology evolves faster than regulations',
      'Market forces can self-regulate effectively',
    ],
    moderatorNotes: 'Both sides presented compelling arguments with clear reasoning.',
    overallAssessment: 'A well-balanced debate with strong points on both sides.',
    scores: {
      for: 42,
      against: 40,
    },
    generatedAt: new Date().toISOString(),
  }
}

export function mockLLMResponse(
  content: string,
  tokens = 100
): {
  content: string
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
} {
  return {
    content,
    usage: {
      prompt_tokens: tokens,
      completion_tokens: tokens,
      total_tokens: tokens * 2,
    },
  }
}

export function mockStreamChunks(content: string): string[] {
  const words = content.split(' ')
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += 3) {
    chunks.push(words.slice(i, i + 3).join(' '))
  }

  return chunks
}

export const testUsers = {
  default: {
    id: 'user-test-1',
    sessionId: 'session-test-1',
    ip: '127.0.0.1',
  },
  rateLimited: {
    id: 'user-test-limited',
    sessionId: 'session-test-limited',
    ip: '192.168.1.100',
  },
}

export const testDebateConfigs = {
  minimal: {
    topic: 'Is water wet?',
    turns: 2,
    format: 'standard' as const,
  },
  full: {
    topic: 'Should governments implement universal basic income?',
    turns: 6,
    format: 'oxford' as const,
    customRules: ['No personal attacks', 'Cite sources when possible'],
  },
  invalid: {
    topic: 'Short',
    turns: 100,
    format: 'invalid',
  },
}
