import { expect, test } from '@playwright/test'

test.describe('operator route smoke', () => {
  test('signed-in eot loads', async ({ page }) => {
    await page.goto('/eot')

    await expect(page).toHaveURL(/\/eot$/)
    await expect(page.getByRole('heading', { name: 'Checkouts' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Operational checkout pipeline' })).toBeVisible()
  })

  test('signed-in reports loads without portfolio error', async ({ page }) => {
    await page.goto('/reports')

    await expect(page).toHaveURL(/\/reports$/)
    await expect(page.getByRole('heading', { name: 'Operations analytics' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Workflow and risk' })).toBeVisible()
    await expect(page.getByText('Unable to load reporting summary')).toHaveCount(0)
  })

  test('signed-in knowledge loads all jurisdictions', async ({ page }) => {
    await page.goto('/knowledge')

    await expect(page).toHaveURL(/\/knowledge$/)
    await expect(page.getByRole('heading', { name: 'Guidance', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Guidance hub' })).toBeVisible()
    await expect(page.getByRole('button', { name: /England/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Wales/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Scotland/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Northern Ireland/i }).first()).toBeVisible()
  })

  test('signed-in settings loads', async ({ page }) => {
    await page.goto('/settings')

    await expect(page).toHaveURL(/\/settings$/)
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Workspace controls' })).toBeVisible()
  })
})
