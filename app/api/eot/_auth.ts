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

type CachedOperatorProfile = {
  operatorProfileId: string
  expiresAt: number
}

const operatorProfileCache = new Map<string, CachedOperatorProfile>()
const OPERATOR_PROFILE_CACHE_TTL_MS = 30_000
// This only caches the post-auth active users_profiles lookup on warm instances.
// Activation changes may take up to 30 seconds to propagate to cached requests.

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

  const cachedOperator = operatorProfileCache.get(user.id)

  if (cachedOperator && Date.now() < cachedOperator.expiresAt) {
    return {
      accessToken: token,
      operatorProfileId: cachedOperator.operatorProfileId,
      authUserId: user.id,
    }
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
    operatorProfileCache.delete(user.id)
    throw new ApiError('Only active operators can access end-of-tenancy workflows.', 403)
  }

  operatorProfileCache.set(user.id, {
    operatorProfileId: operatorProfile.id,
    expiresAt: Date.now() + OPERATOR_PROFILE_CACHE_TTL_MS,
  })

  return {
    accessToken: token,
    operatorProfileId: operatorProfile.id,
    authUserId: user.id,
  }
}
