// e2e/specs/navigation.spec.ts
// E2E tests for navigation and routing

import { test, expect } from '../fixtures/base'

test.describe('Navigation', () => {
  test('should navigate through marketing pages', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/debate/i)

    await page
      .getByRole('link', { name: /how it works/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/how-it-works/)

    await page.getByRole('link', { name: /about/i }).first().click()
    await expect(page).toHaveURL(/\/about/)

    // Navigate back to home via logo
    await page
      .getByRole('link', { name: /debate lab/i })
      .first()
      .click()
    await expect(page).toHaveURL('/')
  })

  test('should handle deep linking to how-it-works', async ({ page }) => {
    await page.goto('/how-it-works')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should handle deep linking to about', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should handle deep linking to debate/new', async ({ page }) => {
    await page.goto('/debate/new')
    await expect(page.getByLabel(/topic/i)).toBeVisible()
  })

  test('should handle browser back/forward', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('link', { name: /how it works/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/how-it-works/)

    await page.getByRole('link', { name: /about/i }).first().click()
    await expect(page).toHaveURL(/\/about/)

    await page.goBack()
    await expect(page).toHaveURL(/\/how-it-works/)

    await page.goBack()
    await expect(page).toHaveURL('/')

    await page.goForward()
    await expect(page).toHaveURL(/\/how-it-works/)
  })

  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/non-existent-page')

    // Should show some kind of error or 404 page
    const pageContent = await page.content()
    expect(pageContent.toLowerCase()).toMatch(/not found|404|error/i)
  })

  test('should display header navigation on all pages', async ({ page }) => {
    const pages = ['/', '/how-it-works', '/about', '/debate/new']

    for (const pagePath of pages) {
      await page.goto(pagePath)
      const header = page.locator('header')
      await expect(header).toBeVisible()
    }
  })

  test('should display footer on marketing pages', async ({ page }) => {
    const marketingPages = ['/', '/how-it-works', '/about']

    for (const pagePath of marketingPages) {
      await page.goto(pagePath)
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
    }
  })

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('should show navigation elements on mobile', async ({ page }) => {
      await page.goto('/')

      // Header should be visible
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // Logo/title should be visible
      await expect(page.getByText(/debate lab/i).first()).toBeVisible()
    })

    test('should navigate on mobile', async ({ page }) => {
      await page.goto('/')

      // Find and click start debate button
      const startButton = page.getByRole('link', { name: /start a debate/i }).first()
      await startButton.click()

      await expect(page).toHaveURL(/\/debate\/new/)
    })
  })
})
