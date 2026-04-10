/**
 * PATCH /api/operator/cases/[caseId]/negotiation — Update negotiation status and notes
 *
 * Body:
 *   negotiation_status?  — 'pending' | 'agreed' | 'disputed'
 *   negotiation_notes?   — string
 *   submission_type?     — 'release' | 'dispute' | null
 */

import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

const VALID_NEGOTIATION_STATUSES = ['pending', 'agreed', 'disputed'] as const
const VALID_SUBMISSION_TYPES = ['release', 'dispute'] as const

type RouteContext = {
  params: Promise<{ caseId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await getOperatorTenantContextForApi(
    OPERATOR_PERMISSIONS.EDIT_CASE
  )

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const { caseId } = await context.params
  const tenantId = authResult.context.tenantId
  const supabase = getSupabaseServiceRoleClient()

  // Verify case belongs to this tenant
  const { data: caseData } = await supabase
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .eq('tenant_id', tenantId)
    .single()

  if (!caseData) {
    return NextResponse.json(
      { error: 'Case not found or access denied.' },
      { status: 404 }
    )
  }

  const body = (await request.json()) as {
    negotiation_status?: string
    negotiation_notes?: string
    submission_type?: string | null
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.negotiation_status !== undefined) {
    if (
      !VALID_NEGOTIATION_STATUSES.includes(
        body.negotiation_status as (typeof VALID_NEGOTIATION_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        { error: 'negotiation_status must be pending, agreed, or disputed.' },
        { status: 400 }
      )
    }
    updates.negotiation_status = body.negotiation_status
  }

  if (body.negotiation_notes !== undefined) {
    updates.negotiation_notes = body.negotiation_notes.trim() || null
  }

  if (body.submission_type !== undefined) {
    if (
      body.submission_type !== null &&
      !VALID_SUBMISSION_TYPES.includes(
        body.submission_type as (typeof VALID_SUBMISSION_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        { error: 'submission_type must be release, dispute, or null.' },
        { status: 400 }
      )
    }
    updates.submission_type = body.submission_type
  }

  const { data, error } = await supabase
    .from('checkout_cases')
    .update(updates)
    .eq('case_id', caseId)
    .select('negotiation_status, negotiation_notes, submission_type, updated_at')
    .single()

  if (error) {
    console.error('Failed to update negotiation', { error, tenantId, caseId })
    return NextResponse.json(
      { error: 'Failed to update negotiation.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Checkout case not found.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ negotiation: data })
}
