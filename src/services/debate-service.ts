// src/services/debate-service.ts
import { generateDebateAssignment, getProviderForPosition } from '@/lib/debate-assignment'
import { generateDebateId } from '@/lib/id-generator'
import {
  createDebateLogger,
  logDebateEvent,
  recordDebateStarted,
  recordDebateError,
} from '@/lib/logging'
import { getSession, storeSession, toPublicSession, updateSession } from '@/lib/session-store'
import { getTopicCategoryWithFallback } from '@/lib/topic-backgrounds'
import { OPENAI_MODEL } from '@/services/llm/openai-provider'
import { XAI_MODEL } from '@/services/llm/xai-provider'

import type { DebateFormValues } from '@/lib/schemas/debate-schema'
import type {
  DebatePhase,
  DebatePosition,
  DebateSession,
  DebateSessionPublic,
  LLMProvider,
} from '@/types/debate'

const SESSION_TTL_HOURS = 24

export interface CreateDebateResult {
  success: boolean
  debateId?: string | undefined
  session?: DebateSessionPublic | undefined
  error?: string | undefined
}

export interface CreateDebateInput extends DebateFormValues {
  originalTopic?: string
}

/**
 * Creates a new debate session with random LLM assignment.
 */
export async function createDebateSession(
  formData: CreateDebateInput
): Promise<CreateDebateResult> {
  const debateId = generateDebateId()
  const log = createDebateLogger(debateId)

  try {
    const assignment = generateDebateAssignment()
    const now = new Date()

    // Classify topic at creation time (keyword matching + semantic fallback)
    const backgroundCategory = await getTopicCategoryWithFallback(formData.topic)

    const session: DebateSession = {
      id: debateId,
      topic: formData.topic,
      originalTopic: formData.originalTopic,
      turns: formData.turns,
      format: formData.format,
      customRules: formData.customRules ?? [],
      assignment,
      status: 'ready',
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000),
      backgroundCategory,
    }

    await storeSession(session)

    // Log debate creation
    logDebateEvent('debate_created', debateId, {
      topic: formData.topic,
      turns: formData.turns,
      format: formData.format,
    })
    recordDebateStarted()
    log.info('Debate session created', { topic: formData.topic, turns: formData.turns })

    return {
      success: true,
      debateId,
      session: toPublicSession(session),
    }
  } catch (error) {
    log.error('Failed to create debate session', error instanceof Error ? error : null)
    recordDebateError()
    return {
      success: false,
      error: 'Failed to create debate session',
    }
  }
}

/**
 * Retrieves a debate session (public version only).
 * Use this for client-facing operations.
 */
export async function getDebateSession(debateId: string): Promise<DebateSessionPublic | null> {
  const session = await getSession(debateId)
  if (!session) return null
  return toPublicSession(session)
}

/**
 * Retrieves full session including assignment (internal use only).
 * Never expose this to client responses.
 */
export async function getFullDebateSession(debateId: string): Promise<DebateSession | null> {
  return getSession(debateId)
}

/**
 * Gets the LLM provider for a specific position in a debate.
 * Internal use only - used by debate engine.
 */
export async function getProviderForTurn(
  debateId: string,
  position: DebatePosition
): Promise<LLMProvider | null> {
  const session = await getSession(debateId)
  if (!session) return null
  return getProviderForPosition(session.assignment, position)
}

/**
 * Updates debate status.
 */
export async function updateDebateStatus(debateId: string, status: DebatePhase): Promise<boolean> {
  const updated = await updateSession(debateId, { status })

  if (updated) {
    logDebateEvent('status_changed', debateId, { status })

    // Note: recordDebateCompleted is called by debate-engine with proper metrics
    // recordDebateError is called here for errors not caught by the engine
    if (status === 'error') {
      recordDebateError()
    }
  }

  return updated !== null
}

/**
 * Reveals assignment after debate completion.
 * Only call this when debate status is 'completed'.
 * Returns provider:model format for use with getModelIdentity()
 */
export async function revealAssignment(
  debateId: string
): Promise<{ forModel: string; againstModel: string } | null> {
  const session = await getSession(debateId)
  if (!session) return null

  if (session.status !== 'completed') {
    return null
  }

  // Map internal provider names to LLMProviderType format
  // getModelIdentity expects format like 'openai:gpt-5.1' or 'xai:grok-4-1-fast-reasoning'
  const providerMapping: Record<LLMProvider, string> = {
    chatgpt: `openai:${OPENAI_MODEL}`,
    grok: `xai:${XAI_MODEL}`,
  }

  return {
    forModel: providerMapping[session.assignment.forPosition],
    againstModel: providerMapping[session.assignment.againstPosition],
  }
}
