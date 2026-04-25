'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { FinanceMonth } from '@/lib/finance/types'
import { formatGBP, formatMonth, totalsForMonth, monthToIsoDate } from '@/lib/finance/runway-math'
import { MonthEditor } from './month-editor'

export function LedgerView() {
  const [months, setMonths] = useState<FinanceMonth[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/internal/runway/months', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load.')
      const body = (await res.json()) as { months: FinanceMonth[] }
      setMonths(body.months)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rowsDesc = useMemo(() => {
    if (!months) return []
    return [...months].sort((a, b) => (a.month > b.month ? -1 : 1))
  }, [months])

  const editingMonth = useMemo(
    () => (editingId ? months?.find((m) => m.id === editingId) ?? null : null),
    [editingId, months]
  )

  const nextMonthIso = useMemo(() => suggestNextMonth(months ?? []), [months])

  if (loadError) {
    return (
      <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {loadError}
      </div>
    )
  }

  if (months === null) {
    return (
      <div className="space-y-3">
        <div className="h-10 animate-pulse rounded-[10px] border border-zinc-200 bg-white" />
        <div className="h-[300px] animate-pulse rounded-[10px] border border-zinc-200 bg-white" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-zinc-500">
          {months.length === 0
            ? 'No months yet — add your first row to get started.'
            : `${months.length} month${months.length === 1 ? '' : 's'} in the ledger`}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
        >
          + Add month
        </button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-zinc-200 bg-white">
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="text-right">Opening</th>
              <th className="text-right">Revenue</th>
              <th className="text-right">Expenses</th>
              <th className="text-right">Net</th>
              <th className="text-right">Closing</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {rowsDesc.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-zinc-400">
                  No months yet.
                </td>
              </tr>
            ) : (
              rowsDesc.map((m) => {
                const t = totalsForMonth(m)
                return (
                  <tr
                    key={m.id}
                    className="clickable"
                    onClick={() => setEditingId(m.id)}
                  >
                    <td className="font-medium text-zinc-900">{formatMonth(m.month)}</td>
                    <td className="text-right tabular-nums text-zinc-700">
                      {formatGBP(m.opening_cash)}
                    </td>
                    <td className="text-right tabular-nums text-zinc-700">
                      {formatGBP(t.revenue)}
                    </td>
                    <td className="text-right tabular-nums text-zinc-700">
                      {formatGBP(t.expenses)}
                    </td>
                    <td
                      className={`text-right tabular-nums font-medium ${
                        t.netCashFlow < 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatGBP(t.netCashFlow)}
                    </td>
                    <td className="text-right tabular-nums font-semibold text-zinc-900">
                      {formatGBP(t.closingCash)}
                    </td>
                    <td>
                      <span
                        className={`badge ${m.is_actual ? 'badge-emerald' : 'badge-zinc'}`}
                      >
                        {m.is_actual ? 'Actual' : 'Forecast'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {(creating || editingMonth) && (
        <MonthEditor
          mode={creating ? 'create' : 'edit'}
          month={editingMonth}
          suggestedMonthIso={nextMonthIso}
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
            toast.success('Month removed.')
          }}
        />
      )}
    </>
  )
}

function suggestNextMonth(months: FinanceMonth[]): string {
  if (months.length === 0) {
    const now = new Date()
    return monthToIsoDate(now.getFullYear(), now.getMonth() + 1)
  }
  const latest = [...months].sort((a, b) => (a.month > b.month ? -1 : 1))[0]
  const [y, m] = latest.month.split('-').map((s) => parseInt(s, 10))
  const nextY = m === 12 ? y + 1 : y
  const nextM = m === 12 ? 1 : m + 1
  return monthToIsoDate(nextY, nextM)
}
