import { expect, test } from '@playwright/test'

test.describe('auth smoke', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveURL(/\/login(?:\?|$)/)
    await expect(page.getByRole('heading', { name: 'Workspace sign-in' })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test.describe('signed out', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('reports redirects to login with returnTo', async ({ page }) => {
      const response = await page.goto('/reports')

      expect(response?.status()).toBeLessThan(400)
      await expect(page).toHaveURL(/\/login\?returnTo=\/reports$/)
      await expect(page.getByRole('heading', { name: 'Workspace sign-in' })).toBeVisible()
    })
  })
})
