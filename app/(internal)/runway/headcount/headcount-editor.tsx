'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { FinanceHeadcount } from '@/lib/finance/types'
import { formatGBP, loadedMonthlyCost } from '@/lib/finance/runway-math'

type Mode = 'create' | 'edit'

type Props = {
  mode: Mode
  person: FinanceHeadcount | null
  onClose: () => void
  onSaved: () => void | Promise<void>
  onDeleted: (id: string) => void | Promise<void>
}

type FormState = {
  name: string
  role: string
  start_date: string
  end_date: string
  gross_monthly_gbp: string
  employer_ni_pct: string
  pension_pct: string
  notes: string
}

function toForm(p: FinanceHeadcount | null): FormState {
  if (!p) {
    const today = new Date().toISOString().slice(0, 10)
    return {
      name: '',
      role: '',
      start_date: today,
      end_date: '',
      gross_monthly_gbp: '',
      employer_ni_pct: '13.8',
      pension_pct: '3',
      notes: '',
    }
  }
  return {
    name: p.name,
    role: p.role ?? '',
    start_date: p.start_date,
    end_date: p.end_date ?? '',
    gross_monthly_gbp: String(p.gross_monthly_gbp),
    employer_ni_pct: String(p.employer_ni_pct),
    pension_pct: String(p.pension_pct),
    notes: p.notes ?? '',
  }
}

function parseNum(v: string): number {
  if (v === '' || v === '-') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function HeadcountEditor({ mode, person, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(person))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setForm(toForm(person))
  }, [person])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving && !deleting) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving, deleting])

  const preview = useMemo<FinanceHeadcount>(
    () => ({
      id: person?.id ?? 'preview',
      name: form.name,
      role: form.role || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      gross_monthly_gbp: parseNum(form.gross_monthly_gbp),
      employer_ni_pct: parseNum(form.employer_ni_pct),
      pension_pct: parseNum(form.pension_pct),
      notes: form.notes || null,
      updated_at: '',
    }),
    [person?.id, form]
  )
  const loaded = loadedMonthlyCost(preview)

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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.start_date)) {
      toast.error('Start date is required.')
      return
    }
    if (form.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.end_date)) {
      toast.error('End date must be a valid date.')
      return
    }
    if (form.end_date && form.end_date < form.start_date) {
      toast.error('End date must be on or after start date.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role,
        start_date: form.start_date,
        end_date: form.end_date || null,
        gross_monthly_gbp: parseNum(form.gross_monthly_gbp),
        employer_ni_pct: parseNum(form.employer_ni_pct),
        pension_pct: parseNum(form.pension_pct),
        notes: form.notes,
      }

      const res = await fetch(
        mode === 'create'
          ? '/api/internal/runway/headcount'
          : `/api/internal/runway/headcount/${person?.id}`,
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

      toast.success(mode === 'create' ? 'Person added.' : 'Saved.')
      await onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!person) return
    if (!confirm(`Remove ${person.name} from the headcount plan?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/internal/runway/headcount/${person.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed.')
      await onDeleted(person.id)
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-950">
              {mode === 'create' ? 'Add person' : form.name || 'Edit person'}
            </h3>
            <p className="mt-1 text-[12px] text-zinc-500">
              Employee or contractor. Leave end date blank for indefinite.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Name" colSpan={1}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Jane Doe"
              className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </Field>
          <Field label="Role" colSpan={1}>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setField('role', e.target.value)}
              placeholder="e.g. Senior Engineer"
              className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </Field>

          <Field label="Start date" colSpan={1}>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setField('start_date', e.target.value)}
              className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </Field>
          <Field label="End date (blank = indefinite)" colSpan={1}>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setField('end_date', e.target.value)}
              className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </Field>

          <Field label="Gross monthly (£)" colSpan={2}>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={form.gross_monthly_gbp}
              onChange={(e) => setField('gross_monthly_gbp', e.target.value)}
              placeholder="0.00"
              className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 tabular-nums outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              For contractors, enter their monthly invoice value and set NI / pension to 0.
            </p>
          </Field>

          <Field label="Employer NI (%)" colSpan={1}>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={form.employer_ni_pct}
              onChange={(e) => setField('employer_ni_pct', e.target.value)}
              className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 tabular-nums outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </Field>
          <Field label="Pension (%)" colSpan={1}>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={form.pension_pct}
              onChange={(e) => setField('pension_pct', e.target.value)}
              className="mt-1 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 tabular-nums outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </Field>
        </div>

        <div className="mt-4">
          <label className="text-[12px] font-medium text-zinc-700">Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Anything material — e.g. pay rise due, contract length"
            className="mt-1 w-full rounded-[10px] border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
          />
        </div>

        <div className="mt-5 rounded-[10px] bg-zinc-50 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Loaded monthly cost
          </div>
          <div className="mt-1 text-[18px] font-bold tabular-nums text-zinc-900">
            {formatGBP(loaded)}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Gross × (1 + NI% + pension%)
          </div>
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
                {deleting ? 'Removing…' : 'Remove from plan'}
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
              {saving ? 'Saving…' : mode === 'create' ? 'Add person' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  colSpan,
  children,
}: {
  label: string
  colSpan: 1 | 2
  children: React.ReactNode
}) {
  return (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <label className="text-[12px] font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  )
}
