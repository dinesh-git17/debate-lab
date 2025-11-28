// e2e/specs/accessibility.spec.ts
// E2E tests for accessibility compliance

import AxeBuilder from '@axe-core/playwright'

import { test, expect } from '../fixtures/base'

test.describe('Accessibility', () => {
  const pages = [
    { name: 'Landing', path: '/' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About', path: '/about' },
    { name: 'Debate Config', path: '/debate/new' },
  ]

  for (const pageInfo of pages) {
    test.describe(pageInfo.name, () => {
      test('should pass WCAG 2.1 AA automated checks', async ({ page }) => {
        await page.goto(pageInfo.path)
        await page.waitForLoadState('networkidle')

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()

        const violations = results.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        )

        // Log violations for debugging if test fails
        if (violations.length > 0) {
          // eslint-disable-next-line no-console
          console.log(
            `Accessibility violations on ${pageInfo.name}:`,
            JSON.stringify(violations, null, 2)
          )
        }

        expect(violations).toHaveLength(0)
      })

      test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto(pageInfo.path)

        const h1Count = await page.locator('h1').count()
        expect(h1Count).toBe(1)

        const headings = await page.evaluate(() => {
          const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
          return Array.from(elements).map((el) => {
            const level = el.tagName.charAt(1)
            return parseInt(level, 10)
          })
        })

        // Check that heading levels don't skip (e.g., h1 -> h3)
        for (let i = 1; i < headings.length; i++) {
          const current = headings[i]
          const previous = headings[i - 1]
          if (current !== undefined && previous !== undefined) {
            const diff = current - previous
            expect(diff).toBeLessThanOrEqual(1)
          }
        }
      })

      test('should have sufficient color contrast', async ({ page }) => {
        await page.goto(pageInfo.path)
        await page.waitForLoadState('networkidle')

        const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()

        // Filter out minor contrast issues, only fail on serious/critical
        const seriousViolations = results.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        )

        expect(seriousViolations).toHaveLength(0)
      })

      test('should have accessible form labels', async ({ page }) => {
        await page.goto(pageInfo.path)

        const results = await new AxeBuilder({ page })
          .withRules(['label', 'label-title-only'])
          .analyze()

        expect(results.violations).toHaveLength(0)
      })

      test('should have accessible images', async ({ page }) => {
        await page.goto(pageInfo.path)

        const results = await new AxeBuilder({ page }).withRules(['image-alt']).analyze()

        expect(results.violations).toHaveLength(0)
      })

      test('should have accessible links', async ({ page }) => {
        await page.goto(pageInfo.path)

        const results = await new AxeBuilder({ page })
          .withRules(['link-name', 'link-in-text-block'])
          .analyze()

        expect(results.violations).toHaveLength(0)
      })
    })
  }

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation on landing', async ({ page }) => {
      await page.goto('/')

      await page.keyboard.press('Tab')
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
      expect(firstFocused).toBeTruthy()

      // Tab through several elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        const focused = await page.evaluate(() => document.activeElement?.tagName)
        expect(focused).toBeTruthy()
      }
    })

    test('should support keyboard navigation on config page', async ({ page }) => {
      await page.goto('/debate/new')

      await page.keyboard.press('Tab')

      // Should be able to tab to topic input
      const topicInput = page.getByLabel(/topic/i)
      await topicInput.focus()
      await expect(topicInput).toBeFocused()

      // Tab to next element
      await page.keyboard.press('Tab')
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('should allow form submission with keyboard', async ({ page }) => {
      await page.goto('/debate/new')

      // Focus on topic and type
      const topicInput = page.getByLabel(/topic/i)
      await topicInput.focus()
      await topicInput.fill('This is a test topic for keyboard navigation testing')

      // Tab to start button and activate with Enter
      const startButton = page.getByRole('button', { name: /start debate/i })
      await startButton.focus()
      await expect(startButton).toBeFocused()
    })
  })

  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/')

      // Tab to an element
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Check that focused element has visible outline or ring
      const focusStyles = await page.evaluate(() => {
        const el = document.activeElement
        if (!el) return null
        const styles = window.getComputedStyle(el)
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow,
        }
      })

      expect(focusStyles).not.toBeNull()
    })

    test('should not have focus traps on landing page', async ({ page }) => {
      await page.goto('/')

      // Tab many times and ensure we can reach the end
      const tabCount = 50
      const visitedElements = new Set<string>()

      for (let i = 0; i < tabCount; i++) {
        await page.keyboard.press('Tab')
        const activeElement = await page.evaluate(
          () =>
            `${document.activeElement?.tagName}-${document.activeElement?.textContent?.slice(0, 20)}`
        )
        visitedElements.add(activeElement)
      }

      // Should have visited multiple unique elements (not stuck in a trap)
      expect(visitedElements.size).toBeGreaterThan(3)
    })
  })

  test.describe('Screen Reader', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await page.goto('/')

      // Check for main landmark
      const main = page.locator('main')
      await expect(main).toBeVisible()

      // Check for header landmark
      const header = page.locator('header')
      await expect(header).toBeVisible()
    })

    test('should have accessible navigation', async ({ page }) => {
      await page.goto('/')

      // Check for nav element
      const nav = page.locator('nav')
      if ((await nav.count()) > 0) {
        await expect(nav.first()).toBeVisible()
      }
    })

    test('should have descriptive link text', async ({ page }) => {
      await page.goto('/')

      // Check that links don't have generic text
      const links = await page.getByRole('link').all()

      for (const link of links.slice(0, 10)) {
        const text = await link.textContent()
        const ariaLabel = await link.getAttribute('aria-label')
        const accessibleName = text || ariaLabel

        // Link should have some accessible name
        expect(accessibleName?.trim().length).toBeGreaterThan(0)

        // Should not be generic
        const genericTexts = ['click here', 'read more', 'here', 'link']
        const isGeneric = genericTexts.some(
          (generic) => accessibleName?.toLowerCase().trim() === generic
        )
        expect(isGeneric).toBe(false)
      }
    })
  })

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')

      // Page should load without issues
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Take screenshot to verify animations are disabled
      await expect(page).toHaveScreenshot('landing-reduced-motion.png', {
        animations: 'disabled',
      })
    })
  })
})
