// src/lib/speaker-config.ts

import type { SpeakerConfig } from '@/types/debate-ui'
import type { TurnSpeaker } from '@/types/turn'

export const SPEAKER_CONFIGS: Record<TurnSpeaker, SpeakerConfig> = {
  for: {
    label: 'FOR (Affirmative)',
    shortLabel: 'FOR',
    color: 'text-blue-400',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-blue-500',
    icon: 'thumbs-up',
    position: 'left',
    chipBorder: 'border-blue-500/20',
    chipBg: 'bg-blue-500/5',
    glowColor: 'shadow-blue-500/10',
  },
  against: {
    label: 'AGAINST (Negative)',
    shortLabel: 'AGAINST',
    color: 'text-rose-400',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-rose-500',
    icon: 'thumbs-down',
    position: 'right',
    chipBorder: 'border-rose-500/20',
    chipBg: 'bg-rose-500/5',
    glowColor: 'shadow-rose-500/10',
  },
  moderator: {
    label: 'Moderator',
    shortLabel: 'MOD',
    color: 'text-amber-400',
    bgColor: 'bg-white/[0.01]',
    borderColor: 'bg-amber-500',
    icon: 'scale',
    position: 'center',
    chipBorder: 'border-amber-500/20',
    chipBg: 'bg-amber-500/5',
    glowColor: 'shadow-amber-500/10',
  },
}

// Gradient colors for glow bleed effect (light bleeding from neon border)
export const SPEAKER_GRADIENTS: Record<TurnSpeaker, string> = {
  for: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, transparent 120px)',
  against: 'linear-gradient(90deg, rgba(244, 63, 94, 0.08) 0%, transparent 120px)',
  moderator: 'linear-gradient(90deg, rgba(245, 158, 11, 0.08) 0%, transparent 120px)',
}

// Border colors for role badges (used with border-current pattern)
export const SPEAKER_BADGE_COLORS: Record<TurnSpeaker, string> = {
  for: 'text-blue-400 border-blue-400/50 bg-blue-400/10',
  against: 'text-rose-400 border-rose-400/50 bg-rose-400/10',
  moderator: 'text-amber-400 border-amber-400/50 bg-amber-400/10',
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
