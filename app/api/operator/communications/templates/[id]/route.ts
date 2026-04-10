/**
 * PUT    /api/operator/communications/templates/[id] — Update a template
 * DELETE /api/operator/communications/templates/[id] — Delete a template
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

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const authResult = await getOperatorTenantContextForApi(
    OPERATOR_PERMISSIONS.EDIT_CASE
  )

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const { id } = await context.params
  const body = (await request.json()) as {
    name?: string
    subject?: string | null
    body?: string
    category?: string
    variables?: string[]
    is_active?: boolean
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.subject !== undefined) updates.subject = body.subject?.trim() || null
  if (body.body !== undefined) updates.body = body.body.trim()
  if (body.is_active !== undefined) updates.is_active = body.is_active
  if (body.variables !== undefined) updates.variables = JSON.stringify(body.variables)
  if (
    body.category !== undefined &&
    VALID_CATEGORIES.includes(body.category as TemplateCategory)
  ) {
    updates.category = body.category
  }

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = authResult.context.tenantId

  const { data, error } = await supabase
    .from('communication_templates')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update template', { error, tenantId, id })
    return NextResponse.json(
      { error: 'Failed to update template.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
  }

  return NextResponse.json({ template: data })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await getOperatorTenantContextForApi(
    OPERATOR_PERMISSIONS.EDIT_CASE
  )

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const { id } = await context.params
  const supabase = getSupabaseServiceRoleClient()
  const tenantId = authResult.context.tenantId

  const { error } = await supabase
    .from('communication_templates')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Failed to delete template', { error, tenantId, id })
    return NextResponse.json(
      { error: 'Failed to delete template.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
