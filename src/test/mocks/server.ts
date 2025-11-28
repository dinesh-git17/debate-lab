// src/test/mocks/server.ts
// MSW server configuration for API mocking

import { setupServer } from 'msw/node'

import { handlers } from './handlers'

export const server = setupServer(...handlers)

export function resetServer(): void {
  server.resetHandlers()
}

export function useServerHandler(...customHandlers: Parameters<typeof server.use>): void {
  server.use(...customHandlers)
}
