// src/__tests__/debate-schema.test.ts
import { describe, expect, it } from 'vitest'

import { debateFormSchema, defaultValues } from '@/lib/schemas/debate-schema'

describe('debate-schema', () => {
  describe('debateFormSchema', () => {
    describe('topic validation', () => {
      it('should accept valid topic', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Should AI be regulated by governments?',
        })
        expect(result.success).toBe(true)
      })

      it('should reject topic shorter than 10 characters', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'AI?',
        })
        expect(result.success).toBe(false)
      })

      it('should reject topic longer than 500 characters', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'a'.repeat(501),
        })
        expect(result.success).toBe(false)
      })

      it('should trim whitespace from topic', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: '   Should AI be regulated?   ',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.topic).toBe('Should AI be regulated?')
        }
      })
    })

    describe('turns validation', () => {
      it('should accept valid turns (4, 6, 8, 10)', () => {
        for (const turns of [4, 6, 8, 10]) {
          const result = debateFormSchema.safeParse({
            ...defaultValues,
            topic: 'Valid topic here for testing',
            turns,
          })
          expect(result.success).toBe(true)
        }
      })

      it('should reject turns less than 4', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          turns: 2,
        })
        expect(result.success).toBe(false)
      })

      it('should reject turns greater than 10', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          turns: 11,
        })
        expect(result.success).toBe(false)
      })

      it('should reject non-integer turns', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          turns: 4.5,
        })
        expect(result.success).toBe(false)
      })
    })

    describe('format validation', () => {
      it('should accept valid formats', () => {
        for (const format of ['standard', 'oxford', 'lincoln-douglas']) {
          const result = debateFormSchema.safeParse({
            ...defaultValues,
            topic: 'Valid topic here for testing',
            format,
          })
          expect(result.success).toBe(true)
        }
      })

      it('should reject invalid format', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          format: 'invalid-format',
        })
        expect(result.success).toBe(false)
      })
    })

    describe('customRules validation', () => {
      it('should accept empty custom rules', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          customRules: [],
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid custom rules', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          customRules: ['Be respectful', 'Cite sources', 'Stay on topic'],
        })
        expect(result.success).toBe(true)
      })

      it('should reject custom rules shorter than 5 characters', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          customRules: ['Hi'],
        })
        expect(result.success).toBe(false)
      })

      it('should reject custom rules longer than 200 characters', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          customRules: ['a'.repeat(201)],
        })
        expect(result.success).toBe(false)
      })

      it('should reject more than 5 custom rules', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          customRules: ['Rule one', 'Rule two', 'Rule three', 'Rule four', 'Rule five', 'Rule six'],
        })
        expect(result.success).toBe(false)
      })

      it('should trim whitespace from custom rules', () => {
        const result = debateFormSchema.safeParse({
          ...defaultValues,
          topic: 'Valid topic here for testing',
          customRules: ['  Be respectful  '],
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.customRules[0]).toBe('Be respectful')
        }
      })
    })

    describe('defaultValues', () => {
      it('should have valid default values', () => {
        expect(defaultValues.topic).toBe('')
        expect(defaultValues.turns).toBe(4)
        expect(defaultValues.format).toBe('standard')
        expect(defaultValues.customRules).toEqual([])
      })
    })
  })
})
