import { NextResponse } from 'next/server'
import {
  clearInvalidTenantSelection,
  resolveActiveTenantMembership,
} from '@/lib/operator-membership-server'
import {
  clearOperatorSession,
  getCurrentOperatorSnapshotForUser,
  getOperatorSessionFromCookies,
  setOperatorSessionCookie,
  validateOperatorSession,
} from '@/lib/operator-session-server'
import { shouldUseSecureCookies, toMinimalSupabaseSession } from '@/lib/supabase-session'

function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === 'https:' || shouldUseSecureCookies()
}

function applyTenantSelectionCookies(
  response: NextResponse,
  secure: boolean,
  membershipResolution: Awaited<ReturnType<typeof resolveActiveTenantMembership>>
) {
  if (membershipResolution.shouldClearSelection) {
    clearInvalidTenantSelection(response.cookies, secure)
  }
}

export async function GET(request: Request) {
  const secure = isSecureRequest(request)
  const sessionCookie = await getOperatorSessionFromCookies()
  const result = await validateOperatorSession(sessionCookie)

  if (!result.ok) {
    const response = NextResponse.json(
      { detail: 'Operator authentication is required.' },
      { status: 401 }
    )
    clearOperatorSession(response.cookies, secure)
    clearInvalidTenantSelection(response.cookies, secure)
    return response
  }

  const membershipResolution = await resolveActiveTenantMembership(result.user.id)
  const operator = await getCurrentOperatorSnapshotForUser(result.user, membershipResolution)
  const response = NextResponse.json(
    operator,
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )

  if (result.refreshed) {
    setOperatorSessionCookie(response.cookies, result.session, secure)
  }

  applyTenantSelectionCookies(response, secure, membershipResolution)

  return response
}

export async function POST(request: Request) {
  const secure = isSecureRequest(request)
  try {
    const payload = await request.json()
    const session = toMinimalSupabaseSession(payload)

    if (!session) {
      return NextResponse.json({ detail: 'Valid session data is required.' }, { status: 400 })
    }

    const result = await validateOperatorSession(session)

    if (!result.ok) {
      const response = NextResponse.json(
        { detail: 'Operator authentication is required.' },
        { status: 401 }
      )
      clearOperatorSession(response.cookies, secure)
      clearInvalidTenantSelection(response.cookies, secure)
      return response
    }

    const membershipResolution = await resolveActiveTenantMembership(result.user.id)
    const operator = await getCurrentOperatorSnapshotForUser(result.user, membershipResolution)
    const response = NextResponse.json(
      operator,
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
    setOperatorSessionCookie(response.cookies, result.session, secure)
    applyTenantSelectionCookies(response, secure, membershipResolution)
    return response
  } catch {
    return NextResponse.json({ detail: 'Valid session data is required.' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ success: true })
  clearOperatorSession(response.cookies, isSecureRequest(request))
  clearInvalidTenantSelection(response.cookies, isSecureRequest(request))
  return response
}
