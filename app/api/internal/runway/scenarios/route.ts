import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { requireInternalUserForApi } from '@/lib/internal-auth'
import { FINANCE_SCENARIO_NUMERIC_KEYS } from '@/lib/finance/types'
import type { FinanceScenario } from '@/lib/finance/types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function rowToScenario(row: Record<string, unknown>): FinanceScenario {
  return {
    id: row.id as string,
    name: row.name as string,
    is_active: Boolean(row.is_active),
    new_mrr_monthly: Number(row.new_mrr_monthly),
    gross_churn_pct: Number(row.gross_churn_pct),
    expense_growth_pct: Number(row.expense_growth_pct),
    fundraise_amount:
      row.fundraise_amount === null || row.fundraise_amount === undefined
        ? null
        : Number(row.fundraise_amount),
    fundraise_close_date: (row.fundraise_close_date as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    updated_at: row.updated_at as string,
  }
}

export async function GET() {
  const auth = await requireInternalUserForApi()
  if (!auth.ok) return auth.response

  const supabase = getSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('finance_scenarios')
    .select('*')
    .is('deleted_at', null)
    .order('is_active', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('finance scenarios GET', error.message)
    return NextResponse.json({ error: 'Failed to load scenarios.' }, { status: 500 })
  }

  return NextResponse.json({ scenarios: (data ?? []).map(rowToScenario) })
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

  const numeric: Record<string, number> = {}
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
    numeric[key] = n
  }

  let fundraise_amount: number | null = null
  if (body.fundraise_amount !== undefined && body.fundraise_amount !== null && body.fundraise_amount !== '') {
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
    fundraise_amount = n
  }

  let fundraise_close_date: string | null = null
  if (
    body.fundraise_close_date !== undefined &&
    body.fundraise_close_date !== null &&
    body.fundraise_close_date !== ''
  ) {
    if (
      typeof body.fundraise_close_date !== 'string' ||
      !DATE_REGEX.test(body.fundraise_close_date)
    ) {
      return NextResponse.json(
        { error: 'fundraise_close_date must be YYYY-MM-DD or null.' },
        { status: 400 }
      )
    }
    fundraise_close_date = body.fundraise_close_date
  }

  const notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes : null

  const supabase = getSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('finance_scenarios')
    .insert({
      name,
      is_active: false,
      fundraise_amount,
      fundraise_close_date,
      notes,
      updated_by: auth.user.id,
      ...numeric,
    })
    .select('id')
    .single()

  if (error) {
    console.error('finance scenarios POST', error.message)
    return NextResponse.json({ error: 'Failed to create scenario.' }, { status: 500 })
  }

  return NextResponse.json({ id: data?.id })
}
