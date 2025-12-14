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
 * Mock content templates for different turn types (longer for testing scroll behavior)
 */
const MOCK_CONTENT: Record<TurnType, string[]> = {
  moderator_intro: [
    `Welcome to today's debate on a topic that has generated significant discussion across academic, political, and social spheres. We have two distinguished perspectives represented here today, each bringing unique insights and evidence to bear on this complex issue. The format will proceed as follows: opening statements, constructive arguments, rebuttals, cross-examination, and closing remarks. I encourage both participants to engage respectfully while making their strongest possible cases. Let's begin with opening statements. lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
  ],

  opening: [
    `Thank you for this opportunity to present my position. I want to begin by acknowledging the complexity of this issue—reasonable people can disagree, and I respect that my opponent brings legitimate concerns to the table. That said, my position is grounded in extensive empirical research, historical precedent, and principled reasoning that I believe makes a compelling case.

The evidence overwhelmingly supports my view when we examine the data carefully. Multiple peer-reviewed studies spanning decades of research have consistently shown the patterns I'm describing. Furthermore, when we look at real-world implementations of similar policies, the outcomes align with what theory predicts.

Beyond the empirical case, there's a strong moral argument to be made here. The approach I advocate respects individual autonomy while also recognizing our collective responsibilities to one another. It balances competing interests in a way that maximizes benefit while minimizing harm. I look forward to elaborating on these points and engaging with my opponent's counterarguments.`,

    `Thank you for having me. Before diving into the specifics, I want to establish the framework through which I'll be analyzing this issue. My argument rests on three pillars: empirical evidence from controlled studies, practical considerations from real-world implementations, and philosophical principles that I believe should guide our decision-making.

First, let me address the empirical foundation. The research literature is clear, though often misrepresented in popular discourse. When we control for confounding variables and examine longitudinal data, a consistent picture emerges that supports my position. I'll be citing specific studies throughout this debate, and I encourage scrutiny of these sources.

Second, practical considerations matter enormously. Theoretical ideals must be weighed against implementation challenges, resource constraints, and unintended consequences. The approach I advocate has been tested in multiple contexts with measurable success. Critics point to failures, but these failures typically stem from incomplete implementation rather than fundamental flaws in the approach itself.

Finally, there are philosophical principles at stake. How we resolve this question says something about what we value as a society and how we balance competing goods. I believe my position offers the most coherent ethical framework. lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
  ],

  constructive: [
    `Building on my opening remarks, I want to dive deeper into the evidence base. A landmark study conducted over fifteen years followed thousands of participants across diverse demographic backgrounds. The findings were striking: those who adopted the approach I'm advocating showed measurably better outcomes across every metric examined—health, economic stability, social connection, and life satisfaction.

Critics have attempted to dismiss this research by pointing to limitations in the methodology. However, these criticisms don't hold up under scrutiny. The study employed rigorous controls, the sample size was more than adequate for statistical significance, and the findings have been replicated by independent research teams in multiple countries.

Beyond the quantitative data, we have compelling case studies that illustrate the real-world impact. Consider the example of communities that implemented these principles over the past two decades. They've seen dramatic improvements in quality of life indicators, reduced costs across multiple systems, and increased civic engagement. These aren't cherry-picked success stories—they represent a pattern that emerges consistently when we examine the data honestly.

I also want to address the theoretical framework underlying my position. This isn't just about what works empirically; it's about what makes sense given our understanding of human nature, social dynamics, and institutional design. The approach I advocate aligns with well-established principles from economics, psychology, and political science. It respects individual agency while acknowledging the role of systemic factors.`,

    `Let me present a systematic case for my position, examining the issue from multiple angles. The empirical record provides strong support for my argument when we look beyond surface-level correlations to understand causal mechanisms.

Consider the fundamental dynamics at play. When the conditions I'm describing are present, we observe predictable patterns of behavior and outcomes. This isn't speculation—it's what the data consistently shows across different contexts, time periods, and populations. The mechanism is well-understood: when people face certain incentives and constraints, they respond in predictable ways that lead to the outcomes I'm describing.

My opponent may point to cases that seem to contradict this pattern. But when we examine these apparent counterexamples carefully, we typically find that they don't actually undermine my thesis. Often, the circumstances differed in important ways, or the implementation was flawed, or the measurement was inadequate. When we have genuine apples-to-apples comparisons, my position is vindicated.

Furthermore, my position is logically consistent in a way that my opponent's is not. The alternative view requires accepting certain premises that, upon reflection, most people would reject. It also leads to conclusions that are difficult to accept when we think through the implications carefully. I'll be exploring these logical tensions throughout this debate.`,
  ],

  rebuttal: [
    `I appreciate my opponent's presentation, but I must respectfully but firmly disagree with several key claims. The evidence cited, while impressive-sounding, has significant methodological limitations that undermine its conclusions.

First, the flagship study my opponent references has been criticized extensively in the academic literature. The sample, while large, was not representative of the broader population. The researchers made assumptions in their statistical analysis that biased the results in a particular direction. And crucially, the study measured outcomes at a single point in time rather than tracking changes over an appropriate timeframe.

Second, the examples my opponent cites are cherry-picked from a much larger universe of cases. For every success story, I can point to multiple failures. The pattern my opponent describes simply doesn't hold when we examine the full range of evidence. Selection bias is a powerful distortion, and we must guard against it.

Third, there are fundamental logical problems with my opponent's framework. The premises, if accepted, lead to conclusions that I don't think anyone here would endorse. There are internal tensions and contradictions that my opponent hasn't addressed. I'll be exploring these in more detail, but suffice it to say that the theoretical foundation is shakier than it appears.

Finally, let me address the practical implications. Even if my opponent were correct about the theory, the approach being advocated faces enormous implementation challenges. The resources required, the political obstacles, the risk of unintended consequences—these practical considerations cannot be ignored. We must deal with the world as it is, not as we might wish it to be.`,

    `My opponent has presented an eloquent case, but elegance shouldn't be confused with correctness. The arguments presented have serious issues that I want to address directly and systematically.

The data my opponent relies on is outdated and has been superseded by more recent research. The field has evolved significantly, and the consensus has shifted. Studies from the past five years, using more sophisticated methods and larger datasets, paint a different picture than the older work my opponent cites. Science progresses, and we must update our beliefs accordingly.

There are also logical inconsistencies in my opponent's position that haven't been acknowledged. On one hand, certain principles are invoked to support the argument. But those same principles, applied consistently, would lead to conclusions that contradict other parts of my opponent's position. You can't have it both ways—either the principles apply generally, or they don't. This selective application of standards is a red flag.

Furthermore, the practical track record is not as strong as my opponent suggests. When we look at actual implementations rather than idealized scenarios, we see a more mixed picture. Success stories tend to be overhyped while failures are explained away. A more honest accounting would acknowledge that the approach being advocated has significant limitations and has failed in many contexts.

I want to propose an alternative framework that better accounts for the complexity of the situation. Rather than the binary my opponent presents, we should recognize that this is a multi-dimensional problem requiring nuanced solutions.`,
  ],

  cross_examination: [
    `I have several questions I'd like my opponent to address directly. First, did you consider the extensive critiques of those studies published in peer-reviewed journals? How do you respond to the methodological concerns raised by independent researchers?

Second, how do you explain the cases where your approach was implemented but failed to produce the predicted outcomes? Are these all explained away by "implementation failures," or might there be something wrong with the theory itself?

Third, who bears the costs if your approach is wrong? Have you conducted a serious risk analysis? What safeguards do you propose, and are they adequate given the stakes involved?

Fourth, your framework seems to assume certain things about human nature and social dynamics. But these assumptions are contested. How do you respond to alternative models that lead to different conclusions?

Finally, I notice you haven't addressed several counterarguments that seem quite strong to me. Is this an oversight, or do you not have responses to these challenges?`,

    `Let me pose some pointed questions that I believe get at the heart of our disagreement.

Better for whom, exactly? Your argument speaks in aggregate terms, but policies affect different groups differently. Have you disaggregated the data to see who wins and who loses under your approach?

Is your timeline realistic given resource constraints and political realities? Theoretical optimality is one thing; practical feasibility is another. How do you propose to navigate the implementation challenges?

How do you respond to critics who argue that your approach has failed before and would fail again? Are their concerns based on misunderstandings, or do they raise legitimate issues you haven't fully addressed?

What would it take to change your mind? I've presented substantial evidence against your position. If that's not sufficient, what would be? This is important for understanding whether we're having a genuine debate or talking past each other.`,
  ],

  closing: [
    `As we conclude this debate, I want to summarize the key points and explain why the weight of evidence supports my position.

First, I've presented extensive empirical evidence from rigorous research. My opponent has attempted to discount this evidence by pointing to methodological concerns, but these critiques don't withstand scrutiny. The research I've cited has been replicated, peer-reviewed, and represents the current scientific consensus.

Second, the logical framework I've offered is internally consistent and leads to clear conclusions. My opponent's position, by contrast, relies on selective application of principles and fails to address fundamental tensions in the argument.

Third, practical considerations favor my approach. The implementation challenges my opponent raises are real but surmountable, and the potential benefits far outweigh the costs. We have successful examples to learn from and adapt.

Fourth, there's a compelling moral argument for my position that my opponent hasn't adequately addressed. The approach I advocate respects important values while also promoting collective wellbeing.

I recognize that my opponent has raised legitimate concerns, and I don't dismiss them lightly. But on balance, the evidence, logic, and ethics all point in the same direction. Thank you for your attention, and I hope this debate has been illuminating.`,

    `We've covered a lot of ground in this debate, and I want to close by finding some common ground while also reiterating where I believe my opponent's argument falls short.

First, we actually agree on more than it might appear. We share fundamental values—we want good outcomes, we believe evidence matters, we think carefully about ethics. Our disagreement is about means, not ends. This is important to recognize because it suggests the possibility of productive dialogue even when we disagree.

That said, I remain confident that my position is the stronger one. The evidence I've presented is more recent, more rigorous, and more comprehensive than what my opponent has offered. The logical framework I've articulated is more coherent and doesn't suffer from the internal contradictions I've identified in the opposing view.

I also want to acknowledge what's at stake. This isn't merely an academic exercise—real people's lives are affected by how we resolve questions like these. That's why it's so important to get it right, to follow the evidence honestly, to reason carefully, and to remain open to updating our views when warranted.

In the end, I believe reasonable people examining this issue carefully will conclude that my position is correct. Not because I'm smarter or more virtuous than my opponent, but because the evidence and logic point in a particular direction. Thank you for your attention and engagement.`,
  ],

  moderator_transition: [
    `Thank you for that thoughtful presentation. You've raised important points that deserve careful consideration. Now let's hear from the other side for their perspective on these issues.`,
    `Those are compelling arguments with significant implications. Let's turn to the response and see how these points are addressed from an alternative perspective.`,
  ],

  moderator_intervention: [
    `Let me step in briefly to clarify something for our audience. Expert opinion on this topic is genuinely divided, and both perspectives we're hearing today represent legitimate scholarly positions. This isn't a case where one side has a monopoly on truth. Let's continue focusing on the strongest arguments each side can offer rather than dismissing opposing views.`,
  ],

  moderator_summary: [
    `This has been an illuminating debate that highlights the genuine complexity of the issue at hand. Both participants have brought evidence, logic, and passion to their arguments. We've seen areas of agreement as well as fundamental disagreements about how to interpret evidence and what values should guide our decisions.

The affirmative position emphasized empirical research, logical consistency, and a particular ethical framework. The opposing position raised methodological concerns, pointed to implementation challenges, and offered an alternative way of thinking about the problem.

I don't think it's my role to declare a winner—that's for each of you to decide based on your own assessment of the arguments. What I hope we've accomplished is a clarification of the key issues and a demonstration that intelligent, good-faith people can disagree about difficult questions.

Thank you to both debaters for a respectful, substantive exchange. And thank you to our audience for your attention. These conversations matter, and engaging with them seriously is how we make progress on important issues.`,
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
