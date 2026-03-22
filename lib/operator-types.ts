import type { User } from '@supabase/supabase-js'

export type OperatorProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_active: boolean | null
  role: string | null
}

export type CurrentOperator = {
  authUser: User | null
  profile: OperatorProfile | null
}

export function getOperatorLabel(operator: CurrentOperator | null) {
  if (!operator?.authUser) return ''

  return operator.profile?.full_name || operator.authUser.email || ''
}
