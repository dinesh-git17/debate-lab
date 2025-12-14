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
 * Mock content templates for sandwich debate (testing without API calls)
 */
const MOCK_CONTENT: Record<TurnType, string[]> = {
  moderator_intro: [
    `**Today's Debate**

> *"Is a sandwich still a sandwich if you think about it too hard?"*

At what point does lunch become philosophy?

Two sides. Opposing views. Let's unnecessarily overanalyze this.

---

**FOR, you have the floor.**`,
  ],

  opening: [
    `### The Answer Is Obvious

A sandwich remains a sandwich—regardless of how much you overthink it.

**1. Functional Identity Matters**

A sandwich is defined by use, not introspection. If it is held, consumed, and referred to socially as a sandwich, then it *is* a sandwich. Overthinking does not alter caloric intake, nor does it prevent crumbs. Philosophy does not change lunch.

Reality bites.

**2. Conceptual Collapse Is Optional**

Thinking too hard about an object does not erase its category—it only exposes abstraction layers we usually ignore. Bread enclosing filling creates a practical boundary. That boundary does not dissolve because someone asked, "But what *is* bread?"

Lunch does not require ontology.

**3. Civilization Depends on Stable Definitions**

If sandwiches cease being sandwiches when questioned, no menu survives scrutiny. Societies function because meanings endure casual doubt. A sandwich that feeds you today feeds you tomorrow, even if you stared at it suspiciously.

Hunger settles debates.

---

A sandwich eaten is proof enough.

*Overthinking doesn't unmake lunch.*`,

    `### The Sandwich Collapses Under Scrutiny

The moment you think too hard, the sandwich dissolves.

**1. Definitions Are Fragile**

What counts as bread? What counts as filling? If one slice folds, is it still two? Once definitions wobble, the category fails. A sandwich is not an object—it's an agreement. Thinking too hard voids the contract.

Concepts crack.

**2. Edge Cases Consume the Core**

Hot dogs. Wraps. Tacos. Ice cream sandwiches. The more you think, the more exceptions appear—until "sandwich" means nothing at all. Overanalysis exposes that the label was always held together by convenience.

Convenience is not truth.

**3. Awareness Changes Experience**

Once you question the sandwich, you stop eating casually. You hesitate. You analyze. The act shifts from consumption to contemplation. At that moment, the sandwich becomes an idea—not lunch.

Thought ruins appetite.

---

A sandwich survives only in ignorance.

*Reflection starves simplicity.*`,
  ],

  constructive: [
    `Building on my opening, let me address the deeper implications.

**The Practical Test**

Consider this: has anyone ever starved because they questioned their sandwich? No. The sandwich continues to nourish regardless of philosophical inquiry. Function persists through doubt.

**Historical Precedent**

The Earl of Sandwich did not require a philosophy degree to invent his namesake. He needed bread and meat. The simplicity of the solution is its strength—and that strength does not diminish under examination.

**The Burden of Proof**

My opponent must show that thinking *actually changes* something about the sandwich. Not our perception of it—the sandwich itself. Until that burden is met, the sandwich stands.

*Reality does not require your approval.*`,

    `Let me deepen my critique of sandwich essentialism.

**The Sorites Problem**

Remove one crumb. Is it still a sandwich? Remove another. At what point does it cease? The boundary is arbitrary—held together by convention, not reality.

**Cultural Variance**

In some cultures, what we call a "sandwich" would not be recognized as such. The category is socially constructed. Thinking hard reveals this construction.

**The Observer Effect**

The act of examination changes the examined. A sandwich eaten mindlessly is different from a sandwich eaten while questioning its nature. The experience transforms.

*Awareness is the anti-condiment.*`,
  ],

  rebuttal: [
    `My opponent claims definitions are fragile. But fragility under extreme pressure does not mean fragility under normal use.

**The Stress Test Fallacy**

Yes, if you apply enough philosophical torque, any concept wobbles. But we don't live in philosophy seminars—we live in delis. The sandwich works because it works, not because it survives Socratic interrogation.

**Edge Cases Don't Destroy Categories**

Hot dogs being controversial does not destroy the sandwich. It creates interesting boundary conversations. The core remains stable while edges are debated.

*The center holds.*`,

    `My opponent appeals to function, but function is interpretation.

**The Interpretation Problem**

"Holding" something is not neutral. You hold it *as* a sandwich. Remove that framing, and you're just gripping bread. The function presupposes the category.

**The Menu Defense Fails**

Menus survive because we don't question them—not because they'd withstand scrutiny. The deli is a zone of suspended disbelief.

*Convenience is a co-conspirator, not a witness.*`,
  ],

  cross_examination: [
    `Direct questions for my opponent:

1. If I think about a sandwich while eating it, does it cease to nourish me?
2. Has any sandwich ever failed to be a sandwich due to excessive contemplation?
3. If definitions require ignorance, how do dictionary editors survive?
4. Is your position that all categorization fails under scrutiny, or just sandwiches?

*The floor awaits your response.*`,

    `Questions that demand answers:

1. If function defines identity, is a sandwich used as a doorstop still a sandwich?
2. At what precise moment does "thinking too hard" occur? One thought? Ten?
3. If categories persist through use, what happens when use varies across cultures?
4. Can you eat a concept?

*Definitions do not digest.*`,
  ],

  closing: [
    `### The Answer Is Still Obvious

**1. Thinking Does Not Alter Function**

They claim: *"Awareness dissolves the sandwich."*

Reality: Awareness does not negate utility. You may question gravity while falling—but you still hit the ground. Likewise, you may question a sandwich while eating it—but you still chew.

Function outlasts thought.

**2. Categories Persist Through Use**

They claim: *"Definitions collapse under scrutiny."*

Reality: Definitions evolve, not vanish. Edge cases do not destroy categories—they refine them. The sandwich persists because people keep making, ordering, and eating them without incident.

The pattern always tells the truth.

---

**The Verdict:** A sandwich remains a sandwich, no matter how hard you stare at it.

*If it feeds you, it qualifies.*`,

    `### Overthinking Destroys Categories

**Definition Failure**
They claim function preserves identity. **Reality:** function depends on agreement—and agreement fails under scrutiny.

Thinking erodes labels.

**Awareness Breaks the Spell**
The sandwich exists only while unquestioned. Once examined, it fragments into bread, filling, and doubt.

Clarity dissolves lunch.

---

**The Verdict:** A sandwich cannot survive excessive thought.

*Ignorance is delicious.*`,
  ],

  moderator_transition: [
    `**Position established.** AGAINST, your turn—destabilize lunch.`,
    `**Arguments submitted.** AGAINST, close it out.`,
    `**Final exchange incoming.** FOR, end this debate—and save lunch.`,
  ],

  moderator_intervention: [
    `Let me clarify for our audience: both sides are engaging with a genuine philosophical tension. The question of whether categories survive scrutiny applies far beyond sandwiches. Continue.`,
  ],

  moderator_summary: [
    `**Quick Recap**
This debate asked whether a sandwich can survive philosophical scrutiny—or whether thought itself dismantles lunch.

**The Clash**
- **FOR:** Function and usage preserve identity; thinking doesn't erase reality.
- **AGAINST:** Overanalysis exposes fragile definitions, collapsing the category.
- **The tension:** Does meaning depend on use—or on unquestioned agreement?

**Food for Thought**
If thinking ruins a sandwich, what else disappears when examined?

---

**Debate Heat:** Mildly Spicy — Existential crumbs everywhere

*Both sides ate well. The ref remains hungry.*`,
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
