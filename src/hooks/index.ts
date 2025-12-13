// index.ts
/**
 * Public API for custom React hooks.
 * Re-exports hooks for debate management, animations, and UI utilities.
 */

export { useDebate } from './use-debate'
export { useDebateMessages } from './use-debate-messages'
export { useCreateDebate } from './use-create-debate'
export {
  useDebouncedState,
  useDebouncedCallback,
  useThrottledState,
  useTransitionState,
  useDeferredUpdate,
} from './use-debounced-state'
export {
  useIntersectionObserver,
  useLazyLoad,
  useElementVisibility,
  usePrefetchOnVisible,
} from './use-intersection-observer'
export { useInView } from './use-in-view'
export { useAnimatedText, useIsAnimating } from './use-animated-text'
export { useMediaQuery, useIsMobile } from './use-media-query'
