import type { User } from '@supabase/supabase-js'

const TENANT_ID_KEYS = [
  'tenant_id',
  'tenantId',
  'workspace_id',
  'workspaceId',
  'agency_id',
  'agencyId',
] as const

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

export function resolveEotTenantId(user: User | null) {
  const configuredTenantId = process.env.EOT_TENANT_ID ?? process.env.NEXT_PUBLIC_EOT_TENANT_ID ?? null

  if (configuredTenantId && process.env.NODE_ENV !== 'production') {
    return configuredTenantId
  }

  return readTenantId(user?.app_metadata) ?? readTenantId(user?.user_metadata) ?? configuredTenantId
}

export function getEotApiBaseUrl() {
  return (
    process.env.EOT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_EOT_API_BASE_URL ??
    'http://127.0.0.1:8000'
  )
}
