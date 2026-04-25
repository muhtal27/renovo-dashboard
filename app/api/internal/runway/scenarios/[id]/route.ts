import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { requireInternalUserForApi } from '@/lib/internal-auth'
import { FINANCE_SCENARIO_NUMERIC_KEYS } from '@/lib/finance/types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireInternalUserForApi()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

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

  for (const key of FINANCE_SCENARIO_NUMERIC_KEYS) {
    const raw = body[key]
    if (raw === undefined) continue
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(n)) {
      return NextResponse.json(
        { error: `Field "${key}" must be a finite number.` },
        { status: 400 }
      )
    }
    patch[key] = n
  }

  if (body.fundraise_amount !== undefined) {
    if (body.fundraise_amount === null || body.fundraise_amount === '') {
      patch.fundraise_amount = null
    } else {
      const n =
        typeof body.fundraise_amount === 'number'
          ? body.fundraise_amount
          : Number(body.fundraise_amount)
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json(
          { error: 'fundraise_amount must be a non-negative number or null.' },
          { status: 400 }
        )
      }
      patch.fundraise_amount = n
    }
  }

  if (body.fundraise_close_date !== undefined) {
    if (body.fundraise_close_date === null || body.fundraise_close_date === '') {
      patch.fundraise_close_date = null
    } else if (
      typeof body.fundraise_close_date !== 'string' ||
      !DATE_REGEX.test(body.fundraise_close_date)
    ) {
      return NextResponse.json(
        { error: 'fundraise_close_date must be YYYY-MM-DD or null.' },
        { status: 400 }
      )
    } else {
      patch.fundraise_close_date = body.fundraise_close_date
    }
  }

  if (body.notes !== undefined) {
    patch.notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes : null
  }

  const supabase = getSupabaseServiceRoleClient()
  const { error } = await supabase
    .from('finance_scenarios')
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('finance scenarios PATCH', error.message)
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireInternalUserForApi()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  const supabase = getSupabaseServiceRoleClient()

  // Soft-delete, but also clear is_active so the "one active" index stays valid.
  const { error } = await supabase
    .from('finance_scenarios')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      updated_by: auth.user.id,
    })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('finance scenarios DELETE', error.message)
    return NextResponse.json({ error: 'Failed to delete.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
