// e2e/types/index.ts
// E2E test type definitions

import type { Page, BrowserContext, Locator } from '@playwright/test'

export interface TestUser {
  sessionId: string
  preferences?: {
    theme: 'light' | 'dark' | 'system'
    reducedMotion: boolean
  }
}

export interface DebateConfig {
  topic: string
  turns: number
  format: 'standard' | 'oxford' | 'lincoln-douglas'
  customRules?: string[]
  enableScoring?: boolean
}

export interface DebateMessage {
  role: 'for' | 'against' | 'moderator'
  content: string
  turnNumber: number
}

export interface PageMetrics {
  loadTime: number
  domContentLoaded: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  timeToInteractive: number
}

export interface AccessibilityViolation {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  nodes: number
}

export interface VisualDiff {
  name: string
  diffPercentage: number
  passed: boolean
}

export interface TestContext {
  page: Page
  context: BrowserContext
  baseURL: string
  isMobile: boolean
  browserName: string
}

export interface DebatePageLocators {
  topicInput: Locator
  turnsSelector: Locator
  formatSelector: Locator
  customRulesToggle: Locator
  customRuleInput: Locator
  addRuleButton: Locator
  startDebateButton: Locator
  messageList: Locator
  messageItem: Locator
  endDebateButton: Locator
  exportButton: Locator
  shareButton: Locator
}

export interface NavigationLocators {
  homeLink: Locator
  howItWorksLink: Locator
  aboutLink: Locator
  startDebateButton: Locator
  themeToggle: Locator
}

export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

export interface ViewportConfig {
  width: number
  height: number
  deviceScaleFactor?: number
  isMobile?: boolean
  hasTouch?: boolean
}

export const VIEWPORTS: Record<ViewportSize, ViewportConfig> = {
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
  tablet: { width: 768, height: 1024, isMobile: false, hasTouch: true },
  desktop: { width: 1280, height: 720, isMobile: false, hasTouch: false },
}
