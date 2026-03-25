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

  const metadata = operator.authUser.user_metadata

  return (
    operator.profile?.full_name ||
    (typeof metadata?.full_name === 'string' ? metadata.full_name : null) ||
    (typeof metadata?.name === 'string' ? metadata.name : null) ||
    operator.authUser.email ||
    ''
  )
}
