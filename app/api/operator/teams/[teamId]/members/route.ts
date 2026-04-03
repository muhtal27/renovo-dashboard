import { NextResponse } from 'next/server'
import { getOperatorMembershipContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const { teamId } = await params
  const supabase = getSupabaseServiceRoleClient()

  // Verify team belongs to this tenant
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .eq('tenant_id', result.context.tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 })
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('team_memberships')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (membershipError) {
    return NextResponse.json({ error: 'Failed to load team members.' }, { status: 500 })
  }

  // Resolve user details from auth — fetch only the users in this team
  const userIds = memberships.map((m: Record<string, unknown>) => m.user_id as string)
  const authUsers = await Promise.all(
    userIds.map((id) => supabase.auth.admin.getUserById(id).then((r) => r.data?.user ?? null))
  )
  const userMap = new Map(
    authUsers.filter(Boolean).map((u) => [u!.id, u!])
  )

  const members = memberships.map((m: Record<string, unknown>) => {
    const authUser = userMap.get(m.user_id as string)

    return {
      teamMembershipId: m.id,
      userId: m.user_id,
      email: authUser?.email ?? null,
      fullName:
        (authUser?.user_metadata as Record<string, unknown>)?.full_name ??
        (authUser?.user_metadata as Record<string, unknown>)?.name ??
        null,
      role: m.role,
      createdAt: m.created_at,
    }
  })

  return NextResponse.json({ members })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const { teamId } = await params
  const body = await request.json()
  const { userId, role } = body as { userId?: string; role?: string }

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'A user ID is required.' }, { status: 400 })
  }

  const normalizedRole = role === 'lead' ? 'lead' : 'member'
  const supabase = getSupabaseServiceRoleClient()

  // Verify team belongs to this tenant
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .eq('tenant_id', result.context.tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 })
  }

  // Verify user is a member of this tenant (workspace)
  const { data: tenantMembership } = await supabase
    .from('tenant_memberships')
    .select('id')
    .eq('tenant_id', result.context.tenantId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!tenantMembership) {
    return NextResponse.json(
      { error: 'This user is not a member of the workspace. Add them as a workspace member first.' },
      { status: 400 }
    )
  }

  // Check for existing team membership
  const { data: existing } = await supabase
    .from('team_memberships')
    .select('id, deleted_at')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing && !existing.deleted_at) {
    return NextResponse.json(
      { error: 'This user is already a member of this team.' },
      { status: 409 }
    )
  }

  // Restore or create
  if (existing?.deleted_at) {
    const { error: updateError } = await supabase
      .from('team_memberships')
      .update({ role: normalizedRole, deleted_at: null })
      .eq('id', existing.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to add member to team.' }, { status: 500 })
    }
  } else {
    const { error: insertError } = await supabase
      .from('team_memberships')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: normalizedRole,
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to add member to team.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
