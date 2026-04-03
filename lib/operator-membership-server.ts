import { cookies } from 'next/headers'
import {
  normalizeOperatorMembershipStatus,
  normalizeOperatorRole,
} from '@/lib/operator-rbac'
import {
  getOptionalString,
  getOptionalTimestamp,
  hasNonNullValue,
  isMissingColumnError,
} from '@/lib/operator-schema-compat'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

export const ACTIVE_TENANT_SELECTION_COOKIE = 'renovo-active-tenant-membership'

type RawOperatorMembership = Record<string, unknown>

type CookieTarget = {
  set: (name: string, value: string, options: Record<string, unknown>) => unknown
}

export type ActiveTenantMembership = {
  id: string
  tenant_id: string
  user_id: string
  role: 'operator' | 'manager' | 'admin'
  status: 'active'
}

export type ActiveTenantMembershipFailureReason = 'missing' | 'invalid' | 'selection_required'

export type ActiveTenantMembershipResolution =
  | {
      ok: true
      membership: ActiveTenantMembership
      memberships: ActiveTenantMembership[]
      selectionSource: 'single' | 'cookie'
      shouldClearSelection: boolean
    }
  | {
      ok: false
      reason: ActiveTenantMembershipFailureReason
      memberships: ActiveTenantMembership[]
      shouldClearSelection: boolean
    }

function getActiveTenantSelectionCookieOptions(secure = false) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  }
}

function normalizeMembership(
  rawMembership: RawOperatorMembership
): ActiveTenantMembership | null {
  if (hasNonNullValue(rawMembership, 'deleted_at')) {
    return null
  }

  const status = normalizeOperatorMembershipStatus(
    getOptionalString(rawMembership, 'status')
  )

  if (status !== 'active') {
    return null
  }

  const role = normalizeOperatorRole(getOptionalString(rawMembership, 'role'))

  if (!role) {
    throw new Error('Invalid active tenant membership role.')
  }

  const id = getOptionalString(rawMembership, 'id')
  const tenantId = getOptionalString(rawMembership, 'tenant_id')
  const userId = getOptionalString(rawMembership, 'user_id')

  if (!id || !tenantId || !userId) {
    throw new Error('Invalid active tenant membership row.')
  }

  return {
    id,
    tenant_id: tenantId,
    user_id: userId,
    role,
    status,
  }
}

function compareMembershipOrder(
  left: RawOperatorMembership,
  right: RawOperatorMembership
) {
  const leftTimestamp = getOptionalTimestamp(left, 'created_at', 'updated_at') ?? 0
  const rightTimestamp = getOptionalTimestamp(right, 'created_at', 'updated_at') ?? 0

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp
  }

  const leftId = getOptionalString(left, 'id') ?? ''
  const rightId = getOptionalString(right, 'id') ?? ''

  return leftId.localeCompare(rightId)
}

export function getActiveTenantFailureDetail(
  reason: ActiveTenantMembershipFailureReason
) {
  switch (reason) {
    case 'missing':
      return 'Authenticated operator does not have an active tenant membership.'
    case 'selection_required':
      return 'Authenticated operator has multiple active tenant memberships and no valid active tenant selection.'
    case 'invalid':
    default:
      return 'Authenticated operator has an invalid tenant membership configuration.'
  }
}

export async function listActiveTenantMembershipsForUser(
  userId: string
): Promise<ActiveTenantMembership[]> {
  const supabase = getSupabaseServiceRoleClient()

  let result = await supabase
    .from('tenant_memberships')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (result.error && isMissingColumnError(result.error, 'created_at')) {
    result = await supabase
      .from('tenant_memberships')
      .select('*')
      .eq('user_id', userId)
  }

  if (result.error) {
    throw result.error
  }

  const memberships = [...(result.data ?? [])]
    .filter(
      (membership): membership is RawOperatorMembership =>
        typeof membership === 'object' && membership !== null
    )
    .sort(compareMembershipOrder)
    .map((membership) => normalizeMembership(membership))

  const normalizedMemberships = memberships.filter(
    (membership): membership is ActiveTenantMembership => membership !== null
  )

  const membershipIds = new Set<string>()
  const tenantIds = new Set<string>()

  for (const membership of normalizedMemberships) {
    if (membershipIds.has(membership.id) || tenantIds.has(membership.tenant_id)) {
      throw new Error('Duplicate active tenant memberships detected.')
    }

    membershipIds.add(membership.id)
    tenantIds.add(membership.tenant_id)
  }

  return normalizedMemberships
}

function resolveMembershipSelection(
  memberships: ActiveTenantMembership[],
  selectedMembershipId: string | null
): ActiveTenantMembershipResolution {
  if (memberships.length === 0) {
    return {
      ok: false,
      reason: 'missing',
      memberships,
      shouldClearSelection: selectedMembershipId !== null,
    }
  }

  if (memberships.length === 1) {
    return {
      ok: true,
      membership: memberships[0],
      memberships,
      selectionSource: 'single',
      shouldClearSelection: selectedMembershipId !== null,
    }
  }

  if (!selectedMembershipId) {
    return {
      ok: false,
      reason: 'selection_required',
      memberships,
      shouldClearSelection: false,
    }
  }

  const selectedMembership =
    memberships.find((membership) => membership.id === selectedMembershipId) ?? null

  if (!selectedMembership) {
    return {
      ok: false,
      reason: 'selection_required',
      memberships,
      shouldClearSelection: true,
    }
  }

  return {
    ok: true,
    membership: selectedMembership,
    memberships,
    selectionSource: 'cookie',
    shouldClearSelection: false,
  }
}

export async function getActiveTenantSelection() {
  const cookieStore = await cookies()
  return cookieStore.get(ACTIVE_TENANT_SELECTION_COOKIE)?.value ?? null
}

export function setActiveTenantSelection(
  target: CookieTarget,
  membershipId: string,
  secure = false
) {
  target.set(ACTIVE_TENANT_SELECTION_COOKIE, membershipId, {
    ...getActiveTenantSelectionCookieOptions(secure),
  })
}

export function clearInvalidTenantSelection(
  target: CookieTarget,
  secure = false
) {
  target.set(ACTIVE_TENANT_SELECTION_COOKIE, '', {
    ...getActiveTenantSelectionCookieOptions(secure),
    maxAge: 0,
  })
}

export async function resolveActiveTenantMembership(
  userId: string,
  options?: {
    selectedMembershipId?: string | null
  }
): Promise<ActiveTenantMembershipResolution> {
  try {
    const [memberships, selectedMembershipId] = await Promise.all([
      listActiveTenantMembershipsForUser(userId),
      options?.selectedMembershipId === undefined
        ? getActiveTenantSelection()
        : Promise.resolve(options.selectedMembershipId),
    ])

    return resolveMembershipSelection(memberships, selectedMembershipId)
  } catch {
    return {
      ok: false,
      reason: 'invalid',
      memberships: [],
      shouldClearSelection: true,
    }
  }
}
