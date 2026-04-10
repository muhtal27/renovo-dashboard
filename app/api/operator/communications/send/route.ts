/**
 * POST /api/operator/communications/send — Send a message on a case
 */

import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function POST(request: Request) {
  const authResult = await getOperatorTenantContextForApi(
    OPERATOR_PERMISSIONS.EDIT_CASE
  )

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const body = (await request.json()) as {
    case_id?: string
    recipient_type?: string
    content?: string
    subject?: string
  }

  if (!body.case_id?.trim() || !body.content?.trim()) {
    return NextResponse.json(
      { error: 'case_id and content are required.' },
      { status: 400 }
    )
  }

  if (!body.recipient_type || !['tenant', 'landlord'].includes(body.recipient_type)) {
    return NextResponse.json(
      { error: 'recipient_type must be "tenant" or "landlord".' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = authResult.context.tenantId

  // Verify the case belongs to this tenant
  const { data: caseData } = await supabase
    .from('cases')
    .select('id')
    .eq('id', body.case_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!caseData) {
    return NextResponse.json(
      { error: 'Case not found or access denied.' },
      { status: 404 }
    )
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      tenant_id: tenantId,
      case_id: body.case_id,
      sender_type: 'manager',
      sender_id: authResult.context.user.id,
      content: body.content.trim(),
      topic: body.subject?.trim() || 'general',
      extension: '',
      attachments: [],
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to send message', { error, tenantId })
    return NextResponse.json(
      { error: 'Failed to send message.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: data }, { status: 201 })
}
