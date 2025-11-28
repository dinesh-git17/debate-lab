// e2e/fixtures/base.ts
// Base test fixtures and page object models

import AxeBuilder from '@axe-core/playwright'
import { test as base, expect, type Page, type Locator } from '@playwright/test'

import type { DebateConfig, PageMetrics, AccessibilityViolation } from '../types'

export interface TestFixtures {
  homePage: HomePage
  debateConfigPage: DebateConfigPage
  debatePage: DebatePage
  summaryPage: SummaryPage
  axeBuilder: AxeBuilder
}

export class BasePage {
  readonly page: Page
  readonly header: Locator
  readonly footer: Locator
  readonly themeToggle: Locator
  readonly skipLink: Locator

  constructor(page: Page) {
    this.page = page
    this.header = page.locator('header')
    this.footer = page.locator('footer')
    // ThemeToggle uses aria-label with "Switch to light/dark theme"
    this.themeToggle = page.getByRole('button', { name: /switch to (light|dark) theme/i })
    this.skipLink = page.getByRole('link', { name: /skip to content/i })
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path)
    await this.page.waitForLoadState('networkidle')
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded')
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click()
  }

  async getTheme(): Promise<'light' | 'dark'> {
    const html = this.page.locator('html')
    const classList = await html.getAttribute('class')
    return classList?.includes('dark') ? 'dark' : 'light'
  }

  async getPageMetrics(): Promise<PageMetrics> {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      const fcp = paint.find((p) => p.name === 'first-contentful-paint')

      return {
        loadTime: navigation?.loadEventEnd - navigation?.startTime || 0,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.startTime || 0,
        firstContentfulPaint: fcp?.startTime || 0,
        largestContentfulPaint: 0,
        timeToInteractive: navigation?.domInteractive - navigation?.startTime || 0,
      }
    })

    return metrics
  }

  async checkAccessibility(): Promise<AccessibilityViolation[]> {
    const results = await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    return results.violations.map((v) => ({
      id: v.id,
      impact: v.impact as AccessibilityViolation['impact'],
      description: v.description,
      nodes: v.nodes.length,
    }))
  }
}

export class HomePage extends BasePage {
  readonly heroTitle: Locator
  readonly heroSubtitle: Locator
  readonly startDebateButton: Locator
  readonly howItWorksLink: Locator
  readonly featuresSection: Locator

  constructor(page: Page) {
    super(page)
    this.heroTitle = page.getByRole('heading', { level: 1 })
    this.heroSubtitle = page.locator('p').filter({ hasText: /Pick any topic/ })
    // Hero section has "Start a Debate" button
    this.startDebateButton = page.getByRole('link', { name: /start a debate/i }).first()
    this.howItWorksLink = page.getByRole('link', { name: /how it works/i }).first()
    this.featuresSection = page.locator('section').filter({ hasText: /features/i })
  }

  async goto(): Promise<void> {
    await super.goto('/')
  }

  async clickStartDebate(): Promise<void> {
    await this.startDebateButton.click()
    await this.page.waitForURL('**/debate/new')
  }

  async clickHowItWorks(): Promise<void> {
    await this.howItWorksLink.click()
    await this.page.waitForURL('**/how-it-works')
  }
}

export class DebateConfigPage extends BasePage {
  readonly topicInput: Locator
  readonly turnsRadioGroup: Locator
  readonly formatSelect: Locator
  readonly customRulesToggle: Locator
  readonly customRuleInput: Locator
  readonly addRuleButton: Locator
  readonly rulesList: Locator
  readonly startButton: Locator
  readonly resetButton: Locator
  readonly topicError: Locator
  readonly charCount: Locator

  constructor(page: Page) {
    super(page)
    // Match the actual form structure from debate-form.tsx
    this.topicInput = page.getByLabel(/debate topic/i)
    this.turnsRadioGroup = page.getByRole('radiogroup')
    this.formatSelect = page.getByLabel(/debate format/i)
    this.customRulesToggle = page.getByRole('button', { name: /add custom rules/i })
    this.customRuleInput = page.getByPlaceholder(/add a rule/i)
    this.addRuleButton = page.getByRole('button', { name: /add/i }).first()
    this.rulesList = page.locator('[role="list"]')
    this.startButton = page.getByRole('button', { name: /start debate/i })
    this.resetButton = page.getByRole('button', { name: /reset/i })
    this.topicError = page.locator('[id*="error"]').first()
    this.charCount = page.locator('text=/\\d+\\s*\\/\\s*500/')
  }

  async goto(): Promise<void> {
    await super.goto('/debate/new')
  }

  async fillTopic(topic: string): Promise<void> {
    await this.topicInput.fill(topic)
  }

  async selectTurns(turns: number): Promise<void> {
    await this.page.getByLabel(`${turns}`, { exact: false }).check()
  }

  async selectFormat(format: string): Promise<void> {
    await this.formatSelect.selectOption(format)
  }

  async addCustomRule(rule: string): Promise<void> {
    // First expand the custom rules section if needed
    const isExpanded = await this.customRulesToggle.getAttribute('aria-expanded')
    if (isExpanded !== 'true') {
      await this.customRulesToggle.click()
    }
    await this.customRuleInput.fill(rule)
    await this.addRuleButton.click()
  }

  async configureDebate(config: DebateConfig): Promise<void> {
    await this.fillTopic(config.topic)
    await this.selectTurns(config.turns)
    await this.selectFormat(config.format)

    if (config.customRules) {
      for (const rule of config.customRules) {
        await this.addCustomRule(rule)
      }
    }
  }

  async submitAndWait(): Promise<string> {
    await this.startButton.click()
    await this.page.waitForURL('**/debate/*', { timeout: 15000 })
    const url = this.page.url()
    const debateId = url.split('/debate/')[1]?.split('/')[0] ?? ''
    return debateId
  }

  async getTopicError(): Promise<string | null> {
    try {
      await this.topicError.waitFor({ state: 'visible', timeout: 2000 })
      return this.topicError.textContent()
    } catch {
      return null
    }
  }
}

export class DebatePage extends BasePage {
  readonly messageList: Locator
  readonly messageItems: Locator
  readonly loadingIndicator: Locator
  readonly endDebateButton: Locator
  readonly exportButton: Locator
  readonly shareButton: Locator
  readonly turnIndicator: Locator
  readonly tokenCounter: Locator

  constructor(page: Page) {
    super(page)
    this.messageList = page.locator('[data-testid="message-list"]')
    this.messageItems = page.locator('[data-testid="message-item"]')
    this.loadingIndicator = page.locator('[data-testid="loading-indicator"]')
    this.endDebateButton = page.getByRole('button', { name: /end debate/i })
    this.exportButton = page.getByRole('button', { name: /export/i })
    this.shareButton = page.getByRole('button', { name: /share/i })
    this.turnIndicator = page.locator('[data-testid="turn-indicator"]')
    this.tokenCounter = page.locator('[data-testid="token-counter"]')
  }

  async goto(debateId: string): Promise<void> {
    await super.goto(`/debate/${debateId}`)
  }

  async waitForMessage(index: number): Promise<void> {
    await this.messageItems.nth(index).waitFor({ state: 'visible', timeout: 30000 })
  }

  async waitForDebateComplete(): Promise<void> {
    await this.page.waitForSelector('[data-testid="debate-complete"]', { timeout: 120000 })
  }

  async getMessageCount(): Promise<number> {
    return this.messageItems.count()
  }

  async getMessageContent(index: number): Promise<string> {
    return (await this.messageItems.nth(index).textContent()) ?? ''
  }

  async endDebate(): Promise<void> {
    await this.endDebateButton.click()
    // Wait for confirmation dialog if any
    const confirmButton = this.page.getByRole('button', { name: /confirm/i })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }
  }

  async openShareModal(): Promise<void> {
    await this.shareButton.click()
    await this.page.waitForSelector('[data-testid="share-modal"]')
  }

  async openExportModal(): Promise<void> {
    await this.exportButton.click()
    await this.page.waitForSelector('[data-testid="export-modal"]')
  }
}

export class SummaryPage extends BasePage {
  readonly summaryTitle: Locator
  readonly forArguments: Locator
  readonly againstArguments: Locator
  readonly moderatorNotes: Locator
  readonly scoreCards: Locator
  readonly downloadButton: Locator
  readonly newDebateButton: Locator
  readonly revealSection: Locator
  readonly statisticsSection: Locator
  readonly shareSection: Locator

  constructor(page: Page) {
    super(page)
    this.summaryTitle = page.getByRole('heading', { name: /summary/i }).first()
    this.forArguments = page.locator('[data-testid="for-arguments"]')
    this.againstArguments = page.locator('[data-testid="against-arguments"]')
    this.moderatorNotes = page.locator('[data-testid="moderator-notes"]')
    this.scoreCards = page.locator('[data-testid="score-cards"]')
    this.downloadButton = page.getByRole('button', { name: /download/i })
    this.newDebateButton = page.getByRole('link', { name: /new debate/i })
    this.revealSection = page.locator('[data-testid="reveal-section"]')
    this.statisticsSection = page.locator('[data-testid="statistics"]')
    this.shareSection = page.locator('[data-testid="share-section"]')
  }

  async goto(debateId: string): Promise<void> {
    await super.goto(`/debate/${debateId}/summary`)
  }

  async waitForReveal(): Promise<void> {
    await this.revealSection.waitFor({ state: 'visible' })
  }

  async getScores(): Promise<{ for: number; against: number } | null> {
    if (!(await this.scoreCards.isVisible())) {
      return null
    }

    const forScore = await this.page.locator('[data-testid="for-score"]').textContent()
    const againstScore = await this.page.locator('[data-testid="against-score"]').textContent()

    return {
      for: parseInt(forScore ?? '0', 10),
      against: parseInt(againstScore ?? '0', 10),
    }
  }
}

export const test = base.extend<TestFixtures>({
  homePage: async ({ page }, callback) => {
    await callback(new HomePage(page))
  },
  debateConfigPage: async ({ page }, callback) => {
    await callback(new DebateConfigPage(page))
  },
  debatePage: async ({ page }, callback) => {
    await callback(new DebatePage(page))
  },
  summaryPage: async ({ page }, callback) => {
    await callback(new SummaryPage(page))
  },
  axeBuilder: async ({ page }, callback) => {
    await callback(new AxeBuilder({ page }))
  },
})

export { expect }
