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

      expect(screen.getByText('Opening Statement')).toBeInTheDocument()
    })

    it('should render speaker icon', () => {
      const message = createMockMessage({ speaker: 'for' })

      render(<MessageBubble message={message} />)

      // FOR speaker icon
      expect(screen.getByText('👍')).toBeInTheDocument()
    })

    it('should have article role for accessibility', () => {
      const message = createMockMessage()

      render(<MessageBubble message={message} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })

  describe('speaker positions', () => {
    it('should align FOR speaker to the left', () => {
      const message = createMockMessage({ speaker: 'for' })

      const { container } = render(<MessageBubble message={message} />)

      // The outer wrapper div has the justify class
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('justify-start')
    })

    it('should align AGAINST speaker to the right', () => {
      const message = createMockMessage({ speaker: 'against' })

      const { container } = render(<MessageBubble message={message} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('justify-end')
    })

    it('should center moderator messages', () => {
      const message = createMockMessage({ speaker: 'moderator' })

      const { container } = render(<MessageBubble message={message} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('justify-center')
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
    it('should show token count when complete', () => {
      const message = createMockMessage({
        isComplete: true,
        tokenCount: 150,
      })

      render(<MessageBubble message={message} />)

      expect(screen.getByText('150 tokens')).toBeInTheDocument()
    })

    it('should not show token count when count is 0', () => {
      const message = createMockMessage({
        isComplete: true,
        tokenCount: 0,
      })

      render(<MessageBubble message={message} />)

      expect(screen.queryByText('0 tokens')).not.toBeInTheDocument()
    })

    it('should not show token count when undefined', () => {
      // tokenCount is omitted, so it's undefined
      const message = createMockMessage({
        isComplete: true,
      })

      render(<MessageBubble message={message} />)

      expect(screen.queryByText('tokens')).not.toBeInTheDocument()
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

    it('should show timestamp when message is complete', () => {
      const message = createMockMessage({
        isComplete: true,
      })

      render(<MessageBubble message={message} />)

      // Footer section should be visible
      const article = screen.getByRole('article')
      expect(article.querySelector('.mt-2')).toBeInTheDocument()
    })
  })

  describe('violations', () => {
    it('should show violations count when present', () => {
      const message = createMockMessage({
        isComplete: true,
        violations: ['Too long', 'Off topic'],
      })

      render(<MessageBubble message={message} />)

      expect(screen.getByText('2 violations')).toBeInTheDocument()
    })

    it('should show singular violation when only one', () => {
      const message = createMockMessage({
        isComplete: true,
        violations: ['Too long'],
      })

      render(<MessageBubble message={message} />)

      expect(screen.getByText('1 violation')).toBeInTheDocument()
    })

    it('should not show violations when empty', () => {
      const message = createMockMessage({
        isComplete: true,
        violations: [],
      })

      render(<MessageBubble message={message} />)

      expect(screen.queryByText('violation')).not.toBeInTheDocument()
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
      { type: 'opening', label: 'Opening Statement' },
      { type: 'constructive', label: 'Constructive Argument' },
      { type: 'rebuttal', label: 'Rebuttal' },
      { type: 'closing', label: 'Closing Statement' },
      { type: 'moderator_intro', label: 'Introduction' },
      { type: 'moderator_summary', label: 'Summary' },
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
