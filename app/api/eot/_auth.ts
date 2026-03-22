import {
  getSupabaseRlsClient,
  getSupabaseServerAuthClient,
} from '@/lib/supabase-admin'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

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
    throw new ApiError('Missing bearer token.', 401)
  }

  const authClient = getSupabaseServerAuthClient()
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token)

  if (authError || !user) {
    throw new ApiError(authError?.message || 'Unable to verify operator session.', 401)
  }

  const rlsClient = getSupabaseRlsClient(token)
  const { data: operatorProfile, error: profileError } = await rlsClient
    .from('users_profiles')
    .select('id, is_active')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new ApiError(profileError.message, 500)
  }

  if (!operatorProfile || operatorProfile.is_active === false) {
    throw new ApiError('Only active operators can access end-of-tenancy workflows.', 403)
  }

  return {
    accessToken: token,
    operatorProfileId: operatorProfile.id,
    authUserId: user.id,
  }
}
