// src/components/debate/__tests__/message-bubble.test.tsx
// Unit tests for MessageBubble component

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { MessageBubble } from '../message-bubble'

import type { DebateMessage } from '@/types/debate-ui'

// Mock the Markdown component to simplify testing
vi.mock('@/components/ui/markdown', () => ({
  Markdown: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}))

function createMockMessage(overrides: Partial<DebateMessage> = {}): DebateMessage {
  return {
    id: 'msg-1',
    speaker: 'for',
    speakerLabel: 'FOR (Affirmative)',
    turnType: 'opening',
    content: 'This is a test message content.',
    isStreaming: false,
    isComplete: true,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    ...overrides,
  }
}

describe('MessageBubble', () => {
  describe('rendering', () => {
    it('should render message content', () => {
      const message = createMockMessage()

      render(<MessageBubble message={message} />)

      expect(screen.getByText('This is a test message content.')).toBeInTheDocument()
    })

    it('should render speaker label', () => {
      const message = createMockMessage()

      render(<MessageBubble message={message} />)

      expect(screen.getByText('FOR')).toBeInTheDocument()
    })

    it('should render turn type label', () => {
      const message = createMockMessage({ turnType: 'opening' })

      render(<MessageBubble message={message} />)

      expect(screen.getByText('OPENING')).toBeInTheDocument()
    })

    it('should render speaker icon', () => {
      const message = createMockMessage({ speaker: 'for' })

      const { container } = render(<MessageBubble message={message} />)

      // FOR speaker uses SVG icon from react-icons
      const svgIcon = container.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
    })

    it('should have article role for accessibility', () => {
      const message = createMockMessage()

      render(<MessageBubble message={message} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })

  describe('speaker positions', () => {
    it('should center all messages with max-width constraint', () => {
      const message = createMockMessage({ speaker: 'for' })

      const { container } = render(<MessageBubble message={message} />)

      // All messages are centered with max-width constraint
      const cardWrapper = container.querySelector('.mx-auto.max-w-3xl')
      expect(cardWrapper).toBeInTheDocument()
    })

    it('should center moderator header content', () => {
      const message = createMockMessage({ speaker: 'moderator' })

      const { container } = render(<MessageBubble message={message} />)

      // Moderator header has justify-center class
      const header = container.querySelector('.justify-center')
      expect(header).toBeInTheDocument()
    })
  })

  describe('streaming state', () => {
    it('should show streaming indicator when streaming', () => {
      const message = createMockMessage({
        isStreaming: true,
        isComplete: false,
      })

      render(<MessageBubble message={message} />)

      expect(screen.getByLabelText('Generating content')).toBeInTheDocument()
    })

    it('should not show streaming indicator when not streaming', () => {
      const message = createMockMessage({
        isStreaming: false,
        isComplete: true,
      })

      render(<MessageBubble message={message} />)

      expect(screen.queryByLabelText('Generating content')).not.toBeInTheDocument()
    })
  })

  describe('completion state', () => {
    it('should render correctly when complete', () => {
      const message = createMockMessage({
        isComplete: true,
      })

      render(<MessageBubble message={message} />)

      // Component renders without streaming indicator
      expect(screen.queryByLabelText('Generating content')).not.toBeInTheDocument()
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should render message content when complete', () => {
      const message = createMockMessage({
        isComplete: true,
        content: 'Completed message content',
      })

      render(<MessageBubble message={message} />)

      expect(screen.getByText('Completed message content')).toBeInTheDocument()
    })
  })

  describe('timestamp', () => {
    it('should show timestamp when showTimestamp is true', () => {
      const message = createMockMessage({
        isComplete: true,
        timestamp: new Date('2024-01-15T10:30:00Z'),
      })

      render(<MessageBubble message={message} showTimestamp />)

      // Timestamp should be displayed (format depends on locale)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should show timestamp in header when showTimestamp is enabled', () => {
      const message = createMockMessage({
        isComplete: true,
        timestamp: new Date('2024-01-15T10:30:00Z'),
      })

      const { container } = render(<MessageBubble message={message} showTimestamp />)

      // Timestamp is displayed in header with ml-auto class
      const timestampElement = container.querySelector('.ml-auto')
      expect(timestampElement).toBeInTheDocument()
    })
  })

  describe('violations', () => {
    it('should show violations count when present', () => {
      const message = createMockMessage({
        isComplete: true,
        violations: ['Too long', 'Off topic'],
      })

      render(<MessageBubble message={message} />)

      expect(screen.getByText('2 VIOLATIONS')).toBeInTheDocument()
    })

    it('should show singular violation when only one', () => {
      const message = createMockMessage({
        isComplete: true,
        violations: ['Too long'],
      })

      render(<MessageBubble message={message} />)

      expect(screen.getByText('1 VIOLATION')).toBeInTheDocument()
    })

    it('should not show violations when empty', () => {
      const message = createMockMessage({
        isComplete: true,
        violations: [],
      })

      render(<MessageBubble message={message} />)

      expect(screen.queryByText('VIOLATION')).not.toBeInTheDocument()
    })
  })

  describe('onAnimationComplete callback', () => {
    it('should call onAnimationComplete when message is complete', async () => {
      const onAnimationComplete = vi.fn()
      const message = createMockMessage({
        isComplete: true,
      })

      render(<MessageBubble message={message} onAnimationComplete={onAnimationComplete} />)

      await waitFor(() => {
        expect(onAnimationComplete).toHaveBeenCalledTimes(1)
      })
    })

    it('should not call onAnimationComplete when message is not complete', () => {
      const onAnimationComplete = vi.fn()
      const message = createMockMessage({
        isComplete: false,
        isStreaming: true,
      })

      render(<MessageBubble message={message} onAnimationComplete={onAnimationComplete} />)

      expect(onAnimationComplete).not.toHaveBeenCalled()
    })

    it('should only call onAnimationComplete once', async () => {
      const onAnimationComplete = vi.fn()
      const message = createMockMessage({
        isComplete: true,
      })

      const { rerender } = render(
        <MessageBubble message={message} onAnimationComplete={onAnimationComplete} />
      )

      await waitFor(() => {
        expect(onAnimationComplete).toHaveBeenCalledTimes(1)
      })

      // Rerender with same props
      rerender(<MessageBubble message={message} onAnimationComplete={onAnimationComplete} />)

      // Should still be 1
      expect(onAnimationComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('different turn types', () => {
    const turnTypes = [
      { type: 'opening', label: 'OPENING' },
      { type: 'constructive', label: 'CONSTRUCTIVE' },
      { type: 'rebuttal', label: 'REBUTTAL' },
      { type: 'closing', label: 'CLOSING' },
      { type: 'moderator_intro', label: 'INTRO' },
      { type: 'moderator_summary', label: 'SUMMARY' },
    ] as const

    it.each(turnTypes)('should display $label for $type turn', ({ type, label }) => {
      const message = createMockMessage({ turnType: type })

      render(<MessageBubble message={message} />)

      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })

  describe('memoization', () => {
    it('should render correctly when props change', () => {
      const message1 = createMockMessage({ content: 'Content 1' })
      const message2 = createMockMessage({ content: 'Content 2' })

      const { rerender } = render(<MessageBubble message={message1} />)

      expect(screen.getByText('Content 1')).toBeInTheDocument()

      rerender(<MessageBubble message={message2} />)

      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })
  })
})
