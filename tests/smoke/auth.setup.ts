import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const authFile = path.join(process.cwd(), 'playwright/.auth/admin.json')

test('bootstrap authenticated admin session', async ({ page, request, baseURL }) => {
  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!email) {
    throw new Error('PLAYWRIGHT_ADMIN_EMAIL must be set before running smoke tests.')
  }
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY ' +
        'must be set in .env.playwright. The dashboard uses Microsoft SSO only, so tests mint a ' +
        'session via the Supabase admin API rather than a password grant.',
    )
  }
  if (!baseURL) {
    throw new Error('PLAYWRIGHT_BASE_URL must resolve to a non-empty baseURL.')
  }

  const supabaseBase = supabaseUrl.replace(/\/$/, '')

  // 1. Admin API: generate a magic-link hashed token for the test user.
  //    Requires the service role key; never leaves the test process.
  const linkResponse = await request.post(`${supabaseBase}/auth/v1/admin/generate_link`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    data: { type: 'magiclink', email },
  })
  if (!linkResponse.ok()) {
    const body = await linkResponse.text().catch(() => '<no body>')
    throw new Error(`Supabase admin.generate_link failed (${linkResponse.status()}): ${body}`)
  }
  const linkData = (await linkResponse.json()) as {
    properties?: { hashed_token?: string }
    hashed_token?: string
  }
  const tokenHash = linkData.properties?.hashed_token ?? linkData.hashed_token
  if (!tokenHash) {
    throw new Error('Supabase admin.generate_link did not return a hashed_token.')
  }

  // 2. Exchange the hashed token for a real Supabase session.
  const verifyResponse = await request.post(`${supabaseBase}/auth/v1/verify`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    },
    data: { type: 'magiclink', token_hash: tokenHash },
  })
  if (!verifyResponse.ok()) {
    const body = await verifyResponse.text().catch(() => '<no body>')
    throw new Error(`Supabase token verify failed (${verifyResponse.status()}): ${body}`)
  }
  const session = await verifyResponse.json()

  // 3. Establish the dashboard operator session so cookies land on the test origin.
  await page.goto('/login')

  const operatorResponse = await page.request.post('/api/operator/session', {
    headers: { 'Content-Type': 'application/json' },
    data: session,
  })
  if (!operatorResponse.ok()) {
    const body = await operatorResponse.text().catch(() => '<no body>')
    throw new Error(
      `Operator session endpoint rejected the Supabase session (${operatorResponse.status()}): ${body}`,
    )
  }

  // 4. Confirm the session cookies let us past the auth gate.
  const gateResponse = await page.request.get('/api/operator/session')
  expect(gateResponse.ok(), 'Operator session check failed after bootstrap.').toBeTruthy()

  // 5. Surface a clear warning if the test user has no operator membership —
  //    downstream smoke tests will 403 until one is created in Supabase.
  const operatorSnapshot = (await gateResponse.json()) as {
    membership?: unknown | null
    memberships?: unknown[]
    authUser?: { email?: string }
  }
  const hasMembership =
    !!operatorSnapshot.membership ||
    (Array.isArray(operatorSnapshot.memberships) && operatorSnapshot.memberships.length > 0)
  if (!hasMembership) {
    console.warn(
      `\n⚠️  Test user ${operatorSnapshot.authUser?.email ?? email} has NO operator memberships.\n` +
        '    Authenticated API routes will return 403 until you insert a row in\n' +
        '    operator_memberships for this user with status="active".\n',
    )
  }

  await mkdir(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
