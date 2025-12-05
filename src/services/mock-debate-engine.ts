// src/services/mock-debate-engine.ts

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
 * Mock content templates for different turn types
 */
const MOCK_CONTENT: Record<TurnType, string[]> = {
  moderator_intro: [
    `Welcome to today's debate. We have two distinguished debaters who will present their arguments on this important topic.

The format will follow a structured exchange where each side will have the opportunity to present their opening statements, engage in constructive argumentation, respond to each other's points, and deliver closing remarks.

I ask both participants to maintain a respectful tone and focus on substantive arguments rather than personal attacks. Let's begin with the opening statements.`,
  ],

  opening: [
    `Thank you, moderator. I appreciate the opportunity to present my position on this crucial topic.

At its core, this debate touches on fundamental questions about how we organize our society, allocate resources, and balance competing interests. My position is grounded in both empirical evidence and principled reasoning.

First, let me establish the key framework through which I'll be making my arguments. I believe we must consider not just immediate effects, but long-term consequences and systemic impacts.

Second, the historical record provides valuable lessons. When we examine similar situations in the past, we find consistent patterns that support my position.

Third, there's a compelling logical argument to be made. When we reason from first principles, the conclusion becomes clear.

I look forward to elaborating on these points and engaging with my opponent's arguments throughout this debate.`,

    `Thank you for this opportunity to engage in substantive discourse on a matter of considerable importance.

My argument rests on three foundational pillars that I will develop throughout this debate:

**Evidence-based reasoning**: The empirical data overwhelmingly supports the position I'm advocating. Studies have consistently demonstrated the efficacy of this approach.

**Practical considerations**: Beyond theoretical arguments, we must consider what actually works in practice. Real-world implementations have shown promising results.

**Ethical dimensions**: This isn't merely a pragmatic question—it's fundamentally about our values and what kind of society we want to build.

I'm confident that as we explore these dimensions together, the strength of my position will become increasingly apparent.`,
  ],

  constructive: [
    `Building on my opening remarks, I want to develop my argument further with specific evidence.

Consider the following data points:

1. **Research findings**: Multiple peer-reviewed studies have examined this question rigorously. The consensus among experts supports my position.

2. **Case studies**: When we look at real-world examples—from various contexts and time periods—we see consistent patterns that reinforce my argument.

3. **Expert testimony**: Leading scholars and practitioners in this field have reached similar conclusions through independent analysis.

Furthermore, I want to address a common misconception. Some might argue that my position leads to undesirable outcomes, but this concern is based on a misunderstanding of the mechanisms involved.

The key insight is that systems are complex and interconnected. Simple linear thinking often leads us astray. When we account for feedback loops and second-order effects, my position becomes even more compelling.`,

    `I'd like to present additional evidence that strengthens my case.

**The empirical record** is clear. When we examine outcomes across different contexts, we consistently find that the approach I'm advocating leads to better results.

**Theoretical coherence** matters too. My position isn't just supported by data—it's also logically consistent and grounded in well-established principles.

Let me also introduce a new dimension to this discussion. Beyond the immediate question at hand, we should consider the broader implications. What precedent do we set? What message do we send?

These meta-level considerations, while sometimes overlooked, are crucial for a complete understanding of the issue.`,
  ],

  rebuttal: [
    `I appreciate my opponent's thoughtful arguments, but I must respectfully disagree on several key points.

**First**, the evidence cited doesn't actually support the conclusion drawn. When we examine the studies more carefully, we find significant methodological limitations and alternative interpretations.

**Second**, the examples provided are cherry-picked. For every case that supports my opponent's position, I can point to multiple counterexamples that tell a different story.

**Third**, there's a logical flaw in the reasoning. My opponent assumes that correlation implies causation, but the relationship is more complex than presented.

Let me be specific. The claim that "X leads to Y" overlooks important confounding variables. When we control for these factors, the relationship weakens considerably or even reverses.

I maintain that my original position remains sound. The criticisms don't address the core of my argument.`,

    `While I respect my opponent's perspective, the arguments presented contain several problematic elements.

**On the evidence**: The data cited is outdated or has been superseded by more recent research. The scientific understanding has evolved, and we should base our discussion on the current state of knowledge.

**On the logic**: There's an internal contradiction in my opponent's argument. On one hand, they claim X, but on the other hand, they also assert Y, which is inconsistent with X.

**On the implications**: Even if we accepted my opponent's premises (which I don't), the conclusions don't follow. There are alternative explanations that my opponent hasn't adequately addressed.

I urge us to return to first principles and examine the question with fresh eyes, unburdened by the assumptions that have led my opponent astray.`,
  ],

  cross_examination: [
    `I have several questions for my opponent that I believe will clarify the issues at stake.

**Question 1**: You cited studies supporting your position, but did you consider the critiques that have been published in response? How do you account for the methodological concerns raised by peer reviewers?

**Question 2**: Your argument relies heavily on one particular case study. How do you explain the many cases where different outcomes were observed?

**Question 3**: You claim that your position leads to beneficial outcomes. Can you be specific about how you're measuring success, and who bears the costs if you're wrong?

These aren't rhetorical questions—I'm genuinely interested in understanding your reasoning and where we might find common ground.`,

    `Let me pose some clarifying questions:

**First**: When you say your approach is "better," better for whom? Have you considered the distributional effects and who might be disadvantaged?

**Second**: Your timeline seems unrealistic. What's your basis for believing that results can be achieved in the timeframe you suggest?

**Third**: How do you respond to critics who argue that your position, while theoretically appealing, faces insurmountable practical obstacles?

I look forward to hearing your responses, as they will help us all better understand the true implications of what's being proposed.`,
  ],

  closing: [
    `As we conclude this debate, I want to summarize why my position deserves your support.

**The evidence is clear**: Across multiple studies, contexts, and time periods, we see consistent support for the approach I've advocated.

**The logic is sound**: My argument proceeds from well-established premises to conclusions that follow necessarily. My opponent has not successfully challenged the fundamental reasoning.

**The stakes are high**: This isn't an abstract academic exercise. Real people's lives are affected by how we decide these questions. We have a responsibility to get it right.

I've engaged seriously with my opponent's arguments and shown where they fall short. While I respect their perspective, the weight of evidence and reason supports my position.

Thank you for your attention throughout this debate. I trust that you'll weigh the arguments carefully and reach the right conclusion.`,

    `In closing, I want to highlight the key takeaways from this debate.

**We agree** on more than it might appear. Both sides want good outcomes and have engaged in good faith. The disagreement is about means, not ends.

**The core dispute** comes down to differing assessments of evidence and different value weightings. I've presented my case for why my interpretation is more compelling.

**Looking forward**, regardless of where you land on this specific question, I hope this debate has illuminated the complexity of the issues and the importance of rigorous thinking.

I'm grateful for the opportunity to engage with my opponent, whose arguments have helped sharpen my own thinking. But ultimately, I remain confident that my position is the stronger one.

Thank you.`,
  ],

  moderator_transition: [
    `Thank you for that thoughtful contribution. Now let's hear from the other side.

As we continue, I encourage both participants to address each other's arguments directly. Engagement with the strongest version of your opponent's case will make for a more productive debate.`,

    `We've heard a compelling argument. Let's now turn to the response.

I remind both debaters that the goal is not just to score points, but to help the audience understand the genuine considerations on each side of this issue.`,
  ],

  moderator_intervention: [
    `I'd like to pause here and clarify a few points for our audience.

Both debaters have made reference to evidence and studies. It's worth noting that in complex policy questions like this, expert opinion is often divided, and reasonable people can disagree about how to weigh competing considerations.

Let's continue with a focus on the strongest arguments on each side.`,
  ],

  moderator_summary: [
    `This has been an illuminating debate on a genuinely difficult question.

**The key points of agreement**: Both sides acknowledge the importance of the underlying issue and share certain values even while disagreeing on specifics.

**The main areas of disagreement**: The debaters differ on how to interpret the evidence, how to weigh competing values, and what practical approach is most likely to succeed.

**What to consider**: As you form your own views, I encourage you to:
- Examine the evidence cited by both sides
- Consider whose interests are at stake
- Think about the risks and uncertainties involved
- Reflect on your own values and how they apply

Thank you to both debaters for a substantive and respectful exchange. And thank you to our audience for your engagement with these important questions.`,
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
 * Simulate streaming by yielding content in chunks with delays
 */
async function* simulateStreaming(content: string): AsyncGenerator<string> {
  // Split into words for more natural streaming
  const words = content.split(/(\s+)/)
  let buffer = ''

  for (const word of words) {
    buffer += word

    // Yield after accumulating some characters (simulate chunking)
    if (buffer.length >= 5 + Math.random() * 10) {
      yield buffer
      buffer = ''
      // Random delay between 20-80ms to simulate LLM generation
      await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 60))
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
): Promise<{ success: boolean; isComplete: boolean; error?: string }> {
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
  const content = getMockContent(turn.type, turn.speaker)

  // Stream the content
  let accumulatedLength = 0
  for await (const chunk of simulateStreaming(content)) {
    accumulatedLength += chunk.length
    debateEvents.emitEvent(debateId, 'turn_streaming', {
      turnId,
      chunk,
      accumulatedLength,
    })
  }

  const durationMs = Date.now() - startTime
  const tokenCount = Math.ceil(content.length / 4) // Rough estimate

  // Emit turn completed
  debateEvents.emitEvent(debateId, 'turn_completed', {
    turnId,
    content,
    tokenCount,
    durationMs,
  })

  // Record the turn
  sequencer.recordTurn({
    speaker: turn.speaker,
    provider,
    content,
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
