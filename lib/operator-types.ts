import type { OperatorMembershipStatus, OperatorRole } from '@/lib/operator-rbac'

export type OperatorProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_active: boolean | null
}

export type OperatorMembership = {
  id: string
  user_id: string
  tenant_id: string
  role: OperatorRole
  status: OperatorMembershipStatus
}

export type OperatorAuthUser = {
  id: string
  email: string | null
  app_metadata: Record<string, unknown> | null
  user_metadata: Record<string, unknown> | null
}

export type CurrentOperator = {
  authUser: OperatorAuthUser | null
  profile: OperatorProfile | null
  membership: OperatorMembership | null
  memberships: OperatorMembership[]
  requiresTenantSelection: boolean
  tenantName: string | null
}

export function getOperatorLabel(operator: CurrentOperator | null) {
  if (!operator?.authUser) return ''

  const metadata = operator.authUser.user_metadata

  return (
    operator.profile?.full_name ||
    (typeof metadata?.full_name === 'string' ? metadata.full_name : null) ||
    (typeof metadata?.name === 'string' ? metadata.name : null) ||
    operator.authUser.email ||
    ''
  )
}
