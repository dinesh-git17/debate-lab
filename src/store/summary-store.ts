// src/store/summary-store.ts
/**
 * Zustand store for debate summary page state.
 * Manages reveal animations, judge analysis, and jury deliberation.
 */

import { create } from 'zustand'

import { getModelIdentity } from '@/types/summary'

const REVEAL_STORAGE_PREFIX = 'debate:revealed:'

function isRevealedInStorage(debateId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(`${REVEAL_STORAGE_PREFIX}${debateId}`) === 'true'
  } catch {
    return false
  }
}

function saveRevealedToStorage(debateId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${REVEAL_STORAGE_PREFIX}${debateId}`, 'true')
  } catch {
    // Storage unavailable or full
  }
}

import type { JudgeAnalysis, QuickScore } from '@/types/judge'
import type { JuryDeliberation, JuryPhase } from '@/types/jury'
import type { RevealedAssignment, SummaryResponse, SummaryState } from '@/types/summary'

interface SummaryActions {
  loadSummary: (data: SummaryResponse) => void
  setStatus: (status: 'loading' | 'ready' | 'error') => void
  setError: (error: string | null) => void

  startReveal: () => void
  completeReveal: () => void
  resetReveal: () => void

  setQuickScore: (quickScore: QuickScore) => void
  setJudgeAnalysis: (analysis: JudgeAnalysis, quickScore?: QuickScore) => void
  setAnalysisLoading: (loading: boolean) => void

  setJuryDeliberation: (deliberation: JuryDeliberation) => void
  setJuryLoading: (loading: boolean) => void
  setJuryError: (error: string | null) => void
  setJuryPhase: (phase: JuryPhase) => void
  resetJury: () => void

  reset: () => void
}

type SummaryStore = SummaryState & SummaryActions

const initialState: SummaryState = {
  debateId: '',
  topic: '',
  format: '',
  status: 'loading',
  error: null,
  turns: [],
  statistics: null,
  revealState: 'hidden',
  assignment: null,
  quickScore: null,
  judgeAnalysis: null,
  isAnalysisLoading: false,
  juryDeliberation: null,
  isJuryLoading: false,
  juryError: null,
  juryPhase: 'idle',
}

export const useSummaryStore = create<SummaryStore>()((set, get) => ({
  ...initialState,

  loadSummary: (data: SummaryResponse) => {
    let assignment: RevealedAssignment | null = null

    if (data.assignment) {
      const forIdentity = getModelIdentity(data.assignment.forModel.toLowerCase())
      const againstIdentity = getModelIdentity(data.assignment.againstModel.toLowerCase())

      assignment = {
        for: forIdentity,
        against: againstIdentity,
      }
    }

    const wasRevealed = isRevealedInStorage(data.debateId)

    set({
      debateId: data.debateId,
      topic: data.topic,
      format: data.format,
      status: 'ready',
      error: null,
      turns: data.turns,
      statistics: data.statistics,
      assignment,
      revealState: wasRevealed ? 'revealed' : 'hidden',
      // Show skeleton for non-cancelled debates while analysis loads
      isAnalysisLoading: data.status !== 'cancelled',
    })
  },

  setStatus: (status) => set({ status }),

  setError: (error) => set({ error, status: error ? 'error' : get().status }),

  startReveal: () => {
    set({ revealState: 'revealing' })
  },

  completeReveal: () => {
    const { debateId } = get()
    if (debateId) {
      saveRevealedToStorage(debateId)
    }
    set({ revealState: 'revealed' })
  },

  resetReveal: () => {
    set({ revealState: 'hidden' })
  },

  setQuickScore: (quickScore) => set({ quickScore }),

  setJudgeAnalysis: (analysis, quickScore) => {
    const update: Partial<SummaryState> = { judgeAnalysis: analysis, isAnalysisLoading: false }
    if (quickScore) {
      update.quickScore = quickScore
    }
    set(update)
  },

  setAnalysisLoading: (loading) => set({ isAnalysisLoading: loading }),

  setJuryDeliberation: (deliberation) =>
    set({
      juryDeliberation: deliberation,
      isJuryLoading: false,
      juryError: null,
      juryPhase: deliberation.phase,
    }),

  setJuryLoading: (loading) =>
    set({ isJuryLoading: loading, juryError: loading ? null : get().juryError }),

  setJuryError: (error) =>
    set({ juryError: error, isJuryLoading: false, juryPhase: error ? 'error' : 'idle' }),

  setJuryPhase: (phase) => set({ juryPhase: phase }),

  resetJury: () =>
    set({
      juryDeliberation: null,
      isJuryLoading: false,
      juryError: null,
      juryPhase: 'idle',
    }),

  reset: () => set(initialState),
}))

/**
 * Selector for checking if reveal can be triggered
 */
export const selectCanReveal = (state: SummaryStore): boolean =>
  state.status === 'ready' && state.revealState === 'hidden' && state.assignment !== null

/**
 * Selector for getting formatted duration
 */
export const selectFormattedDuration = (state: SummaryStore): string => {
  if (!state.statistics) return '0:00'

  const totalSeconds = Math.floor(state.statistics.durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
