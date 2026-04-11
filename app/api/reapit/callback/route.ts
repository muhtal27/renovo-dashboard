/**
 * Reapit OAuth callback handler.
 *
 * PUBLIC ROUTE — no operator auth required on the inbound GET because
 * Reapit redirects the browser here after the agency approves. The
 * operator IS logged in (they started from Settings), so their Supabase
 * session cookie is still in the browser and we resolve it via
 * getOperatorTenantContextForApi().
 *
 * Flow:
 * 1. Extract code + state from Reapit redirect query params
 * 2. Verify HMAC on state → extract connection_id
 * 3. Exchange code for tokens with Reapit token endpoint
 * 4. Resolve operator context from session cookie
 * 5. Call backend POST /api/integrations/reapit/activate with tokens
 * 6. Redirect to /settings?reapit=connected or ?reapit=error
 */

import { createHmac } from 'node:crypto'
import { NextResponse } from 'next/server'

import {
  buildEotInternalAuthHeaders,
  getEotApiBaseUrlConfig,
} from '@/lib/eot-server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'

const REAPIT_TOKEN_URL = 'https://connect.reapit.cloud/token'

function settingsUrl(base: string, params: Record<string, string>): string {
  const url = new URL('/settings', base)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return url.toString()
}

function verifyState(state: string): string | null {
  const secret = process.env.EOT_INTERNAL_AUTH_SECRET
  if (!secret) return null

  const lastColon = state.lastIndexOf(':')
  if (lastColon === -1) return null

  const connectionId = state.slice(0, lastColon)
  const signature = state.slice(lastColon + 1)

  const expected = createHmac('sha256', secret)
    .update(connectionId)
    .digest('hex')

  // Constant-time comparison via subtle crypto
  if (signature.length !== expected.length) return null
  let mismatch = 0
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  if (mismatch !== 0) return null

  return connectionId
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  // --- Validate params ---
  if (!code || !state) {
    return NextResponse.redirect(
      settingsUrl(origin, { reapit: 'error', reason: 'missing_params' })
    )
  }

  // --- Verify state HMAC ---
  const connectionId = verifyState(state)
  if (!connectionId) {
    return NextResponse.redirect(
      settingsUrl(origin, { reapit: 'error', reason: 'invalid_state' })
    )
  }

  // --- Exchange code for tokens ---
  const clientId = process.env.REAPIT_CLIENT_ID
  const clientSecret = process.env.REAPIT_CLIENT_SECRET
  const redirectUri = process.env.REAPIT_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      settingsUrl(origin, { reapit: 'error', reason: 'not_configured' })
    )
  }

  let tokens: { access_token: string; refresh_token: string; expires_in: number }

  try {
    const tokenResponse = await fetch(REAPIT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      console.error(
        'Reapit token exchange failed:',
        tokenResponse.status,
        await tokenResponse.text().catch(() => '')
      )
      return NextResponse.redirect(
        settingsUrl(origin, { reapit: 'error', reason: 'token_exchange' })
      )
    }

    tokens = await tokenResponse.json()
  } catch (err) {
    console.error('Reapit token exchange exception:', err)
    return NextResponse.redirect(
      settingsUrl(origin, { reapit: 'error', reason: 'token_exchange' })
    )
  }

  // --- Resolve operator context from session cookie ---
  const authResult = await getOperatorTenantContextForApi()
  if (!authResult.ok) {
    // Session expired during OAuth redirect — operator must retry
    return NextResponse.redirect(
      settingsUrl(origin, { reapit: 'error', reason: 'session_expired' })
    )
  }

  // --- Activate connection via backend ---
  const apiConfig = getEotApiBaseUrlConfig()
  const backendUrl = `${apiConfig.value}/api/integrations/reapit/activate`

  const ctx = authResult.context
  const authHeaders = buildEotInternalAuthHeaders({
    userId: ctx.user.id,
    tenantId: ctx.tenantId,
    role: ctx.role,
    membershipId: ctx.membershipId,
    membershipStatus: ctx.membershipStatus,
  })

  try {
    const activateResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        connection_id: connectionId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      }),
    })

    if (!activateResponse.ok) {
      const detail = await activateResponse.text().catch(() => '')
      console.error('Reapit activation failed:', activateResponse.status, detail)
      return NextResponse.redirect(
        settingsUrl(origin, { reapit: 'error', reason: 'activation_failed' })
      )
    }
  } catch (err) {
    console.error('Reapit activation exception:', err)
    return NextResponse.redirect(
      settingsUrl(origin, { reapit: 'error', reason: 'activation_failed' })
    )
  }

  // --- Success: redirect to settings ---
  return NextResponse.redirect(settingsUrl(origin, { reapit: 'connected' }))
}
