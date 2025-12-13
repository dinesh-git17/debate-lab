// debate-schema.ts
/**
 * Zod validation schema for debate creation form.
 * Defines topic, turn count, format, and custom rule constraints.
 */

import { z } from 'zod'

export const debateFormSchema = z.object({
  topic: z
    .string()
    .min(10, 'Topic must be at least 10 characters')
    .max(500, 'Topic cannot exceed 500 characters')
    .trim(),

  turns: z.number().int().min(4, 'Minimum 4 turns required').max(10, 'Maximum 10 turns allowed'),

  format: z.enum(['standard', 'oxford', 'lincoln-douglas']),

  customRules: z
    .array(
      z
        .string()
        .min(5, 'Rule must be at least 5 characters')
        .max(200, 'Rule cannot exceed 200 characters')
        .trim()
    )
    .max(5, 'Maximum 5 custom rules allowed'),
})

export type DebateFormValues = z.infer<typeof debateFormSchema>

export const defaultValues: DebateFormValues = {
  topic: '',
  turns: 4,
  format: 'standard',
  customRules: [],
}

export const turnOptions = [
  { value: 4, label: '4 turns', description: 'Quick — Opening + Closing only' },
  { value: 6, label: '6 turns', description: 'Standard — Opening + Rebuttal + Closing' },
  {
    value: 8,
    label: '8 turns',
    description: 'Extended — Opening + Constructive + Rebuttal + Closing',
  },
  { value: 10, label: '10 turns', description: 'Full — Adds additional rebuttal rounds' },
] as const

export const formatOptions = [
  { value: 'standard', label: 'Standard', description: 'Classic back-and-forth debate' },
  { value: 'oxford', label: 'Oxford', description: 'Formal parliamentary style' },
  { value: 'lincoln-douglas', label: 'Lincoln-Douglas', description: 'Value-focused one-on-one' },
] as const
