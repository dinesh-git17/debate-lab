// src/store/__tests__/debate-view-store.test.ts
// Unit tests for debate view store

import { act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

import { useDebateViewStore } from '../debate-view-store'

import type { DebateMessage } from '@/types/debate-ui'

function createMockMessage(overrides: Partial<DebateMessage> = {}): DebateMessage {
  return {
    id: `msg-${Math.random().toString(36).substring(7)}`,
    speaker: 'for',
    speakerLabel: 'FOR (Affirmative)',
    turnType: 'opening',
    content: 'Test message content',
    isStreaming: false,
    isComplete: true,
    timestamp: new Date(),
    ...overrides,
  }
}

describe('debate-view-store', () => {
  beforeEach(() => {
    act(() => {
      useDebateViewStore.getState().reset()
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useDebateViewStore.getState()

      expect(state.debateId).toBe('')
      expect(state.topic).toBe('')
      expect(state.format).toBe('')
      expect(state.status).toBe('ready')
      expect(state.messages).toEqual([])
      expect(state.currentTurnId).toBeNull()
      expect(state.connection).toBe('disconnected')
      expect(state.error).toBeNull()
    })
  })

  describe('setDebateInfo', () => {
    it('should set debate info', () => {
      act(() => {
        useDebateViewStore.getState().setDebateInfo({
          debateId: 'debate-123',
          topic: 'AI Regulation',
          format: 'standard',
        })
      })

      const state = useDebateViewStore.getState()
      expect(state.debateId).toBe('debate-123')
      expect(state.topic).toBe('AI Regulation')
      expect(state.format).toBe('standard')
    })
  })

  describe('setStatus', () => {
    it('should set status', () => {
      act(() => {
        useDebateViewStore.getState().setStatus('active')
      })

      expect(useDebateViewStore.getState().status).toBe('active')
    })

    it('should set completed status when no messages exist', () => {
      // This is critical for page reload of completed debates
      act(() => {
        useDebateViewStore.getState().setStatus('completed')
      })

      const state = useDebateViewStore.getState()
      expect(state.status).toBe('completed')
      expect(state.pendingCompletion).toBe(false)
    })

    it('should set pendingCompletion when messages exist but not all displayed', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
        useDebateViewStore.getState().setStatus('completed')
      })

      const state = useDebateViewStore.getState()
      expect(state.status).toBe('ready') // Still ready, not completed yet
      expect(state.pendingCompletion).toBe(true)
    })

    it('should set completed status when all messages are displayed', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
        useDebateViewStore.getState().markMessageDisplayed('msg-1')
        useDebateViewStore.getState().setStatus('completed')
      })

      const state = useDebateViewStore.getState()
      expect(state.status).toBe('completed')
      expect(state.pendingCompletion).toBe(false)
    })

    it('should transition through non-completed status states', () => {
      const statuses = ['ready', 'active', 'paused', 'error'] as const

      for (const status of statuses) {
        act(() => {
          useDebateViewStore.getState().setStatus(status)
        })
        expect(useDebateViewStore.getState().status).toBe(status)
      }
    })
  })

  describe('setConnection', () => {
    it('should set connection status', () => {
      act(() => {
        useDebateViewStore.getState().setConnection('connected')
      })

      expect(useDebateViewStore.getState().connection).toBe('connected')
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      act(() => {
        useDebateViewStore.getState().setError('Connection failed')
      })

      expect(useDebateViewStore.getState().error).toBe('Connection failed')
    })

    it('should clear error', () => {
      act(() => {
        useDebateViewStore.getState().setError('Error')
        useDebateViewStore.getState().setError(null)
      })

      expect(useDebateViewStore.getState().error).toBeNull()
    })
  })

  describe('message management', () => {
    describe('addMessage', () => {
      it('should add a message', () => {
        const message = createMockMessage({ id: 'msg-1' })

        act(() => {
          useDebateViewStore.getState().addMessage(message)
        })

        expect(useDebateViewStore.getState().messages).toHaveLength(1)
        expect(useDebateViewStore.getState().messages[0]?.id).toBe('msg-1')
      })

      it('should append messages in order', () => {
        const msg1 = createMockMessage({ id: 'msg-1' })
        const msg2 = createMockMessage({ id: 'msg-2' })

        act(() => {
          useDebateViewStore.getState().addMessage(msg1)
          useDebateViewStore.getState().addMessage(msg2)
        })

        const messages = useDebateViewStore.getState().messages
        expect(messages).toHaveLength(2)
        expect(messages[0]?.id).toBe('msg-1')
        expect(messages[1]?.id).toBe('msg-2')
      })
    })

    describe('updateMessage', () => {
      it('should update message by ID', () => {
        const message = createMockMessage({ id: 'msg-1', content: 'Original' })

        act(() => {
          useDebateViewStore.getState().addMessage(message)
          useDebateViewStore.getState().updateMessage('msg-1', { content: 'Updated' })
        })

        expect(useDebateViewStore.getState().messages[0]?.content).toBe('Updated')
      })
    })

    describe('appendToMessage', () => {
      it('should append content to existing message', () => {
        const message = createMockMessage({
          id: 'msg-1',
          content: 'Hello',
          isStreaming: true,
        })

        act(() => {
          useDebateViewStore.getState().addMessage(message)
          useDebateViewStore.getState().appendToMessage('msg-1', ' World')
        })

        expect(useDebateViewStore.getState().messages[0]?.content).toBe('Hello World')
      })
    })

    describe('completeMessage', () => {
      it('should complete a streaming message', () => {
        const message = createMockMessage({
          id: 'msg-1',
          content: 'Partial',
          isStreaming: true,
          isComplete: false,
        })

        act(() => {
          useDebateViewStore.getState().addMessage(message)
          useDebateViewStore.getState().completeMessage('msg-1', 'Final content', 100)
        })

        const msg = useDebateViewStore.getState().messages[0]
        expect(msg?.content).toBe('Final content')
        expect(msg?.isStreaming).toBe(false)
        expect(msg?.isComplete).toBe(true)
        expect(msg?.tokenCount).toBe(100)
      })
    })
  })

  describe('hydrateMessages', () => {
    it('should hydrate messages from server', () => {
      const messages = [createMockMessage({ id: 'msg-1' }), createMockMessage({ id: 'msg-2' })]

      act(() => {
        useDebateViewStore.getState().hydrateMessages(messages)
      })

      const state = useDebateViewStore.getState()
      expect(state.messages).toHaveLength(2)
      // All hydrated messages should be marked as displayed
      expect(state.displayedMessageIds.has('msg-1')).toBe(true)
      expect(state.displayedMessageIds.has('msg-2')).toBe(true)
    })

    it('should not duplicate existing messages', () => {
      const msg1 = createMockMessage({ id: 'msg-1' })
      const msg2 = createMockMessage({ id: 'msg-2' })

      act(() => {
        useDebateViewStore.getState().addMessage(msg1)
        useDebateViewStore.getState().hydrateMessages([msg1, msg2])
      })

      expect(useDebateViewStore.getState().messages).toHaveLength(2)
    })
  })

  describe('message display queue', () => {
    describe('markMessageDisplayed', () => {
      it('should mark message as displayed', () => {
        const message = createMockMessage({ id: 'msg-1' })

        act(() => {
          useDebateViewStore.getState().addMessage(message)
          useDebateViewStore.getState().markMessageDisplayed('msg-1')
        })

        expect(useDebateViewStore.getState().displayedMessageIds.has('msg-1')).toBe(true)
      })
    })

    describe('getVisibleMessages', () => {
      it('should return all displayed messages plus first non-displayed', () => {
        const msg1 = createMockMessage({ id: 'msg-1' })
        const msg2 = createMockMessage({ id: 'msg-2' })
        const msg3 = createMockMessage({ id: 'msg-3' })

        act(() => {
          useDebateViewStore.getState().addMessage(msg1)
          useDebateViewStore.getState().addMessage(msg2)
          useDebateViewStore.getState().addMessage(msg3)
          useDebateViewStore.getState().markMessageDisplayed('msg-1')
        })

        const visibleMessages = useDebateViewStore.getState().getVisibleMessages()

        // Should show msg-1 (displayed) and msg-2 (currently animating)
        expect(visibleMessages).toHaveLength(2)
        expect(visibleMessages[0]?.id).toBe('msg-1')
        expect(visibleMessages[1]?.id).toBe('msg-2')
      })

      it('should return all messages when all are displayed', () => {
        const msg1 = createMockMessage({ id: 'msg-1' })
        const msg2 = createMockMessage({ id: 'msg-2' })

        act(() => {
          useDebateViewStore.getState().addMessage(msg1)
          useDebateViewStore.getState().addMessage(msg2)
          useDebateViewStore.getState().markMessageDisplayed('msg-1')
          useDebateViewStore.getState().markMessageDisplayed('msg-2')
        })

        const visibleMessages = useDebateViewStore.getState().getVisibleMessages()
        expect(visibleMessages).toHaveLength(2)
      })
    })
  })

  describe('setProgress', () => {
    it('should set progress', () => {
      act(() => {
        useDebateViewStore.getState().setProgress({
          currentTurn: 2,
          totalTurns: 6,
          percentComplete: 33,
        })
      })

      const progress = useDebateViewStore.getState().progress
      expect(progress.currentTurn).toBe(2)
      expect(progress.totalTurns).toBe(6)
      expect(progress.percentComplete).toBe(33)
    })
  })

  describe('setCurrentTurn', () => {
    it('should set current turn ID', () => {
      act(() => {
        useDebateViewStore.getState().setCurrentTurn('turn-123')
      })

      expect(useDebateViewStore.getState().currentTurnId).toBe('turn-123')
    })

    it('should clear current turn ID', () => {
      act(() => {
        useDebateViewStore.getState().setCurrentTurn('turn-123')
        useDebateViewStore.getState().setCurrentTurn(null)
      })

      expect(useDebateViewStore.getState().currentTurnId).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset all state including displayedMessageIds', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().setDebateInfo({
          debateId: 'debate-123',
          topic: 'Test',
          format: 'standard',
        })
        useDebateViewStore.getState().addMessage(message)
        useDebateViewStore.getState().markMessageDisplayed('msg-1')
        useDebateViewStore.getState().setStatus('active')
        useDebateViewStore.getState().reset()
      })

      const state = useDebateViewStore.getState()
      expect(state.debateId).toBe('')
      expect(state.messages).toHaveLength(0)
      expect(state.status).toBe('ready')
      expect(state.displayedMessageIds.size).toBe(0)
    })
  })
})
