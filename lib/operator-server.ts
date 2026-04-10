import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import {
  ACTIVE_TENANT_SELECTION_COOKIE,
  getActiveTenantFailureDetail,
  resolveActiveTenantMembership,
} from '@/lib/operator-membership-server'
import { normalizeReturnTo } from '@/lib/return-to'
import type { MinimalSessionCookie } from '@/lib/supabase-session'
import {
  getOperatorProfileForUserId,
  readOperatorSessionIfNeeded,
  refreshOperatorSessionIfNeeded,
  toSafeOperatorAuthUser,
} from '@/lib/operator-session-server'
import {
  hasPermission,
  hasRole,
  type OperatorPermission,
  type OperatorRole,
  type OperatorMembershipStatus,
} from '@/lib/operator-rbac'
import type { OperatorProfile } from '@/lib/operator-types'
import type { CurrentOperator } from '@/lib/operator-types'

export type OperatorTenantContext = {
  user: User
  session: MinimalSessionCookie
  tenantId: string
  membershipId: string
  membershipStatus: OperatorMembershipStatus
  role: OperatorRole
  profile: OperatorProfile | null
}

type OperatorContextResult =
  | {
      ok: true
      context: OperatorTenantContext
    }
  | {
      ok: false
      status: 401 | 403
      detail: string
  }

function buildLoginRedirect(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(normalizeReturnTo(returnTo))}`
}

function buildWorkspaceAccessRedirect(
  returnTo: string,
  reason?: 'membership' | 'forbidden'
) {
  const searchParams = new URLSearchParams({
    returnTo: normalizeReturnTo(returnTo),
  })

  if (reason) {
    searchParams.set('reason', reason)
  }

  return `/workspace-access?${searchParams.toString()}`
}

async function buildOperatorContextResult(
  authResult: Awaited<ReturnType<typeof readOperatorSessionIfNeeded>>
): Promise<OperatorContextResult> {
  if (!authResult.ok) {
    return {
      ok: false,
      status: 401,
      detail: 'Operator authentication is required.',
    }
  }

  const [profile, membershipResult] = await Promise.all([
    getOperatorProfileForUserId(authResult.user.id),
    resolveActiveTenantMembership(authResult.user.id),
  ])

  if (profile?.is_active === false) {
    return {
      ok: false,
      status: 403,
      detail: 'Operator access is disabled for this account.',
    }
  }

  if (!membershipResult.ok) {
    return {
      ok: false,
      status: 403,
      detail: getActiveTenantFailureDetail(membershipResult.reason),
    }
  }

  return {
    ok: true,
    context: {
      user: authResult.user,
      session: authResult.session,
      tenantId: membershipResult.membership.tenant_id,
      membershipId: membershipResult.membership.id,
      membershipStatus: membershipResult.membership.status,
      role: membershipResult.membership.role,
      profile,
    },
  }
}

const resolveOperatorContext = cache(async (): Promise<OperatorContextResult> => {
  const authResult = await readOperatorSessionIfNeeded()
  return buildOperatorContextResult(authResult)
})

// Short-lived in-memory cache for API route auth context.
// Each client-side page load fires multiple /api/eot/* calls in quick succession;
// without this cache every call repeats Supabase auth.getUser + profile + membership
// lookups (3-4 DB round trips). Keyed by access_token + active tenant cookie so a
// tenant switch immediately produces a cache miss.
const apiContextCache = new Map<
  string,
  { result: OperatorContextResult; expiresAt: number }
>()
const API_CONTEXT_TTL_MS = 60_000

function pruneApiContextCache() {
  const now = Date.now()
  for (const [key, entry] of apiContextCache) {
    if (entry.expiresAt <= now) {
      apiContextCache.delete(key)
    }
  }
}

async function resolveOperatorApiContext(): Promise<OperatorContextResult> {
  const authResult = await refreshOperatorSessionIfNeeded()

  if (!authResult.ok) {
    console.warn('Operator API authentication failed.', {
      status: 401,
      reason: authResult.reason,
    })
    return buildOperatorContextResult(authResult)
  }

  // Include active tenant cookie in the key so a tenant switch immediately
  // invalidates the cached context instead of serving stale data for up to 10s.
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const tenantCookie = cookieStore.get(ACTIVE_TENANT_SELECTION_COOKIE)?.value ?? ''
  const cacheKey = `${authResult.session.access_token}:${tenantCookie}`
  const now = Date.now()
  const cached = apiContextCache.get(cacheKey)

  if (cached && cached.expiresAt > now) {
    return cached.result
  }

  const result = await buildOperatorContextResult(authResult)

  apiContextCache.set(cacheKey, { result, expiresAt: now + API_CONTEXT_TTL_MS })

  // Prune stale entries periodically (cheap, map is small)
  if (apiContextCache.size > 20) {
    pruneApiContextCache()
  }

  return result
}

export async function requireOperatorSession(returnTo: string) {
  const result = await readOperatorSessionIfNeeded()

  if (!result.ok) {
    redirect(buildLoginRedirect(returnTo))
  }

  return {
    user: result.user,
    session: result.session,
  }
}

export async function requireOperatorUser(returnTo: string) {
  const { user } = await requireOperatorSession(returnTo)
  return user
}

export async function requireOperatorTenant(returnTo: string): Promise<OperatorTenantContext> {
  return requireActiveTenantMembership(returnTo)
}

export async function requireActiveTenantMembership(
  returnTo: string
): Promise<OperatorTenantContext> {
  const result = await resolveOperatorContext()

  if (!result.ok) {
    if (result.status === 401) {
      redirect(buildLoginRedirect(returnTo))
    }

    redirect(buildWorkspaceAccessRedirect(returnTo, 'membership'))
  }

  return result.context
}

export async function requireOperatorRole(returnTo: string, minimumRole: OperatorRole) {
  const context = await requireOperatorTenant(returnTo)

  if (!hasRole(context.role, minimumRole)) {
    redirect(buildWorkspaceAccessRedirect(returnTo, 'forbidden'))
  }

  return context
}

export async function requireOperatorPermission(
  returnTo: string,
  permission: OperatorPermission
) {
  return requireMembershipPermission(returnTo, permission)
}

export async function requireMembershipPermission(
  returnTo: string,
  permission: OperatorPermission
) {
  const context = await requireOperatorTenant(returnTo)

  if (!hasPermission(context.role, permission)) {
    redirect(buildWorkspaceAccessRedirect(returnTo, 'forbidden'))
  }

  return context
}

export async function getOperatorTenantContextForApi(requiredPermission?: OperatorPermission) {
  return getOperatorMembershipContextForApi(requiredPermission)
}

export async function getOperatorMembershipContextForApi(requiredPermission?: OperatorPermission) {
  const result = await resolveOperatorApiContext()

  if (!result.ok) {
    return result
  }

  if (requiredPermission && !hasPermission(result.context.role, requiredPermission)) {
    console.warn('Operator API permission denied.', {
      requiredPermission,
      role: result.context.role,
      tenantId: result.context.tenantId,
      userId: result.context.user.id,
    })
    return {
      ok: false as const,
      status: 403 as const,
      detail: 'Operator is not authorized for this action.',
    }
  }

  return result
}

export async function getCurrentOperatorForLayout(): Promise<CurrentOperator | null> {
  const result = await resolveOperatorContext()

  if (!result.ok) {
    return null
  }

  return {
    authUser: toSafeOperatorAuthUser(result.context.user),
    profile: result.context.profile,
    membership: {
      id: result.context.membershipId,
      user_id: result.context.user.id,
      tenant_id: result.context.tenantId,
      role: result.context.role,
      status: result.context.membershipStatus,
    },
    memberships: [
      {
        id: result.context.membershipId,
        user_id: result.context.user.id,
        tenant_id: result.context.tenantId,
        role: result.context.role,
        status: result.context.membershipStatus,
      },
    ],
    requiresTenantSelection: false,
  }
}
