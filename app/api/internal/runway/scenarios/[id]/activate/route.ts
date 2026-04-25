import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { requireInternalUserForApi } from '@/lib/internal-auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

// Activating a scenario is two sequential updates:
//   1. Deactivate whatever is currently active
//   2. Activate the target
// The partial unique index uq_finance_scenarios_one_active enforces
// the invariant even if step 2 fails — worst case we temporarily have
// zero active scenarios, which the caller can recover from by retrying.
export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireInternalUserForApi()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  const supabase = getSupabaseServiceRoleClient()

  const deactivated = await supabase
    .from('finance_scenarios')
    .update({ is_active: false, updated_by: auth.user.id })
    .eq('is_active', true)
    .is('deleted_at', null)

  if (deactivated.error) {
    console.error('scenarios activate - deactivate step', deactivated.error.message)
    return NextResponse.json({ error: 'Failed to deactivate previous.' }, { status: 500 })
  }

  const activated = await supabase
    .from('finance_scenarios')
    .update({ is_active: true, updated_by: auth.user.id })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (activated.error) {
    console.error('scenarios activate - activate step', activated.error.message)
    return NextResponse.json({ error: 'Failed to activate scenario.' }, { status: 500 })
  }

  if (!activated.data) {
    return NextResponse.json({ error: 'Scenario not found.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
