/**
 * GET  /api/operator/inbound-email — List email config + recent logs + unmatched count
 * POST /api/operator/inbound-email — Create/update inbound email config
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

  const [configResult, logsResult, unmatchedResult] = await Promise.all([
    supabase
      .from('inbound_email_configs')
      .select('id, tenant_id, address_prefix, is_active, allowed_sender_domains, updated_at')
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('inbound_email_log')
      .select('id, tenant_id, resend_email_id, from_address, subject, status, matched_property_id, matched_tenancy_id, matched_case_id, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('inbound_unmatched_queue')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('resolved', false),
  ])

  return NextResponse.json({
    config: configResult.data ?? null,
    recentLogs: logsResult.data ?? [],
    unmatchedCount: unmatchedResult.count ?? 0,
  })
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
    address_prefix?: string
    is_active?: boolean
    allowed_sender_domains?: string[]
  }

  const prefix = body.address_prefix?.trim().toLowerCase()
  if (!prefix || prefix.length < 2 || prefix.length > 60) {
    return NextResponse.json(
      { error: 'Address prefix must be 2-60 characters' },
      { status: 400 }
    )
  }

  // Validate prefix is safe for email addresses
  if (!/^[a-z0-9][a-z0-9._+-]*$/.test(prefix)) {
    return NextResponse.json(
      { error: 'Address prefix contains invalid characters' },
      { status: 400 }
    )
  }

  // Upsert config
  const { data, error } = await supabase
    .from('inbound_email_configs')
    .upsert(
      {
        tenant_id: tenantId,
        address_prefix: prefix,
        is_active: body.is_active ?? true,
        allowed_sender_domains: body.allowed_sender_domains ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    )
    .select()
    .single()

  if (error) {
    // Handle unique constraint on address_prefix (another tenant using it)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This address prefix is already in use' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
  }

  return NextResponse.json({ config: data })
}
