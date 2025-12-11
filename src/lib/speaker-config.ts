/**
 * src/lib/speaker-config.ts
 * Apple-inspired color palette and shadow system for speaker differentiation
 */

import type { SpeakerConfig } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

/**
 * Apple-inspired color tokens (HSL format for consistency)
 * Desaturated, sophisticated palette that feels premium
 */
export const APPLE_COLORS = {
  // Desaturated teal - calm, authoritative
  for: {
    hsl: 'hsl(185, 45%, 55%)',
    rgb: 'rgb(77, 175, 182)',
    rgba: (alpha: number) => `rgba(77, 175, 182, ${alpha})`,
  },
  // Soft rose - warm, passionate
  against: {
    hsl: 'hsl(350, 55%, 62%)',
    rgb: 'rgb(204, 107, 122)',
    rgba: (alpha: number) => `rgba(204, 107, 122, ${alpha})`,
  },
  // Neutral slate - balanced, impartial
  moderator: {
    hsl: 'hsl(220, 15%, 58%)',
    rgb: 'rgb(132, 140, 158)',
    rgba: (alpha: number) => `rgba(132, 140, 158, ${alpha})`,
  },
} as const

export const SPEAKER_CONFIGS: Record<TurnSpeaker, SpeakerConfig> = {
  for: {
    label: 'FOR (Affirmative)',
    shortLabel: 'FOR',
    color: 'text-[hsl(185,45%,65%)]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[hsl(185,45%,55%)]',
    icon: 'thumbs-up',
    position: 'left',
    chipBorder: 'border-[hsl(185,45%,55%)]/20',
    chipBg: 'bg-[hsl(185,45%,55%)]/5',
    glowColor: 'shadow-[hsl(185,45%,55%)]/10',
  },
  against: {
    label: 'AGAINST (Negative)',
    shortLabel: 'AGAINST',
    color: 'text-[hsl(350,55%,72%)]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[hsl(350,55%,62%)]',
    icon: 'thumbs-down',
    position: 'right',
    chipBorder: 'border-[hsl(350,55%,62%)]/20',
    chipBg: 'bg-[hsl(350,55%,62%)]/5',
    glowColor: 'shadow-[hsl(350,55%,62%)]/10',
  },
  moderator: {
    label: 'Moderator',
    shortLabel: 'MOD',
    color: 'text-[hsl(220,15%,68%)]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[hsl(220,15%,58%)]',
    icon: 'scale',
    position: 'center',
    chipBorder: 'border-[hsl(220,15%,58%)]/20',
    chipBg: 'bg-[hsl(220,15%,58%)]/5',
    glowColor: 'shadow-[hsl(220,15%,58%)]/10',
  },
}

// Gradient colors for glow bleed effect (light bleeding from accent border)
export const SPEAKER_GRADIENTS: Record<TurnSpeaker, string> = {
  for: `linear-gradient(90deg, ${APPLE_COLORS.for.rgba(0.06)} 0%, transparent 120px)`,
  against: `linear-gradient(90deg, ${APPLE_COLORS.against.rgba(0.06)} 0%, transparent 120px)`,
  moderator: `linear-gradient(90deg, ${APPLE_COLORS.moderator.rgba(0.05)} 0%, transparent 120px)`,
}

// Border colors for role badges (used with border-current pattern)
export const SPEAKER_BADGE_COLORS: Record<TurnSpeaker, string> = {
  for: `text-[hsl(185,45%,65%)] border-[hsl(185,45%,55%)]/40 bg-[hsl(185,45%,55%)]/8`,
  against: `text-[hsl(350,55%,72%)] border-[hsl(350,55%,62%)]/40 bg-[hsl(350,55%,62%)]/8`,
  moderator: `text-[hsl(220,15%,68%)] border-[hsl(220,15%,58%)]/40 bg-[hsl(220,15%,58%)]/8`,
}

/**
 * 3D floating card shadows - creates depth and elevation
 * Softened for Apple aesthetic: reduced glow intensity by 40%, blur radii adjusted
 * Layer 1: Rim light (top edge catch)
 * Layer 2: Left edge highlight (catches light)
 * Layer 3: Inner depth (card thickness)
 * Layer 4: Close contact shadow (tight to card)
 * Layer 5: Speaker-colored glow (softened)
 * Layer 6: Mid elevation shadow
 * Layer 7: Far ground shadow (diffuse)
 */
export const SPEAKER_ACTIVE_SHADOWS: Record<TurnSpeaker, string> = {
  for: [
    'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    'inset 1px 0 0 rgba(255, 255, 255, 0.04)',
    'inset 0 -48px 48px -24px rgba(0, 0, 0, 0.28)',
    '0 1px 2px rgba(0, 0, 0, 0.2)',
    `0 0 32px ${APPLE_COLORS.for.rgba(0.09)}`,
    '0 16px 32px -8px rgba(0, 0, 0, 0.35)',
    '0 40px 48px -16px rgba(0, 0, 0, 0.28)',
  ].join(', '),
  against: [
    'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    'inset 1px 0 0 rgba(255, 255, 255, 0.04)',
    'inset 0 -48px 48px -24px rgba(0, 0, 0, 0.28)',
    '0 1px 2px rgba(0, 0, 0, 0.2)',
    `0 0 32px ${APPLE_COLORS.against.rgba(0.09)}`,
    '0 16px 32px -8px rgba(0, 0, 0, 0.35)',
    '0 40px 48px -16px rgba(0, 0, 0, 0.28)',
  ].join(', '),
  moderator: [
    'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    'inset 1px 0 0 rgba(255, 255, 255, 0.04)',
    'inset 0 -48px 48px -24px rgba(0, 0, 0, 0.28)',
    '0 1px 2px rgba(0, 0, 0, 0.2)',
    `0 0 32px ${APPLE_COLORS.moderator.rgba(0.07)}`,
    '0 16px 32px -8px rgba(0, 0, 0, 0.35)',
    '0 40px 48px -16px rgba(0, 0, 0, 0.28)',
  ].join(', '),
}

// Inactive card shadows - subtle, recessed feel (softened)
export const SPEAKER_INACTIVE_SHADOWS = [
  'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  'inset 0 -32px 48px -16px rgba(0, 0, 0, 0.22)',
  '0 8px 24px -4px rgba(0, 0, 0, 0.22)',
].join(', ')

/**
 * Gradient pill badge styles for premium speaker identification
 * Uses subtle gradient with Apple-inspired desaturated colors
 */
export const SPEAKER_PILL_STYLES: Record<
  TurnSpeaker,
  {
    background: string
    text: string
    border: string
    glow: string
  }
> = {
  for: {
    background: `linear-gradient(135deg, ${APPLE_COLORS.for.rgba(0.14)} 0%, ${APPLE_COLORS.for.rgba(0.04)} 100%)`,
    text: 'hsl(185, 45%, 72%)',
    border: APPLE_COLORS.for.rgba(0.2),
    glow: `0 0 16px ${APPLE_COLORS.for.rgba(0.09)}`,
  },
  against: {
    background: `linear-gradient(135deg, ${APPLE_COLORS.against.rgba(0.14)} 0%, ${APPLE_COLORS.against.rgba(0.04)} 100%)`,
    text: 'hsl(350, 55%, 78%)',
    border: APPLE_COLORS.against.rgba(0.2),
    glow: `0 0 16px ${APPLE_COLORS.against.rgba(0.09)}`,
  },
  moderator: {
    background: `linear-gradient(135deg, ${APPLE_COLORS.moderator.rgba(0.12)} 0%, ${APPLE_COLORS.moderator.rgba(0.03)} 100%)`,
    text: 'hsl(220, 15%, 75%)',
    border: APPLE_COLORS.moderator.rgba(0.16),
    glow: `0 0 16px ${APPLE_COLORS.moderator.rgba(0.07)}`,
  },
}

// Phase/section chip styles - subtle speaker-tinted backgrounds
export const SPEAKER_PHASE_CHIP_STYLES: Record<
  TurnSpeaker,
  {
    background: string
    text: string
    border: string
  }
> = {
  for: {
    background: APPLE_COLORS.for.rgba(0.06),
    text: 'rgb(156, 163, 175)', // gray-400
    border: APPLE_COLORS.for.rgba(0.12),
  },
  against: {
    background: APPLE_COLORS.against.rgba(0.06),
    text: 'rgb(156, 163, 175)', // gray-400
    border: APPLE_COLORS.against.rgba(0.12),
  },
  moderator: {
    background: APPLE_COLORS.moderator.rgba(0.05),
    text: 'rgb(156, 163, 175)', // gray-400
    border: APPLE_COLORS.moderator.rgba(0.1),
  },
}

// Card surface tint per speaker for role differentiation
export const SPEAKER_SURFACE_TINT: Record<
  TurnSpeaker,
  {
    active: string
    inactive: string
  }
> = {
  for: {
    active: APPLE_COLORS.for.rgba(0.025),
    inactive: APPLE_COLORS.for.rgba(0.012),
  },
  against: {
    active: APPLE_COLORS.against.rgba(0.025),
    inactive: APPLE_COLORS.against.rgba(0.012),
  },
  moderator: {
    active: APPLE_COLORS.moderator.rgba(0.02),
    inactive: APPLE_COLORS.moderator.rgba(0.008),
  },
}

// Enhanced gradient for active state - exponential decay for natural light falloff
export const SPEAKER_ACTIVE_GRADIENTS: Record<TurnSpeaker, string> = {
  for: `linear-gradient(90deg,
    ${APPLE_COLORS.for.rgba(0.1)} 0%,
    ${APPLE_COLORS.for.rgba(0.07)} 25px,
    ${APPLE_COLORS.for.rgba(0.04)} 70px,
    ${APPLE_COLORS.for.rgba(0.018)} 130px,
    ${APPLE_COLORS.for.rgba(0.006)} 190px,
    ${APPLE_COLORS.for.rgba(0)} 260px
  )`.replace(/\s+/g, ' '),
  against: `linear-gradient(90deg,
    ${APPLE_COLORS.against.rgba(0.1)} 0%,
    ${APPLE_COLORS.against.rgba(0.07)} 25px,
    ${APPLE_COLORS.against.rgba(0.04)} 70px,
    ${APPLE_COLORS.against.rgba(0.018)} 130px,
    ${APPLE_COLORS.against.rgba(0.006)} 190px,
    ${APPLE_COLORS.against.rgba(0)} 260px
  )`.replace(/\s+/g, ' '),
  moderator: `linear-gradient(90deg,
    ${APPLE_COLORS.moderator.rgba(0.08)} 0%,
    ${APPLE_COLORS.moderator.rgba(0.055)} 25px,
    ${APPLE_COLORS.moderator.rgba(0.03)} 70px,
    ${APPLE_COLORS.moderator.rgba(0.014)} 130px,
    ${APPLE_COLORS.moderator.rgba(0.004)} 190px,
    ${APPLE_COLORS.moderator.rgba(0)} 260px
  )`.replace(/\s+/g, ' '),
}

export function getSpeakerConfig(speaker: TurnSpeaker): SpeakerConfig {
  return SPEAKER_CONFIGS[speaker]
}

const TURN_TYPE_LABELS: Record<string, string> = {
  opening: 'Opening Statement',
  constructive: 'Constructive Argument',
  rebuttal: 'Rebuttal',
  cross_examination: 'Cross-Examination',
  closing: 'Closing Statement',
  moderator_intro: 'Introduction',
  moderator_transition: 'Transition',
  moderator_intervention: 'Intervention',
  moderator_summary: 'Summary',
}

// Short labels for data chips
const TURN_TYPE_SHORT_LABELS: Record<string, string> = {
  opening: 'OPENING',
  constructive: 'CONSTRUCTIVE',
  rebuttal: 'REBUTTAL',
  cross_examination: 'CROSS-EX',
  closing: 'CLOSING',
  moderator_intro: 'INTRO',
  moderator_transition: 'TRANSITION',
  moderator_intervention: 'INTERVENTION',
  moderator_summary: 'SUMMARY',
}

export function getTurnTypeLabel(turnType: string): string {
  return TURN_TYPE_LABELS[turnType] ?? 'Response'
}

export function getTurnTypeShortLabel(turnType: string): string {
  return TURN_TYPE_SHORT_LABELS[turnType] ?? 'RESPONSE'
}
