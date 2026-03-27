import { expect, test } from '@playwright/test'

test('authenticated eot cases api returns 200 and an array', async ({ page }) => {
  const response = await page.goto('/api/eot/cases')

  expect(response).not.toBeNull()
  expect(response?.status()).toBe(200)

  const body = await page.locator('body').textContent()
  expect(body).not.toBeNull()

  const payload = JSON.parse(body ?? 'null') as unknown

  expect(Array.isArray(payload)).toBe(true)
})
