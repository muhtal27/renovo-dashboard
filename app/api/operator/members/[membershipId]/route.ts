import { NextResponse } from 'next/server'
import { getOperatorMembershipContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const { membershipId } = await params
  const body = await request.json()
  const { role, status } = body as { role?: string; status?: string }

  // Prevent admins from demoting themselves
  if (membershipId === result.context.membershipId && role && role !== 'admin') {
    return NextResponse.json(
      { error: 'You cannot change your own role.' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseServiceRoleClient()

  // Verify membership belongs to this tenant
  const { data: membership, error: fetchError } = await supabase
    .from('tenant_memberships')
    .select('id, tenant_id')
    .eq('id', membershipId)
    .eq('tenant_id', result.context.tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError || !membership) {
    return NextResponse.json({ error: 'Membership not found.' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}

  if (role && (role === 'operator' || role === 'manager' || role === 'admin')) {
    updates.role = role
  }

  if (status && (status === 'active' || status === 'inactive' || status === 'suspended')) {
    updates.status = status
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('tenant_memberships')
    .update(updates)
    .eq('id', membershipId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update membership.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const { membershipId } = await params

  // Prevent admins from removing themselves
  if (membershipId === result.context.membershipId) {
    return NextResponse.json(
      { error: 'You cannot remove your own membership.' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseServiceRoleClient()

  // Verify membership belongs to this tenant
  const { data: membership, error: fetchError } = await supabase
    .from('tenant_memberships')
    .select('id, tenant_id')
    .eq('id', membershipId)
    .eq('tenant_id', result.context.tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError || !membership) {
    return NextResponse.json({ error: 'Membership not found.' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('tenant_memberships')
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
    .eq('id', membershipId)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to remove member.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
