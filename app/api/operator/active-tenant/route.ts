import { NextResponse } from 'next/server'
import {
  clearInvalidTenantSelection,
  listActiveTenantMembershipsForUser,
  setActiveTenantSelection,
} from '@/lib/operator-membership-server'
import {
  clearOperatorSession,
  getOperatorSessionFromCookies,
  setOperatorSessionCookie,
  validateOperatorSession,
} from '@/lib/operator-session-server'
import { shouldUseSecureCookies } from '@/lib/supabase-session'

function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === 'https:' || shouldUseSecureCookies()
}

export async function POST(request: Request) {
  const secure = isSecureRequest(request)
  const sessionCookie = await getOperatorSessionFromCookies()
  const authResult = await validateOperatorSession(sessionCookie)

  if (!authResult.ok) {
    const response = NextResponse.json(
      { detail: 'Operator authentication is required.' },
      { status: 401 }
    )
    clearOperatorSession(response.cookies, secure)
    clearInvalidTenantSelection(response.cookies, secure)
    return response
  }

  let membershipId: string | null = null

  try {
    const payload = (await request.json()) as { membershipId?: unknown }
    membershipId =
      typeof payload.membershipId === 'string' && payload.membershipId.trim()
        ? payload.membershipId.trim()
        : null
  } catch {
    return NextResponse.json({ detail: 'Valid membership selection is required.' }, { status: 400 })
  }

  if (!membershipId) {
    return NextResponse.json({ detail: 'Valid membership selection is required.' }, { status: 400 })
  }

  try {
    const memberships = await listActiveTenantMembershipsForUser(authResult.user.id)
    const membership = memberships.find((entry) => entry.id === membershipId) ?? null

    if (!membership) {
      const response = NextResponse.json(
        { detail: 'Selected tenant membership is invalid.' },
        { status: 403 }
      )

      if (authResult.refreshed) {
        setOperatorSessionCookie(response.cookies, authResult.session, secure)
      }

      clearInvalidTenantSelection(response.cookies, secure)
      return response
    }

    const response = NextResponse.json(
      {
        membership,
        memberships,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )

    setActiveTenantSelection(response.cookies, membership.id, secure)

    if (authResult.refreshed) {
      setOperatorSessionCookie(response.cookies, authResult.session, secure)
    }

    return response
  } catch {
    const response = NextResponse.json(
      { detail: 'Unable to resolve active tenant memberships.' },
      { status: 403 }
    )

    if (authResult.refreshed) {
      setOperatorSessionCookie(response.cookies, authResult.session, secure)
    }

    clearInvalidTenantSelection(response.cookies, secure)
    return response
  }
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ success: true })
  clearInvalidTenantSelection(response.cookies, isSecureRequest(request))
  return response
}
