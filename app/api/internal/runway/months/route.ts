import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { requireInternalUserForApi } from '@/lib/internal-auth'
import { FINANCE_MONTH_NUMERIC_KEYS } from '@/lib/finance/types'
import type { FinanceMonth, FinanceMonthNumericKey } from '@/lib/finance/types'

const MONTH_REGEX = /^\d{4}-\d{2}-01$/

function pickNumeric(source: Record<string, unknown>): Partial<Record<FinanceMonthNumericKey, number>> {
  const out: Partial<Record<FinanceMonthNumericKey, number>> = {}
  for (const key of FINANCE_MONTH_NUMERIC_KEYS) {
    const raw = source[key]
    if (raw === undefined) continue
    const num = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(num)) {
      throw new Error(`Field "${key}" must be a finite number.`)
    }
    out[key] = num
  }
  return out
}

export async function GET() {
  const auth = await requireInternalUserForApi()
  if (!auth.ok) return auth.response

  const supabase = getSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('finance_months')
    .select('*')
    .is('deleted_at', null)
    .order('month', { ascending: true })

  if (error) {
    console.error('finance months GET', error.message)
    return NextResponse.json({ error: 'Failed to load months.' }, { status: 500 })
  }

  const months: FinanceMonth[] = (data ?? []).map((row) => ({
    id: row.id as string,
    month: row.month as string,
    is_actual: Boolean(row.is_actual),
    opening_cash: Number(row.opening_cash),
    mrr_collected: Number(row.mrr_collected),
    one_off_revenue: Number(row.one_off_revenue),
    rd_credit: Number(row.rd_credit),
    payroll: Number(row.payroll),
    contractors: Number(row.contractors),
    saas_tools: Number(row.saas_tools),
    rent_ops: Number(row.rent_ops),
    legal_accounting: Number(row.legal_accounting),
    marketing: Number(row.marketing),
    other: Number(row.other),
    vat_net: Number(row.vat_net),
    notes: (row.notes as string | null) ?? null,
    updated_at: row.updated_at as string,
  }))

  return NextResponse.json({ months })
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

  const month = body.month
  if (typeof month !== 'string' || !MONTH_REGEX.test(month)) {
    return NextResponse.json(
      { error: 'month must be formatted YYYY-MM-01.' },
      { status: 400 }
    )
  }

  let numeric: Partial<Record<FinanceMonthNumericKey, number>>
  try {
    numeric = pickNumeric(body)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid field.' },
      { status: 400 }
    )
  }

  const isActual = Boolean(body.is_actual)
  const notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes : null

  const supabase = getSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('finance_months')
    .insert({
      month,
      is_actual: isActual,
      notes,
      updated_by: auth.user.id,
      ...numeric,
    })
    .select('id')
    .single()

  if (error) {
    console.error('finance months POST', error.message)
    const isDuplicate = error.message?.includes('uq_finance_months_month')
    return NextResponse.json(
      {
        error: isDuplicate
          ? 'A row for that month already exists.'
          : 'Failed to create month.',
      },
      { status: isDuplicate ? 409 : 500 }
    )
  }

  return NextResponse.json({ id: data?.id })
}
