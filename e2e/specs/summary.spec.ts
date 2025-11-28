// e2e/specs/summary.spec.ts
// E2E tests for debate summary page

import { test, expect } from '../fixtures/base'
import { mockDebateApi } from '../fixtures/mocks'

test.describe('Summary Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockDebateApi(page)
  })

  test('should display summary page heading', async ({ page }) => {
    // Navigate to a mock summary page
    await page.goto('/debate/test-debate-id/summary')

    // Check for loading state or summary content
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/debate/test-debate-id/summary')
    await page.waitForTimeout(2000)

    const { SummaryPage } = await import('../fixtures/base')
    const summaryPage = new SummaryPage(page)
    const violations = await summaryPage.checkAccessibility()
    const criticalViolations = violations.filter((v) => v.impact === 'critical')

    expect(criticalViolations).toHaveLength(0)
  })

  test.describe('Visual Regression', () => {
    test('should match summary page snapshot', async ({ page }) => {
      await page.goto('/debate/test-debate-id/summary')
      await page.waitForTimeout(2000)

      await expect(page).toHaveScreenshot('summary-page.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })
})
