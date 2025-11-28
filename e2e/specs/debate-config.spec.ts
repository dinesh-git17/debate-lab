// e2e/specs/debate-config.spec.ts
// E2E tests for debate configuration flow

import { test, expect } from '../fixtures/base'
import { mockDebateApi } from '../fixtures/mocks'

test.describe('Debate Configuration', () => {
  test.beforeEach(async ({ page, debateConfigPage }) => {
    await mockDebateApi(page)
    await debateConfigPage.goto()
  })

  test('should display configuration form', async ({ debateConfigPage }) => {
    await expect(debateConfigPage.topicInput).toBeVisible()
    await expect(debateConfigPage.turnsRadioGroup).toBeVisible()
    await expect(debateConfigPage.formatSelect).toBeVisible()
    await expect(debateConfigPage.startButton).toBeVisible()
  })

  test('should show page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Start a New Debate')
  })

  test('should show character count for topic', async ({ debateConfigPage, page }) => {
    await debateConfigPage.fillTopic('Test topic for debate')

    // Wait for the char count to update
    await page.waitForTimeout(100)
    await expect(debateConfigPage.charCount).toBeVisible()
  })

  test('should validate minimum topic length', async ({ debateConfigPage, page }) => {
    await debateConfigPage.fillTopic('Short')
    await debateConfigPage.startButton.click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Check that we're still on the same page (validation failed)
    await expect(page).toHaveURL(/\/debate\/new/)
  })

  test('should allow selecting different turn counts', async ({ page }) => {
    // Find the radio button for 6 turns and click it
    const sixTurnsRadio = page.getByLabel(/6/i).first()
    await sixTurnsRadio.check()

    await expect(sixTurnsRadio).toBeChecked()
  })

  test('should allow selecting debate format', async ({ debateConfigPage }) => {
    await debateConfigPage.selectFormat('oxford')

    await expect(debateConfigPage.formatSelect).toHaveValue('oxford')
  })

  test('should show custom rules section when toggled', async ({ debateConfigPage }) => {
    await debateConfigPage.customRulesToggle.click()

    await expect(debateConfigPage.customRuleInput).toBeVisible()
  })

  test('should preserve form state on validation error', async ({ debateConfigPage, page }) => {
    await debateConfigPage.fillTopic('Short')

    // Select 6 turns
    const sixTurnsRadio = page.getByLabel(/6/i).first()
    await sixTurnsRadio.check()

    await debateConfigPage.startButton.click()

    // Topic should still be there
    await expect(debateConfigPage.topicInput).toHaveValue('Short')
    await expect(sixTurnsRadio).toBeChecked()
  })

  test('should have no critical accessibility violations', async ({ debateConfigPage }) => {
    const violations = await debateConfigPage.checkAccessibility()
    const criticalViolations = violations.filter((v) => v.impact === 'critical')

    expect(criticalViolations).toHaveLength(0)
  })

  test('should allow resetting form', async ({ debateConfigPage }) => {
    await debateConfigPage.fillTopic('This is a test topic for resetting')
    await debateConfigPage.resetButton.click()

    await expect(debateConfigPage.topicInput).toHaveValue('')
  })

  test.describe('Keyboard Navigation', () => {
    test('should support tab navigation through form', async ({ debateConfigPage, page }) => {
      await debateConfigPage.topicInput.focus()
      await page.keyboard.press('Tab')

      // Should move to next focusable element
      const activeElement = page.locator(':focus')
      await expect(activeElement).toBeVisible()
    })
  })

  test.describe('Visual Regression', () => {
    test('should match config page snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('debate-config.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })
})
