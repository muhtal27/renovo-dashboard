import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_ROLE = 'admin'

const ROLE_ALIASES = {
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
}

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName)

  if (!fs.existsSync(filePath)) {
    return
  }

  const contents = fs.readFileSync(filePath, 'utf8')

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()

    if (!key || process.env[key]) {
      continue
    }

    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')

    process.env[key] = value
  }
}

function readArg(name, fallbackValue = null) {
  const flag = `--${name}`
  const inlineArg = process.argv.find((value) => value.startsWith(`${flag}=`))

  if (inlineArg) {
    return inlineArg.slice(flag.length + 1)
  }

  const index = process.argv.indexOf(flag)

  if (index >= 0) {
    return process.argv[index + 1] ?? fallbackValue
  }

  return fallbackValue
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

function normalizeRole(value) {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return ROLE_ALIASES[normalized] ?? null
}

function isDeleted(row) {
  return row?.deleted_at !== null && row?.deleted_at !== undefined
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object') {
    return JSON.stringify(error)
  }

  return String(error)
}

function printUsage() {
  console.log(`Usage: node scripts/reconcile-operator-access.mjs [options]

Options:
  --user-id      Auth user id to reconcile (required)
  --tenant-id    Tenant id to bind the user to (required)
  --role         operator | manager | admin (default: ${DEFAULT_ROLE})
  --full-name    Optional profile display name override
  --avatar-url   Optional avatar URL override
  --inactive     Mark the profile inactive instead of active
  --dry-run      Show the reconciliation plan without writing changes
`)
}

loadEnvFile('.env.local')
loadEnvFile('.env')

if (hasFlag('help')) {
  printUsage()
  process.exit(0)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const userId = readArg('user-id')
const tenantId = readArg('tenant-id')
const role = normalizeRole(readArg('role', DEFAULT_ROLE))
const fullNameOverride = readArg('full-name')
const avatarUrlOverride = readArg('avatar-url')
const profileIsActive = !hasFlag('inactive')
const dryRun = hasFlag('dry-run')

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

if (!userId || !tenantId) {
  printUsage()
  process.exit(1)
}

if (!role) {
  console.error('Invalid --role. Expected operator, manager, or admin.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function getAuthUser(targetUserId) {
  const { data, error } = await supabase.auth.admin.getUserById(targetUserId)

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error(`Auth user ${targetUserId} was not found.`)
  }

  return data.user
}

async function getTenant(targetTenantId) {
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', targetTenantId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(`Tenant ${targetTenantId} was not found.`)
  }

  return data
}

async function listProfileRows(targetUserId) {
  const { data, error } = await supabase
    .from('users_profiles')
    .select('*')
    .eq('auth_user_id', targetUserId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

async function listMembershipRows(targetUserId, targetTenantId) {
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('tenant_id', targetTenantId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

async function reconcileProfile(user, roleValue) {
  const rows = await listProfileRows(user.id)
  const activeRows = rows.filter((row) => !isDeleted(row))
  const primaryRow = activeRows[0] ?? rows[0] ?? null
  const extraRows = activeRows.slice(1)

  const resolvedFullName =
    fullNameOverride ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.app_metadata?.full_name ??
    user.app_metadata?.name ??
    null
  const resolvedAvatarUrl =
    avatarUrlOverride ??
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    user.app_metadata?.avatar_url ??
    user.app_metadata?.picture ??
    null

  const payload = {
    auth_user_id: user.id,
    full_name: typeof resolvedFullName === 'string' ? resolvedFullName : null,
    avatar_url: typeof resolvedAvatarUrl === 'string' ? resolvedAvatarUrl : null,
    is_active: profileIsActive,
    role: roleValue,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  }

  if (dryRun) {
    return {
      action: primaryRow ? 'update' : 'insert',
      extra_profile_rows_to_soft_delete: extraRows.map((row) => row.id),
    }
  }

  if (primaryRow) {
    const { error } = await supabase
      .from('users_profiles')
      .update(payload)
      .eq('id', primaryRow.id)

    if (error) {
      throw error
    }
  } else {
    const { error } = await supabase
      .from('users_profiles')
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
      })

    if (error) {
      throw error
    }
  }

  for (const row of extraRows) {
    const { error } = await supabase
      .from('users_profiles')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (error) {
      throw error
    }
  }

  return {
    action: primaryRow ? 'updated' : 'inserted',
    extra_profile_rows_to_soft_delete: extraRows.map((row) => row.id),
  }
}

async function reconcileMembership(user, targetTenantId, roleValue) {
  const rows = await listMembershipRows(user.id, targetTenantId)
  const activeRows = rows.filter(
    (row) => !isDeleted(row) && String(row.status ?? '').trim().toLowerCase() === 'active'
  )
  const primaryRow = activeRows[0] ?? rows[0] ?? null
  const extraRows = activeRows.slice(1)
  const now = new Date().toISOString()

  const payload = {
    tenant_id: targetTenantId,
    user_id: user.id,
    role: roleValue,
    status: 'active',
    deleted_at: null,
    updated_at: now,
  }

  if (dryRun) {
    return {
      action: primaryRow ? 'update' : 'insert',
      extra_membership_rows_to_soft_delete: extraRows.map((row) => row.id),
    }
  }

  if (primaryRow) {
    const { error } = await supabase
      .from('tenant_memberships')
      .update(payload)
      .eq('id', primaryRow.id)

    if (error) {
      throw error
    }
  } else {
    const { error } = await supabase
      .from('tenant_memberships')
      .insert({
        ...payload,
        created_at: now,
      })

    if (error) {
      throw error
    }
  }

  for (const row of extraRows) {
    const { error } = await supabase
      .from('tenant_memberships')
      .update({
        status: 'inactive',
        deleted_at: now,
        updated_at: now,
      })
      .eq('id', row.id)

    if (error) {
      throw error
    }
  }

  return {
    action: primaryRow ? 'updated' : 'inserted',
    extra_membership_rows_to_soft_delete: extraRows.map((row) => row.id),
  }
}

async function verifyAccess(targetUserId, targetTenantId) {
  const { data: profileRows, error: profileError } = await supabase
    .from('users_profiles')
    .select('id, auth_user_id, role, is_active, deleted_at')
    .eq('auth_user_id', targetUserId)

  if (profileError) {
    throw profileError
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from('tenant_memberships')
    .select('id, tenant_id, user_id, role, status, deleted_at')
    .eq('tenant_id', targetTenantId)
    .eq('user_id', targetUserId)

  if (membershipError) {
    throw membershipError
  }

  const activeProfile =
    (profileRows ?? []).find((row) => !isDeleted(row) && row.is_active !== false) ?? null
  const activeMembership =
    (membershipRows ?? []).find(
      (row) =>
        !isDeleted(row) && String(row.status ?? '').trim().toLowerCase() === 'active'
    ) ?? null

  return {
    profile: activeProfile,
    membership: activeMembership,
    access_ready: Boolean(activeProfile && activeMembership),
  }
}

async function main() {
  const user = await getAuthUser(userId)
  await getTenant(tenantId)

  const profileResult = await reconcileProfile(user, role)
  const membershipResult = await reconcileMembership(user, tenantId, role)
  const verification = await verifyAccess(user.id, tenantId)

  console.log(
    JSON.stringify(
      {
        user_id: user.id,
        tenant_id: tenantId,
        role,
        dry_run: dryRun,
        profile: profileResult,
        membership: membershipResult,
        verification,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  const message = formatError(error)
  console.error(`Operator access reconciliation failed: ${message}`)
  process.exit(1)
})
