import { NextResponse } from 'next/server'
import { getOperatorMembershipContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { resolveAuthUsersByIds } from '@/lib/operator-auth-users'

export async function GET() {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.VIEW_CASE)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = result.context.tenantId

  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_memberships')
    .select('user_id')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)

  if (membershipError) {
    return NextResponse.json({ error: 'Failed to load assignees.' }, { status: 500 })
  }

  const userIds = memberships.map((m: { user_id: string }) => m.user_id)
  const userMap = await resolveAuthUsersByIds(supabase, userIds)

  const assignees = userIds.map((userId: string) => {
    const authUser = userMap.get(userId)
    return {
      userId,
      fullName:
        (authUser?.user_metadata as Record<string, unknown>)?.full_name ??
        (authUser?.user_metadata as Record<string, unknown>)?.name ??
        null,
      email: authUser?.email ?? null,
    }
  })

  return NextResponse.json({ assignees }, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } })
}
