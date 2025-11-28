// e2e/specs/landing.spec.ts
// E2E tests for landing page

import { test, expect } from '../fixtures/base'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto()
  })

  test('should display hero section with title and CTA', async ({ homePage }) => {
    await expect(homePage.heroTitle).toBeVisible()
    await expect(homePage.heroTitle).toContainText('Watch AI Models')
    await expect(homePage.startDebateButton).toBeVisible()
    await expect(homePage.howItWorksLink).toBeVisible()
  })

  test('should navigate to debate configuration on CTA click', async ({ homePage, page }) => {
    await homePage.clickStartDebate()

    await expect(page).toHaveURL(/\/debate\/new/)
  })

  test('should navigate to how it works page', async ({ homePage, page }) => {
    await homePage.clickHowItWorks()

    await expect(page).toHaveURL(/\/how-it-works/)
  })

  test('should toggle theme between light and dark', async ({ homePage, page }) => {
    // Wait for theme toggle to be visible (it hydrates on client)
    await page.waitForTimeout(500)
    const initialTheme = await homePage.getTheme()
    await homePage.toggleTheme()

    // Wait for theme change to take effect
    await page.waitForTimeout(300)
    const newTheme = await homePage.getTheme()

    expect(newTheme).not.toBe(initialTheme)
  })

  test('should have no critical accessibility violations', async ({ homePage }) => {
    const violations = await homePage.checkAccessibility()
    const criticalViolations = violations.filter((v) => v.impact === 'critical')

    expect(criticalViolations).toHaveLength(0)
  })

  test('should load within performance budget', async ({ homePage }) => {
    const metrics = await homePage.getPageMetrics()

    expect(metrics.loadTime).toBeLessThan(5000)
    expect(metrics.firstContentfulPaint).toBeLessThan(3000)
  })

  test('should display header with navigation', async ({ homePage, page }) => {
    await expect(homePage.header).toBeVisible()
    await expect(page.getByRole('link', { name: /debate lab/i })).toBeVisible()
  })

  test('should display footer', async ({ homePage }) => {
    await expect(homePage.footer).toBeVisible()
  })

  test.describe('Visual Regression', () => {
    test('should match light theme snapshot', async ({ homePage, page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await homePage.goto()

      await expect(page).toHaveScreenshot('landing-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match dark theme snapshot', async ({ homePage, page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await homePage.goto()

      await expect(page).toHaveScreenshot('landing-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })
})
