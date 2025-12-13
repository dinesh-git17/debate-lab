// speaker-config.ts
/**
 * Apple-inspired luminosity color system for debate speaker differentiation.
 * FOR uses aqua/cyan tones, AGAINST uses lavender/violet, MODERATOR uses silver/indigo.
 */

import type { SpeakerConfig } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

export const APPLE_COLORS = {
  for: {
    primary: 'hsl(187, 72%, 58%)', // Core aqua
    secondary: 'hsl(195, 85%, 48%)', // Deeper cyan
    highlight: 'hsl(180, 65%, 72%)', // Bright highlight
    hsl: 'hsl(187, 72%, 58%)',
    rgb: 'rgb(64, 196, 210)',
    rgba: (alpha: number) => `rgba(64, 196, 210, ${alpha})`,
    rgba2: (alpha: number) => `rgba(32, 164, 210, ${alpha})`,
  },
  against: {
    primary: 'hsl(270, 60%, 65%)', // Core lavender
    secondary: 'hsl(285, 70%, 55%)', // Electric violet
    highlight: 'hsl(260, 55%, 78%)', // Soft highlight
    hsl: 'hsl(270, 60%, 65%)',
    rgb: 'rgb(168, 128, 212)',
    rgba: (alpha: number) => `rgba(168, 128, 212, ${alpha})`,
    rgba2: (alpha: number) => `rgba(190, 100, 210, ${alpha})`,
  },
  moderator: {
    primary: 'hsl(225, 25%, 62%)', // Cool silver-blue
    secondary: 'hsl(230, 30%, 52%)', // Deeper indigo
    highlight: 'hsl(220, 20%, 75%)', // Soft silver highlight
    hsl: 'hsl(225, 25%, 62%)',
    rgb: 'rgb(128, 138, 172)',
    rgba: (alpha: number) => `rgba(128, 138, 172, ${alpha})`,
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

export const SPEAKER_AMBIENT_GLOW: Record<TurnSpeaker, string> = {
  for: `radial-gradient(
    ellipse 140% 120% at 50% 0%,
    rgba(80, 110, 160, 0.08) 0%,
    rgba(70, 100, 150, 0.07) 15%,
    rgba(60, 90, 140, 0.06) 30%,
    rgba(50, 75, 120, 0.04) 45%,
    rgba(40, 60, 100, 0.03) 60%,
    rgba(30, 45, 80, 0.02) 75%,
    rgba(20, 30, 50, 0.01) 88%,
    transparent 100%
  )`.replace(/\s+/g, ' '),
  against: `radial-gradient(
    ellipse 140% 120% at 50% 0%,
    rgba(140, 90, 115, 0.08) 0%,
    rgba(130, 85, 108, 0.07) 15%,
    rgba(115, 75, 95, 0.06) 30%,
    rgba(100, 65, 85, 0.04) 45%,
    rgba(80, 55, 70, 0.03) 60%,
    rgba(60, 40, 55, 0.02) 75%,
    rgba(40, 28, 38, 0.01) 88%,
    transparent 100%
  )`.replace(/\s+/g, ' '),
  moderator: `radial-gradient(
    ellipse 140% 120% at 50% 0%,
    rgba(140, 125, 90, 0.07) 0%,
    rgba(130, 115, 85, 0.06) 15%,
    rgba(115, 100, 75, 0.05) 30%,
    rgba(95, 85, 65, 0.04) 45%,
    rgba(75, 68, 52, 0.03) 60%,
    rgba(55, 50, 40, 0.02) 75%,
    rgba(38, 34, 28, 0.01) 88%,
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
  for: `text-[hsl(187,72%,68%)] border-[hsl(187,72%,58%)]/35 bg-[hsl(187,72%,58%)]/10`,
  against: `text-[hsl(270,60%,75%)] border-[hsl(270,60%,65%)]/35 bg-[hsl(270,60%,65%)]/10`,
  moderator: `text-[hsl(225,25%,72%)] border-[hsl(225,25%,62%)]/35 bg-[hsl(225,25%,62%)]/10`,
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
