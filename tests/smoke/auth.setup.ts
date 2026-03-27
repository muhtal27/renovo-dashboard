import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const authFile = path.join(process.cwd(), 'playwright/.auth/admin.json')

test('bootstrap authenticated admin session', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD must be set before running smoke tests.'
    )
  }

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Workspace sign-in' })).toBeVisible()

  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in with password' }).click()

  await page.waitForURL(/\/(overview|eot|reports|knowledge|settings|workspace-access)(\?.*)?$/)
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/)

  await mkdir(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
