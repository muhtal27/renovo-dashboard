import { createClient } from '@supabase/supabase-js'

function requireFirstEnv(names: readonly string[]) {
  for (const name of names) {
    const value = process.env[name]

    if (value) {
      return value
    }
  }

  throw new Error(`Missing ${names.join(' or ')}.`)
}

function requireSupabaseUrl() {
  return requireFirstEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'] as const)
}

function requireSupabaseAnonKey() {
  return requireFirstEnv(['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'] as const)
}

function requireSupabaseServiceRoleKey() {
  return requireFirstEnv(['SUPABASE_SERVICE_ROLE_KEY'] as const)
}

export function getSupabaseServerAuthClient() {
  return createClient(
    requireSupabaseUrl(),
    requireSupabaseAnonKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

export function getSupabaseRlsClient(accessToken: string) {
  return createClient(
    requireSupabaseUrl(),
    requireSupabaseAnonKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )
}

export function getSupabaseServiceRoleClient() {
  return createClient(
    requireSupabaseUrl(),
    requireSupabaseServiceRoleKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
