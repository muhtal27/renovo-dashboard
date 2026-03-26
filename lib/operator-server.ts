import { forbidden, redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import {
  getActiveTenantFailureDetail,
  resolveActiveTenantMembership,
} from '@/lib/operator-membership-server'
import type { MinimalSessionCookie } from '@/lib/supabase-session'
import {
  getOperatorProfileForUserId,
  refreshOperatorSessionIfNeeded,
} from '@/lib/operator-session-server'
import {
  hasPermission,
  hasRole,
  type OperatorPermission,
  type OperatorRole,
  type OperatorMembershipStatus,
} from '@/lib/operator-rbac'
import type { OperatorProfile } from '@/lib/operator-types'

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

async function resolveOperatorContext(): Promise<OperatorContextResult> {
  const authResult = await refreshOperatorSessionIfNeeded()

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

export async function requireOperatorSession(returnTo: string) {
  const result = await refreshOperatorSessionIfNeeded()

  if (!result.ok) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
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
      redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
    }

    forbidden()
  }

  return result.context
}

export async function requireOperatorRole(returnTo: string, minimumRole: OperatorRole) {
  const context = await requireOperatorTenant(returnTo)

  if (!hasRole(context.role, minimumRole)) {
    forbidden()
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
    forbidden()
  }

  return context
}

export async function getOperatorTenantContextForApi(requiredPermission?: OperatorPermission) {
  return getOperatorMembershipContextForApi(requiredPermission)
}

export async function getOperatorMembershipContextForApi(requiredPermission?: OperatorPermission) {
  const result = await resolveOperatorContext()

  if (!result.ok) {
    return result
  }

  if (requiredPermission && !hasPermission(result.context.role, requiredPermission)) {
    return {
      ok: false as const,
      status: 403 as const,
      detail: 'Operator is not authorized for this action.',
    }
  }

  return result
}
