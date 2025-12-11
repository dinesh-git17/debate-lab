/**
 * src/lib/speaker-config.ts
 * Apple Thematic Luminosity Color System for speaker differentiation
 * Inspired by VisionOS panels, Apple TV+ atmospheric glow, and Siri waveforms
 */

import type { SpeakerConfig } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

/**
 * Apple Thematic Luminosity Colors
 * These are NOT flat colors - they represent "light" emanating from the interface
 *
 * FOR: Aqua/Cyan - Siri-inspired, calm affirmation
 * AGAINST: Lavender/Violet - Apple Music gradient, passionate opposition
 * MODERATOR: Silver/Indigo - neutral authority, cool professionalism
 */
export const APPLE_COLORS = {
  // Aqua/Cyan - inspired by Siri waveforms and macOS accent colors
  for: {
    primary: 'hsl(187, 72%, 58%)', // Core aqua
    secondary: 'hsl(195, 85%, 48%)', // Deeper cyan
    highlight: 'hsl(180, 65%, 72%)', // Bright highlight
    hsl: 'hsl(187, 72%, 58%)',
    rgb: 'rgb(64, 196, 210)',
    rgba: (alpha: number) => `rgba(64, 196, 210, ${alpha})`,
    // Secondary color for gradients
    rgba2: (alpha: number) => `rgba(32, 164, 210, ${alpha})`,
  },
  // Lavender/Violet - inspired by Apple Music and VisionOS purples
  against: {
    primary: 'hsl(270, 60%, 65%)', // Core lavender
    secondary: 'hsl(285, 70%, 55%)', // Electric violet
    highlight: 'hsl(260, 55%, 78%)', // Soft highlight
    hsl: 'hsl(270, 60%, 65%)',
    rgb: 'rgb(168, 128, 212)',
    rgba: (alpha: number) => `rgba(168, 128, 212, ${alpha})`,
    // Secondary color for gradients
    rgba2: (alpha: number) => `rgba(190, 100, 210, ${alpha})`,
  },
  // Silver/Indigo - neutral authority
  moderator: {
    primary: 'hsl(225, 25%, 62%)', // Cool silver-blue
    secondary: 'hsl(230, 30%, 52%)', // Deeper indigo
    highlight: 'hsl(220, 20%, 75%)', // Soft silver highlight
    hsl: 'hsl(225, 25%, 62%)',
    rgb: 'rgb(128, 138, 172)',
    rgba: (alpha: number) => `rgba(128, 138, 172, ${alpha})`,
    // Secondary color for gradients
    rgba2: (alpha: number) => `rgba(108, 118, 162, ${alpha})`,
  },
} as const

export const SPEAKER_CONFIGS: Record<TurnSpeaker, SpeakerConfig> = {
  for: {
    label: 'FOR (Affirmative)',
    shortLabel: 'FOR',
    color: 'text-[hsl(187,72%,68%)]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[hsl(187,72%,58%)]',
    icon: 'thumbs-up',
    position: 'left',
    chipBorder: 'border-[hsl(187,72%,58%)]/20',
    chipBg: 'bg-[hsl(187,72%,58%)]/5',
    glowColor: 'shadow-[hsl(187,72%,58%)]/10',
  },
  against: {
    label: 'AGAINST (Negative)',
    shortLabel: 'AGAINST',
    color: 'text-[hsl(270,60%,75%)]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[hsl(270,60%,65%)]',
    icon: 'thumbs-down',
    position: 'right',
    chipBorder: 'border-[hsl(270,60%,65%)]/20',
    chipBg: 'bg-[hsl(270,60%,65%)]/5',
    glowColor: 'shadow-[hsl(270,60%,65%)]/10',
  },
  moderator: {
    label: 'Moderator',
    shortLabel: 'MOD',
    color: 'text-[hsl(225,25%,72%)]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[hsl(225,25%,62%)]',
    icon: 'scale',
    position: 'center',
    chipBorder: 'border-[hsl(225,25%,62%)]/20',
    chipBg: 'bg-[hsl(225,25%,62%)]/5',
    glowColor: 'shadow-[hsl(225,25%,62%)]/10',
  },
}

/**
 * Atmospheric Ambient Glow - thematic radial gradient behind the card
 * Each speaker has a subtle identity gradient that tells their story:
 * - FOR: Deep charcoal → midnight blue (analytical, logical)
 * - AGAINST: Deep charcoal → subtle plum/rose (passionate, challenging)
 * - MODERATOR: Deep charcoal → warm amber (balanced, wise)
 * Apple-style: emotionally connected but sophisticated
 */
export const SPEAKER_AMBIENT_GLOW: Record<TurnSpeaker, string> = {
  // FOR: Midnight blue undertone - analytical, logical intelligence (subtle)
  for: `radial-gradient(
    ellipse 120% 100% at 50% 0%,
    rgba(100, 130, 180, 0.10) 0%,
    rgba(60, 80, 120, 0.06) 40%,
    rgba(20, 20, 30, 0.03) 70%,
    transparent 100%
  )`.replace(/\s+/g, ' '),
  // AGAINST: Plum/rose undertone - passionate, challenging perspective (subtle)
  against: `radial-gradient(
    ellipse 120% 100% at 50% 0%,
    rgba(160, 100, 130, 0.10) 0%,
    rgba(100, 60, 80, 0.06) 40%,
    rgba(30, 20, 25, 0.03) 70%,
    transparent 100%
  )`.replace(/\s+/g, ' '),
  // MODERATOR: Warm amber undertone - balanced, wise oversight (subtle)
  moderator: `radial-gradient(
    ellipse 120% 100% at 50% 0%,
    rgba(160, 140, 100, 0.08) 0%,
    rgba(100, 85, 60, 0.04) 40%,
    rgba(30, 25, 20, 0.02) 70%,
    transparent 100%
  )`.replace(/\s+/g, ' '),
}

/**
 * Thematic Luminosity Background - multi-layer gradient system
 * Layer 1: Top highlight (luminous rim)
 * Layer 2: Vertical atmospheric gradient
 * Layer 3: Role-colored tint wash
 */
export const SPEAKER_LUMINOSITY_BACKGROUND: Record<TurnSpeaker, string> = {
  for: `
    linear-gradient(180deg,
      ${APPLE_COLORS.for.rgba(0.06)} 0%,
      ${APPLE_COLORS.for.rgba(0.02)} 15%,
      transparent 40%
    ),
    linear-gradient(180deg,
      rgba(255, 255, 255, 0.03) 0%,
      rgba(255, 255, 255, 0.01) 50%,
      ${APPLE_COLORS.for.rgba(0.015)} 100%
    ),
    radial-gradient(ellipse 120% 80% at 50% -20%,
      ${APPLE_COLORS.for.rgba(0.08)} 0%,
      transparent 60%
    )
  `.replace(/\s+/g, ' '),
  against: `
    linear-gradient(180deg,
      ${APPLE_COLORS.against.rgba(0.06)} 0%,
      ${APPLE_COLORS.against.rgba(0.02)} 15%,
      transparent 40%
    ),
    linear-gradient(180deg,
      rgba(255, 255, 255, 0.03) 0%,
      rgba(255, 255, 255, 0.01) 50%,
      ${APPLE_COLORS.against.rgba(0.015)} 100%
    ),
    radial-gradient(ellipse 120% 80% at 50% -20%,
      ${APPLE_COLORS.against.rgba(0.08)} 0%,
      transparent 60%
    )
  `.replace(/\s+/g, ' '),
  moderator: `
    linear-gradient(180deg,
      ${APPLE_COLORS.moderator.rgba(0.04)} 0%,
      ${APPLE_COLORS.moderator.rgba(0.015)} 15%,
      transparent 40%
    ),
    linear-gradient(180deg,
      rgba(255, 255, 255, 0.025) 0%,
      rgba(255, 255, 255, 0.008) 50%,
      ${APPLE_COLORS.moderator.rgba(0.01)} 100%
    ),
    radial-gradient(ellipse 120% 80% at 50% -20%,
      ${APPLE_COLORS.moderator.rgba(0.06)} 0%,
      transparent 60%
    )
  `.replace(/\s+/g, ' '),
}

/**
 * Specular Edge Rim Light - inner inset shadow creating "device bezel" effect
 * 0.5-1px inset with role color at 25-35% opacity
 */
export const SPEAKER_RIM_LIGHT: Record<TurnSpeaker, string> = {
  for: `
    inset 0 1px 0 ${APPLE_COLORS.for.rgba(0.25)},
    inset 0 0 0 0.5px ${APPLE_COLORS.for.rgba(0.15)},
    inset 0 -1px 0 ${APPLE_COLORS.for.rgba(0.08)}
  `.replace(/\s+/g, ' '),
  against: `
    inset 0 1px 0 ${APPLE_COLORS.against.rgba(0.25)},
    inset 0 0 0 0.5px ${APPLE_COLORS.against.rgba(0.15)},
    inset 0 -1px 0 ${APPLE_COLORS.against.rgba(0.08)}
  `.replace(/\s+/g, ' '),
  moderator: `
    inset 0 1px 0 ${APPLE_COLORS.moderator.rgba(0.2)},
    inset 0 0 0 0.5px ${APPLE_COLORS.moderator.rgba(0.12)},
    inset 0 -1px 0 ${APPLE_COLORS.moderator.rgba(0.06)}
  `.replace(/\s+/g, ' '),
}

// Legacy gradient for side glow bleed effect
export const SPEAKER_GRADIENTS: Record<TurnSpeaker, string> = {
  for: `linear-gradient(90deg, ${APPLE_COLORS.for.rgba(0.08)} 0%, transparent 150px)`,
  against: `linear-gradient(90deg, ${APPLE_COLORS.against.rgba(0.08)} 0%, transparent 150px)`,
  moderator: `linear-gradient(90deg, ${APPLE_COLORS.moderator.rgba(0.06)} 0%, transparent 150px)`,
}

// Border colors for role badges
export const SPEAKER_BADGE_COLORS: Record<TurnSpeaker, string> = {
  for: `text-[hsl(187,72%,68%)] border-[hsl(187,72%,58%)]/35 bg-[hsl(187,72%,58%)]/10`,
  against: `text-[hsl(270,60%,75%)] border-[hsl(270,60%,65%)]/35 bg-[hsl(270,60%,65%)]/10`,
  moderator: `text-[hsl(225,25%,72%)] border-[hsl(225,25%,62%)]/35 bg-[hsl(225,25%,62%)]/10`,
}

/**
 * 3D floating card shadows with role-colored atmospheric glow
 * Enhanced with thematic luminosity
 */
export const SPEAKER_ACTIVE_SHADOWS: Record<TurnSpeaker, string> = {
  for: [
    // Specular rim light
    `inset 0 1px 0 ${APPLE_COLORS.for.rgba(0.3)}`,
    'inset 1px 0 0 rgba(255, 255, 255, 0.05)',
    // Inner depth
    'inset 0 -48px 48px -24px rgba(0, 0, 0, 0.25)',
    // Contact shadow
    '0 1px 2px rgba(0, 0, 0, 0.18)',
    // Role-colored atmospheric glow (enhanced)
    `0 0 48px ${APPLE_COLORS.for.rgba(0.12)}`,
    `0 0 96px ${APPLE_COLORS.for.rgba(0.06)}`,
    // Elevation shadows
    '0 16px 32px -8px rgba(0, 0, 0, 0.32)',
    '0 40px 48px -16px rgba(0, 0, 0, 0.25)',
  ].join(', '),
  against: [
    `inset 0 1px 0 ${APPLE_COLORS.against.rgba(0.3)}`,
    'inset 1px 0 0 rgba(255, 255, 255, 0.05)',
    'inset 0 -48px 48px -24px rgba(0, 0, 0, 0.25)',
    '0 1px 2px rgba(0, 0, 0, 0.18)',
    `0 0 48px ${APPLE_COLORS.against.rgba(0.12)}`,
    `0 0 96px ${APPLE_COLORS.against.rgba(0.06)}`,
    '0 16px 32px -8px rgba(0, 0, 0, 0.32)',
    '0 40px 48px -16px rgba(0, 0, 0, 0.25)',
  ].join(', '),
  moderator: [
    `inset 0 1px 0 ${APPLE_COLORS.moderator.rgba(0.25)}`,
    'inset 1px 0 0 rgba(255, 255, 255, 0.04)',
    'inset 0 -48px 48px -24px rgba(0, 0, 0, 0.25)',
    '0 1px 2px rgba(0, 0, 0, 0.18)',
    `0 0 40px ${APPLE_COLORS.moderator.rgba(0.08)}`,
    `0 0 80px ${APPLE_COLORS.moderator.rgba(0.04)}`,
    '0 16px 32px -8px rgba(0, 0, 0, 0.32)',
    '0 40px 48px -16px rgba(0, 0, 0, 0.25)',
  ].join(', '),
}

// Inactive card shadows
export const SPEAKER_INACTIVE_SHADOWS = [
  'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  'inset 0 -32px 48px -16px rgba(0, 0, 0, 0.2)',
  '0 8px 24px -4px rgba(0, 0, 0, 0.2)',
].join(', ')

/**
 * Luminous pill badge styles - Vision Pro floating label aesthetic
 * Inner glow + translucent luminous background
 */
export const SPEAKER_PILL_STYLES: Record<
  TurnSpeaker,
  {
    background: string
    text: string
    border: string
    glow: string
    innerGlow: string
  }
> = {
  for: {
    background: `linear-gradient(135deg,
      ${APPLE_COLORS.for.rgba(0.18)} 0%,
      ${APPLE_COLORS.for.rgba(0.08)} 50%,
      ${APPLE_COLORS.for.rgba(0.12)} 100%
    )`.replace(/\s+/g, ' '),
    text: APPLE_COLORS.for.highlight,
    border: APPLE_COLORS.for.rgba(0.25),
    glow: `0 0 20px ${APPLE_COLORS.for.rgba(0.15)}, 0 0 40px ${APPLE_COLORS.for.rgba(0.08)}`,
    innerGlow: `inset 0 1px 0 ${APPLE_COLORS.for.rgba(0.35)}, inset 0 0 8px ${APPLE_COLORS.for.rgba(0.1)}`,
  },
  against: {
    background: `linear-gradient(135deg,
      ${APPLE_COLORS.against.rgba(0.18)} 0%,
      ${APPLE_COLORS.against.rgba(0.08)} 50%,
      ${APPLE_COLORS.against.rgba(0.12)} 100%
    )`.replace(/\s+/g, ' '),
    text: APPLE_COLORS.against.highlight,
    border: APPLE_COLORS.against.rgba(0.25),
    glow: `0 0 20px ${APPLE_COLORS.against.rgba(0.15)}, 0 0 40px ${APPLE_COLORS.against.rgba(0.08)}`,
    innerGlow: `inset 0 1px 0 ${APPLE_COLORS.against.rgba(0.35)}, inset 0 0 8px ${APPLE_COLORS.against.rgba(0.1)}`,
  },
  moderator: {
    background: `linear-gradient(135deg,
      ${APPLE_COLORS.moderator.rgba(0.15)} 0%,
      ${APPLE_COLORS.moderator.rgba(0.06)} 50%,
      ${APPLE_COLORS.moderator.rgba(0.1)} 100%
    )`.replace(/\s+/g, ' '),
    text: APPLE_COLORS.moderator.highlight,
    border: APPLE_COLORS.moderator.rgba(0.2),
    glow: `0 0 16px ${APPLE_COLORS.moderator.rgba(0.1)}, 0 0 32px ${APPLE_COLORS.moderator.rgba(0.05)}`,
    innerGlow: `inset 0 1px 0 ${APPLE_COLORS.moderator.rgba(0.3)}, inset 0 0 8px ${APPLE_COLORS.moderator.rgba(0.08)}`,
  },
}

// Phase/section chip styles with luminous tint
export const SPEAKER_PHASE_CHIP_STYLES: Record<
  TurnSpeaker,
  {
    background: string
    text: string
    border: string
  }
> = {
  for: {
    background: APPLE_COLORS.for.rgba(0.08),
    text: APPLE_COLORS.for.highlight,
    border: APPLE_COLORS.for.rgba(0.15),
  },
  against: {
    background: APPLE_COLORS.against.rgba(0.08),
    text: APPLE_COLORS.against.highlight,
    border: APPLE_COLORS.against.rgba(0.15),
  },
  moderator: {
    background: APPLE_COLORS.moderator.rgba(0.06),
    text: APPLE_COLORS.moderator.highlight,
    border: APPLE_COLORS.moderator.rgba(0.12),
  },
}

// Card surface tint - luminous wash over the frosted glass
export const SPEAKER_SURFACE_TINT: Record<
  TurnSpeaker,
  {
    active: string
    inactive: string
  }
> = {
  for: {
    active: APPLE_COLORS.for.rgba(0.04),
    inactive: APPLE_COLORS.for.rgba(0.015),
  },
  against: {
    active: APPLE_COLORS.against.rgba(0.04),
    inactive: APPLE_COLORS.against.rgba(0.015),
  },
  moderator: {
    active: APPLE_COLORS.moderator.rgba(0.03),
    inactive: APPLE_COLORS.moderator.rgba(0.01),
  },
}

// Enhanced gradient for active state with exponential luminosity decay
export const SPEAKER_ACTIVE_GRADIENTS: Record<TurnSpeaker, string> = {
  for: `linear-gradient(90deg,
    ${APPLE_COLORS.for.rgba(0.14)} 0%,
    ${APPLE_COLORS.for.rgba(0.09)} 25px,
    ${APPLE_COLORS.for.rgba(0.05)} 70px,
    ${APPLE_COLORS.for.rgba(0.025)} 130px,
    ${APPLE_COLORS.for.rgba(0.01)} 200px,
    ${APPLE_COLORS.for.rgba(0)} 280px
  )`.replace(/\s+/g, ' '),
  against: `linear-gradient(90deg,
    ${APPLE_COLORS.against.rgba(0.14)} 0%,
    ${APPLE_COLORS.against.rgba(0.09)} 25px,
    ${APPLE_COLORS.against.rgba(0.05)} 70px,
    ${APPLE_COLORS.against.rgba(0.025)} 130px,
    ${APPLE_COLORS.against.rgba(0.01)} 200px,
    ${APPLE_COLORS.against.rgba(0)} 280px
  )`.replace(/\s+/g, ' '),
  moderator: `linear-gradient(90deg,
    ${APPLE_COLORS.moderator.rgba(0.1)} 0%,
    ${APPLE_COLORS.moderator.rgba(0.065)} 25px,
    ${APPLE_COLORS.moderator.rgba(0.035)} 70px,
    ${APPLE_COLORS.moderator.rgba(0.018)} 130px,
    ${APPLE_COLORS.moderator.rgba(0.006)} 200px,
    ${APPLE_COLORS.moderator.rgba(0)} 280px
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
