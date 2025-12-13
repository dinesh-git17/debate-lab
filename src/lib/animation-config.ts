// animation-config.ts
/**
 * Animation configuration for streaming text and UI transitions.
 * Defines timing, easing curves, and spring physics for consistent motion design.
 */

export const ANIMATION_CONFIG = {
  // Character reveal speed (WPM = words per minute, assuming 6 chars/word)
  CHARS_PER_SECOND: 25,
  MIN_CHARS_PER_SECOND: 16,
  MAX_CHARS_PER_SECOND: 38,

  DEBATER_THINKING_DELAY_MS: 3000,

  // Adaptive speed buffer thresholds (character count)
  LOW_BUFFER_THRESHOLD: 50,
  HIGH_BUFFER_THRESHOLD: 200,

  // Word micro-animation parameters
  WORD_FADE_DURATION_MS: 120,
  WORD_STAGGER_MS: 35,
  WORD_TRANSLATE_Y: 4,
  WORD_BLUR_START: 2,

  THINKING_WORDS: [
    'Contemplating',
    'Analyzing',
    'Considering',
    'Weighing',
    'Examining',
    'Deliberating',
    'Evaluating',
    'Reasoning',
    'Reflecting',
    'Pondering',
    'Formulating',
    'Synthesizing',
    'Assessing',
    'Processing',
    'Composing',
  ] as const,
  WORD_ROTATE_INTERVAL_MS: 2000,
  WORD_CROSSFADE_MS: 300,

  REVEAL_EASING: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  WORD_EASING: 'cubic-bezier(0.25, 0.95, 0.35, 1)',

  ANIMATION_CLEANUP_DELAY_MS: 150,
  RAF_THROTTLE_MS: 16,

  CARD_ENTRANCE: {
    DURATION_MS: 350,
    TRANSLATE_Y: 8,
    BLUR_START: 4,
    STAGGER_MS: 80,
    EASING: [0.16, 1, 0.3, 1] as const,
  },

  AUTO_SCROLL: {
    PAUSE_AFTER_COMPLETE_MS: 400,
    SCROLL_DURATION_MS: 500,
    SCROLL_EASING: [0.25, 0.1, 0.25, 1] as const,
    LERP_FACTOR: 0.1,
    CENTER_OFFSET: 0.35,
  },

  HEIGHT_TRANSITION: {
    DURATION_MS: 200,
    EASING: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  },
} as const

/** Spring physics presets for different animation contexts. */
export const SPRING_CONFIG = {
  card: {
    stiffness: 180,
    damping: 28,
    mass: 1,
  },
  interactive: {
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  },
  ambient: {
    stiffness: 100,
    damping: 20,
    mass: 1.2,
  },
} as const

/** Entry animation constraints for initial element appearance. */
export const ENTRY_CONFIG = {
  maxDuration: 140,
  floatDistance: 8,
  initialScale: 0.98,
  stagger: 80,
} as const

/** Cubic bezier easing curves as numeric arrays for Framer Motion. */
export const EASING = {
  appleEaseOut: [0.25, 0.95, 0.35, 1] as const,
  decelerate: [0.0, 0.0, 0.2, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
  breathe: [0.4, 0, 0.6, 1] as const,
} as const

export type ThinkingWord = (typeof ANIMATION_CONFIG.THINKING_WORDS)[number]

/** Speaker-specific color classes for animation styling. */
export const SPEAKER_ANIMATION_COLORS = {
  for: {
    spinner: 'border-blue-400',
    text: 'text-blue-400',
    glow: 'shadow-blue-400/20',
  },
  against: {
    spinner: 'border-rose-400',
    text: 'text-rose-400',
    glow: 'shadow-rose-400/20',
  },
  moderator: {
    spinner: 'border-amber-400',
    text: 'text-amber-400',
    glow: 'shadow-amber-400/20',
  },
} as const

export type SpeakerType = keyof typeof SPEAKER_ANIMATION_COLORS
