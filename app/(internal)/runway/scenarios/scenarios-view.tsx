'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { FinanceMonth, FinanceScenario } from '@/lib/finance/types'
import {
  formatDateShort,
  formatGBP,
  runwayForScenario,
} from '@/lib/finance/runway-math'
import { ScenarioEditor } from './scenario-editor'

export function ScenariosView() {
  const [scenarios, setScenarios] = useState<FinanceScenario[] | null>(null)
  const [months, setMonths] = useState<FinanceMonth[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [sRes, mRes] = await Promise.all([
        fetch('/api/internal/runway/scenarios', { cache: 'no-store' }),
        fetch('/api/internal/runway/months', { cache: 'no-store' }),
      ])
      if (!sRes.ok || !mRes.ok) throw new Error('Failed to load.')
      const sBody = (await sRes.json()) as { scenarios: FinanceScenario[] }
      const mBody = (await mRes.json()) as { months: FinanceMonth[] }
      setScenarios(sBody.scenarios)
      setMonths(mBody.months)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const editing = useMemo(
    () => (editingId ? scenarios?.find((s) => s.id === editingId) ?? null : null),
    [editingId, scenarios]
  )

  async function handleActivate(id: string) {
    setActivating(id)
    try {
      const res = await fetch(`/api/internal/runway/scenarios/${id}/activate`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Activate failed.')
      }
      toast.success('Scenario activated.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Activate failed.')
    } finally {
      setActivating(null)
    }
  }

  if (loadError) {
    return (
      <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {loadError}
      </div>
    )
  }

  if (scenarios === null || months === null) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[180px] animate-pulse rounded-[10px] border border-zinc-200 bg-white" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-zinc-500">
          {scenarios.length === 0
            ? 'No scenarios yet.'
            : `${scenarios.length} scenario${scenarios.length === 1 ? '' : 's'}`}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
        >
          + Add scenario
        </button>
      </div>

      {scenarios.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-zinc-300 bg-white p-6 text-center">
          <h3 className="text-base font-semibold text-zinc-900">No scenarios yet</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create Base / Upside / Downside to stress-test runway.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((s) => {
            const runway = runwayForScenario(months, s)
            const isActivating = activating === s.id
            return (
              <div
                key={s.id}
                className={`relative flex flex-col rounded-[10px] border bg-white p-5 transition ${
                  s.is_active ? 'border-emerald-500 ring-[3px] ring-emerald-500/10' : 'border-zinc-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold text-zinc-900">{s.name}</div>
                    {s.notes && (
                      <p className="mt-1 text-[12px] text-zinc-500 line-clamp-2">{s.notes}</p>
                    )}
                  </div>
                  {s.is_active && (
                    <span className="badge badge-emerald">Active</span>
                  )}
                </div>

                <dl className="mt-4 space-y-1.5 text-[12px]">
                  <Row label="New MRR / mo" value={formatGBP(s.new_mrr_monthly)} />
                  <Row label="Monthly churn" value={`${s.gross_churn_pct.toFixed(1)}%`} />
                  <Row label="Expense growth" value={`${s.expense_growth_pct.toFixed(1)}%/mo`} />
                  <Row
                    label="Fundraise"
                    value={
                      s.fundraise_amount && s.fundraise_close_date
                        ? `${formatGBP(s.fundraise_amount)} · ${formatDateShort(s.fundraise_close_date)}`
                        : '—'
                    }
                  />
                </dl>

                <div className="mt-4 rounded-[10px] bg-zinc-50 p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Projected runway
                  </div>
                  <div className="mt-1 text-[20px] font-bold tabular-nums text-zinc-900">
                    {runwayValue(runway.runwayMonths, runway.startingCash)}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {projectionSub(runway)}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setEditingId(s.id)}
                    className="text-[12px] font-medium text-zinc-600 transition hover:text-zinc-900"
                  >
                    Edit
                  </button>
                  {s.is_active ? (
                    <span className="text-[12px] text-zinc-400">Currently active</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivate(s.id)}
                      disabled={isActivating}
                      className="rounded-lg border border-emerald-600 px-3 py-1 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                      {isActivating ? 'Activating…' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(creating || editing) && (
        <ScenarioEditor
          mode={creating ? 'create' : 'edit'}
          scenario={editing}
          onClose={() => {
            setCreating(false)
            setEditingId(null)
          }}
          onSaved={async () => {
            await load()
            setCreating(false)
            setEditingId(null)
          }}
          onDeleted={async (id) => {
            await load()
            if (editingId === id) setEditingId(null)
            toast.success('Scenario removed.')
          }}
        />
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="tabular-nums font-medium text-zinc-900">{value}</dd>
    </div>
  )
}

function runwayValue(months: number | null, startingCash: number): string {
  if (startingCash <= 0) return '£0'
  if (months === null) return '>36 mo'
  if (months === 0) return '0 mo'
  return `${months.toFixed(1)} mo`
}

function projectionSub(runway: {
  runwayMonths: number | null
  cashOutDate: Date | null
  startingCash: number
  projection: { length: number }
}): string {
  if (runway.startingCash <= 0) return 'No cash on hand'
  if (runway.runwayMonths === null) {
    return runway.projection.length > 0
      ? 'Cash holds beyond 36-month horizon'
      : 'No actual months yet'
  }
  if (runway.cashOutDate) {
    return `Cash out ≈ ${runway.cashOutDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
  }
  return '—'
}
