import { NextResponse } from 'next/server'
import {
  getSupabaseRlsClient,
  getSupabaseServerAuthClient,
  getSupabaseServiceRoleClient,
} from '@/lib/supabase-admin'

type OperatorRole = 'admin' | 'manager' | 'operator' | 'viewer'
type PortalRole = 'tenant' | 'landlord' | 'contractor'

type SyncAccessPayload = {
  action: 'sync_access'
  email: string
  fullName: string
  displayName: string
  isActive: boolean
  grantOperatorAccess: boolean
  workspaceRole: OperatorRole
  grantPortalAccess: boolean
  portalRole: PortalRole
  contactId: string
  contractorId?: string | null
}

async function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization') || ''

  if (!authHeader.toLowerCase().startsWith('bearer ')) return null

  return authHeader.slice(7).trim()
}

async function requireActiveOperator(request: Request) {
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
    throw new Error('Only active operators can manage onboarding.')
  }

  return token
}

async function findAuthUserIdByEmail(email: string) {
  const serviceClient = getSupabaseServiceRoleClient()
  const { data, error } = await serviceClient
    .schema('auth')
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data?.id ?? null
}

function normalizeContractorId(portalRole: PortalRole, contractorId: string | null | undefined) {
  return portalRole === 'contractor' ? contractorId?.trim() || null : null
}

export async function POST(request: Request) {
  try {
    const accessToken = await requireActiveOperator(request)
    const payload = (await request.json()) as SyncAccessPayload

    if (payload.action !== 'sync_access') {
      return NextResponse.json({ error: 'Unsupported onboarding action.' }, { status: 400 })
    }

    const email = payload.email.trim().toLowerCase()
    const fullName = payload.fullName.trim()
    const displayName = payload.displayName.trim()
    const contactId = payload.contactId.trim()

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    if (!payload.grantOperatorAccess && !payload.grantPortalAccess) {
      return NextResponse.json({ error: 'Choose at least one access role.' }, { status: 400 })
    }

    if (payload.grantOperatorAccess && !fullName) {
      return NextResponse.json(
        { error: 'Full name is required for dashboard access.' },
        { status: 400 }
      )
    }

    if (payload.grantPortalAccess && (!displayName || !contactId)) {
      return NextResponse.json(
        { error: 'Display name and linked contact are required for portal access.' },
        { status: 400 }
      )
    }

    const authUserId = await findAuthUserIdByEmail(email)

    if (!authUserId) {
      return NextResponse.json(
        {
          error:
            'No Supabase Auth user exists for that email yet. Create the auth user first, then assign access here.',
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseRlsClient(accessToken)

    if (payload.grantOperatorAccess) {
      const { error } = await supabase.from('users_profiles').upsert(
        {
          auth_user_id: authUserId,
          email,
          full_name: fullName,
          role: payload.workspaceRole,
          is_active: payload.isActive,
        },
        {
          onConflict: 'auth_user_id',
        }
      )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    if (payload.grantPortalAccess) {
      const { error } = await supabase.from('portal_profiles').upsert(
        {
          auth_user_id: authUserId,
          contact_id: contactId,
          portal_role: payload.portalRole,
          contractor_id: normalizeContractorId(payload.portalRole, payload.contractorId),
          display_name: displayName,
          is_active: payload.isActive,
        },
        {
          onConflict: 'auth_user_id',
        }
      )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Access updated successfully.',
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing SUPABASE_SERVICE_ROLE_KEY')
    ) {
      return NextResponse.json(
        {
          error:
            'New Business onboarding requires the server-side SUPABASE_SERVICE_ROLE_KEY env var. Add it to `.env.local` for local development or to your deployment environment, then retry.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to process onboarding right now.',
      },
      { status: 500 }
    )
  }
}
