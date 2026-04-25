'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { FinanceHeadcount } from '@/lib/finance/types'
import {
  formatDateShort,
  formatGBP,
  loadedMonthlyCost,
  statusForHeadcount,
} from '@/lib/finance/runway-math'
import { HeadcountEditor } from './headcount-editor'

export function HeadcountView() {
  const [headcount, setHeadcount] = useState<FinanceHeadcount[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/internal/runway/headcount', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load.')
      const body = (await res.json()) as { headcount: FinanceHeadcount[] }
      setHeadcount(body.headcount)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const editing = useMemo(
    () => (editingId ? headcount?.find((h) => h.id === editingId) ?? null : null),
    [editingId, headcount]
  )

  const summary = useMemo(() => {
    if (!headcount) return null
    let activeCount = 0
    let upcomingCount = 0
    let endedCount = 0
    let activeLoaded = 0
    const today = new Date()
    for (const h of headcount) {
      const s = statusForHeadcount(h, today)
      if (s === 'active') {
        activeCount++
        activeLoaded += loadedMonthlyCost(h)
      } else if (s === 'upcoming') {
        upcomingCount++
      } else {
        endedCount++
      }
    }
    return { activeCount, upcomingCount, endedCount, activeLoaded }
  }, [headcount])

  if (loadError) {
    return (
      <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {loadError}
      </div>
    )
  }

  if (headcount === null || summary === null) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-[10px] border border-zinc-200 bg-white" />
          ))}
        </div>
        <div className="h-[280px] animate-pulse rounded-[10px] border border-zinc-200 bg-white" />
      </div>
    )
  }

  const sorted = [...headcount].sort((a, b) =>
    a.start_date === b.start_date ? a.name.localeCompare(b.name) : a.start_date < b.start_date ? -1 : 1
  )

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active headcount"
          value={String(summary.activeCount)}
          sub={
            summary.activeLoaded > 0
              ? `${formatGBP(summary.activeLoaded)}/mo loaded`
              : '—'
          }
        />
        <StatCard
          label="Planned hires"
          value={String(summary.upcomingCount)}
          sub={summary.upcomingCount === 0 ? 'No upcoming starts' : 'Future start dates'}
        />
        <StatCard
          label="Departed"
          value={String(summary.endedCount)}
          sub="End date in the past"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-zinc-500">
          {headcount.length === 0
            ? 'No people yet — add your first row to build the plan.'
            : `${headcount.length} record${headcount.length === 1 ? '' : 's'}`}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
        >
          + Add person
        </button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-zinc-200 bg-white">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Start</th>
              <th>End</th>
              <th className="text-right">Gross / mo</th>
              <th className="text-right">Loaded / mo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-zinc-400">
                  No headcount yet.
                </td>
              </tr>
            ) : (
              sorted.map((h) => {
                const status = statusForHeadcount(h)
                const loaded = loadedMonthlyCost(h)
                return (
                  <tr
                    key={h.id}
                    className="clickable"
                    onClick={() => setEditingId(h.id)}
                  >
                    <td className="font-medium text-zinc-900">{h.name}</td>
                    <td className="text-zinc-700">{h.role ?? '—'}</td>
                    <td className="text-zinc-700">{formatDateShort(h.start_date)}</td>
                    <td className="text-zinc-700">
                      {h.end_date ? formatDateShort(h.end_date) : '—'}
                    </td>
                    <td className="text-right tabular-nums text-zinc-700">
                      {formatGBP(h.gross_monthly_gbp)}
                    </td>
                    <td className="text-right tabular-nums font-medium text-zinc-900">
                      {formatGBP(loaded)}
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(status)}`}>
                        {status === 'upcoming' ? 'Upcoming' : status === 'active' ? 'Active' : 'Ended'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <HeadcountEditor
          mode={creating ? 'create' : 'edit'}
          person={editing}
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
            toast.success('Person removed.')
          }}
        />
      )}
    </>
  )
}

function statusBadgeClass(status: 'upcoming' | 'active' | 'ended') {
  switch (status) {
    case 'active':
      return 'badge-emerald'
    case 'upcoming':
      return 'badge-sky'
    case 'ended':
      return 'badge-zinc'
  }
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-zinc-200 bg-white p-5">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-[28px] font-bold leading-none tracking-tight tabular-nums text-zinc-900">
        {value}
      </div>
      <div className="mt-2 text-[12px] text-zinc-500">{sub}</div>
    </div>
  )
}
