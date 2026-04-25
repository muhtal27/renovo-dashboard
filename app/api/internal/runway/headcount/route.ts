import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { requireInternalUserForApi } from '@/lib/internal-auth'
import { FINANCE_HEADCOUNT_NUMERIC_KEYS } from '@/lib/finance/types'
import type { FinanceHeadcount } from '@/lib/finance/types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function rowToHeadcount(row: Record<string, unknown>): FinanceHeadcount {
  return {
    id: row.id as string,
    name: row.name as string,
    role: (row.role as string | null) ?? null,
    start_date: row.start_date as string,
    end_date: (row.end_date as string | null) ?? null,
    gross_monthly_gbp: Number(row.gross_monthly_gbp),
    employer_ni_pct: Number(row.employer_ni_pct),
    pension_pct: Number(row.pension_pct),
    notes: (row.notes as string | null) ?? null,
    updated_at: row.updated_at as string,
  }
}

export async function GET() {
  const auth = await requireInternalUserForApi()
  if (!auth.ok) return auth.response

  const supabase = getSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('finance_headcount')
    .select('*')
    .is('deleted_at', null)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('finance headcount GET', error.message)
    return NextResponse.json({ error: 'Failed to load headcount.' }, { status: 500 })
  }

  return NextResponse.json({ headcount: (data ?? []).map(rowToHeadcount) })
}

export async function POST(request: Request) {
  const auth = await requireInternalUserForApi()
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const start_date = body.start_date
  if (typeof start_date !== 'string' || !DATE_REGEX.test(start_date)) {
    return NextResponse.json(
      { error: 'start_date must be YYYY-MM-DD.' },
      { status: 400 }
    )
  }

  let end_date: string | null = null
  if (body.end_date !== undefined && body.end_date !== null && body.end_date !== '') {
    if (typeof body.end_date !== 'string' || !DATE_REGEX.test(body.end_date)) {
      return NextResponse.json(
        { error: 'end_date must be YYYY-MM-DD or null.' },
        { status: 400 }
      )
    }
    end_date = body.end_date
    if (end_date < start_date) {
      return NextResponse.json(
        { error: 'end_date must not be before start_date.' },
        { status: 400 }
      )
    }
  }

  const numeric: Record<string, number> = {}
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
    numeric[key] = n
  }

  const role = typeof body.role === 'string' && body.role.trim() !== '' ? body.role.trim() : null
  const notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes : null

  const supabase = getSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('finance_headcount')
    .insert({
      name,
      role,
      start_date,
      end_date,
      notes,
      updated_by: auth.user.id,
      ...numeric,
    })
    .select('id')
    .single()

  if (error) {
    console.error('finance headcount POST', error.message)
    return NextResponse.json({ error: 'Failed to create person.' }, { status: 500 })
  }

  return NextResponse.json({ id: data?.id })
}
