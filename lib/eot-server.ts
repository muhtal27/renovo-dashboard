import { createHmac } from 'node:crypto'
import type { User } from '@supabase/supabase-js'

const TENANT_ID_KEYS = [
  'tenant_id',
  'tenantId',
  'workspace_id',
  'workspaceId',
  'agency_id',
  'agencyId',
] as const

const ROLE_KEYS = ['role', 'operator_role'] as const
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TENANT_SCOPE_KEYS = new Set(TENANT_ID_KEYS)

export const EOT_INTERNAL_AUTH_CONTEXT_HEADER = 'x-renovo-eot-context'
export const EOT_INTERNAL_AUTH_SIGNATURE_HEADER = 'x-renovo-eot-signature'
export const EOT_INTERNAL_AUTH_VERSION = 1

export type EotOperatorContext = {
  userId: string
  tenantId: string
  role: string | null
}

function readTenantId(source: unknown): string | null {
  if (!source || typeof source !== 'object') {
    return null
  }

  for (const key of TENANT_ID_KEYS) {
    const value = (source as Record<string, unknown>)[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return null
}

function readString(source: unknown, keys: readonly string[]) {
  if (!source || typeof source !== 'object') {
    return null
  }

  for (const key of keys) {
    const value = (source as Record<string, unknown>)[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

export function resolveEotTenantId(user: User | null) {
  const tenantId = readTenantId(user?.app_metadata) ?? readTenantId(user?.user_metadata)
  return tenantId && UUID_PATTERN.test(tenantId) ? tenantId : null
}

export function resolveOperatorRole(user: User | null) {
  return readString(user?.app_metadata, ROLE_KEYS) ?? readString(user?.user_metadata, ROLE_KEYS)
}

export function getEotApiBaseUrl() {
  return (
    process.env.EOT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_EOT_API_BASE_URL ??
    'http://127.0.0.1:8000'
  )
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
    issued_at: Math.floor(Date.now() / 1000),
  })
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url')
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url')

  return {
    [EOT_INTERNAL_AUTH_CONTEXT_HEADER]: encodedPayload,
    [EOT_INTERNAL_AUTH_SIGNATURE_HEADER]: signature,
  }
}
