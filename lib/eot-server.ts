import { createHmac } from 'node:crypto'
import type { OperatorMembershipStatus, OperatorRole } from '@/lib/operator-rbac'

const TENANT_ID_KEYS = [
  'tenant_id',
  'tenantId',
  'workspace_id',
  'workspaceId',
  'agency_id',
  'agencyId',
] as const

const TENANT_SCOPE_KEYS = new Set(TENANT_ID_KEYS)

export const EOT_INTERNAL_AUTH_CONTEXT_HEADER = 'x-renovo-eot-context'
export const EOT_INTERNAL_AUTH_SIGNATURE_HEADER = 'x-renovo-eot-signature'
export const EOT_INTERNAL_AUTH_VERSION = 1
export const DEFAULT_LOCAL_EOT_API_BASE_URL = 'http://127.0.0.1:8000'

export type EotApiBaseUrlConfig = {
  value: string
  source: 'EOT_API_BASE_URL' | 'NEXT_PUBLIC_EOT_API_BASE_URL' | 'default_local'
}

export type EotOperatorContext = {
  userId: string
  tenantId: string
  role: OperatorRole | null
  membershipId?: string | null
  membershipStatus?: OperatorMembershipStatus | null
}

export function getEotApiBaseUrlConfig(): EotApiBaseUrlConfig {
  const serverUrl = process.env.EOT_API_BASE_URL?.trim()

  if (serverUrl) {
    return {
      value: serverUrl,
      source: 'EOT_API_BASE_URL',
    }
  }

  const publicUrl = process.env.NEXT_PUBLIC_EOT_API_BASE_URL?.trim()

  if (publicUrl) {
    return {
      value: publicUrl,
      source: 'NEXT_PUBLIC_EOT_API_BASE_URL',
    }
  }

  return {
    value: DEFAULT_LOCAL_EOT_API_BASE_URL,
    source: 'default_local',
  }
}

export function getEotApiBaseUrl() {
  return getEotApiBaseUrlConfig().value
}

export function sanitizeEotSearchParams(searchParams: URLSearchParams) {
  const sanitized = new URLSearchParams(searchParams)

  for (const key of TENANT_SCOPE_KEYS) {
    sanitized.delete(key)
  }

  return sanitized
}

export function stripTenantScopeFromPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload
  }

  const sanitizedEntries = Object.entries(payload as Record<string, unknown>).filter(
    ([key]) => !TENANT_SCOPE_KEYS.has(key as (typeof TENANT_ID_KEYS)[number])
  )

  return Object.fromEntries(sanitizedEntries)
}

export function buildEotInternalAuthHeaders(context: EotOperatorContext) {
  const secret = process.env.EOT_INTERNAL_AUTH_SECRET

  if (!secret?.trim()) {
    throw new Error('Missing EOT_INTERNAL_AUTH_SECRET.')
  }

  const payload = JSON.stringify({
    version: EOT_INTERNAL_AUTH_VERSION,
    user_id: context.userId,
    tenant_id: context.tenantId,
    role: context.role,
    membership_id: context.membershipId ?? null,
    membership_status: context.membershipStatus ?? null,
    issued_at: Math.floor(Date.now() / 1000),
  })
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url')
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url')

  return {
    [EOT_INTERNAL_AUTH_CONTEXT_HEADER]: encodedPayload,
    [EOT_INTERNAL_AUTH_SIGNATURE_HEADER]: signature,
  }
}
