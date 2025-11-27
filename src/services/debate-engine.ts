// src/services/debate-engine.ts

import { getProviderForPosition } from '@/lib/debate-assignment'
import { debateEvents } from '@/lib/debate-events'
import { getEngineState, storeEngineState } from '@/lib/engine-store'
import {
  createDebateLogger,
  logDebateEvent,
  recordDebateCompleted,
  recordDebateError,
} from '@/lib/logging'
import { estimateTurnInputTokens } from '@/lib/token-counter'
import {
  checkBudget,
  getBudgetStatus,
  initializeDebateBudget,
  isBudgetInitialized,
  recordUsage,
  shouldEndDueToBudget,
} from '@/services/budget-manager'
import { getFullDebateSession, updateDebateStatus } from '@/services/debate-service'
import { getJudgeAnalysis } from '@/services/judge-service'
import { generateStream } from '@/services/llm/llm-service'
import {
  buildModeratorContext,
  compileDebaterPrompt,
  compileModeratorPrompt,
  isModeratorTurn,
} from '@/services/prompt-compiler'
import { TurnSequencer } from '@/services/turn-sequencer'

import type { DebateSession, LLMProvider } from '@/types/debate'
import type { GenerateResult, LLMProviderType } from '@/types/llm'
import type { DebateEngineState, DebateProgress, TurnConfig, TurnProvider } from '@/types/turn'

export interface DebateEngineContext {
  session: DebateSession
  sequencer: TurnSequencer
}

export interface StartDebateResult {
  success: boolean
  error?: string
}

export interface RecordTurnResult {
  success: boolean
  isComplete: boolean
  error?: string
}

export interface CurrentTurnInfo {
  turn: TurnConfig
  provider: TurnProvider
  progress: DebateProgress
  context: string
}

/**
 * Initialize a debate engine for a session.
 * Creates new or resumes existing engine state.
 */
export async function initializeEngine(debateId: string): Promise<DebateEngineContext | null> {
  const log = createDebateLogger(debateId)
  const session = await getFullDebateSession(debateId)
  if (!session) {
    log.warn('Session not found')
    return null
  }

  const existingState = await getEngineState(debateId)
  if (existingState) {
    const sequencer = TurnSequencer.fromState(existingState)
    return { session, sequencer }
  }

  const sequencer = new TurnSequencer({
    debateId,
    format: session.format,
    turnCount: session.turns,
    customRules: session.customRules,
  })

  await storeEngineState(debateId, sequencer.getState())

  if (!isBudgetInitialized(debateId)) {
    initializeDebateBudget(debateId, session.turns)
  }

  return { session, sequencer }
}

/**
 * Start a debate.
 */
export async function startDebate(debateId: string): Promise<StartDebateResult> {
  const context = await initializeEngine(debateId)
  if (!context) {
    return { success: false, error: 'Failed to initialize engine' }
  }

  try {
    context.sequencer.start()
    await storeEngineState(debateId, context.sequencer.getState())
    await updateDebateStatus(debateId, 'active')

    const progress = context.sequencer.getProgress()
    debateEvents.emitEvent(debateId, 'debate_started', {
      totalTurns: progress.totalTurns,
      format: context.session.format,
    })

    logDebateEvent('debate_started', debateId, { format: context.session.format })
    return { success: true }
  } catch (error) {
    const log = createDebateLogger(debateId)
    log.error('Failed to start debate', error instanceof Error ? error : null)
    recordDebateError()
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get current turn info for a debate.
 */
export async function getCurrentTurnInfo(debateId: string): Promise<CurrentTurnInfo | null> {
  const engineContext = await initializeEngine(debateId)
  if (!engineContext) return null

  const { session, sequencer } = engineContext
  const currentTurn = sequencer.getCurrentTurn()

  if (!currentTurn) {
    return null
  }

  let provider: TurnProvider
  if (currentTurn.speaker === 'moderator') {
    provider = 'claude'
  } else {
    provider = getProviderForPosition(session.assignment, currentTurn.speaker)
  }

  return {
    turn: currentTurn,
    provider,
    progress: sequencer.getProgress(),
    context: sequencer.getDebateContext(),
  }
}

/**
 * Get next turn info (preview).
 */
export async function getNextTurnInfo(
  debateId: string
): Promise<{ turn: TurnConfig; provider: TurnProvider } | null> {
  const engineContext = await initializeEngine(debateId)
  if (!engineContext) return null

  const { session, sequencer } = engineContext
  const nextTurn = sequencer.getNextTurn()

  if (!nextTurn) {
    return null
  }

  let provider: TurnProvider
  if (nextTurn.speaker === 'moderator') {
    provider = 'claude'
  } else {
    provider = getProviderForPosition(session.assignment, nextTurn.speaker)
  }

  return { turn: nextTurn, provider }
}

/**
 * Record a completed turn.
 */
export async function recordCompletedTurn(
  debateId: string,
  content: string,
  provider: LLMProvider | 'claude',
  tokenCount: number
): Promise<RecordTurnResult> {
  const context = await initializeEngine(debateId)
  if (!context) {
    return { success: false, isComplete: false, error: 'Engine not found' }
  }

  const { sequencer } = context
  const currentTurn = sequencer.getCurrentTurn()

  if (!currentTurn) {
    return { success: false, isComplete: true, error: 'No current turn' }
  }

  try {
    sequencer.recordTurn({
      speaker: currentTurn.speaker,
      provider,
      content,
      tokenCount,
      startedAt: new Date(),
      completedAt: new Date(),
    })

    await storeEngineState(debateId, sequencer.getState())

    const isComplete = sequencer.isComplete()
    if (isComplete) {
      await updateDebateStatus(debateId, 'completed')
    }

    return { success: true, isComplete }
  } catch (error) {
    const log = createDebateLogger(debateId)
    log.error('Failed to record turn', error instanceof Error ? error : null)
    return {
      success: false,
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Record a turn with timing information.
 */
export async function recordCompletedTurnWithTiming(
  debateId: string,
  content: string,
  provider: LLMProvider | 'claude',
  tokenCount: number,
  startedAt: Date,
  completedAt: Date
): Promise<RecordTurnResult> {
  const context = await initializeEngine(debateId)
  if (!context) {
    return { success: false, isComplete: false, error: 'Engine not found' }
  }

  const { sequencer } = context
  const currentTurn = sequencer.getCurrentTurn()

  if (!currentTurn) {
    return { success: false, isComplete: true, error: 'No current turn' }
  }

  try {
    sequencer.recordTurn({
      speaker: currentTurn.speaker,
      provider,
      content,
      tokenCount,
      startedAt,
      completedAt,
    })

    await storeEngineState(debateId, sequencer.getState())

    const isComplete = sequencer.isComplete()
    if (isComplete) {
      await updateDebateStatus(debateId, 'completed')
    }

    return { success: true, isComplete }
  } catch (error) {
    const log = createDebateLogger(debateId)
    log.error('Failed to record turn with timing', error instanceof Error ? error : null)
    return {
      success: false,
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Insert a moderator intervention.
 */
export async function insertModeratorIntervention(
  debateId: string,
  content: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const context = await initializeEngine(debateId)
  if (!context) {
    return { success: false, error: 'Engine not found' }
  }

  try {
    context.sequencer.insertIntervention(content, reason)
    await storeEngineState(debateId, context.sequencer.getState())
    logDebateEvent('moderator_intervention', debateId, { reason })
    return { success: true }
  } catch (error) {
    const log = createDebateLogger(debateId)
    log.error('Failed to insert intervention', error instanceof Error ? error : null)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get engine state for a debate.
 */
export async function getDebateEngineState(debateId: string): Promise<DebateEngineState | null> {
  return getEngineState(debateId)
}

/**
 * Get debate progress.
 */
export async function getDebateProgress(debateId: string): Promise<DebateProgress | null> {
  const context = await initializeEngine(debateId)
  if (!context) return null
  return context.sequencer.getProgress()
}

/**
 * Get full debate transcript.
 */
export async function getDebateTranscript(debateId: string): Promise<string | null> {
  const context = await initializeEngine(debateId)
  if (!context) return null
  return context.sequencer.getFullTranscript()
}

/**
 * End debate early.
 */
export async function endDebateEarly(debateId: string, reason: string): Promise<boolean> {
  const context = await initializeEngine(debateId)
  if (!context) return false

  const progress = context.sequencer.getProgress()
  context.sequencer.cancel(reason)
  await storeEngineState(debateId, context.sequencer.getState())
  await updateDebateStatus(debateId, 'completed')

  debateEvents.emitEvent(debateId, 'debate_cancelled', {
    reason,
    completedTurns: progress.currentTurn,
  })

  return true
}

/**
 * Pause debate.
 */
export async function pauseDebate(debateId: string): Promise<boolean> {
  const context = await initializeEngine(debateId)
  if (!context) return false

  const progress = context.sequencer.getProgress()
  context.sequencer.pause()
  await storeEngineState(debateId, context.sequencer.getState())
  await updateDebateStatus(debateId, 'paused')

  debateEvents.emitEvent(debateId, 'debate_paused', {
    pausedAtTurn: progress.currentTurn,
  })

  return true
}

/**
 * Resume debate.
 */
export async function resumeDebate(debateId: string): Promise<boolean> {
  const context = await initializeEngine(debateId)
  if (!context) return false

  const progress = context.sequencer.getProgress()
  context.sequencer.resume()
  await storeEngineState(debateId, context.sequencer.getState())
  await updateDebateStatus(debateId, 'active')

  debateEvents.emitEvent(debateId, 'debate_resumed', {
    resumingAtTurn: progress.currentTurn,
  })

  return true
}

/**
 * Set debate to error state.
 */
export async function setDebateError(debateId: string, error: string): Promise<boolean> {
  const context = await initializeEngine(debateId)
  if (!context) return false

  context.sequencer.setError(error)
  await storeEngineState(debateId, context.sequencer.getState())
  await updateDebateStatus(debateId, 'error')

  debateEvents.emitEvent(debateId, 'debate_error', {
    error,
    fatal: true,
  })

  const log = createDebateLogger(debateId)
  log.error('Debate error', new Error(error))
  logDebateEvent('debate_error', debateId, { error, fatal: true })
  recordDebateError()

  return true
}

/**
 * Check if a debate can be started.
 */
export async function canStartDebate(debateId: string): Promise<{
  canStart: boolean
  reason?: string
}> {
  const session = await getFullDebateSession(debateId)
  if (!session) {
    return { canStart: false, reason: 'Session not found' }
  }

  if (session.status !== 'ready') {
    return { canStart: false, reason: `Invalid session status: ${session.status}` }
  }

  const existingState = await getEngineState(debateId)
  if (existingState && existingState.status !== 'initialized') {
    return { canStart: false, reason: `Engine already in status: ${existingState.status}` }
  }

  return { canStart: true }
}

/**
 * Map turn provider to LLM provider type for budget checking.
 */
function mapTurnProviderToLLMProvider(provider: TurnProvider): LLMProviderType {
  switch (provider) {
    case 'chatgpt':
      return 'openai'
    case 'grok':
      return 'xai'
    case 'claude':
      return 'anthropic'
  }
}

/**
 * Check if a turn can proceed within budget.
 */
export async function checkTurnBudget(
  debateId: string,
  systemPrompt: string,
  debateContext: string
): Promise<{
  allowed: boolean
  warning?: string | undefined
  error?: string | undefined
}> {
  const context = await initializeEngine(debateId)
  if (!context) {
    return { allowed: false, error: 'Engine not found' }
  }

  const { session, sequencer } = context
  const currentTurn = sequencer.getCurrentTurn()

  if (!currentTurn) {
    return { allowed: false, error: 'No current turn' }
  }

  let provider: TurnProvider
  if (currentTurn.speaker === 'moderator') {
    provider = 'claude'
  } else {
    provider = getProviderForPosition(session.assignment, currentTurn.speaker)
  }

  const llmProvider = mapTurnProviderToLLMProvider(provider)

  const estimatedInput = estimateTurnInputTokens(
    systemPrompt,
    debateContext,
    currentTurn.description,
    llmProvider
  )

  const check = checkBudget(debateId, llmProvider, estimatedInput, currentTurn.maxTokens)

  if (!check.allowed) {
    return { allowed: false, error: check.reason }
  }

  if (check.warningLevel === 'critical') {
    return {
      allowed: true,
      warning: `Budget critically low: ${check.tokensRemaining} tokens remaining`,
    }
  }

  if (check.warningLevel === 'warning') {
    return {
      allowed: true,
      warning: `Budget warning: ${check.tokensRemaining} tokens remaining`,
    }
  }

  return { allowed: true }
}

/**
 * Record a completed turn with usage tracking.
 */
export async function recordCompletedTurnWithUsage(
  debateId: string,
  content: string,
  provider: LLMProvider | 'claude',
  generateResult: GenerateResult
): Promise<RecordTurnResult> {
  const context = await initializeEngine(debateId)
  if (!context) {
    return { success: false, isComplete: false, error: 'Engine not found' }
  }

  const { sequencer } = context
  const currentTurn = sequencer.getCurrentTurn()

  if (!currentTurn) {
    return { success: false, isComplete: true, error: 'No current turn' }
  }

  try {
    sequencer.recordTurn({
      speaker: currentTurn.speaker,
      provider,
      content,
      tokenCount: generateResult.totalTokens,
      startedAt: new Date(Date.now() - generateResult.latencyMs),
      completedAt: new Date(),
    })

    await storeEngineState(debateId, sequencer.getState())

    const turnId = `${debateId}_turn_${sequencer.getState().currentTurnIndex - 1}`
    const usageProvider = provider === 'claude' ? 'claude' : mapTurnProviderToLLMProvider(provider)
    recordUsage(debateId, turnId, usageProvider, generateResult)

    const budgetCheck = shouldEndDueToBudget(debateId)
    if (budgetCheck.shouldEnd) {
      sequencer.cancel(budgetCheck.reason ?? 'Budget exhausted')
      await storeEngineState(debateId, sequencer.getState())
      await updateDebateStatus(debateId, 'completed')
      return { success: true, isComplete: true }
    }

    const isComplete = sequencer.isComplete()
    if (isComplete) {
      await updateDebateStatus(debateId, 'completed')
    }

    return { success: true, isComplete }
  } catch (error) {
    const log = createDebateLogger(debateId)
    log.error('Failed to record turn with usage', error instanceof Error ? error : null)
    return {
      success: false,
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Execute the next turn in the debate.
 * Handles both moderator and debater turns with streaming.
 */
export async function executeNextTurn(debateId: string): Promise<{
  success: boolean
  isComplete: boolean
  error?: string
}> {
  const context = await initializeEngine(debateId)
  if (!context) {
    return { success: false, isComplete: false, error: 'Engine not found' }
  }

  const { session, sequencer } = context
  const currentTurn = sequencer.getCurrentTurn()

  if (!currentTurn) {
    return { success: false, isComplete: true, error: 'No more turns' }
  }

  // Check if paused or terminated
  const status = sequencer.getStatus()
  if (status === 'paused') {
    return { success: false, isComplete: false, error: 'Debate is paused' }
  }
  if (status === 'completed' || status === 'cancelled' || status === 'error') {
    return { success: false, isComplete: true, error: `Debate is ${status}` }
  }

  // Determine provider for this turn
  let provider: TurnProvider
  if (currentTurn.speaker === 'moderator') {
    provider = 'claude'
  } else {
    provider = getProviderForPosition(session.assignment, currentTurn.speaker)
  }

  const turnId = `${debateId}_turn_${sequencer.getState().currentTurnIndex}`
  const startTime = Date.now()

  // Emit turn started event
  debateEvents.emitEvent(debateId, 'turn_started', {
    turnId,
    turnNumber: sequencer.getState().currentTurnIndex + 1,
    speaker: currentTurn.speaker,
    speakerLabel: currentTurn.label,
    turnType: currentTurn.type,
    provider,
  })

  try {
    let systemPrompt: string
    let userPrompt: string
    let maxTokens: number
    let temperature: number

    // Compile prompts based on turn type
    if (isModeratorTurn(currentTurn.type)) {
      // For moderator turns, pass the next turn config so we know who speaks next
      const nextTurn = sequencer.getNextTurn()
      const moderatorContext = buildModeratorContext(
        session,
        sequencer.getCompletedTurns(),
        currentTurn,
        [], // violations
        nextTurn ?? undefined
      )
      const compiled = compileModeratorPrompt(currentTurn.type, moderatorContext)
      systemPrompt = compiled.systemPrompt
      userPrompt = compiled.userPrompt
      maxTokens = compiled.maxTokens
      temperature = compiled.temperature
    } else {
      const compiled = compileDebaterPrompt(session, currentTurn, sequencer.getCompletedTurns())
      systemPrompt = compiled.systemPrompt
      userPrompt = compiled.userPrompt
      maxTokens = compiled.maxTokens
      temperature = compiled.temperature
    }

    // Check budget before generating
    const llmProviderType = mapTurnProviderToLLMProvider(provider)
    const estimatedInput = estimateTurnInputTokens(
      systemPrompt,
      sequencer.getDebateContext(),
      currentTurn.description,
      llmProviderType
    )

    const budgetCheck = checkBudget(debateId, llmProviderType, estimatedInput, maxTokens)
    if (!budgetCheck.allowed) {
      debateEvents.emitEvent(debateId, 'turn_error', {
        turnId,
        error: budgetCheck.reason ?? 'Budget exceeded',
        recoverable: false,
      })
      return { success: false, isComplete: false, error: budgetCheck.reason ?? 'Budget exceeded' }
    }

    if (budgetCheck.warningLevel) {
      const budgetStatus = getBudgetStatus(debateId)
      const usedPercent = budgetStatus.usage?.budgetUtilizationPercent ?? 0
      const remainingCost = budgetStatus.config.costLimitUsd
        ? budgetStatus.config.costLimitUsd - (budgetStatus.usage?.totalCostUsd ?? 0)
        : 0
      debateEvents.emitEvent(debateId, 'budget_warning', {
        budgetUsedPercent: usedPercent,
        remainingTokens: budgetCheck.tokensRemaining,
        remainingCost,
        message: `Budget ${budgetCheck.warningLevel}: ${budgetCheck.tokensRemaining} tokens remaining`,
      })
    }

    // Generate with streaming
    let fullContent = ''
    let accumulatedLength = 0

    const stream = generateStream({
      provider,
      params: {
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        maxTokens,
        temperature,
      },
    })

    for await (const chunk of stream) {
      fullContent += chunk.content
      accumulatedLength += chunk.content.length
      debateEvents.emitEvent(debateId, 'turn_streaming', {
        turnId,
        chunk: chunk.content,
        accumulatedLength,
      })
    }

    // Get final result from generator return value
    const durationMs = Date.now() - startTime
    const inputTokens = Math.ceil(systemPrompt.length / 4) + Math.ceil(userPrompt.length / 4)
    const outputTokens = Math.ceil(fullContent.length / 4)

    const generateResult: GenerateResult = {
      content: fullContent,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      finishReason: 'stop',
      latencyMs: durationMs,
      provider: llmProviderType,
      model: provider,
    }

    // Emit turn completed
    debateEvents.emitEvent(debateId, 'turn_completed', {
      turnId,
      content: fullContent,
      tokenCount: generateResult.totalTokens,
      durationMs,
    })

    // Record the turn
    const llmProvider: LLMProvider | 'claude' = provider === 'claude' ? 'claude' : provider
    const recordResult = await recordCompletedTurnWithUsage(
      debateId,
      fullContent,
      llmProvider,
      generateResult
    )

    if (!recordResult.success) {
      return {
        success: false,
        isComplete: false,
        error: recordResult.error ?? 'Failed to record turn',
      }
    }

    // Emit progress update - re-fetch to get updated state
    const updatedContext = await initializeEngine(debateId)
    if (updatedContext) {
      const progress = updatedContext.sequencer.getProgress()
      debateEvents.emitEvent(debateId, 'progress_update', {
        currentTurn: progress.currentTurn,
        totalTurns: progress.totalTurns,
        percentComplete: progress.percentComplete,
        debaterTurnsCompleted: progress.debaterTurnsCompleted,
        debaterTurnsTotal: progress.debaterTurnsTotal,
      })
    }

    logDebateEvent('turn_completed', debateId, {
      turnId,
      speaker: currentTurn.speaker,
      durationMs: Date.now() - startTime,
    })

    return { success: true, isComplete: recordResult.isComplete }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    const log = createDebateLogger(debateId)
    log.error('Turn execution failed', error instanceof Error ? error : null, { turnId })

    debateEvents.emitEvent(debateId, 'turn_error', {
      turnId,
      error: errorMsg,
      recoverable: false,
    })

    return { success: false, isComplete: false, error: errorMsg }
  }
}

/**
 * Run the debate loop until completion or error.
 * This executes all turns sequentially with streaming.
 */
export async function runDebateLoop(debateId: string): Promise<{
  success: boolean
  error?: string | undefined
}> {
  const loopStartTime = Date.now()
  let turnCount = 0
  const maxTurns = 100 // Safety limit

  while (turnCount < maxTurns) {
    // Re-fetch context to get latest state
    const context = await initializeEngine(debateId)
    if (!context) {
      return { success: false, error: 'Engine not found' }
    }

    const status = context.sequencer.getStatus()

    // Check for terminal states
    if (status === 'completed') {
      const budgetStatus = getBudgetStatus(debateId)
      debateEvents.emitEvent(debateId, 'debate_completed', {
        totalTurns: context.sequencer.getProgress().currentTurn,
        durationMs: Date.now() - loopStartTime,
        totalTokens: budgetStatus.usage?.totalTokens ?? 0,
        totalCost: budgetStatus.usage?.totalCostUsd ?? 0,
      })

      // Preload judge analysis in background so it's ready when user visits summary
      getJudgeAnalysis(debateId).catch((err) => {
        const log = createDebateLogger(debateId)
        log.warn('Failed to preload judge analysis', {
          error: err instanceof Error ? err.message : String(err),
        })
      })

      const completedTurns = context.sequencer.getProgress().currentTurn
      const completedDurationMs = Date.now() - loopStartTime
      logDebateEvent('debate_completed', debateId, {
        totalTurns: completedTurns,
        durationMs: completedDurationMs,
      })
      recordDebateCompleted(completedTurns, completedDurationMs)

      return { success: true }
    }

    if (status === 'cancelled') {
      return { success: true }
    }

    if (status === 'error') {
      const errorMsg = context.sequencer.getState().error ?? 'Unknown error'
      return { success: false, error: errorMsg }
    }

    if (status === 'paused') {
      return { success: true }
    }

    // Execute next turn
    const result = await executeNextTurn(debateId)

    if (!result.success) {
      // If turn failed, set error state
      await setDebateError(debateId, result.error ?? 'Turn execution failed')
      return { success: false, error: result.error ?? 'Turn execution failed' }
    }

    if (result.isComplete) {
      const finalTurnCount = turnCount + 1
      const finalDurationMs = Date.now() - loopStartTime
      const budgetStatus = getBudgetStatus(debateId)
      debateEvents.emitEvent(debateId, 'debate_completed', {
        totalTurns: finalTurnCount,
        durationMs: finalDurationMs,
        totalTokens: budgetStatus.usage?.totalTokens ?? 0,
        totalCost: budgetStatus.usage?.totalCostUsd ?? 0,
      })

      logDebateEvent('debate_completed', debateId, {
        totalTurns: finalTurnCount,
        durationMs: finalDurationMs,
      })
      recordDebateCompleted(finalTurnCount, finalDurationMs)

      // Preload judge analysis in background so it's ready when user visits summary
      getJudgeAnalysis(debateId).catch((err) => {
        const log = createDebateLogger(debateId)
        log.warn('Failed to preload judge analysis', {
          error: err instanceof Error ? err.message : String(err),
        })
      })

      return { success: true }
    }

    turnCount++

    // Small delay between turns to prevent overwhelming
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // Safety limit reached
  await setDebateError(debateId, 'Maximum turn limit reached')
  return { success: false, error: 'Maximum turn limit reached' }
}
