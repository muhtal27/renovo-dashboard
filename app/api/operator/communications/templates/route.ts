/**
 * GET  /api/operator/communications/templates — List all templates
 * POST /api/operator/communications/templates — Create a new template
 */

import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import type { TemplateCategory } from '@/lib/communication-hub-types'

const VALID_CATEGORIES: TemplateCategory[] = [
  'general',
  'tenant_notice',
  'landlord_update',
  'dispute',
  'deposit',
]

export async function GET() {
  const authResult = await getOperatorTenantContextForApi(
    OPERATOR_PERMISSIONS.VIEW_CASE
  )

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = authResult.context.tenantId

  const { data, error } = await supabase
    .from('communication_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch templates', { error, tenantId })
    return NextResponse.json(
      { error: 'Failed to fetch templates.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(request: Request) {
  const authResult = await getOperatorTenantContextForApi(
    OPERATOR_PERMISSIONS.EDIT_CASE
  )

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const body = (await request.json()) as {
    name?: string
    subject?: string | null
    body?: string
    category?: string
    variables?: string[]
  }

  if (!body.name?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: 'Name and body are required.' },
      { status: 400 }
    )
  }

  const category = VALID_CATEGORIES.includes(body.category as TemplateCategory)
    ? (body.category as TemplateCategory)
    : 'general'

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = authResult.context.tenantId

  const { data, error } = await supabase
    .from('communication_templates')
    .insert({
      tenant_id: tenantId,
      name: body.name.trim(),
      subject: body.subject?.trim() || null,
      body: body.body.trim(),
      category,
      variables: JSON.stringify(body.variables ?? []),
      is_active: true,
      created_by: authResult.context.user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create template', { error, tenantId })
    return NextResponse.json(
      { error: 'Failed to create template.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ template: data }, { status: 201 })
}
