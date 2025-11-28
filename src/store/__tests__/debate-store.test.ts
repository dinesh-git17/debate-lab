// src/store/__tests__/debate-store.test.ts
// Unit tests for debate store

import { act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

import { useDebateStore, type LocalMessage } from '../debate-store'

describe('debate-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useDebateStore.getState().reset()
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useDebateStore.getState()

      expect(state.currentDebateId).toBeNull()
      expect(state.debatePhase).toBe('idle')
      expect(state.localMessages).toEqual([])
      expect(state.connectionStatus).toBe('disconnected')
    })
  })

  describe('setDebateId', () => {
    it('should set debate ID', () => {
      act(() => {
        useDebateStore.getState().setDebateId('debate-123')
      })

      expect(useDebateStore.getState().currentDebateId).toBe('debate-123')
    })

    it('should clear debate ID when set to null', () => {
      act(() => {
        useDebateStore.getState().setDebateId('debate-123')
        useDebateStore.getState().setDebateId(null)
      })

      expect(useDebateStore.getState().currentDebateId).toBeNull()
    })
  })

  describe('setPhase', () => {
    it('should set debate phase', () => {
      act(() => {
        useDebateStore.getState().setPhase('active')
      })

      expect(useDebateStore.getState().debatePhase).toBe('active')
    })

    it('should update phase through different states', () => {
      const phases = [
        'configuring',
        'validating',
        'ready',
        'active',
        'paused',
        'completed',
      ] as const

      for (const phase of phases) {
        act(() => {
          useDebateStore.getState().setPhase(phase)
        })
        expect(useDebateStore.getState().debatePhase).toBe(phase)
      }
    })
  })

  describe('addLocalMessage', () => {
    it('should add a message', () => {
      const message: LocalMessage = {
        id: 'msg-1',
        role: 'debater_for',
        content: 'Test message',
        createdAt: new Date(),
      }

      act(() => {
        useDebateStore.getState().addLocalMessage(message)
      })

      const messages = useDebateStore.getState().localMessages
      expect(messages).toHaveLength(1)
      expect(messages[0]).toEqual(message)
    })

    it('should append messages in order', () => {
      const message1: LocalMessage = {
        id: 'msg-1',
        role: 'debater_for',
        content: 'First message',
        createdAt: new Date(),
      }

      const message2: LocalMessage = {
        id: 'msg-2',
        role: 'debater_against',
        content: 'Second message',
        createdAt: new Date(),
      }

      act(() => {
        useDebateStore.getState().addLocalMessage(message1)
        useDebateStore.getState().addLocalMessage(message2)
      })

      const messages = useDebateStore.getState().localMessages
      expect(messages).toHaveLength(2)
      expect(messages[0]?.id).toBe('msg-1')
      expect(messages[1]?.id).toBe('msg-2')
    })
  })

  describe('updateLocalMessage', () => {
    it('should update an existing message', () => {
      const message: LocalMessage = {
        id: 'msg-1',
        role: 'debater_for',
        content: 'Original content',
        isStreaming: true,
        createdAt: new Date(),
      }

      act(() => {
        useDebateStore.getState().addLocalMessage(message)
        useDebateStore.getState().updateLocalMessage('msg-1', {
          content: 'Updated content',
          isStreaming: false,
        })
      })

      const messages = useDebateStore.getState().localMessages
      expect(messages[0]?.content).toBe('Updated content')
      expect(messages[0]?.isStreaming).toBe(false)
    })

    it('should not affect other messages', () => {
      const message1: LocalMessage = {
        id: 'msg-1',
        role: 'debater_for',
        content: 'Message 1',
        createdAt: new Date(),
      }

      const message2: LocalMessage = {
        id: 'msg-2',
        role: 'debater_against',
        content: 'Message 2',
        createdAt: new Date(),
      }

      act(() => {
        useDebateStore.getState().addLocalMessage(message1)
        useDebateStore.getState().addLocalMessage(message2)
        useDebateStore.getState().updateLocalMessage('msg-1', {
          content: 'Updated Message 1',
        })
      })

      const messages = useDebateStore.getState().localMessages
      expect(messages[0]?.content).toBe('Updated Message 1')
      expect(messages[1]?.content).toBe('Message 2')
    })

    it('should not throw for non-existent message ID', () => {
      act(() => {
        useDebateStore.getState().updateLocalMessage('non-existent', {
          content: 'Updated content',
        })
      })

      expect(useDebateStore.getState().localMessages).toHaveLength(0)
    })
  })

  describe('clearLocalMessages', () => {
    it('should clear all messages', () => {
      const message: LocalMessage = {
        id: 'msg-1',
        role: 'debater_for',
        content: 'Test message',
        createdAt: new Date(),
      }

      act(() => {
        useDebateStore.getState().addLocalMessage(message)
        useDebateStore.getState().clearLocalMessages()
      })

      expect(useDebateStore.getState().localMessages).toHaveLength(0)
    })
  })

  describe('setConnectionStatus', () => {
    it('should set connection status', () => {
      act(() => {
        useDebateStore.getState().setConnectionStatus('connecting')
      })

      expect(useDebateStore.getState().connectionStatus).toBe('connecting')
    })

    it('should update through connection states', () => {
      const statuses = ['connecting', 'connected', 'reconnecting', 'disconnected'] as const

      for (const status of statuses) {
        act(() => {
          useDebateStore.getState().setConnectionStatus(status)
        })
        expect(useDebateStore.getState().connectionStatus).toBe(status)
      }
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const message: LocalMessage = {
        id: 'msg-1',
        role: 'debater_for',
        content: 'Test message',
        createdAt: new Date(),
      }

      act(() => {
        useDebateStore.getState().setDebateId('debate-123')
        useDebateStore.getState().setPhase('active')
        useDebateStore.getState().addLocalMessage(message)
        useDebateStore.getState().setConnectionStatus('connected')
        useDebateStore.getState().reset()
      })

      const state = useDebateStore.getState()
      expect(state.currentDebateId).toBeNull()
      expect(state.debatePhase).toBe('idle')
      expect(state.localMessages).toEqual([])
      expect(state.connectionStatus).toBe('disconnected')
    })
  })
})
