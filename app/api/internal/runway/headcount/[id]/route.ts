import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { requireInternalUserForApi } from '@/lib/internal-auth'
import { FINANCE_HEADCOUNT_NUMERIC_KEYS } from '@/lib/finance/types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

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

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
    patch.name = name
  }

  if (body.role !== undefined) {
    patch.role = typeof body.role === 'string' && body.role.trim() !== '' ? body.role.trim() : null
  }

  if (body.start_date !== undefined) {
    if (typeof body.start_date !== 'string' || !DATE_REGEX.test(body.start_date)) {
      return NextResponse.json({ error: 'start_date must be YYYY-MM-DD.' }, { status: 400 })
    }
    patch.start_date = body.start_date
  }

  if (body.end_date !== undefined) {
    if (body.end_date === null || body.end_date === '') {
      patch.end_date = null
    } else if (typeof body.end_date !== 'string' || !DATE_REGEX.test(body.end_date)) {
      return NextResponse.json({ error: 'end_date must be YYYY-MM-DD or null.' }, { status: 400 })
    } else {
      patch.end_date = body.end_date
    }
  }

  for (const key of FINANCE_HEADCOUNT_NUMERIC_KEYS) {
    const raw = body[key]
    if (raw === undefined) continue
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: `Field "${key}" must be a non-negative number.` },
        { status: 400 }
      )
    }
    patch[key] = n
  }

  if (body.notes !== undefined) {
    patch.notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes : null
  }

  const supabase = getSupabaseServiceRoleClient()
  const { error } = await supabase
    .from('finance_headcount')
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('finance headcount PATCH', error.message)
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 })
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
    .from('finance_headcount')
    .update({ deleted_at: new Date().toISOString(), updated_by: auth.user.id })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('finance headcount DELETE', error.message)
    return NextResponse.json({ error: 'Failed to delete.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
