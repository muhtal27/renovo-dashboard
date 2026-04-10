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
      id, tenant_id, email_log_id, attachment_urls, suggested_tenancy_ids, match_reason, created_at,
      email_log:inbound_email_log(id, from_address, subject, status, created_at)
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
  let attachmentsLinked = 0
  if (openCase && queueItem.attachment_urls?.length > 0) {
    const rows = (queueItem.attachment_urls as string[]).map((url) => ({
      case_id: openCase.id,
      tenant_id: tenantId,
      document_type: 'inventory_report' as const,
      document_name: url.split('/').pop() ?? 'attachment',
      file_path: url,
      source: 'email' as const,
    }))

    const { error: docError } = await supabase
      .from('checkout_documents')
      .insert(rows)

    if (docError) {
      return NextResponse.json(
        { error: 'Failed to attach documents to case.' },
        { status: 500 }
      )
    }
    attachmentsLinked = rows.length
  }

  // Mark queue item as resolved
  const { error: resolveError } = await supabase
    .from('inbound_unmatched_queue')
    .update({
      resolved: true,
      resolved_by: authResult.context.user.id,
      resolved_at: new Date().toISOString(),
      resolved_tenancy_id: body.tenancy_id,
    })
    .eq('id', body.queue_item_id)

  if (resolveError) {
    return NextResponse.json(
      { error: 'Failed to mark queue item as resolved.' },
      { status: 500 }
    )
  }

  // Update the log entry
  const { error: logError } = await supabase
    .from('inbound_email_log')
    .update({
      status: 'matched',
      matched_property_id: tenancy.property_id,
      matched_tenancy_id: body.tenancy_id,
      matched_case_id: openCase?.id ?? null,
    })
    .eq('id', queueItem.email_log_id)

  if (logError) {
    // Queue item already resolved — log the failure but don't roll back
    console.error('Failed to update inbound_email_log after resolving queue item', {
      queueItemId: body.queue_item_id,
      emailLogId: queueItem.email_log_id,
      error: logError.message,
    })
  }

  return NextResponse.json({
    ok: true,
    case_id: openCase?.id ?? null,
    attachments_linked: attachmentsLinked,
  })
}
