// src/store/debate-view-store.ts

import { create } from 'zustand'

import type {
  DebateMessage,
  DebateViewState,
  DebateViewStatus,
  ViewConnectionStatus,
  ViewProgress,
} from '@/types/debate-ui'

interface DebateViewActions {
  setDebateInfo: (info: { debateId: string; topic: string; format: string }) => void
  setStatus: (status: DebateViewStatus) => void
  setConnection: (status: ViewConnectionStatus) => void
  setError: (error: string | null) => void

  addMessage: (message: DebateMessage) => void
  updateMessage: (id: string, updates: Partial<DebateMessage>) => void
  appendToMessage: (id: string, chunk: string, expectedPosition?: number) => void
  completeMessage: (id: string, finalContent: string, tokenCount: number) => void

  // Hydrate store with messages from server (for page reload/navigation back)
  hydrateMessages: (messages: DebateMessage[]) => void

  // Message display queue - controls which messages are visible
  markMessageDisplayed: (id: string) => void
  getVisibleMessages: () => DebateMessage[]

  setProgress: (progress: ViewProgress) => void
  setCurrentTurn: (turnId: string | null) => void

  reset: () => void
}

// Extended state to include display queue tracking
interface ExtendedDebateViewState extends DebateViewState {
  // Set of message IDs that have finished displaying (animation complete)
  displayedMessageIds: Set<string>
  // Track content length per message to detect duplicate appends
  messageContentLengths: Map<string, number>
}

type DebateViewStore = ExtendedDebateViewState & DebateViewActions

const initialState: ExtendedDebateViewState = {
  debateId: '',
  topic: '',
  format: '',
  status: 'ready',
  messages: [],
  currentTurnId: null,
  progress: {
    currentTurn: 0,
    totalTurns: 0,
    percentComplete: 0,
  },
  connection: 'disconnected',
  error: null,
  displayedMessageIds: new Set(),
  messageContentLengths: new Map(),
}

export const useDebateViewStore = create<DebateViewStore>()((set, get) => ({
  ...initialState,

  setDebateInfo: (info) =>
    set({
      debateId: info.debateId,
      topic: info.topic,
      format: info.format,
    }),

  setStatus: (status) => set({ status }),

  setConnection: (connection) => set({ connection }),

  setError: (error) => set({ error }),

  addMessage: (message) =>
    set((state) => {
      // Prevent duplicate messages
      if (state.messages.some((m) => m.id === message.id)) {
        // eslint-disable-next-line no-console
        console.log('[Store] addMessage: duplicate ignored', message.id)
        return state
      }
      // Initialize content length tracking for this message
      const newLengths = new Map(state.messageContentLengths)
      newLengths.set(message.id, message.content.length)
      return {
        messages: [...state.messages, message],
        messageContentLengths: newLengths,
      }
    }),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
    })),

  appendToMessage: (id, chunk, expectedPosition) =>
    set((state) => {
      const message = state.messages.find((m) => m.id === id)
      if (!message) return state

      const currentLength = message.content.length

      // If expectedPosition is provided, use it for precise duplicate detection
      if (expectedPosition !== undefined) {
        if (currentLength > expectedPosition) {
          // We already have content past this position - this is a duplicate chunk
          // eslint-disable-next-line no-console
          console.log('[Store] appendToMessage: skipping duplicate chunk', {
            id,
            currentLength,
            expectedPosition,
            chunkLength: chunk.length,
          })
          return state
        }

        if (currentLength < expectedPosition) {
          // We're missing some content - log warning but continue
          // This can happen if chunks arrive out of order
          // eslint-disable-next-line no-console
          console.warn('[Store] appendToMessage: gap detected, missing content', {
            id,
            currentLength,
            expectedPosition,
            gap: expectedPosition - currentLength,
          })
          // Still append - better to have some content than get stuck
        }
        // If currentLength === expectedPosition, this chunk is exactly where we expect it
      } else {
        // Fallback: legacy duplicate detection when expectedPosition not provided
        const trackedLength = state.messageContentLengths.get(id) ?? 0
        if (currentLength > trackedLength + chunk.length) {
          // eslint-disable-next-line no-console
          console.log('[Store] appendToMessage: skipping likely duplicate (legacy)', {
            id,
            currentLength,
            trackedLength,
            chunkLength: chunk.length,
          })
          return state
        }
      }

      const newContent = message.content + chunk
      const newLengths = new Map(state.messageContentLengths)
      newLengths.set(id, newContent.length)

      return {
        messages: state.messages.map((msg) =>
          msg.id === id ? { ...msg, content: newContent } : msg
        ),
        messageContentLengths: newLengths,
      }
    }),

  completeMessage: (id, finalContent, tokenCount) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id
          ? { ...msg, content: finalContent, isStreaming: false, isComplete: true, tokenCount }
          : msg
      ),
    })),

  // Hydrate store with messages from server (for page reload/navigation back)
  // Only adds messages that don't already exist to avoid duplicates
  hydrateMessages: (messages) =>
    set((state) => {
      const existingIds = new Set(state.messages.map((m) => m.id))
      const newMessages = messages.filter((m) => !existingIds.has(m.id))

      // Also mark all hydrated messages as displayed (no animation needed for historical messages)
      const allIds = new Set([...existingIds, ...newMessages.map((m) => m.id)])

      return {
        messages: [...state.messages, ...newMessages],
        displayedMessageIds: allIds,
      }
    }),

  // Mark a message as fully displayed (animation complete)
  markMessageDisplayed: (id) =>
    set((state) => {
      const newSet = new Set(state.displayedMessageIds)
      newSet.add(id)
      // eslint-disable-next-line no-console
      console.log('[Store] markMessageDisplayed:', id, 'total displayed:', newSet.size)
      return { displayedMessageIds: newSet }
    }),

  // Get messages that should be visible:
  // All displayed messages + the first non-displayed message (currently animating)
  getVisibleMessages: () => {
    const state = get()
    const { messages, displayedMessageIds } = state

    const visibleMessages: DebateMessage[] = []

    for (const msg of messages) {
      visibleMessages.push(msg)
      // If this message hasn't been displayed yet, it's the one currently animating
      // Don't show any messages after it
      if (!displayedMessageIds.has(msg.id)) {
        break
      }
    }

    return visibleMessages
  },

  setProgress: (progress) => set({ progress }),

  setCurrentTurn: (turnId) => set({ currentTurnId: turnId }),

  reset: () =>
    set({
      ...initialState,
      displayedMessageIds: new Set(),
      messageContentLengths: new Map(),
    }),
}))
