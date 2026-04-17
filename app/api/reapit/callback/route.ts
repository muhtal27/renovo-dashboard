import { NextResponse } from 'next/server'

/**
 * Reapit Connect OAuth callback.
 *
 * Reapit Connect redirects here after the agent authenticates:
 *   GET /api/reapit/callback?code=<auth_code>&state=<state>
 *
 * Flow:
 * 1. Receive the authorization code from Reapit Connect
 * 2. Exchange it for tokens via the backend
 * 3. Redirect to the Reapit app page with the session established
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle auth errors from Reapit Connect
  if (error) {
    const description = searchParams.get('error_description') || 'Authentication failed'
    return NextResponse.redirect(
      new URL(`/reapit/app?error=${encodeURIComponent(description)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/reapit/app?error=No+authorization+code+received', request.url)
    )
  }

  // Exchange the code for tokens via the backend
  const backendUrl = process.env.EOT_API_BASE_URL || 'http://127.0.0.1:8000'

  try {
    const response = await fetch(`${backendUrl}/api/integrations/reapit/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: 'Token exchange failed' }))
      const detail = (body as { detail?: string }).detail || 'Token exchange failed'
      return NextResponse.redirect(
        new URL(`/reapit/app?error=${encodeURIComponent(detail)}`, request.url)
      )
    }

    const tokens = (await response.json()) as {
      access_token: string
      id_token: string
      expires_in: number
    }

    // Set the Reapit session token in a secure cookie
    const redirectUrl = new URL('/reapit/app', request.url)
    const res = NextResponse.redirect(redirectUrl)

    res.cookies.set('reapit_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/',
    })

    res.cookies.set('reapit_id_token', tokens.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/',
    })

    return res
  } catch {
    return NextResponse.redirect(
      new URL('/reapit/app?error=Unable+to+reach+backend', request.url)
    )
  }
}
