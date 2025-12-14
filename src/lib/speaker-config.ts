// speaker-config.ts
/**
 * Apple-inspired material color system for debate speaker differentiation.
 * FOR uses cool teal-blue (rational), AGAINST uses warm amber (grounded), MOD uses neutral silver.
 */

import type { SpeakerConfig } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

export const APPLE_COLORS = {
  for: {
    primary: '#63E6BE', // Electric Mint (visionOS spatial computing)
    secondary: 'hsl(162, 69%, 55%)', // Deeper mint
    highlight: 'hsl(162, 69%, 75%)', // Soft mint highlight
    hsl: 'hsl(162, 69%, 65%)',
    rgb: 'rgb(99, 230, 190)',
    rgba: (alpha: number) => `rgba(99, 230, 190, ${alpha})`,
    rgba2: (alpha: number) => `rgba(79, 210, 170, ${alpha})`,
    glow: 'rgba(99, 230, 190, 0.6)', // Text glow for pills
  },
  against: {
    primary: '#FF6B6B', // Warm Coral (visionOS spatial computing)
    secondary: 'hsl(0, 100%, 61%)', // Deeper coral
    highlight: 'hsl(0, 100%, 81%)', // Soft coral highlight
    hsl: 'hsl(0, 100%, 71%)',
    rgb: 'rgb(255, 107, 107)',
    rgba: (alpha: number) => `rgba(255, 107, 107, ${alpha})`,
    rgba2: (alpha: number) => `rgba(235, 87, 87, ${alpha})`,
    glow: 'rgba(255, 107, 107, 0.6)', // Text glow for pills
  },
  moderator: {
    primary: '#F2F2F7', // Platinum White (visionOS neutral)
    secondary: 'hsl(240, 24%, 90%)', // Deeper platinum
    highlight: 'hsl(240, 24%, 98%)', // Near-white highlight
    hsl: 'hsl(240, 24%, 96%)',
    rgb: 'rgb(242, 242, 247)',
    rgba: (alpha: number) => `rgba(242, 242, 247, ${alpha})`,
    rgba2: (alpha: number) => `rgba(222, 222, 232, ${alpha})`,
    glow: 'rgba(242, 242, 247, 0.5)', // Subtle glow for pills
  },
} as const

export const SPEAKER_CONFIGS: Record<TurnSpeaker, SpeakerConfig> = {
  for: {
    label: 'FOR (Affirmative)',
    shortLabel: 'FOR',
    color: 'text-[#63E6BE]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[#63E6BE]',
    icon: 'thumbs-up',
    position: 'left',
    chipBorder: 'border-[#63E6BE]/30',
    chipBg: 'bg-[#63E6BE]/15',
    glowColor: 'shadow-[#63E6BE]/20',
  },
  against: {
    label: 'AGAINST (Negative)',
    shortLabel: 'AGAINST',
    color: 'text-[#FF6B6B]',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-[#FF6B6B]',
    icon: 'thumbs-down',
    position: 'right',
    chipBorder: 'border-[#FF6B6B]/30',
    chipBg: 'bg-[#FF6B6B]/15',
    glowColor: 'shadow-[#FF6B6B]/20',
  },
  moderator: {
    label: 'Moderator',
    shortLabel: 'MOD',
    color: 'text-[#F2F2F7]',
    bgColor: 'bg-black/[0.1]',
    borderColor: 'bg-[#F2F2F7]',
    icon: 'scale',
    position: 'center',
    chipBorder: 'border-[#F2F2F7]/20',
    chipBg: 'bg-[#F2F2F7]/10',
    glowColor: 'shadow-[#F2F2F7]/10',
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
  for: `text-[#63E6BE] border-[#63E6BE]/35 bg-[#63E6BE]/10`,
  against: `text-[#FF6B6B] border-[#FF6B6B]/35 bg-[#FF6B6B]/10`,
  moderator: `text-[#F2F2F7] border-[#F2F2F7]/35 bg-[#F2F2F7]/10`,
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
    textShadow: string
    innerGlow: string
  }
> = {
  for: {
    background: APPLE_COLORS.for.rgba(0.15),
    text: '#FFFFFF',
    border: APPLE_COLORS.for.rgba(0.3),
    glow: `0 0 10px ${APPLE_COLORS.for.glow}`,
    textShadow: `0 0 10px ${APPLE_COLORS.for.glow}`,
    innerGlow: `inset 0 1px 0 ${APPLE_COLORS.for.rgba(0.35)}`,
  },
  against: {
    background: APPLE_COLORS.against.rgba(0.15),
    text: '#FFFFFF',
    border: APPLE_COLORS.against.rgba(0.3),
    glow: `0 0 12px ${APPLE_COLORS.against.glow}`,
    textShadow: `0 0 8px ${APPLE_COLORS.against.glow}`,
    innerGlow: `inset 0 1px 0 ${APPLE_COLORS.against.rgba(0.35)}`,
  },
  moderator: {
    background: APPLE_COLORS.moderator.rgba(0.1),
    text: '#FFFFFF',
    border: APPLE_COLORS.moderator.rgba(0.2),
    glow: 'none',
    textShadow: 'none',
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
