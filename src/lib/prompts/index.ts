// index.ts
/**
 * Prompt module exports for moderator, debater, judge, and violation detection.
 */

export {
  buildModeratorSystemPrompt,
  FORMAT_SYSTEM_ADDITIONS,
  getFormatDisplayName,
  MODERATOR_SYSTEM_PROMPT,
} from './moderator-system'

export { compileIntroPrompt, INTRO_PROMPT_TEMPLATE } from './intro-prompt'

export { compileTransitionPrompt, TRANSITION_PROMPT_TEMPLATE } from './transition-prompt'

export {
  compileInterventionPrompt,
  getViolationDescription,
  INTERVENTION_PROMPT_TEMPLATE,
  VIOLATION_DESCRIPTIONS,
} from './intervention-prompt'

export { compileSummaryPrompt, SUMMARY_PROMPT_TEMPLATE } from './summary-prompt'

export {
  buildDebaterSystemPrompt,
  buildDebaterTurnPrompt,
  getDebaterTemperature,
} from './debater-prompt'

export {
  buildViolationCheckPrompt,
  getMostSevereTrigger,
  parseViolationResponse,
  shouldIntervene,
  VIOLATION_DETECTION_SYSTEM,
} from './violation-detection'

export { buildRuleValidationPrompt, extractDefaultRuleSummaries } from './rule-validation-prompt'
