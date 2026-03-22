import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type OperatorProfile = {
  id: string
  full_name: string | null
  is_active: boolean | null
  role: string | null
}

export type CurrentOperator = {
  authUser: User | null
  profile: OperatorProfile | null
}

export async function getOperatorProfile(userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from('users_profiles')
    .select('id, full_name, is_active, role')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  return (profile as OperatorProfile | null) ?? null
}

export async function getCurrentOperator(): Promise<CurrentOperator> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  const user = session?.user ?? null

  if (!user) {
    return {
      authUser: null,
      profile: null,
    }
  }

  const profile = await getOperatorProfile(user.id)

  return {
    authUser: user,
    profile,
  }
}

export async function getSessionUser() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  return session?.user ?? null
}

export function getOperatorLabel(operator: CurrentOperator | null) {
  if (!operator?.authUser) return 'Unknown operator'

  return (
    operator.profile?.full_name ||
    operator.authUser.user_metadata?.full_name ||
    operator.authUser.email ||
    'Unknown operator'
  )
}
