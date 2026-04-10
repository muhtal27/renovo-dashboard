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

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, description, created_at')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (teamsError) {
    return NextResponse.json({ error: 'Failed to load teams.' }, { status: 500 })
  }

  // Get member counts for each team
  const teamIds = teams.map((t: Record<string, unknown>) => t.id as string)

  let memberCounts: Record<string, number> = {}

  if (teamIds.length > 0) {
    const { data: memberships } = await supabase
      .from('team_memberships')
      .select('team_id')
      .in('team_id', teamIds)
      .is('deleted_at', null)

    if (memberships) {
      memberCounts = memberships.reduce(
        (acc: Record<string, number>, m: Record<string, unknown>) => {
          const tid = m.team_id as string
          acc[tid] = (acc[tid] ?? 0) + 1
          return acc
        },
        {}
      )
    }
  }

  const result_teams = teams.map((t: Record<string, unknown>) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    memberCount: memberCounts[t.id as string] ?? 0,
    createdAt: t.created_at,
  }))

  return NextResponse.json({ teams: result_teams })
}

export async function POST(request: Request) {
  const result = await getOperatorMembershipContextForApi(OPERATOR_PERMISSIONS.MANAGE_USERS)

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const body = await request.json()
  const { name, description } = body as { name?: string; description?: string }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'A team name is required.' }, { status: 400 })
  }

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = result.context.tenantId

  // Check for duplicate name
  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('name', name.trim())
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'A team with this name already exists.' },
      { status: 409 }
    )
  }

  const { data: team, error: insertError } = await supabase
    .from('teams')
    .insert({
      tenant_id: tenantId,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .select('id, name, description, created_at')
    .single()

  if (insertError || !team) {
    return NextResponse.json({ error: 'Failed to create team.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, team })
}
