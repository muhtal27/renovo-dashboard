import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { requireInternalUserForApi } from '@/lib/internal-auth'
import { FINANCE_MONTH_NUMERIC_KEYS } from '@/lib/finance/types'
import type { FinanceMonthNumericKey } from '@/lib/finance/types'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireInternalUserForApi()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing id.' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {
    updated_by: auth.user.id,
  }

  for (const key of FINANCE_MONTH_NUMERIC_KEYS) {
    const raw = body[key]
    if (raw === undefined) continue
    const num = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(num)) {
      return NextResponse.json(
        { error: `Field "${key}" must be a finite number.` },
        { status: 400 }
      )
    }
    patch[key as FinanceMonthNumericKey] = num
  }

  if (body.is_actual !== undefined) patch.is_actual = Boolean(body.is_actual)
  if (body.notes !== undefined) {
    patch.notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes : null
  }

  const supabase = getSupabaseServiceRoleClient()
  const { error } = await supabase
    .from('finance_months')
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('finance months PATCH', error.message)
    return NextResponse.json({ error: 'Failed to update month.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireInternalUserForApi()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing id.' }, { status: 400 })
  }

  const supabase = getSupabaseServiceRoleClient()
  const { error } = await supabase
    .from('finance_months')
    .update({ deleted_at: new Date().toISOString(), updated_by: auth.user.id })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('finance months DELETE', error.message)
    return NextResponse.json({ error: 'Failed to delete month.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
