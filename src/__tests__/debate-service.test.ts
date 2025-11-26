// src/__tests__/debate-service.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isValidDebateId } from '@/lib/id-generator'
import { deleteSession } from '@/lib/session-store'
import {
  createDebateSession,
  getDebateSession,
  getFullDebateSession,
  getProviderForTurn,
  revealAssignment,
  updateDebateStatus,
} from '@/services/debate-service'

import type { DebateFormValues } from '@/lib/schemas/debate-schema'

describe('debate-service', () => {
  const testFormData: DebateFormValues = {
    topic: 'Should AI be regulated by governments?',
    turns: 4,
    format: 'standard',
    customRules: ['Be respectful', 'Cite sources'],
  }

  let createdDebateIds: string[] = []

  beforeEach(() => {
    vi.stubEnv('SESSION_SECRET', 'test-secret-key-for-vitest-testing-32chars')
    vi.stubEnv('NODE_ENV', 'test')
    createdDebateIds = []
  })

  afterEach(async () => {
    // Clean up created debates
    for (const id of createdDebateIds) {
      await deleteSession(id)
    }
  })

  describe('createDebateSession', () => {
    it('should create a new debate session successfully', async () => {
      const result = await createDebateSession(testFormData)

      expect(result.success).toBe(true)
      expect(result.debateId).toBeDefined()
      expect(result.session).toBeDefined()

      if (result.debateId) {
        createdDebateIds.push(result.debateId)
      }
    })

    it('should generate a valid debate ID', async () => {
      const result = await createDebateSession(testFormData)

      expect(result.debateId).toBeDefined()
      expect(isValidDebateId(result.debateId!)).toBe(true)

      if (result.debateId) {
        createdDebateIds.push(result.debateId)
      }
    })

    it('should return a public session without assignment', async () => {
      const result = await createDebateSession(testFormData)

      expect(result.session).toBeDefined()
      expect(result.session).not.toHaveProperty('assignment')
      expect(result.session?.topic).toBe(testFormData.topic)
      expect(result.session?.turns).toBe(testFormData.turns)
      expect(result.session?.format).toBe(testFormData.format)
      expect(result.session?.status).toBe('ready')

      if (result.debateId) {
        createdDebateIds.push(result.debateId)
      }
    })

    it('should store session with random assignment', async () => {
      const result = await createDebateSession(testFormData)

      if (result.debateId) {
        createdDebateIds.push(result.debateId)

        const fullSession = await getFullDebateSession(result.debateId)
        expect(fullSession).not.toBeNull()
        expect(fullSession?.assignment).toBeDefined()
        expect(['chatgpt', 'grok']).toContain(fullSession?.assignment.forPosition)
        expect(['chatgpt', 'grok']).toContain(fullSession?.assignment.againstPosition)
        expect(fullSession?.assignment.forPosition).not.toBe(
          fullSession?.assignment.againstPosition
        )
      }
    })

    it('should handle empty custom rules', async () => {
      const dataWithoutRules: DebateFormValues = {
        ...testFormData,
        customRules: [],
      }

      const result = await createDebateSession(dataWithoutRules)

      expect(result.success).toBe(true)
      expect(result.session?.customRules).toEqual([])

      if (result.debateId) {
        createdDebateIds.push(result.debateId)
      }
    })
  })

  describe('getDebateSession', () => {
    it('should return public session data', async () => {
      const createResult = await createDebateSession(testFormData)
      createdDebateIds.push(createResult.debateId!)

      const session = await getDebateSession(createResult.debateId!)

      expect(session).not.toBeNull()
      expect(session).not.toHaveProperty('assignment')
      expect(session?.id).toBe(createResult.debateId)
      expect(session?.topic).toBe(testFormData.topic)
    })

    it('should return null for non-existent debate', async () => {
      const session = await getDebateSession('db_nonexistent12345')
      expect(session).toBeNull()
    })
  })

  describe('getFullDebateSession', () => {
    it('should return full session including assignment', async () => {
      const createResult = await createDebateSession(testFormData)
      createdDebateIds.push(createResult.debateId!)

      const fullSession = await getFullDebateSession(createResult.debateId!)

      expect(fullSession).not.toBeNull()
      expect(fullSession?.assignment).toBeDefined()
      expect(fullSession?.assignment.forPosition).toBeDefined()
      expect(fullSession?.assignment.againstPosition).toBeDefined()
    })

    it('should return null for non-existent debate', async () => {
      const fullSession = await getFullDebateSession('db_nonexistent12345')
      expect(fullSession).toBeNull()
    })
  })

  describe('getProviderForTurn', () => {
    it('should return correct provider for FOR position', async () => {
      const createResult = await createDebateSession(testFormData)
      createdDebateIds.push(createResult.debateId!)

      const fullSession = await getFullDebateSession(createResult.debateId!)
      const provider = await getProviderForTurn(createResult.debateId!, 'for')

      expect(provider).toBe(fullSession?.assignment.forPosition)
    })

    it('should return correct provider for AGAINST position', async () => {
      const createResult = await createDebateSession(testFormData)
      createdDebateIds.push(createResult.debateId!)

      const fullSession = await getFullDebateSession(createResult.debateId!)
      const provider = await getProviderForTurn(createResult.debateId!, 'against')

      expect(provider).toBe(fullSession?.assignment.againstPosition)
    })

    it('should return null for non-existent debate', async () => {
      const provider = await getProviderForTurn('db_nonexistent12345', 'for')
      expect(provider).toBeNull()
    })
  })

  describe('updateDebateStatus', () => {
    it('should update debate status', async () => {
      const createResult = await createDebateSession(testFormData)
      createdDebateIds.push(createResult.debateId!)

      const updated = await updateDebateStatus(createResult.debateId!, 'active')
      expect(updated).toBe(true)

      const session = await getDebateSession(createResult.debateId!)
      expect(session?.status).toBe('active')
    })

    it('should return false for non-existent debate', async () => {
      const updated = await updateDebateStatus('db_nonexistent12345', 'active')
      expect(updated).toBe(false)
    })
  })

  describe('revealAssignment', () => {
    it('should return null for non-completed debate', async () => {
      const createResult = await createDebateSession(testFormData)
      createdDebateIds.push(createResult.debateId!)

      const assignment = await revealAssignment(createResult.debateId!)
      expect(assignment).toBeNull()
    })

    it('should return assignment for completed debate', async () => {
      const createResult = await createDebateSession(testFormData)
      createdDebateIds.push(createResult.debateId!)

      await updateDebateStatus(createResult.debateId!, 'completed')

      const assignment = await revealAssignment(createResult.debateId!)
      expect(assignment).not.toBeNull()
      // revealAssignment returns model identifiers in 'provider:model' format
      expect(['openai:gpt-4', 'xai:grok']).toContain(assignment?.forModel)
      expect(['openai:gpt-4', 'xai:grok']).toContain(assignment?.againstModel)
      expect(assignment?.forModel).not.toBe(assignment?.againstModel)
    })

    it('should return null for non-existent debate', async () => {
      const assignment = await revealAssignment('db_nonexistent12345')
      expect(assignment).toBeNull()
    })
  })

  describe('security', () => {
    it('should never expose assignment in public session', async () => {
      const createResult = await createDebateSession(testFormData)
      createdDebateIds.push(createResult.debateId!)

      const publicSession = await getDebateSession(createResult.debateId!)
      const sessionJson = JSON.stringify(publicSession)

      expect(sessionJson).not.toContain('chatgpt')
      expect(sessionJson).not.toContain('grok')
      expect(sessionJson).not.toContain('forPosition')
      expect(sessionJson).not.toContain('againstPosition')
    })
  })
})
