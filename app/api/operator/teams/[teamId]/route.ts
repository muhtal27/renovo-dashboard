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

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .eq('tenant_id', result.context.tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (teamError || !team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 })
  }

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.created_at,
    },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const { teamId } = await params
  const body = await request.json()
  const { name, description } = body as { name?: string; description?: string }

  const supabase = getSupabaseServiceRoleClient()

  // Verify team belongs to this tenant
  const { data: team, error: fetchError } = await supabase
    .from('teams')
    .select('id, tenant_id')
    .eq('id', teamId)
    .eq('tenant_id', result.context.tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError || !team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (name && typeof name === 'string' && name.trim().length > 0) {
    // Check for duplicate name
    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .eq('tenant_id', result.context.tenantId)
      .eq('name', name.trim())
      .is('deleted_at', null)
      .neq('id', teamId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'A team with this name already exists.' },
        { status: 409 }
      )
    }

    updates.name = name.trim()
  }

  if (description !== undefined) {
    updates.description = description?.trim() || null
  }

  const { error: updateError } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update team.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
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
  const { data: team, error: fetchError } = await supabase
    .from('teams')
    .select('id, tenant_id')
    .eq('id', teamId)
    .eq('tenant_id', result.context.tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError || !team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 })
  }

  // Soft-delete the team and all its memberships
  const now = new Date().toISOString()

  const { error: deleteTeamError } = await supabase
    .from('teams')
    .update({ deleted_at: now })
    .eq('id', teamId)

  if (deleteTeamError) {
    return NextResponse.json({ error: 'Failed to delete team.' }, { status: 500 })
  }

  // Soft-delete all team memberships
  await supabase
    .from('team_memberships')
    .update({ deleted_at: now })
    .eq('team_id', teamId)
    .is('deleted_at', null)

  return NextResponse.json({ ok: true })
}
