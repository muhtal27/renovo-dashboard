import {
  getSupabaseRlsClient,
  getSupabaseServerAuthClient,
} from '@/lib/supabase-admin'

async function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization') || ''

  if (!authHeader.toLowerCase().startsWith('bearer ')) return null

  return authHeader.slice(7).trim()
}

export type ActiveOperatorContext = {
  accessToken: string
  operatorProfileId: string
  authUserId: string
}

export async function requireActiveOperator(request: Request): Promise<ActiveOperatorContext> {
  const token = await getBearerToken(request)

  if (!token) {
    throw new Error('Missing bearer token.')
  }

  const authClient = getSupabaseServerAuthClient()
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token)

  if (authError || !user) {
    throw new Error(authError?.message || 'Unable to verify operator session.')
  }

  const rlsClient = getSupabaseRlsClient(token)
  const { data: operatorProfile, error: profileError } = await rlsClient
    .from('users_profiles')
    .select('id, is_active')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (!operatorProfile || operatorProfile.is_active === false) {
    throw new Error('Only active operators can access end-of-tenancy workflows.')
  }

  return {
    accessToken: token,
    operatorProfileId: operatorProfile.id,
    authUserId: user.id,
  }
}
