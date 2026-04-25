'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { FinanceHeadcount, FinanceMonth } from '@/lib/finance/types'
import {
  formatGBP,
  formatMonth,
  projectedPayrollForMonth,
  totalsForMonth,
} from '@/lib/finance/runway-math'

type Mode = 'create' | 'edit'

type Props = {
  mode: Mode
  month: FinanceMonth | null
  suggestedMonthIso: string
  onClose: () => void
  onSaved: () => void | Promise<void>
  onDeleted: (id: string) => void | Promise<void>
}

type FormState = {
  monthIso: string
  is_actual: boolean
  opening_cash: string
  mrr_collected: string
  one_off_revenue: string
  rd_credit: string
  payroll: string
  contractors: string
  saas_tools: string
  rent_ops: string
  legal_accounting: string
  marketing: string
  other: string
  vat_net: string
  notes: string
}

const NUMERIC_FIELDS: Array<{
  key: keyof FormState
  label: string
  group: 'cash' | 'inflow' | 'outflow'
  hint?: string
}> = [
  { key: 'opening_cash', label: 'Opening cash', group: 'cash', hint: 'Bank balance at month start' },
  { key: 'mrr_collected', label: 'MRR collected', group: 'inflow' },
  { key: 'one_off_revenue', label: 'One-off revenue', group: 'inflow' },
  { key: 'rd_credit', label: 'R&D credit', group: 'inflow', hint: 'Annual HMRC credit, post in the month received' },
  { key: 'payroll', label: 'Payroll', group: 'outflow', hint: 'Gross + employer NI + pension' },
  { key: 'contractors', label: 'Contractors', group: 'outflow' },
  { key: 'saas_tools', label: 'SaaS & tools', group: 'outflow' },
  { key: 'rent_ops', label: 'Rent & ops', group: 'outflow' },
  { key: 'legal_accounting', label: 'Legal & accounting', group: 'outflow' },
  { key: 'marketing', label: 'Marketing', group: 'outflow' },
  { key: 'other', label: 'Other', group: 'outflow' },
  { key: 'vat_net', label: 'VAT (net, signed)', group: 'outflow', hint: 'Positive if received, negative if paid' },
]

function toForm(m: FinanceMonth | null, fallbackMonthIso: string): FormState {
  if (!m) {
    return {
      monthIso: fallbackMonthIso,
      is_actual: false,
      opening_cash: '',
      mrr_collected: '',
      one_off_revenue: '',
      rd_credit: '',
      payroll: '',
      contractors: '',
      saas_tools: '',
      rent_ops: '',
      legal_accounting: '',
      marketing: '',
      other: '',
      vat_net: '',
      notes: '',
    }
  }
  return {
    monthIso: m.month,
    is_actual: m.is_actual,
    opening_cash: String(m.opening_cash),
    mrr_collected: String(m.mrr_collected),
    one_off_revenue: String(m.one_off_revenue),
    rd_credit: String(m.rd_credit),
    payroll: String(m.payroll),
    contractors: String(m.contractors),
    saas_tools: String(m.saas_tools),
    rent_ops: String(m.rent_ops),
    legal_accounting: String(m.legal_accounting),
    marketing: String(m.marketing),
    other: String(m.other),
    vat_net: String(m.vat_net),
    notes: m.notes ?? '',
  }
}

function parseNum(v: string): number {
  if (v === '' || v === '-') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function MonthEditor({ mode, month, suggestedMonthIso, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(month, suggestedMonthIso))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [headcount, setHeadcount] = useState<FinanceHeadcount[] | null>(null)

  useEffect(() => {
    setForm(toForm(month, suggestedMonthIso))
  }, [month, suggestedMonthIso])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/internal/runway/headcount', { cache: 'no-store' })
        if (!res.ok) return
        const body = (await res.json()) as { headcount: FinanceHeadcount[] }
        if (!cancelled) setHeadcount(body.headcount)
      } catch {
        // Non-fatal: the fill-from-plan helper just won't appear.
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const plannedPayroll = useMemo(() => {
    if (!headcount) return null
    return projectedPayrollForMonth(form.monthIso, headcount)
  }, [headcount, form.monthIso])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving && !deleting) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving, deleting])

  const previewMonth: FinanceMonth = useMemo(
    () => ({
      id: month?.id ?? 'preview',
      month: form.monthIso,
      is_actual: form.is_actual,
      opening_cash: parseNum(form.opening_cash),
      mrr_collected: parseNum(form.mrr_collected),
      one_off_revenue: parseNum(form.one_off_revenue),
      rd_credit: parseNum(form.rd_credit),
      payroll: parseNum(form.payroll),
      contractors: parseNum(form.contractors),
      saas_tools: parseNum(form.saas_tools),
      rent_ops: parseNum(form.rent_ops),
      legal_accounting: parseNum(form.legal_accounting),
      marketing: parseNum(form.marketing),
      other: parseNum(form.other),
      vat_net: parseNum(form.vat_net),
      notes: form.notes || null,
      updated_at: '',
    }),
    [month?.id, form]
  )
  const totals = totalsForMonth(previewMonth)

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((f) => ({ ...f, [key]: value }))
    },
    []
  )

  async function handleSave() {
    if (!/^\d{4}-\d{2}-01$/.test(form.monthIso)) {
      toast.error('Month must be the first of a month (YYYY-MM-01).')
      return
    }
    setSaving(true)
    try {
      const payload = {
        month: form.monthIso,
        is_actual: form.is_actual,
        opening_cash: parseNum(form.opening_cash),
        mrr_collected: parseNum(form.mrr_collected),
        one_off_revenue: parseNum(form.one_off_revenue),
        rd_credit: parseNum(form.rd_credit),
        payroll: parseNum(form.payroll),
        contractors: parseNum(form.contractors),
        saas_tools: parseNum(form.saas_tools),
        rent_ops: parseNum(form.rent_ops),
        legal_accounting: parseNum(form.legal_accounting),
        marketing: parseNum(form.marketing),
        other: parseNum(form.other),
        vat_net: parseNum(form.vat_net),
        notes: form.notes,
      }

      const res = await fetch(
        mode === 'create'
          ? '/api/internal/runway/months'
          : `/api/internal/runway/months/${month?.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Save failed.')
      }

      toast.success(mode === 'create' ? 'Month added.' : 'Saved.')
      await onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!month) return
    if (!confirm(`Delete ${formatMonth(month.month)} from the ledger?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/internal/runway/months/${month.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed.')
      await onDeleted(month.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-zinc-950/40 p-8"
      onClick={() => !saving && !deleting && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-[14px] border border-zinc-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-950">
              {mode === 'create' ? 'Add month' : formatMonth(form.monthIso)}
            </h3>
            <p className="mt-1 text-[12px] text-zinc-500">
              All amounts in GBP. Leave blank for zero.
            </p>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-zinc-700">
            <input
              type="checkbox"
              checked={form.is_actual}
              onChange={(e) => setField('is_actual', e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            Actual (from bank)
          </label>
        </div>

        {mode === 'create' && (
          <div className="mt-4">
            <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Month
            </label>
            <input
              type="month"
              value={form.monthIso.slice(0, 7)}
              onChange={(e) => setField('monthIso', `${e.target.value}-01`)}
              className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
          {(['cash', 'inflow', 'outflow'] as const).map((group) => (
            <div key={group} className="col-span-2">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {group === 'cash' ? 'Cash' : group === 'inflow' ? 'Inflows' : 'Outflows'}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {NUMERIC_FIELDS.filter((f) => f.group === group).map((f) => {
                  const showPlanHint =
                    f.key === 'payroll' && plannedPayroll !== null && plannedPayroll > 0
                  return (
                    <div key={f.key}>
                      <label className="text-[12px] font-medium text-zinc-700">
                        {f.label}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={form[f.key] as string}
                        onChange={(e) => setField(f.key, e.target.value)}
                        placeholder="0.00"
                        className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 tabular-nums outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                      />
                      {f.hint && (
                        <p className="mt-1 text-[11px] text-zinc-400">{f.hint}</p>
                      )}
                      {showPlanHint && (
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Plan: {formatGBP(plannedPayroll)}
                          {' · '}
                          <button
                            type="button"
                            onClick={() =>
                              setField('payroll', plannedPayroll.toFixed(2))
                            }
                            className="font-medium text-emerald-700 transition hover:text-emerald-900"
                          >
                            Use
                          </button>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-[12px] font-medium text-zinc-700">Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Anything material about this month"
            className="mt-1 w-full rounded-[10px] border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
          />
        </div>

        {/* Live totals */}
        <div className="mt-5 grid grid-cols-4 gap-3 rounded-[10px] bg-zinc-50 p-3">
          <Metric label="Revenue" value={formatGBP(totals.revenue)} tone="neutral" />
          <Metric label="Expenses" value={formatGBP(totals.expenses)} tone="neutral" />
          <Metric
            label="Net cash flow"
            value={formatGBP(totals.netCashFlow)}
            tone={totals.netCashFlow < 0 ? 'bad' : 'good'}
          />
          <Metric label="Closing cash" value={formatGBP(totals.closingCash)} tone="neutral" strong />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="text-[12px] font-medium text-rose-600 transition hover:text-rose-800 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete month'}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || deleting}
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : mode === 'create' ? 'Add month' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
  strong,
}: {
  label: string
  value: string
  tone: 'neutral' | 'good' | 'bad'
  strong?: boolean
}) {
  const color =
    tone === 'bad'
      ? 'text-rose-700'
      : tone === 'good'
      ? 'text-emerald-700'
      : 'text-zinc-900'
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div
        className={`mt-1 ${
          strong ? 'text-[16px] font-bold' : 'text-[14px] font-semibold'
        } tabular-nums ${color}`}
      >
        {value}
      </div>
    </div>
  )
}
