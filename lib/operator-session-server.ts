import { cookies } from 'next/headers'
import type { AuthSession, User } from '@supabase/supabase-js'
import type { ActiveTenantMembershipResolution } from '@/lib/operator-membership-server'
import { resolveActiveTenantMembership } from '@/lib/operator-membership-server'
import {
  getSupabaseServerAuthClient,
  getSupabaseServiceRoleClient,
} from '@/lib/supabase-admin'
import {
  getOptionalBoolean,
  getOptionalString,
} from '@/lib/operator-schema-compat'
import type {
  OperatorAuthUser,
  OperatorMembership,
  OperatorProfile,
} from '@/lib/operator-types'
import {
  getOperatorSessionCookieOptions,
  LEGACY_SUPABASE_SESSION_COOKIE,
  parseSupabaseSessionCookie,
  serializeSupabaseSessionCookie,
  SUPABASE_SESSION_COOKIE,
  type MinimalSessionCookie,
} from '@/lib/supabase-session'

type ValidatedOperatorSession =
  | {
      ok: true
      session: MinimalSessionCookie
      user: User
      refreshed: boolean
    }
  | {
      ok: false
      reason: 'missing' | 'invalid'
    }

export type SafeCurrentOperator = {
  authUser: OperatorAuthUser | null
  profile: OperatorProfile | null
  membership: OperatorMembership | null
  memberships: OperatorMembership[]
  requiresTenantSelection: boolean
}

function toMinimalSession(session: Partial<AuthSession> | null | undefined): MinimalSessionCookie | null {
  if (!session || typeof session.access_token !== 'string') {
    return null
  }

  return {
    access_token: session.access_token,
    refresh_token: typeof session.refresh_token === 'string' ? session.refresh_token : undefined,
    expires_at: typeof session.expires_at === 'number' ? session.expires_at : undefined,
  }
}

export function toSafeOperatorAuthUser(user: User): OperatorAuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    app_metadata: user.app_metadata ?? null,
    user_metadata: user.user_metadata ?? null,
  }
}

export async function getOperatorProfileForUserId(userId: string) {
  const t0 = performance.now()
  try {
    const supabase = getSupabaseServiceRoleClient()

    const result = await supabase
      .from('users_profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .is('deleted_at', null)
      .maybeSingle()

    console.log(`[perf] getOperatorProfileForUserId: ${(performance.now() - t0).toFixed(0)}ms queries=1 result=${result.data ? 'found' : 'null'}`)

    if (result.error || !result.data || typeof result.data !== 'object') {
      return null
    }

    const rawProfile = result.data as Record<string, unknown>

    return {
      id:
        getOptionalString(rawProfile, 'id', 'auth_user_id', 'user_id') ??
        userId,
      full_name: getOptionalString(rawProfile, 'full_name', 'name'),
      avatar_url: getOptionalString(rawProfile, 'avatar_url'),
      is_active: getOptionalBoolean(rawProfile, 'is_active'),
    } satisfies OperatorProfile
  } catch {
    console.log(`[perf] getOperatorProfileForUserId: ${(performance.now() - t0).toFixed(0)}ms queries=1 result=catch`)
    return null
  }
}

export async function getCurrentOperatorSnapshotForUser(
  user: User,
  membershipResolution?: ActiveTenantMembershipResolution
): Promise<SafeCurrentOperator> {
  const resolvedMembership =
    membershipResolution ?? (await resolveActiveTenantMembership(user.id))
  const profile = await getOperatorProfileForUserId(user.id)

  return {
    authUser: toSafeOperatorAuthUser(user),
    profile,
    membership: resolvedMembership.ok ? resolvedMembership.membership : null,
    memberships: resolvedMembership.memberships,
    requiresTenantSelection:
      !resolvedMembership.ok && resolvedMembership.reason === 'selection_required',
  }
}

export async function validateOperatorSession(
  sessionCookie: MinimalSessionCookie | null
): Promise<ValidatedOperatorSession> {
  if (!sessionCookie) {
    return { ok: false, reason: 'missing' }
  }

  const t0 = performance.now()
  const authClient = getSupabaseServerAuthClient()
  let activeSession = sessionCookie
  let userResponse = await authClient.auth.getUser(sessionCookie.access_token)
  const tGetUser = performance.now()
  let refreshed = false

  if ((userResponse.error || !userResponse.data.user) && sessionCookie.refresh_token) {
    const refreshResponse = await authClient.auth.refreshSession({
      refresh_token: sessionCookie.refresh_token,
    })

    const refreshedSession = toMinimalSession(refreshResponse.data.session)

    if (!refreshResponse.error && refreshedSession) {
      activeSession = refreshedSession
      userResponse = await authClient.auth.getUser(activeSession.access_token)
      refreshed = true
    }
  }

  console.log(`[perf] validateOperatorSession getUser: ${(tGetUser - t0).toFixed(0)}ms refreshed=${refreshed} total: ${(performance.now() - t0).toFixed(0)}ms`)

  if (userResponse.error || !userResponse.data.user) {
    return { ok: false, reason: 'invalid' }
  }

  return {
    ok: true,
    session: activeSession,
    user: userResponse.data.user,
    refreshed:
      activeSession.access_token !== sessionCookie.access_token ||
      activeSession.refresh_token !== sessionCookie.refresh_token,
  }
}

export async function getOperatorSessionFromCookies() {
  const cookieStore = await cookies()
  return parseSupabaseSessionCookie(cookieStore.get(SUPABASE_SESSION_COOKIE)?.value)
}

export function setOperatorSessionCookie(
  target: { set: (name: string, value: string, options: Record<string, unknown>) => unknown },
  session: MinimalSessionCookie,
  secure?: boolean
) {
  target.set(SUPABASE_SESSION_COOKIE, serializeSupabaseSessionCookie(session), {
    ...getOperatorSessionCookieOptions(secure),
  })
}

export function clearOperatorSession(
  target: { set: (name: string, value: string, options: Record<string, unknown>) => unknown },
  secure?: boolean
) {
  const options = getOperatorSessionCookieOptions(secure)
  target.set(SUPABASE_SESSION_COOKIE, '', {
    ...options,
    maxAge: 0,
  })
  target.set(LEGACY_SUPABASE_SESSION_COOKIE, '', {
    path: '/',
    sameSite: 'lax',
    secure: options.secure,
    maxAge: 0,
  })
}

// Route handlers and server actions can use this path because cookie writes are allowed there.
export async function refreshOperatorSessionIfNeeded() {
  const cookieStore = await cookies()
  const sessionCookie = parseSupabaseSessionCookie(cookieStore.get(SUPABASE_SESSION_COOKIE)?.value)
  const result = await validateOperatorSession(sessionCookie)

  if (!result.ok) {
    clearOperatorSession(cookieStore)
    return result
  }

  if (result.refreshed) {
    setOperatorSessionCookie(cookieStore, result.session)
  }

  return result
}

// Server-component callers must stay on the read-only path because Next.js
// rejects cookie writes during render.
export async function readOperatorSessionIfNeeded() {
  const cookieStore = await cookies()
  const sessionCookie = parseSupabaseSessionCookie(cookieStore.get(SUPABASE_SESSION_COOKIE)?.value)
  const result = await validateOperatorSession(sessionCookie)

  if (!result.ok) {
    return result
  }

  if (result.refreshed) {
    console.info('Operator session refreshed during server render without cookie persistence.')
  }

  return result
}

export async function getCurrentOperatorSessionSnapshot(): Promise<SafeCurrentOperator | null> {
  const result = await readOperatorSessionIfNeeded()

  if (!result.ok) {
    return null
  }

  return getCurrentOperatorSnapshotForUser(result.user)
}
