const OPERATOR_ROLE_ALIASES = {
  operator: 'operator',
  agent: 'operator',
  caseworker: 'operator',
  manager: 'manager',
  property_manager: 'manager',
  case_manager: 'manager',
  admin: 'admin',
  administrator: 'admin',
  owner: 'admin',
  super_admin: 'admin',
} as const

export type OperatorRole = 'operator' | 'manager' | 'admin'
export type OperatorMembershipStatus = 'active' | 'inactive' | 'suspended'

export const OPERATOR_PERMISSIONS = {
  VIEW_CASE: 'case:view',
  CREATE_CASE: 'case:create',
  EDIT_CASE: 'case:edit',
  MANAGE_EVIDENCE: 'evidence:manage',
  MANAGE_ISSUES: 'issues:manage',
  MANAGE_RECOMMENDATIONS: 'recommendations:manage',
  GENERATE_CLAIM_OUTPUT: 'claim:generate',
  REASSIGN_CASE: 'case:reassign',
  VIEW_REPORTING: 'reporting:view',
  MANAGE_SETTINGS: 'settings:manage',
  MANAGE_USERS: 'users:manage',
} as const

export type OperatorPermission =
  (typeof OPERATOR_PERMISSIONS)[keyof typeof OPERATOR_PERMISSIONS]

const ROLE_PRIORITY: Record<OperatorRole, number> = {
  operator: 1,
  manager: 2,
  admin: 3,
}

const PERMISSION_MINIMUM_ROLE: Record<OperatorPermission, OperatorRole> = {
  [OPERATOR_PERMISSIONS.VIEW_CASE]: 'operator',
  [OPERATOR_PERMISSIONS.CREATE_CASE]: 'operator',
  [OPERATOR_PERMISSIONS.EDIT_CASE]: 'operator',
  [OPERATOR_PERMISSIONS.MANAGE_EVIDENCE]: 'operator',
  [OPERATOR_PERMISSIONS.MANAGE_ISSUES]: 'operator',
  [OPERATOR_PERMISSIONS.MANAGE_RECOMMENDATIONS]: 'operator',
  [OPERATOR_PERMISSIONS.GENERATE_CLAIM_OUTPUT]: 'operator',
  [OPERATOR_PERMISSIONS.REASSIGN_CASE]: 'manager',
  [OPERATOR_PERMISSIONS.VIEW_REPORTING]: 'manager',
  [OPERATOR_PERMISSIONS.MANAGE_SETTINGS]: 'admin',
  [OPERATOR_PERMISSIONS.MANAGE_USERS]: 'admin',
}

export function normalizeOperatorRole(value: string | null | undefined): OperatorRole | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return null
  }

  return OPERATOR_ROLE_ALIASES[normalized as keyof typeof OPERATOR_ROLE_ALIASES] ?? null
}

export function normalizeOperatorMembershipStatus(
  value: string | null | undefined
): OperatorMembershipStatus | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'active' || normalized === 'inactive' || normalized === 'suspended') {
    return normalized
  }

  return null
}

export function hasRole(
  currentRole: OperatorRole | null | undefined,
  minimumRole: OperatorRole
) {
  if (!currentRole) {
    return false
  }

  return ROLE_PRIORITY[currentRole] >= ROLE_PRIORITY[minimumRole]
}

export function hasPermission(
  currentRole: OperatorRole | null | undefined,
  permission: OperatorPermission
) {
  return hasRole(currentRole, PERMISSION_MINIMUM_ROLE[permission])
}
