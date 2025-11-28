// e2e/specs/debate-flow.spec.ts
// E2E tests for active debate flow

import { test, expect } from '../fixtures/base'
import { mockDebateApi } from '../fixtures/mocks'

test.describe('Debate Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockDebateApi(page)
  })

  test('should navigate from config to debate page', async ({ debateConfigPage, page }) => {
    await debateConfigPage.goto()
    await debateConfigPage.configureDebate({
      topic: 'Should artificial intelligence be regulated by governments?',
      turns: 4,
      format: 'standard',
    })

    const debateId = await debateConfigPage.submitAndWait()
    expect(debateId).toBeTruthy()
    await expect(page).toHaveURL(/\/debate\/[a-zA-Z0-9-]+/)
  })

  test('should display debate page elements', async ({ debateConfigPage, debatePage, page }) => {
    await debateConfigPage.goto()
    await debateConfigPage.configureDebate({
      topic: 'Is remote work better than office work for productivity?',
      turns: 2,
      format: 'standard',
    })

    await debateConfigPage.submitAndWait()

    // Check for main debate page elements
    await expect(page.locator('main')).toBeVisible()
    await expect(debatePage.header).toBeVisible()
  })

  test('should have no critical accessibility violations on debate page', async ({
    debateConfigPage,
    debatePage,
    page,
  }) => {
    await debateConfigPage.goto()
    await debateConfigPage.configureDebate({
      topic: 'Should college education be free for everyone?',
      turns: 2,
      format: 'standard',
    })

    await debateConfigPage.submitAndWait()

    // Wait for page to load
    await page.waitForTimeout(1000)

    const violations = await debatePage.checkAccessibility()
    const criticalViolations = violations.filter((v) => v.impact === 'critical')

    expect(criticalViolations).toHaveLength(0)
  })

  test.describe('Visual Regression', () => {
    test('should match debate page snapshot', async ({ debateConfigPage, page }) => {
      await debateConfigPage.goto()
      await debateConfigPage.configureDebate({
        topic: 'Is space colonization necessary for human survival?',
        turns: 2,
        format: 'standard',
      })

      await debateConfigPage.submitAndWait()

      // Wait for content to load
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('debate-active.png', {
        animations: 'disabled',
      })
    })
  })
})
