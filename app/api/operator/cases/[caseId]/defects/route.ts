import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

type RouteContext = {
  params: Promise<{
    caseId: string
  }>
}

type DefectUpdate = {
  defectId: string
  operatorLiability: 'tenant' | 'landlord' | 'shared' | null
  costAdjusted: number | null
  excluded: boolean
}

type PatchBody = {
  updates: DefectUpdate[]
}

const VALID_LIABILITIES = ['tenant', 'landlord', 'shared', null]

export async function PATCH(request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.VIEW_CASE)
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const tenantId = authResult.context.tenantId
  const userId = authResult.context.user.id

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!Array.isArray(body.updates) || body.updates.length === 0) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  // Validate all updates
  for (const update of body.updates) {
    if (!update.defectId || typeof update.defectId !== 'string') {
      return NextResponse.json({ error: 'Each update must have a defectId.' }, { status: 400 })
    }
    if (!VALID_LIABILITIES.includes(update.operatorLiability)) {
      return NextResponse.json(
        { error: `Invalid liability value: ${update.operatorLiability}` },
        { status: 400 }
      )
    }
    if (update.costAdjusted != null && (typeof update.costAdjusted !== 'number' || update.costAdjusted < 0)) {
      return NextResponse.json({ error: 'costAdjusted must be a non-negative number or null.' }, { status: 400 })
    }
  }

  const supabase = getSupabaseServiceRoleClient()

  // Verify the case belongs to this tenant by checking checkout_cases
  const { data: checkoutCase, error: caseError } = await supabase
    .from('checkout_cases')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('case_id', caseId)
    .is('deleted_at', null)
    .maybeSingle()

  if (caseError) {
    console.error('defects PATCH - case lookup error', { caseId, error: caseError.message })
    return NextResponse.json({ error: 'Failed to verify case ownership.' }, { status: 500 })
  }

  if (!checkoutCase) {
    return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const errors: string[] = []
  let updated = 0

  // Process each defect update
  for (const update of body.updates) {
    const { error: updateError } = await supabase
      .from('checkout_defects')
      .update({
        operator_liability: update.excluded ? null : update.operatorLiability,
        cost_adjusted: update.excluded ? 0 : update.costAdjusted,
        reviewed_at: now,
        reviewed_by: userId,
        updated_at: now,
      })
      .eq('id', update.defectId)
      .eq('tenant_id', tenantId)
      .eq('case_id', checkoutCase.id)

    if (updateError) {
      console.error('defects PATCH - update error', {
        defectId: update.defectId,
        error: updateError.message,
      })
      errors.push(`Failed to update defect ${update.defectId}`)
    } else {
      updated++
    }
  }

  if (errors.length > 0 && updated === 0) {
    return NextResponse.json({ error: 'All updates failed.', errors }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  })
}
