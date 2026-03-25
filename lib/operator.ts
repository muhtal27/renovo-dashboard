'use client'

import { supabase } from '@/lib/supabase'
import type { CurrentOperator, OperatorProfile } from '@/lib/operator-types'

export type { CurrentOperator, OperatorProfile } from '@/lib/operator-types'
export { getOperatorLabel } from '@/lib/operator-types'

const OPERATOR_PROFILE_CACHE_TTL_MS = 5 * 60 * 1000

const operatorProfileCache = new Map<
  string,
  {
    loadedAt: number
    profile: OperatorProfile | null
  }
>()

const operatorProfileInflight = new Map<string, Promise<OperatorProfile | null>>()

function isMissingUsersProfilesSource(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const code = 'code' in error ? error.code : null
  const message = 'message' in error ? error.message : null

  return (
    code === 'PGRST205' ||
    (typeof message === 'string' &&
      message.toLowerCase().includes('users_profiles'))
  )
}

export async function getOperatorProfile(userId: string) {
  const cached = operatorProfileCache.get(userId)

  if (cached && Date.now() - cached.loadedAt < OPERATOR_PROFILE_CACHE_TTL_MS) {
    return cached.profile
  }

  const inflight = operatorProfileInflight.get(userId)

  if (inflight) {
    return inflight
  }

  const request = (async () => {
    const { data: profile, error: profileError } = await supabase
      .from('users_profiles')
      .select('id, full_name, avatar_url, is_active, role')
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (profileError) {
      if (isMissingUsersProfilesSource(profileError)) {
        operatorProfileCache.set(userId, {
          loadedAt: Date.now(),
          profile: null,
        })

        return null
      }

      throw profileError
    }

    const normalizedProfile = (profile as OperatorProfile | null) ?? null

    operatorProfileCache.set(userId, {
      loadedAt: Date.now(),
      profile: normalizedProfile,
    })

    return normalizedProfile
  })()

  operatorProfileInflight.set(userId, request)

  try {
    return await request
  } finally {
    operatorProfileInflight.delete(userId)
  }
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
