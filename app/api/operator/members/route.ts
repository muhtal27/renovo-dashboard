import { NextResponse } from 'next/server'
import { getOperatorMembershipContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

export async function GET() {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = result.context.tenantId

  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_memberships')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (membershipError) {
    return NextResponse.json({ error: 'Failed to load members.' }, { status: 500 })
  }

  const { data: authUsers } = await supabase.auth.admin.listUsers({
    perPage: 500,
  })

  const userMap = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u])
  )

  const members = memberships.map((m: Record<string, unknown>) => {
    const authUser = userMap.get(m.user_id as string)

    return {
      membershipId: m.id,
      userId: m.user_id,
      email: authUser?.email ?? null,
      fullName:
        (authUser?.user_metadata as Record<string, unknown>)?.full_name ??
        (authUser?.user_metadata as Record<string, unknown>)?.name ??
        null,
      role: m.role,
      status: m.status,
      createdAt: m.created_at,
    }
  })

  return NextResponse.json({ members })
}

export async function POST(request: Request) {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const body = await request.json()
  const { email, role } = body as { email?: string; role?: string }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  const normalizedRole = role === 'admin' || role === 'manager' ? role : 'operator'

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = result.context.tenantId

  // Check if user already exists in auth
  const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 500 })
  let authUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  // Create auth user if they don't exist
  if (!authUser) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
    })

    if (createError || !newUser.user) {
      return NextResponse.json(
        { error: `Could not create user: ${createError?.message ?? 'unknown error'}` },
        { status: 500 }
      )
    }

    authUser = newUser.user
  }

  // Check if membership already exists for this tenant
  const { data: existingMembership } = await supabase
    .from('tenant_memberships')
    .select('id, status, deleted_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (existingMembership && !existingMembership.deleted_at) {
    return NextResponse.json(
      { error: 'This user already has a membership in this workspace.' },
      { status: 409 }
    )
  }

  // Create or restore membership
  if (existingMembership?.deleted_at) {
    const { error: updateError } = await supabase
      .from('tenant_memberships')
      .update({ role: normalizedRole, status: 'active', deleted_at: null })
      .eq('id', existingMembership.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to restore membership.' }, { status: 500 })
    }
  } else {
    const { error: insertError } = await supabase
      .from('tenant_memberships')
      .insert({
        tenant_id: tenantId,
        user_id: authUser.id,
        role: normalizedRole,
        status: 'active',
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create membership.' }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    email: authUser.email,
    role: normalizedRole,
  })
}
