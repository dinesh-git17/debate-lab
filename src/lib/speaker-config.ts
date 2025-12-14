// speaker-config.ts
/**
 * Apple-inspired material color system for debate speaker differentiation.
 * FOR uses cool teal-blue (rational), AGAINST uses warm amber (grounded), MOD uses neutral silver.
 */

import type { SpeakerConfig } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

export const APPLE_COLORS = {
  for: {
    primary: 'hsl(192, 45%, 52%)', // Cool teal-blue (iOS system accent)
    secondary: 'hsl(195, 50%, 45%)', // Deeper teal
    highlight: 'hsl(190, 38%, 68%)', // Soft teal highlight
    hsl: 'hsl(192, 45%, 52%)',
    rgb: 'rgb(73, 148, 164)',
    rgba: (alpha: number) => `rgba(73, 148, 164, ${alpha})`,
    rgba2: (alpha: number) => `rgba(58, 138, 158, ${alpha})`,
  },
  against: {
    primary: 'hsl(25, 50%, 52%)', // Warm amber/terracotta (grounded, skeptical)
    secondary: 'hsl(20, 55%, 45%)', // Deeper rust
    highlight: 'hsl(28, 42%, 68%)', // Soft peach highlight
    hsl: 'hsl(25, 50%, 52%)',
    rgb: 'rgb(184, 128, 92)',
    rgba: (alpha: number) => `rgba(184, 128, 92, ${alpha})`,
    rgba2: (alpha: number) => `rgba(176, 112, 74, ${alpha})`,
  },
  moderator: {
    primary: 'hsl(220, 12%, 58%)', // True neutral silver
    secondary: 'hsl(222, 15%, 48%)', // Deeper slate
    highlight: 'hsl(218, 10%, 72%)', // Soft silver highlight
    hsl: 'hsl(220, 12%, 58%)',
    rgb: 'rgb(133, 139, 156)',
    rgba: (alpha: number) => `rgba(133, 139, 156, ${alpha})`,
    rgba2: (alpha: number) => `rgba(113, 119, 140, ${alpha})`,
  },
} as const

export const SPEAKER_CONFIGS: Record<TurnSpeaker, SpeakerConfig> = {
  for: {
    label: 'FOR (Affirmative)',
    shortLabel: 'FOR',
    color: 'text-[hsl(190,38%,68%)]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[hsl(192,45%,52%)]',
    icon: 'thumbs-up',
    position: 'left',
    chipBorder: 'border-[hsl(192,45%,52%)]/20',
    chipBg: 'bg-[hsl(192,45%,52%)]/5',
    glowColor: 'shadow-[hsl(192,45%,52%)]/10',
  },
  against: {
    label: 'AGAINST (Negative)',
    shortLabel: 'AGAINST',
    color: 'text-[hsl(28,42%,68%)]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[hsl(25,50%,52%)]',
    icon: 'thumbs-down',
    position: 'right',
    chipBorder: 'border-[hsl(25,50%,52%)]/20',
    chipBg: 'bg-[hsl(25,50%,52%)]/5',
    glowColor: 'shadow-[hsl(25,50%,52%)]/10',
  },
  moderator: {
    label: 'Moderator',
    shortLabel: 'MOD',
    color: 'text-[hsl(218,10%,72%)]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[hsl(220,12%,58%)]',
    icon: 'scale',
    position: 'center',
    chipBorder: 'border-[hsl(220,12%,58%)]/20',
    chipBg: 'bg-[hsl(220,12%,58%)]/5',
    glowColor: 'shadow-[hsl(220,12%,58%)]/10',
  },
}

export const SPEAKER_AMBIENT_GLOW: Record<TurnSpeaker, string> = {
  for: `radial-gradient(
    ellipse 140% 120% at 50% 0%,
    rgba(73, 148, 164, 0.07) 0%,
    rgba(68, 140, 156, 0.06) 15%,
    rgba(62, 130, 145, 0.05) 30%,
    rgba(55, 115, 130, 0.035) 45%,
    rgba(45, 100, 115, 0.025) 60%,
    rgba(35, 80, 95, 0.015) 75%,
    rgba(25, 60, 75, 0.008) 88%,
    transparent 100%
  )`.replace(/\s+/g, ' '),
  against: `radial-gradient(
    ellipse 140% 120% at 50% 0%,
    rgba(184, 128, 92, 0.07) 0%,
    rgba(175, 120, 85, 0.06) 15%,
    rgba(160, 110, 78, 0.05) 30%,
    rgba(145, 98, 70, 0.035) 45%,
    rgba(125, 85, 60, 0.025) 60%,
    rgba(100, 68, 48, 0.015) 75%,
    rgba(75, 52, 38, 0.008) 88%,
    transparent 100%
  )`.replace(/\s+/g, ' '),
  moderator: `radial-gradient(
    ellipse 140% 120% at 50% 0%,
    rgba(133, 139, 156, 0.06) 0%,
    rgba(125, 130, 148, 0.05) 15%,
    rgba(115, 120, 138, 0.04) 30%,
    rgba(100, 105, 122, 0.03) 45%,
    rgba(85, 90, 105, 0.02) 60%,
    rgba(70, 75, 88, 0.012) 75%,
    rgba(55, 58, 68, 0.006) 88%,
    transparent 100%
  )`.replace(/\s+/g, ' '),
}

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

export const SPEAKER_GRADIENTS: Record<TurnSpeaker, string> = {
  for: `linear-gradient(90deg, ${APPLE_COLORS.for.rgba(0.08)} 0%, transparent 150px)`,
  against: `linear-gradient(90deg, ${APPLE_COLORS.against.rgba(0.08)} 0%, transparent 150px)`,
  moderator: `linear-gradient(90deg, ${APPLE_COLORS.moderator.rgba(0.06)} 0%, transparent 150px)`,
}

export const SPEAKER_BADGE_COLORS: Record<TurnSpeaker, string> = {
  for: `text-[hsl(190,38%,68%)] border-[hsl(192,45%,52%)]/35 bg-[hsl(192,45%,52%)]/10`,
  against: `text-[hsl(28,42%,68%)] border-[hsl(25,50%,52%)]/35 bg-[hsl(25,50%,52%)]/10`,
  moderator: `text-[hsl(218,10%,72%)] border-[hsl(220,12%,58%)]/35 bg-[hsl(220,12%,58%)]/10`,
}

export const SPEAKER_ACTIVE_SHADOWS: Record<TurnSpeaker, string> = {
  for: [
    `inset 0 1px 0 ${APPLE_COLORS.for.rgba(0.3)}`,
    'inset 1px 0 0 rgba(255, 255, 255, 0.05)',
    '0 1px 2px rgba(0, 0, 0, 0.18)',
    '0 16px 32px -8px rgba(0, 0, 0, 0.32)',
    '0 40px 48px -16px rgba(0, 0, 0, 0.25)',
  ].join(', '),
  against: [
    `inset 0 1px 0 ${APPLE_COLORS.against.rgba(0.3)}`,
    'inset 1px 0 0 rgba(255, 255, 255, 0.05)',
    '0 1px 2px rgba(0, 0, 0, 0.18)',
    '0 16px 32px -8px rgba(0, 0, 0, 0.32)',
    '0 40px 48px -16px rgba(0, 0, 0, 0.25)',
  ].join(', '),
  moderator: [
    `inset 0 1px 0 ${APPLE_COLORS.moderator.rgba(0.25)}`,
    'inset 1px 0 0 rgba(255, 255, 255, 0.04)',
    '0 1px 2px rgba(0, 0, 0, 0.18)',
    '0 16px 32px -8px rgba(0, 0, 0, 0.32)',
    '0 40px 48px -16px rgba(0, 0, 0, 0.25)',
  ].join(', '),
}

export const SPEAKER_INACTIVE_SHADOWS = [
  'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  '0 8px 24px -4px rgba(0, 0, 0, 0.2)',
].join(', ')

export const SPEAKER_COMPLETED_SHADOWS: Record<TurnSpeaker, string> = {
  for: [
    `inset 0 1px 0 ${APPLE_COLORS.for.rgba(0.15)}`,
    'inset 1px 0 0 rgba(255, 255, 255, 0.03)',
    '0 1px 2px rgba(0, 0, 0, 0.12)',
    '0 8px 20px -6px rgba(0, 0, 0, 0.22)',
  ].join(', '),
  against: [
    `inset 0 1px 0 ${APPLE_COLORS.against.rgba(0.15)}`,
    'inset 1px 0 0 rgba(255, 255, 255, 0.03)',
    '0 1px 2px rgba(0, 0, 0, 0.12)',
    '0 8px 20px -6px rgba(0, 0, 0, 0.22)',
  ].join(', '),
  moderator: [
    `inset 0 1px 0 ${APPLE_COLORS.moderator.rgba(0.12)}`,
    'inset 1px 0 0 rgba(255, 255, 255, 0.025)',
    '0 1px 2px rgba(0, 0, 0, 0.12)',
    '0 8px 20px -6px rgba(0, 0, 0, 0.22)',
  ].join(', '),
}

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
    glow: 'none',
    innerGlow: `inset 0 1px 0 ${APPLE_COLORS.for.rgba(0.35)}`,
  },
  against: {
    background: `linear-gradient(135deg,
      ${APPLE_COLORS.against.rgba(0.18)} 0%,
      ${APPLE_COLORS.against.rgba(0.08)} 50%,
      ${APPLE_COLORS.against.rgba(0.12)} 100%
    )`.replace(/\s+/g, ' '),
    text: APPLE_COLORS.against.highlight,
    border: APPLE_COLORS.against.rgba(0.25),
    glow: 'none',
    innerGlow: `inset 0 1px 0 ${APPLE_COLORS.against.rgba(0.35)}`,
  },
  moderator: {
    background: `linear-gradient(135deg,
      ${APPLE_COLORS.moderator.rgba(0.15)} 0%,
      ${APPLE_COLORS.moderator.rgba(0.06)} 50%,
      ${APPLE_COLORS.moderator.rgba(0.1)} 100%
    )`.replace(/\s+/g, ' '),
    text: APPLE_COLORS.moderator.highlight,
    border: APPLE_COLORS.moderator.rgba(0.2),
    glow: 'none',
    innerGlow: `inset 0 1px 0 ${APPLE_COLORS.moderator.rgba(0.3)}`,
  },
}

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
