import { NextResponse } from 'next/server'
import { getOperatorMembershipContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string; teamMembershipId: string }> }
) {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const { teamId, teamMembershipId } = await params
  const body = await request.json()
  const { role } = body as { role?: string }

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

  // Verify team membership exists
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('id')
    .eq('id', teamMembershipId)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Team membership not found.' }, { status: 404 })
  }

  if (!role || (role !== 'member' && role !== 'lead')) {
    return NextResponse.json({ error: 'Role must be "member" or "lead".' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('team_memberships')
    .update({ role })
    .eq('id', teamMembershipId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update role.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ teamId: string; teamMembershipId: string }> }
) {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const { teamId, teamMembershipId } = await params
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

  // Verify team membership exists
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('id')
    .eq('id', teamMembershipId)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Team membership not found.' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('team_memberships')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', teamMembershipId)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to remove member from team.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
