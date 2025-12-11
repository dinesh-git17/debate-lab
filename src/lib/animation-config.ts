/**
 * src/lib/animation-config.ts
 * Apple-inspired animation configuration for smooth, natural motion
 */

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

  // Easing functions - Apple-inspired curves
  REVEAL_EASING: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  WORD_EASING: 'cubic-bezier(0.25, 0.95, 0.35, 1)', // Apple-style overshoot ease-out

  // Performance
  ANIMATION_CLEANUP_DELAY_MS: 150, // Remove animation classes after completion
  RAF_THROTTLE_MS: 16, // ~60fps target

  // Card entrance animation - Apple-style smooth fade-in
  CARD_ENTRANCE: {
    DURATION_MS: 350, // Snappy for real-time streaming
    TRANSLATE_Y: 8, // pixels - subtle lift
    BLUR_START: 4, // pixels - light blur (less GPU intensive)
    STAGGER_MS: 80, // stagger between cards - for page load cascade
    EASING: [0.16, 1, 0.3, 1] as const, // Apple expo-out (fast start, smooth end)
  },

  // Auto-scroll behavior - cinematic pause + smooth scroll
  AUTO_SCROLL: {
    PAUSE_AFTER_COMPLETE_MS: 400, // Reading time before scrolling to next
    SCROLL_DURATION_MS: 500, // Smooth scroll duration (snappier)
    SCROLL_EASING: [0.25, 0.1, 0.25, 1] as const, // Apple ease-out curve
    LERP_FACTOR: 0.1, // Responsive lerp for streaming follow
    CENTER_OFFSET: 0.35, // Position next card at 35% from top (visual center)
  },

  // Card height expansion
  HEIGHT_TRANSITION: {
    DURATION_MS: 200,
    EASING: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  },
} as const

/**
 * Apple-inspired spring physics configuration
 * Used for card entry, floating effects, and interactive transitions
 */
export const SPRING_CONFIG = {
  // Card entry animation - natural, weighty feel
  card: {
    stiffness: 180,
    damping: 28,
    mass: 1,
  },
  // Quick interactive responses (buttons, pills)
  interactive: {
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  },
  // Gentle floating/breathing effects
  ambient: {
    stiffness: 100,
    damping: 20,
    mass: 1.2,
  },
} as const

/**
 * Entry animation values - capped at 140ms max
 */
export const ENTRY_CONFIG = {
  maxDuration: 140, // ms
  floatDistance: 8, // px - reduced from 24px
  initialScale: 0.98,
  stagger: 80, // ms between sequential elements
} as const

/**
 * Apple-inspired easing curves as numeric arrays for Framer Motion
 */
export const EASING = {
  // Standard Apple ease-out with subtle overshoot
  appleEaseOut: [0.25, 0.95, 0.35, 1] as const,
  // Smooth deceleration
  decelerate: [0.0, 0.0, 0.2, 1] as const,
  // Natural spring-like ease
  spring: [0.34, 1.56, 0.64, 1] as const,
  // Gentle breathing
  breathe: [0.4, 0, 0.6, 1] as const,
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
