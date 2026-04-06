/**
 * GET  /api/operator/inbound-email/unmatched — List unmatched emails
 * POST /api/operator/inbound-email/unmatched — Resolve an unmatched email
 */

import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function GET() {
  const authResult = await getOperatorTenantContextForApi(
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = authResult.context.tenantId

  const { data, error } = await supabase
    .from('inbound_unmatched_queue')
    .select(`
      *,
      email_log:inbound_email_log(*)
    `)
    .eq('tenant_id', tenantId)
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: Request) {
  const authResult = await getOperatorTenantContextForApi(
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = authResult.context.tenantId

  const body = (await request.json()) as {
    queue_item_id: string
    tenancy_id: string
  }

  if (!body.queue_item_id || !body.tenancy_id) {
    return NextResponse.json(
      { error: 'Missing queue_item_id or tenancy_id' },
      { status: 400 }
    )
  }

  // Fetch the queue item
  const { data: queueItem } = await supabase
    .from('inbound_unmatched_queue')
    .select('*, email_log:inbound_email_log(*)')
    .eq('id', body.queue_item_id)
    .eq('tenant_id', tenantId)
    .eq('resolved', false)
    .single()

  if (!queueItem) {
    return NextResponse.json({ error: 'Queue item not found' }, { status: 404 })
  }

  // Verify the tenancy belongs to this tenant
  const { data: tenancy } = await supabase
    .from('tenancies')
    .select('id, property_id')
    .eq('id', body.tenancy_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!tenancy) {
    return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 })
  }

  // Find open case for this tenancy
  const { data: openCase } = await supabase
    .from('cases')
    .select('id')
    .eq('tenancy_id', body.tenancy_id)
    .neq('status', 'closed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Attach documents if there are attachment URLs and a case exists
  if (openCase && queueItem.attachment_urls?.length > 0) {
    for (const url of queueItem.attachment_urls as string[]) {
      const filename = url.split('/').pop() ?? 'attachment'
      await supabase.from('checkout_documents').insert({
        case_id: openCase.id,
        tenant_id: tenantId,
        document_type: 'inventory_report',
        document_name: filename,
        file_path: url,
        source: 'email',
      })
    }
  }

  // Mark queue item as resolved
  await supabase
    .from('inbound_unmatched_queue')
    .update({
      resolved: true,
      resolved_by: authResult.context.user.id,
      resolved_at: new Date().toISOString(),
      resolved_tenancy_id: body.tenancy_id,
    })
    .eq('id', body.queue_item_id)

  // Update the log entry
  await supabase
    .from('inbound_email_log')
    .update({
      status: 'matched',
      matched_property_id: tenancy.property_id,
      matched_tenancy_id: body.tenancy_id,
      matched_case_id: openCase?.id ?? null,
    })
    .eq('id', queueItem.email_log_id)

  return NextResponse.json({
    ok: true,
    case_id: openCase?.id ?? null,
    attachments_linked: openCase ? queueItem.attachment_urls?.length ?? 0 : 0,
  })
}
