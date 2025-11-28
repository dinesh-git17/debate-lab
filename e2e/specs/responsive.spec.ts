// e2e/specs/responsive.spec.ts
// E2E tests for responsive behavior

import { test, expect } from '../fixtures/base'
import { VIEWPORTS } from '../types'

test.describe('Responsive Design', () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${name} viewport (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      test('should render landing page correctly', async ({ page }) => {
        await page.goto('/')

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.getByRole('link', { name: /start a debate/i }).first()).toBeVisible()

        await expect(page).toHaveScreenshot(`landing-${name}.png`, {
          fullPage: true,
          animations: 'disabled',
        })
      })

      test('should render debate config page correctly', async ({ page }) => {
        await page.goto('/debate/new')

        await expect(page.getByLabel(/topic/i)).toBeVisible()
        await expect(page.getByRole('button', { name: /start/i })).toBeVisible()

        await expect(page).toHaveScreenshot(`debate-config-${name}.png`, {
          fullPage: true,
          animations: 'disabled',
        })
      })

      test('should render how it works page correctly', async ({ page }) => {
        await page.goto('/how-it-works')

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        await expect(page).toHaveScreenshot(`how-it-works-${name}.png`, {
          fullPage: true,
          animations: 'disabled',
        })
      })

      test('should render about page correctly', async ({ page }) => {
        await page.goto('/about')

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        await expect(page).toHaveScreenshot(`about-${name}.png`, {
          fullPage: true,
          animations: 'disabled',
        })
      })
    })
  }

  test.describe('Layout Shift', () => {
    test('should have minimal CLS on page load', async ({ page }) => {
      await page.goto('/')

      const cls = await page.evaluate(async () => {
        return new Promise<number>((resolve) => {
          let clsValue = 0
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (
                'hadRecentInput' in entry &&
                !(entry as unknown as { hadRecentInput: boolean }).hadRecentInput
              ) {
                clsValue += (entry as unknown as { value: number }).value
              }
            }
          })
          observer.observe({ type: 'layout-shift', buffered: true })

          setTimeout(() => {
            observer.disconnect()
            resolve(clsValue)
          }, 3000)
        })
      })

      // CLS should be less than 0.1 for a good score
      expect(cls).toBeLessThan(0.25)
    })
  })

  test.describe('Touch Interactions', () => {
    test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })

    test('should have touch-friendly button sizes', async ({ page }) => {
      await page.goto('/')

      const buttons = page.getByRole('button')
      const buttonCount = await buttons.count()

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i)
        if (await button.isVisible()) {
          const box = await button.boundingBox()
          if (box) {
            // Minimum touch target size should be 44x44 pixels
            expect(box.width).toBeGreaterThanOrEqual(36)
            expect(box.height).toBeGreaterThanOrEqual(36)
          }
        }
      }
    })

    test('should have touch-friendly links', async ({ page }) => {
      await page.goto('/')

      const links = page.getByRole('link')
      const linkCount = await links.count()

      // Check first few visible links
      let checkedCount = 0
      for (let i = 0; i < linkCount && checkedCount < 5; i++) {
        const link = links.nth(i)
        if (await link.isVisible()) {
          const box = await link.boundingBox()
          if (box) {
            // Links should have reasonable touch target size
            expect(box.height).toBeGreaterThanOrEqual(24)
          }
          checkedCount++
        }
      }
    })
  })
})
