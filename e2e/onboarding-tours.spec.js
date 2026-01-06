import { test, expect } from '@playwright/test'

/**
 * Onboarding Tours E2E Tests
 *
 * These tests verify the onboarding tour functionality works correctly
 * across different viewports and scenarios, catching issues like:
 * - Missing data-tour attributes
 * - Overlay covering highlighted elements
 * - Tours not starting on redirects
 * - Mobile fullscreen behavior
 */

test.describe('Medals List Onboarding Tour', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state
    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
  })

  test('has all data-tour attributes on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/medals')

    // Verify all tour targets exist
    await expect(page.locator('[data-tour="medals-search"]')).toBeVisible()
    await expect(page.locator('[data-tour="chip-unlocked"]')).toBeVisible()
    await expect(page.locator('[data-tour="open-filters"]')).toBeVisible()

    // Medal row appears when there are medals
    const medalRows = page.locator('[data-tour^="medal-row"]')
    await expect(medalRows.first()).toBeVisible()
  })

  test('starts tour manually from Home page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')

    // Click the guide button
    await page.click('text=Visa märkeslista-guide')
    await expect(page).toHaveURL(/\/medals/)

    // Tour should start
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Snabbguide')).toBeVisible()
  })

  test('can navigate through all tour steps', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })

    // Trigger manual tour start
    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'medals')
    })
    await page.goto('/medals')

    // Wait for tour to start
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Navigate through steps
    const steps = ['Snabbguide', 'Sök', 'Snabbfilter', 'Fler filter']
    for (const stepTitle of steps) {
      await expect(page.locator(`text=${stepTitle}`)).toBeVisible()
      const nextButton = page.locator('button:has-text("Nästa")')
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForTimeout(300)
      }
    }
  })

  test('spotlight highlights target elements', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'medals')
    })
    await page.goto('/medals')

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Click next to go to search step
    await page.click('button:has-text("Nästa")')
    await page.waitForTimeout(300)

    // Verify search field is highlighted (spotlight exists)
    const searchField = page.locator('[data-tour="medals-search"]')
    await expect(searchField).toBeVisible()

    // The spotlight creates a box-shadow overlay
    // We can verify the search field is in the viewport
    const box = await searchField.boundingBox()
    expect(box).not.toBeNull()
    expect(box.y).toBeGreaterThan(0)
  })
})

test.describe('Tree View Onboarding Tour', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
  })

  test('has all data-tour attributes on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/skill-tree')

    // Verify all tour targets exist in non-fullscreen mode
    await expect(page.locator('[data-tour="tree-canvas"]')).toBeVisible()
    await expect(page.locator('[data-tour="zoom-controls"]')).toBeVisible()
    await expect(page.locator('[data-tour="tree-legend"]')).toBeVisible()
    await expect(page.locator('[data-tour="tree-actions"]')).toBeVisible()
  })

  test('has all data-tour attributes in fullscreen on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/skill-tree')

    // Should auto-redirect to fullscreen
    await expect(page).toHaveURL(/\/skill-tree\/fullscreen/, { timeout: 5000 })

    // Verify all tour targets exist in fullscreen mode
    await expect(page.locator('[data-tour="tree-canvas"]')).toBeVisible()
    await expect(page.locator('[data-tour="zoom-controls"]')).toBeVisible()
    await expect(page.locator('[data-tour="tree-actions"]')).toBeVisible()

    // Legend might be hidden by default, but the element should exist
    const legend = page.locator('[data-tour="tree-legend"]')
    await expect(legend).toBeAttached()
  })

  test('starts tour manually from Home page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')

    // Click the tree view guide button
    await page.click('text=Visa trädvy-guide')
    await expect(page).toHaveURL(/\/skill-tree/)

    // Tour should start
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Välkommen till trädvyn')).toBeVisible()
  })

  test('starts tour on fullscreen redirect (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    // Request manual tour start
    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'tree-view')
    })
    await page.goto('/skill-tree')

    // Should redirect to fullscreen
    await expect(page).toHaveURL(/\/skill-tree\/fullscreen/, { timeout: 5000 })

    // Tour should start after redirect
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Välkommen till trädvyn')).toBeVisible()
  })

  test('overlay does not cover bottom elements on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'tree-view')
    })
    await page.goto('/skill-tree')

    await expect(page).toHaveURL(/\/skill-tree\/fullscreen/)
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Navigate to zoom controls step
    let attempts = 0
    while (attempts < 6) {
      const currentText = await page.locator('[role="dialog"] h2').textContent()
      if (currentText.includes('Zoomkontroller')) break

      const nextButton = page.locator('button:has-text("Nästa")')
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForTimeout(300)
      }
      attempts++
    }

    // Verify we're on the zoom controls step
    await expect(page.locator('text=Zoomkontroller')).toBeVisible()

    // Get positions of zoom controls and overlay
    const zoomControls = page.locator('[data-tour="zoom-controls"]')
    await expect(zoomControls).toBeVisible()

    const zoomBox = await zoomControls.boundingBox()
    const overlay = page.locator('[role="dialog"][aria-modal="true"]')
    const overlayBox = await overlay.boundingBox()

    // Verify zoom controls are visible and overlay is positioned at top (not covering them)
    expect(zoomBox).not.toBeNull()
    expect(overlayBox).not.toBeNull()

    // Overlay should be at the top when targeting bottom elements
    expect(overlayBox.y).toBeLessThan(zoomBox.y)
  })

  test('can complete full tour flow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })

    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'tree-view')
    })
    await page.goto('/skill-tree')

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Navigate through all steps
    const steps = [
      'Välkommen till trädvyn',
      'Interaktiv canvas',
      'Zoomkontroller',
      'Teckenförklaring',
      'Åtgärdsmeny',
      'Klicka på märken',
    ]

    for (let i = 0; i < steps.length; i++) {
      await expect(page.locator(`text=${steps[i]}`)).toBeVisible()

      if (i < steps.length - 1) {
        await page.click('button:has-text("Nästa")')
        await page.waitForTimeout(300)
      }
    }

    // Complete the tour
    await page.click('button:has-text("Klart")')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    // Tour should be marked as seen
    const tourSeen = await page.evaluate(() => {
      return window.localStorage.getItem('app:onboardingTour:lastSeen')
    })
    expect(tourSeen).toBe('tree-view-v1')
  })

  test('keyboard navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })

    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'tree-view')
    })
    await page.goto('/skill-tree')

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Escape should close the tour
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('manual trigger button works', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/skill-tree')

    // Click "Visa guide" button
    await page.click('button:has-text("Visa guide")')

    // Tour should start
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Välkommen till trädvyn')).toBeVisible()
  })
})

test.describe('Onboarding Accessibility', () => {
  test('tour dialog has proper ARIA attributes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })

    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'tree-view')
    })
    await page.goto('/skill-tree')

    const dialog = page.locator('[role="dialog"][aria-modal="true"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Verify ARIA attributes
    await expect(dialog).toHaveAttribute('role', 'dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAttribute('aria-labelledby')
    await expect(dialog).toHaveAttribute('aria-describedby')
  })

  test('focus is trapped in tour dialog', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })

    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'tree-view')
    })
    await page.goto('/skill-tree')

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Tab through focusable elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Focus should still be within dialog
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]')
      return dialog?.contains(active)
    })

    expect(focusedElement).toBe(true)
  })

  test('buttons meet minimum touch target size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'tree-view')
    })
    await page.goto('/skill-tree')

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Check button sizes (WCAG requires minimum 44x44px)
    const buttons = await page.locator('[role="dialog"] button').all()

    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
})

test.describe('Tour Independence', () => {
  test('medals and tree-view tours track completion independently', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')

    // Complete medals tour
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'medals')
    })
    await page.goto('/medals')
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    await page.click('button:has-text("Stäng")')

    // Check medals tour is marked as seen
    let medalsSeen = await page.evaluate(() => {
      return window.localStorage.getItem('app:onboardingTour:lastSeen')
    })
    expect(medalsSeen).toBe('medals-v1')

    // Tree view tour should still be available
    await page.goto('/')
    await page.evaluate(() => {
      window.sessionStorage.setItem('app:onboardingTour:manualStart', 'tree-view')
    })
    await page.goto('/skill-tree')

    // Tree view tour should start
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Välkommen till trädvyn')).toBeVisible()
  })
})
