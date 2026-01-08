// src/components/debate/__tests__/message-list.test.tsx
// Unit tests for MessageList component

import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useDebateViewStore } from '@/store/debate-view-store'

import { MessageList } from '../message-list'

import type { DebateMessage } from '@/types/debate-ui'

// Mock the MessageBubble component to simplify testing
vi.mock('../message-bubble', () => ({
  MessageBubble: ({
    message,
    onAnimationComplete,
  }: {
    message: DebateMessage
    onAnimationComplete?: () => void
  }) => (
    <div data-testid={`message-${message.id}`} data-message-id={message.id}>
      <span>{message.content}</span>
      <button onClick={onAnimationComplete}>Complete Animation</button>
    </div>
  ),
}))

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

describe('MessageList', () => {
  beforeEach(() => {
    act(() => {
      useDebateViewStore.getState().reset()
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no messages', () => {
      render(<MessageList />)

      expect(screen.getByRole('button', { name: 'Start Debate' })).toBeInTheDocument()
      expect(screen.getByText('General')).toBeInTheDocument()
    })

    it('should have status role for accessibility in empty state', () => {
      render(<MessageList />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should have aria-live polite in empty state', () => {
      render(<MessageList />)

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('rendering messages', () => {
    it('should render messages from store', () => {
      const message = createMockMessage({ id: 'msg-1', content: 'Hello World' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
        useDebateViewStore.getState().markMessageDisplayed('msg-1')
      })

      render(<MessageList />)

      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('should render multiple messages', () => {
      const msg1 = createMockMessage({ id: 'msg-1' })
      const msg2 = createMockMessage({ id: 'msg-2' })
      const msg3 = createMockMessage({ id: 'msg-3' })

      act(() => {
        useDebateViewStore.getState().addMessage(msg1)
        useDebateViewStore.getState().addMessage(msg2)
        useDebateViewStore.getState().addMessage(msg3)
        useDebateViewStore.getState().markMessageDisplayed('msg-1')
        useDebateViewStore.getState().markMessageDisplayed('msg-2')
        useDebateViewStore.getState().markMessageDisplayed('msg-3')
      })

      render(<MessageList />)

      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
      expect(screen.getByTestId('message-msg-3')).toBeInTheDocument()
    })

    it('should have log role for message list', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
      })

      render(<MessageList />)

      expect(screen.getByRole('log')).toBeInTheDocument()
    })

    it('should have aria-label for message list', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
      })

      render(<MessageList />)

      expect(screen.getByRole('log')).toHaveAttribute('aria-label', 'Debate messages')
    })
  })

  describe('message display queue', () => {
    it('should only show first non-displayed message', () => {
      const msg1 = createMockMessage({ id: 'msg-1', content: 'First' })
      const msg2 = createMockMessage({ id: 'msg-2', content: 'Second' })
      const msg3 = createMockMessage({ id: 'msg-3', content: 'Third' })

      act(() => {
        useDebateViewStore.getState().addMessage(msg1)
        useDebateViewStore.getState().addMessage(msg2)
        useDebateViewStore.getState().addMessage(msg3)
        // Only mark first as displayed
        useDebateViewStore.getState().markMessageDisplayed('msg-1')
      })

      render(<MessageList />)

      // Should show msg-1 (displayed) and msg-2 (currently animating)
      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
      // msg-3 should not be visible yet
      expect(screen.queryByTestId('message-msg-3')).not.toBeInTheDocument()
    })

    it('should show all messages when all are displayed', () => {
      const msg1 = createMockMessage({ id: 'msg-1' })
      const msg2 = createMockMessage({ id: 'msg-2' })

      act(() => {
        useDebateViewStore.getState().addMessage(msg1)
        useDebateViewStore.getState().addMessage(msg2)
        useDebateViewStore.getState().markMessageDisplayed('msg-1')
        useDebateViewStore.getState().markMessageDisplayed('msg-2')
      })

      render(<MessageList />)

      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
      })

      const { container } = render(<MessageList className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('auto scroll behavior', () => {
    it('should have scrollable container', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
      })

      render(<MessageList />)

      // Note: scroll-smooth was removed to fix RAF-based auto-scroll race conditions
      expect(screen.getByRole('log')).toHaveClass('overflow-y-auto')
    })

    it('should respect autoScroll prop', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
      })

      // Render with autoScroll disabled - component should still render
      render(<MessageList autoScroll={false} />)

      expect(screen.getByRole('log')).toBeInTheDocument()
    })
  })

  describe('animation completion', () => {
    it('should mark message as displayed when animation completes', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
      })

      render(<MessageList />)

      // Find and click the "Complete Animation" button
      const button = screen.getByText('Complete Animation')
      act(() => {
        button.click()
      })

      // Message should now be marked as displayed
      expect(useDebateViewStore.getState().displayedMessageIds.has('msg-1')).toBe(true)
    })
  })

  describe('scroll anchor', () => {
    it('should render scroll anchor', () => {
      const message = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(message)
      })

      render(<MessageList />)

      const scrollAnchor = document.getElementById('scroll-anchor')
      expect(scrollAnchor).toBeInTheDocument()
      expect(scrollAnchor).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('hydrated messages', () => {
    it('should display hydrated messages immediately', () => {
      const messages = [
        createMockMessage({ id: 'msg-1', content: 'First hydrated' }),
        createMockMessage({ id: 'msg-2', content: 'Second hydrated' }),
      ]

      act(() => {
        useDebateViewStore.getState().hydrateMessages(messages)
      })

      render(<MessageList />)

      // All hydrated messages should be visible
      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
    })
  })

  describe('real-time updates', () => {
    it('should update when new message is added', () => {
      const msg1 = createMockMessage({ id: 'msg-1' })

      act(() => {
        useDebateViewStore.getState().addMessage(msg1)
        useDebateViewStore.getState().markMessageDisplayed('msg-1')
      })

      const { rerender } = render(<MessageList />)

      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()

      // Add a new message
      const msg2 = createMockMessage({ id: 'msg-2', content: 'New message' })
      act(() => {
        useDebateViewStore.getState().addMessage(msg2)
      })

      rerender(<MessageList />)

      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
    })
  })
})
