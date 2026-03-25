import { cookies } from 'next/headers'
import { forbidden, redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { getSupabaseServerAuthClient } from '@/lib/supabase-admin'
import { resolveEotTenantId, resolveOperatorRole } from '@/lib/eot-server'
import {
  parseSupabaseSessionCookie,
  serializeSupabaseSessionCookie,
  SUPABASE_SESSION_COOKIE,
  SUPABASE_SESSION_COOKIE_MAX_AGE,
} from '@/lib/supabase-session'

export type OperatorTenantContext = {
  user: User
  tenantId: string
  role: string | null
}

type OperatorAuthResult =
  | {
      ok: true
      user: User
    }
  | {
      ok: false
      status: 401
      detail: string
    }

async function getVerifiedOperatorUser(): Promise<OperatorAuthResult> {
  const cookieStore = await cookies()
  const sessionCookie = parseSupabaseSessionCookie(
    cookieStore.get(SUPABASE_SESSION_COOKIE)?.value
  )

  if (!sessionCookie) {
    return {
      ok: false,
      status: 401,
      detail: 'Operator authentication is required.',
    }
  }

  const authClient = getSupabaseServerAuthClient()
  let activeSession = sessionCookie
  let userResponse = await authClient.auth.getUser(sessionCookie.access_token)

  if (userResponse.error || !userResponse.data.user) {
    if (sessionCookie.refresh_token) {
      const refreshResponse = await authClient.auth.refreshSession({
        refresh_token: sessionCookie.refresh_token,
      })

      const refreshedSession = refreshResponse.data.session

      if (!refreshResponse.error && refreshedSession) {
        activeSession = {
          access_token: refreshedSession.access_token,
          refresh_token: refreshedSession.refresh_token,
          expires_at: refreshedSession.expires_at ?? undefined,
        }

        cookieStore.set(
          SUPABASE_SESSION_COOKIE,
          serializeSupabaseSessionCookie(activeSession),
          {
            path: '/',
            maxAge: SUPABASE_SESSION_COOKIE_MAX_AGE,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          }
        )

        userResponse = await authClient.auth.getUser(activeSession.access_token)
      }
    }
  }

  if (userResponse.error || !userResponse.data.user) {
    cookieStore.set(SUPABASE_SESSION_COOKIE, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return {
      ok: false,
      status: 401,
      detail: 'Operator authentication is required.',
    }
  }

  return {
    ok: true,
    user: userResponse.data.user,
  }
}

export async function requireOperatorUser(returnTo: string) {
  const result = await getVerifiedOperatorUser()

  if (!result.ok) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return result.user
}

export async function requireOperatorTenant(returnTo: string): Promise<OperatorTenantContext> {
  const user = await requireOperatorUser(returnTo)
  const tenantId = resolveEotTenantId(user)

  if (!tenantId) {
    forbidden()
  }

  return {
    user,
    tenantId,
    role: resolveOperatorRole(user),
  }
}

export async function getOperatorTenantContextForApi():
  Promise<
    | {
        ok: true
        context: OperatorTenantContext
      }
    | {
        ok: false
        status: 401 | 403
        detail: string
      }
  > {
  const authResult = await getVerifiedOperatorUser()

  if (!authResult.ok) {
    return authResult
  }

  const tenantId = resolveEotTenantId(authResult.user)

  if (!tenantId) {
    return {
      ok: false,
      status: 403,
      detail: 'Authenticated operator is not bound to an EOT tenant.',
    }
  }

  return {
    ok: true,
    context: {
      user: authResult.user,
      tenantId,
      role: resolveOperatorRole(authResult.user),
    },
  }
}
