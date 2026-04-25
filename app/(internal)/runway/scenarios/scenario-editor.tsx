'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { FinanceScenario } from '@/lib/finance/types'

type Mode = 'create' | 'edit'

type Props = {
  mode: Mode
  scenario: FinanceScenario | null
  onClose: () => void
  onSaved: () => void | Promise<void>
  onDeleted: (id: string) => void | Promise<void>
}

type FormState = {
  name: string
  new_mrr_monthly: string
  gross_churn_pct: string
  expense_growth_pct: string
  fundraise_amount: string
  fundraise_close_date: string
  notes: string
}

function toForm(s: FinanceScenario | null): FormState {
  if (!s) {
    return {
      name: '',
      new_mrr_monthly: '0',
      gross_churn_pct: '0',
      expense_growth_pct: '0',
      fundraise_amount: '',
      fundraise_close_date: '',
      notes: '',
    }
  }
  return {
    name: s.name,
    new_mrr_monthly: String(s.new_mrr_monthly),
    gross_churn_pct: String(s.gross_churn_pct),
    expense_growth_pct: String(s.expense_growth_pct),
    fundraise_amount: s.fundraise_amount === null ? '' : String(s.fundraise_amount),
    fundraise_close_date: s.fundraise_close_date ?? '',
    notes: s.notes ?? '',
  }
}

function parseNum(v: string): number {
  if (v === '' || v === '-') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function ScenarioEditor({ mode, scenario, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(scenario))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setForm(toForm(scenario))
  }, [scenario])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving && !deleting) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving, deleting])

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((f) => ({ ...f, [key]: value }))
    },
    []
  )

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Name is required.')
      return
    }
    if (form.fundraise_close_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.fundraise_close_date)) {
      toast.error('Fundraise date must be a valid date.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        new_mrr_monthly: parseNum(form.new_mrr_monthly),
        gross_churn_pct: parseNum(form.gross_churn_pct),
        expense_growth_pct: parseNum(form.expense_growth_pct),
        fundraise_amount: form.fundraise_amount === '' ? null : parseNum(form.fundraise_amount),
        fundraise_close_date: form.fundraise_close_date || null,
        notes: form.notes,
      }

      const res = await fetch(
        mode === 'create'
          ? '/api/internal/runway/scenarios'
          : `/api/internal/runway/scenarios/${scenario?.id}`,
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

      toast.success(mode === 'create' ? 'Scenario added.' : 'Saved.')
      await onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!scenario) return
    if (scenario.is_active) {
      toast.error('Activate a different scenario before deleting this one.')
      return
    }
    if (!confirm(`Delete scenario "${scenario.name}"?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/internal/runway/scenarios/${scenario.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed.')
      await onDeleted(scenario.id)
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
        className="w-full max-w-xl rounded-[14px] border border-zinc-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-zinc-950">
          {mode === 'create' ? 'Add scenario' : form.name || 'Edit scenario'}
        </h3>
        <p className="mt-1 text-[12px] text-zinc-500">
          Assumptions apply to forecast months from the latest actual forward.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-zinc-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Base, Upside, Downside"
              className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>

          <div className="rounded-[10px] border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Revenue assumptions
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-zinc-700">New MRR / mo (£)</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={form.new_mrr_monthly}
                  onChange={(e) => setField('new_mrr_monthly', e.target.value)}
                  className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 tabular-nums outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
                <p className="mt-1 text-[11px] text-zinc-400">Added each month</p>
              </div>
              <div>
                <label className="text-[12px] font-medium text-zinc-700">Monthly churn (%)</label>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={form.gross_churn_pct}
                  onChange={(e) => setField('gross_churn_pct', e.target.value)}
                  className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 tabular-nums outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
                <p className="mt-1 text-[11px] text-zinc-400">Gross revenue lost/mo</p>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Expense assumptions
            </div>
            <div className="mt-3">
              <label className="text-[12px] font-medium text-zinc-700">Expense growth (% / mo)</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={form.expense_growth_pct}
                onChange={(e) => setField('expense_growth_pct', e.target.value)}
                className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 tabular-nums outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Compounded monthly. Keep at 0 unless you expect hiring / infra ramp.
              </p>
            </div>
          </div>

          <div className="rounded-[10px] border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Fundraise (optional)
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-zinc-700">Amount (£)</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={form.fundraise_amount}
                  onChange={(e) => setField('fundraise_amount', e.target.value)}
                  placeholder="blank = none"
                  className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 tabular-nums outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-zinc-700">Close date</label>
                <input
                  type="date"
                  value={form.fundraise_close_date}
                  onChange={(e) => setField('fundraise_close_date', e.target.value)}
                  className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-zinc-400">
              Lands as a one-off inflow in the month matching the close date.
            </p>
          </div>

          <div>
            <label className="text-[12px] font-medium text-zinc-700">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="What this scenario represents"
              className="mt-1 w-full rounded-[10px] border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            {mode === 'edit' && scenario && !scenario.is_active && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="text-[12px] font-medium text-rose-600 transition hover:text-rose-800 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete scenario'}
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
              {saving ? 'Saving…' : mode === 'create' ? 'Add scenario' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
