// src/services/mock-debate-engine.ts

import { checkAbortSignal } from '@/lib/debate-abort-signals'
import { getProviderForPosition } from '@/lib/debate-assignment'
import { debateEvents } from '@/lib/debate-events'
import { getEngineState, storeEngineState } from '@/lib/engine-store'
import { createDebateLogger, logDebateEvent, recordDebateCompleted } from '@/lib/logging'
import { getFullDebateSession, updateDebateStatus } from '@/services/debate-service'
import { TurnSequencer } from '@/services/turn-sequencer'

import type { TurnConfig, TurnProvider, TurnType } from '@/types/turn'

/**
 * Check if we're in mock mode
 */
export function isMockMode(): boolean {
  return process.env.DEBATE_MODE === 'mock'
}

/**
 * Mock content templates for different turn types (shortened for testing)
 */
const MOCK_CONTENT: Record<TurnType, string[]> = {
  moderator_intro: [`Welcome to today's debate. Let's begin with opening statements.`],

  opening: [
    `Thank you. My position is grounded in evidence and principled reasoning. The data supports my view, and I look forward to making my case.`,

    `Thank you for this opportunity. My argument rests on empirical evidence and practical considerations. The approach I advocate leads to better outcomes.`,
  ],

  constructive: [
    `Building on my opening, research findings and case studies support my position. The evidence is clear when we examine it carefully.`,

    `The empirical record supports my case. My position is logically consistent and grounded in well-established principles.`,
  ],

  rebuttal: [
    `I must respectfully disagree. The evidence cited has methodological limitations, and the examples are cherry-picked. My original position remains sound.`,

    `The arguments presented have issues. The data is outdated and there are logical inconsistencies. We should examine this with fresh eyes.`,
  ],

  cross_examination: [
    `Did you consider the critiques of those studies? How do you explain cases with different outcomes? Who bears the costs if you're wrong?`,

    `Better for whom? Is your timeline realistic? How do you respond to critics who see practical obstacles?`,
  ],

  closing: [
    `In summary, the evidence is clear and the logic is sound. The weight of evidence supports my position. Thank you for your attention.`,

    `We agree on more than it appears—the disagreement is about means, not ends. I remain confident my position is stronger. Thank you.`,
  ],

  moderator_transition: [
    `Thank you. Now let's hear from the other side.`,
    `Good points. Let's turn to the response.`,
  ],

  moderator_intervention: [
    `Let me clarify: expert opinion is often divided on complex questions. Let's continue focusing on the strongest arguments.`,
  ],

  moderator_summary: [
    `This has been an illuminating debate. Both sides share values while disagreeing on specifics. Thank you to both debaters for a respectful exchange.`,
  ],
}

/**
 * Get mock content for a turn type
 */
function getMockContent(turnType: TurnType, speaker: string): string {
  const templates = MOCK_CONTENT[turnType] ?? MOCK_CONTENT.constructive
  const template = templates[Math.floor(Math.random() * templates.length)] ?? templates[0] ?? ''

  // Add speaker-specific flavor
  if (speaker === 'for') {
    return template.replace(/my position/gi, 'the affirmative position')
  } else if (speaker === 'against') {
    return template.replace(/my position/gi, 'the opposing position')
  }

  return template
}

/**
 * Simulate streaming by yielding content in chunks with delays (fast for testing)
 */
async function* simulateStreaming(content: string): AsyncGenerator<string> {
  // Split into words for more natural streaming
  const words = content.split(/(\s+)/)
  let buffer = ''

  for (const word of words) {
    buffer += word

    // Yield after accumulating some characters (simulate chunking)
    if (buffer.length >= 8 + Math.random() * 8) {
      yield buffer
      buffer = ''
      // Fast delay for testing (10-30ms)
      await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 20))
    }
  }

  // Yield any remaining content
  if (buffer) {
    yield buffer
  }
}

/**
 * Execute a mock turn with simulated streaming
 */
async function executeMockTurn(
  debateId: string,
  turn: TurnConfig,
  provider: TurnProvider,
  sequencer: TurnSequencer
): Promise<{
  success: boolean
  isComplete: boolean
  wasInterrupted?: boolean
  interruptReason?: 'paused' | 'cancelled' | null
  error?: string
}> {
  const turnId = `${debateId}_turn_${sequencer.getState().currentTurnIndex}`
  const startTime = Date.now()

  // Emit turn started
  debateEvents.emitEvent(debateId, 'turn_started', {
    turnId,
    turnNumber: sequencer.getState().currentTurnIndex + 1,
    speaker: turn.speaker,
    speakerLabel: turn.label,
    turnType: turn.type,
    provider,
  })

  // Get mock content
  const fullContent = getMockContent(turn.type, turn.speaker)

  // Stream the content with abort signal checks
  let accumulatedContent = ''
  let wasInterrupted = false
  let interruptReason: 'paused' | 'cancelled' | null = null

  // eslint-disable-next-line no-console
  console.log(`[MockStream] Starting streaming for ${debateId}, turn ${turnId}`)

  for await (const chunk of simulateStreaming(fullContent)) {
    // Check abort signal on EVERY chunk (async Redis check)
    const abortSignal = await checkAbortSignal(debateId)
    if (abortSignal.aborted) {
      // eslint-disable-next-line no-console
      console.log(
        `[MockStream] ABORT DETECTED for ${debateId}: reason=${abortSignal.reason}, contentLength=${accumulatedContent.length}`
      )
      wasInterrupted = true
      interruptReason = abortSignal.reason
      break
    }

    accumulatedContent += chunk
    debateEvents.emitEvent(debateId, 'turn_streaming', {
      turnId,
      chunk,
      accumulatedLength: accumulatedContent.length,
    })
  }

  // eslint-disable-next-line no-console
  console.log(
    `[MockStream] Finished streaming for ${debateId}, wasInterrupted=${wasInterrupted}, contentLength=${accumulatedContent.length}`
  )

  // Handle interruption
  if (wasInterrupted) {
    // Emit turn interrupted event
    // eslint-disable-next-line no-console
    console.log(
      `[MockStream] Emitting turn_interrupted for ${turnId}, partialContent length=${accumulatedContent.length}`
    )
    await debateEvents.emitEvent(debateId, 'turn_interrupted', {
      turnId,
      reason: interruptReason,
      partialContent: accumulatedContent,
      contentLength: accumulatedContent.length,
    })
    // eslint-disable-next-line no-console
    console.log(`[MockStream] turn_interrupted emitted for ${turnId}`)

    if (interruptReason === 'paused') {
      // Store partial content for resume
      sequencer.setPartialContent(accumulatedContent)
      await storeEngineState(debateId, sequencer.getState())
      return { success: true, isComplete: false, wasInterrupted: true, interruptReason }
    }

    if (interruptReason === 'cancelled') {
      return { success: true, isComplete: true, wasInterrupted: true, interruptReason }
    }
  }

  const durationMs = Date.now() - startTime
  const tokenCount = Math.ceil(accumulatedContent.length / 4)

  // Emit turn completed
  debateEvents.emitEvent(debateId, 'turn_completed', {
    turnId,
    content: accumulatedContent,
    tokenCount,
    durationMs,
  })

  // Record the turn
  sequencer.recordTurn({
    speaker: turn.speaker,
    provider,
    content: accumulatedContent,
    tokenCount,
    startedAt: new Date(startTime),
    completedAt: new Date(),
  })

  await storeEngineState(debateId, sequencer.getState())

  const isComplete = sequencer.isComplete()
  if (isComplete) {
    await updateDebateStatus(debateId, 'completed')
  }

  // Emit progress update
  const progress = sequencer.getProgress()
  debateEvents.emitEvent(debateId, 'progress_update', {
    currentTurn: progress.currentTurn,
    totalTurns: progress.totalTurns,
    percentComplete: progress.percentComplete,
    debaterTurnsCompleted: progress.debaterTurnsCompleted,
    debaterTurnsTotal: progress.debaterTurnsTotal,
  })

  logDebateEvent('turn_completed', debateId, {
    turnId,
    speaker: turn.speaker,
    durationMs,
    mock: true,
  })

  return { success: true, isComplete }
}

/**
 * Run the mock debate loop
 */
export async function runMockDebateLoop(debateId: string): Promise<{
  success: boolean
  error?: string
}> {
  const log = createDebateLogger(debateId)
  const loopStartTime = Date.now()
  let turnCount = 0
  const maxTurns = 100

  log.info('Starting mock debate loop')

  while (turnCount < maxTurns) {
    // Get session and sequencer
    const session = await getFullDebateSession(debateId)
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const existingState = await getEngineState(debateId)
    if (!existingState) {
      return { success: false, error: 'Engine state not found' }
    }

    const sequencer = TurnSequencer.fromState(existingState)
    const status = sequencer.getStatus()

    // Check terminal states
    if (status === 'completed') {
      debateEvents.emitEvent(debateId, 'debate_completed', {
        totalTurns: sequencer.getProgress().currentTurn,
        durationMs: Date.now() - loopStartTime,
        totalTokens: 0,
        totalCost: 0,
      })

      logDebateEvent('debate_completed', debateId, {
        totalTurns: sequencer.getProgress().currentTurn,
        durationMs: Date.now() - loopStartTime,
        mock: true,
      })
      recordDebateCompleted(sequencer.getProgress().currentTurn, Date.now() - loopStartTime)

      return { success: true }
    }

    if (status === 'cancelled') {
      return { success: true }
    }

    if (status === 'error') {
      return { success: false, error: sequencer.getState().error ?? 'Unknown error' }
    }

    if (status === 'paused') {
      return { success: true }
    }

    // Get current turn
    const currentTurn = sequencer.getCurrentTurn()
    if (!currentTurn) {
      // No more turns, debate complete
      debateEvents.emitEvent(debateId, 'debate_completed', {
        totalTurns: turnCount,
        durationMs: Date.now() - loopStartTime,
        totalTokens: 0,
        totalCost: 0,
      })

      recordDebateCompleted(turnCount, Date.now() - loopStartTime)
      return { success: true }
    }

    // Determine provider
    let provider: TurnProvider
    if (currentTurn.speaker === 'moderator') {
      provider = 'chatgpt'
    } else {
      provider = getProviderForPosition(session.assignment, currentTurn.speaker)
    }

    // Execute the mock turn
    const result = await executeMockTurn(debateId, currentTurn, provider, sequencer)

    if (!result.success) {
      return { success: false, error: result.error ?? 'Mock turn execution failed' }
    }

    // Handle interruption (pause or cancel)
    if (result.wasInterrupted) {
      // eslint-disable-next-line no-console
      console.log(`[MockLoop] Turn interrupted for ${debateId}, reason=${result.interruptReason}`)

      if (result.interruptReason === 'paused') {
        // Exit loop - will be resumed later
        return { success: true }
      }

      if (result.interruptReason === 'cancelled') {
        // Debate ended early
        return { success: true }
      }
    }

    if (result.isComplete) {
      debateEvents.emitEvent(debateId, 'debate_completed', {
        totalTurns: turnCount + 1,
        durationMs: Date.now() - loopStartTime,
        totalTokens: 0,
        totalCost: 0,
      })

      logDebateEvent('debate_completed', debateId, {
        totalTurns: turnCount + 1,
        durationMs: Date.now() - loopStartTime,
        mock: true,
      })
      recordDebateCompleted(turnCount + 1, Date.now() - loopStartTime)

      return { success: true }
    }

    turnCount++

    // Small delay between turns
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return { success: false, error: 'Maximum turn limit reached' }
}
