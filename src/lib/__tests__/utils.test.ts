// src/lib/__tests__/utils.test.ts
// Unit tests for utility functions

import { describe, it, expect } from 'vitest'

import { cn, formatDate, generateId, clamp } from '../utils'

describe('utils', () => {
  describe('cn (className helper)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8')
    })

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const formatted = formatDate(date)

      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should include time', () => {
      const date = new Date('2024-06-01T09:05:00')
      const formatted = formatDate(date)

      expect(formatted).toContain('Jun')
      expect(formatted).toContain('1')
    })
  })

  describe('generateId', () => {
    it('should generate a string ID', () => {
      const id = generateId()

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should call crypto.randomUUID', () => {
      // The mock returns 'test-uuid-...' format
      const id = generateId()

      expect(id).toContain('test-uuid')
    })
  })

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('should clamp to min when value is below', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('should clamp to max when value is above', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('should return min when min equals max and value is different', () => {
      expect(clamp(10, 5, 5)).toBe(5)
    })

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5)
      expect(clamp(-15, -10, -1)).toBe(-10)
      expect(clamp(5, -10, -1)).toBe(-1)
    })

    it('should handle decimal values', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5)
      expect(clamp(-0.5, 0, 1)).toBe(0)
      expect(clamp(1.5, 0, 1)).toBe(1)
    })
  })
})
