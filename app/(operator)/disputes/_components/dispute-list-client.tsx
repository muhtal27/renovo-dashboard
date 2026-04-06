'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { useEotCases } from '@/lib/queries/eot-queries'
import type { EotCaseListItem, EotCasePriority } from '@/lib/eot-types'
import {
  EmptyState,
  SkeletonPanel,
  ToolbarPill,
  formatCurrency,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'

function buildFullAddress(property: EotCaseListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
  return parts || property.name
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
}

type PriorityView = 'all' | 'high' | 'medium' | 'low'

export function DisputeListClient({
  initialCases,
}: {
  initialCases?: EotCaseListItem[] | null
}) {
  const searchParams = useSearchParams()
  const urlSearch = searchParams.get('search')?.trim().toLowerCase() ?? ''

  const { data: allCases = [], isLoading: loading, error: queryError, isFetching: refreshing, refetch } = useEotCases(initialCases)
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unable to load disputes.') : null
  const cases = useMemo(() => allCases.filter((c) => c.status === 'disputed'), [allCases])

  const [view, setView] = useState<PriorityView>('all')
  const [search, setSearch] = useState(urlSearch)

  function refreshCases() {
    void refetch()
  }

  const stats = useMemo(() => ({
    total: cases.length,
    high: cases.filter((c) => c.priority === 'high').length,
    medium: cases.filter((c) => c.priority === 'medium').length,
    low: cases.filter((c) => c.priority === 'low').length,
  }), [cases])

  const visible = useMemo(() => {
    const searchLower = search.toLowerCase()
    return cases.filter((c) => {
      if (view !== 'all' && c.priority !== view) return false
      if (searchLower) {
        const haystack = [
          c.property.name,
          c.property.address_line_1,
          c.property.city,
          c.property.postcode,
          c.tenant_name,
          c.landlord_name,
          c.id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(searchLower)) return false
      }
      return true
    })
  }, [cases, view, search])

  const totalDeposit = cases.reduce((sum, c) => sum + (c.deposit_amount ? Number(c.deposit_amount) : 0), 0)
  const totalIssues = cases.reduce((sum, c) => sum + c.issue_count, 0)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-0">
            {([
              { value: 'all' as const, label: `All (${stats.total})` },
              { value: 'high' as const, label: `High (${stats.high})` },
              { value: 'medium' as const, label: `Medium (${stats.medium})` },
              { value: 'low' as const, label: `Low (${stats.low})` },
            ] as const).map((tab) => (
              <button key={tab.value} type="button" onClick={() => setView(tab.value)}>
                <ToolbarPill active={view === tab.value}>{tab.label}</ToolbarPill>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-4 border-r border-zinc-200 pr-3 xl:flex">
              <span className="text-xs text-zinc-400">
                Deposit at risk{' '}
                <span className="font-semibold tabular-nums text-zinc-700">{formatCurrency(totalDeposit)}</span>
              </span>
              <span className="text-xs text-zinc-400">
                Issues{' '}
                <span className="font-semibold tabular-nums text-zinc-700">{totalIssues}</span>
              </span>
            </div>
            <input
              type="text"
              placeholder="Search disputes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-48 border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 outline-none transition focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={() => void refreshCases()}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:text-zinc-950"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      ) : error ? (
        <EmptyState title="Unable to load disputes" body={error} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={cases.length === 0 ? 'No active disputes' : 'No disputes match this view'}
          body={
            cases.length === 0
              ? 'Cases that are flagged as disputed will appear here.'
              : 'Adjust the priority filter or search to widen the results.'
          }
        />
      ) : (
        <div className="space-y-0">
          {visible.map((c) => (
            <Link
              key={c.id}
              href={`/operator/cases/${c.id}?step=resolved`}
              prefetch={false}
              className="grid grid-cols-1 items-start gap-x-6 border-b border-zinc-200 px-5 py-5 transition hover:bg-zinc-50/60 sm:grid-cols-[1fr_140px] md:grid-cols-[1fr_140px_120px_120px_100px]"
            >
              {/* Property + tenant */}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-950">
                  {buildFullAddress(c.property)}
                </p>
                <p className="mt-1 truncate text-sm text-zinc-500">
                  <span className="text-xs text-zinc-400">Tenant </span>
                  {c.tenant_name}
                </p>
                {c.landlord_name ? (
                  <p className="mt-0.5 truncate text-xs text-zinc-400">
                    Landlord: {c.landlord_name}
                  </p>
                ) : null}
              </div>

              {/* Priority */}
              <div className="hidden sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  Priority
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[c.priority] ?? 'bg-zinc-400'}`}
                  />
                  <span className="font-medium text-zinc-700">{formatEnumLabel(c.priority)}</span>
                </p>
              </div>

              {/* Deposit */}
              <div className="hidden md:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  Deposit
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-950">
                  {c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '—'}
                </p>
              </div>

              {/* Issues */}
              <div className="hidden md:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  Issues
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-950">
                  {c.issue_count}
                </p>
              </div>

              {/* Last activity */}
              <div className="hidden md:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  Activity
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {formatDateTime(c.last_activity_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
