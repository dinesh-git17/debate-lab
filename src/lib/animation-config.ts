// src/lib/animation-config.ts

/**
 * Shared animation configuration constants for the streaming text animation system.
 * Provides consistent timing across all reveal and thinking animations.
 */

export const ANIMATION_CONFIG = {
  // Speed governor - character reveal velocity
  // Target: ~250 WPM - fast reading speed
  // 250 WPM ≈ 25 chars/sec (assuming 6 chars per word including space)
  CHARS_PER_SECOND: 25, // ~250 WPM - fast reading pace
  MIN_CHARS_PER_SECOND: 16, // ~160 WPM when buffer is low
  MAX_CHARS_PER_SECOND: 38, // ~380 WPM max when catching up

  // Debater thinking delay - pause before debaters start speaking
  DEBATER_THINKING_DELAY_MS: 3000, // ms - natural pause for debaters (not moderator)

  // Buffer thresholds for adaptive speed
  LOW_BUFFER_THRESHOLD: 50, // chars - slow down below this
  HIGH_BUFFER_THRESHOLD: 200, // chars - speed up above this

  // Word animations - micro-animations for newly revealed words
  WORD_FADE_DURATION_MS: 120,
  WORD_STAGGER_MS: 35,
  WORD_TRANSLATE_Y: 4, // pixels
  WORD_BLUR_START: 2, // pixels

  // Thinking indicator - rotating words
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

  // Easing functions
  REVEAL_EASING: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  WORD_EASING: 'cubic-bezier(0.16, 1, 0.3, 1)', // Apple-style ease-out

  // Performance
  ANIMATION_CLEANUP_DELAY_MS: 150, // Remove animation classes after completion
  RAF_THROTTLE_MS: 16, // ~60fps target
} as const

export type ThinkingWord = (typeof ANIMATION_CONFIG.THINKING_WORDS)[number]

/**
 * Speaker color configurations for animations
 */
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
