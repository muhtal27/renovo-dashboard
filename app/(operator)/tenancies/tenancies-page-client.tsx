'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Columns3,
  GripVertical,
  List,
  RefreshCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEotTenancies, useEotCases } from '@/lib/queries/eot-queries'
import type { EotTenancyListItem, EotCaseListItem, EotCaseStatus } from '@/lib/eot-types'
import { EmptyState, SkeletonPanel } from '@/app/operator-ui'
import {
  formatCurrency,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'
import { useDebounce } from '@/lib/use-debounce'

/* ────────────────────────────────────────────────────────────────── */
/*  Helpers                                                           */
/* ────────────────────────────────────────────────────────────────── */

function buildAddress(property: EotTenancyListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode].filter(Boolean)
  return parts.join(', ') || property.name
}

function buildCaseAddress(property: EotCaseListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode].filter(Boolean)
  return parts.join(', ') || property.name
}

type ViewMode = 'table' | 'kanban'

const STATUS_META: Record<string, { label: string; badge: string }> = {
  draft: { label: 'Draft', badge: 'bg-zinc-100 text-zinc-600' },
  collecting_evidence: { label: 'Collecting', badge: 'bg-sky-50 text-sky-700' },
  analysis: { label: 'Analysis', badge: 'bg-indigo-50 text-indigo-700' },
  review: { label: 'Review', badge: 'bg-amber-50 text-amber-700' },
  draft_sent: { label: 'Draft Sent', badge: 'bg-violet-50 text-violet-700' },
  ready_for_claim: { label: 'Ready', badge: 'bg-emerald-50 text-emerald-700' },
  submitted: { label: 'Submitted', badge: 'bg-cyan-50 text-cyan-700' },
  disputed: { label: 'Disputed', badge: 'bg-rose-50 text-rose-700' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-50 text-emerald-700' },
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-rose-50 text-rose-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-zinc-100 text-zinc-600',
}

const WORKFLOW_STEPS: EotCaseStatus[] = [
  'draft', 'collecting_evidence', 'analysis', 'review',
  'draft_sent', 'ready_for_claim', 'submitted', 'disputed', 'resolved',
]

const KANBAN_COLORS: Record<string, string> = {
  draft: '#a1a1aa',
  collecting_evidence: '#0ea5e9',
  analysis: '#6366f1',
  review: '#f59e0b',
  draft_sent: '#8b5cf6',
  ready_for_claim: '#10b981',
  submitted: '#06b6d4',
  disputed: '#f43f5e',
  resolved: '#059669',
}

/* ────────────────────────────────────────────────────────────────── */
/*  Stat Cards                                                        */
/* ────────────────────────────────────────────────────────────────── */

function StatCards({ cases }: { cases: EotCaseListItem[] }) {
  const inProgress = cases.filter((c) => !['resolved', 'disputed'].includes(c.status)).length
  const disputed = cases.filter((c) => c.status === 'disputed').length
  const resolved = cases.filter((c) => c.status === 'resolved').length

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-medium text-zinc-500">Total Checkouts</p>
        <p className="mt-2 text-[28px] font-bold tabular-nums leading-none tracking-tight">{cases.length}</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-medium text-zinc-500">In Progress</p>
        <p className="mt-2 text-[28px] font-bold tabular-nums leading-none tracking-tight text-sky-700">{inProgress}</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-medium text-zinc-500">Disputed</p>
        <p className="mt-2 text-[28px] font-bold tabular-nums leading-none tracking-tight text-rose-700">{disputed}</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-medium text-zinc-500">Resolved</p>
        <p className="mt-2 text-[28px] font-bold tabular-nums leading-none tracking-tight text-emerald-700">{resolved}</p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Case Table                                                        */
/* ────────────────────────────────────────────────────────────────── */

function CaseTable({ cases }: { cases: EotCaseListItem[] }) {
  if (cases.length === 0) {
    return (
      <EmptyState
        title="No cases match"
        body="Adjust the filter or search to widen results."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/60">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">Property</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">Tenant</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">Status</th>
              <th className="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400 md:table-cell">Priority</th>
              <th className="hidden px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400 md:table-cell">Deposit</th>
              <th className="hidden px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400 lg:table-cell">Issues</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400">Activity</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const address = buildCaseAddress(c.property)
              const meta = STATUS_META[c.status] ?? STATUS_META.draft
              const priBadge = PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.low
              return (
                <tr key={c.id} className="border-b border-zinc-100 transition last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/operator/cases/${c.id}`} prefetch={false} className="block">
                      <p className="font-medium text-zinc-950">{address}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">{c.id.slice(0, 8)}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{c.tenant_name}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', meta.badge)}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', priBadge)}>
                      {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right font-semibold tabular-nums text-zinc-950 md:table-cell">
                    {c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '\u2014'}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-zinc-600 lg:table-cell">
                    {c.issue_count}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-400">
                    {relativeTime(c.last_activity_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Kanban Board                                                      */
/* ────────────────────────────────────────────────────────────────── */

function KanbanBoard({ cases }: { cases: EotCaseListItem[] }) {
  const columns = WORKFLOW_STEPS.map((status) => ({
    status,
    label: STATUS_META[status]?.label ?? status,
    color: KANBAN_COLORS[status] ?? '#a1a1aa',
    cards: cases.filter((c) => c.status === status),
  }))

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div
          key={col.status}
          className="flex w-[260px] shrink-0 flex-col rounded-xl border border-zinc-200 bg-zinc-50"
        >
          {/* Column header */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: col.color }}
            />
            <span className="text-[13px] font-medium text-zinc-700">{col.label}</span>
            <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-600">
              {col.cards.length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
            {col.cards.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-400">No cases</p>
            ) : (
              col.cards.map((c) => {
                const address = buildCaseAddress(c.property)
                const shortAddress = address.split(',')[0]
                const priBadge = PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.low
                return (
                  <Link
                    key={c.id}
                    href={`/operator/cases/${c.id}`}
                    prefetch={false}
                    className="rounded-lg border border-zinc-200 bg-white p-3 transition hover:shadow-sm"
                  >
                    <p className="text-[13px] font-medium text-zinc-900">{shortAddress}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{c.tenant_name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold tabular-nums text-zinc-700">
                        {c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '\u2014'}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', priBadge)}>
                        {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Main export                                                       */
/* ────────────────────────────────────────────────────────────────── */

export function TenanciesPageClient({
  initialTenancies,
}: {
  initialTenancies?: EotTenancyListItem[] | null
}) {
  const {
    data: tenancies = [],
    isLoading: tenanciesLoading,
    isFetching: refreshing,
    refetch: refetchTenancies,
  } = useEotTenancies(initialTenancies)

  const {
    data: cases = [],
    isLoading: casesLoading,
    refetch: refetchCases,
  } = useEotCases()

  const loading = tenanciesLoading || casesLoading

  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [statusFilter, setStatusFilter] = useState<EotCaseStatus | 'all'>('all')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const debouncedSearch = useDebounce(search, 250)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of cases) counts[c.status] = (counts[c.status] ?? 0) + 1
    return counts
  }, [cases])

  const filteredCases = useMemo(() => {
    let result = [...cases]
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter)
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((c) => {
        const searchable = [
          c.tenant_name,
          c.property.address_line_1 ?? '',
          c.property.city ?? '',
          c.property.postcode ?? '',
          c.property.name,
        ].join(' ').toLowerCase()
        return searchable.includes(q)
      })
    }
    return result.sort((a, b) =>
      new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
    )
  }, [cases, statusFilter, debouncedSearch])

  const handleRefresh = () => {
    void refetchTenancies()
    void refetchCases()
    toast.success('Refreshed')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonPanel className="h-12" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SkeletonPanel className="h-24" />
          <SkeletonPanel className="h-24" />
          <SkeletonPanel className="h-24" />
          <SkeletonPanel className="h-24" />
        </div>
        <SkeletonPanel className="h-[400px]" />
      </div>
    )
  }

  const filters: Array<{ key: EotCaseStatus | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    ...WORKFLOW_STEPS.map((s) => ({
      key: s,
      label: STATUS_META[s]?.label ?? s,
    })),
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Tenancies</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {cases.length} checkout cases across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              viewMode === 'table'
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
            )}
          >
            <List className="h-3.5 w-3.5" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              viewMode === 'kanban'
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Board
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <StatCards cases={cases} />

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {filters.map((f) => {
            const count = f.key === 'all' ? cases.length : (statusCounts[f.key] ?? 0)
            if (f.key !== 'all' && count === 0) return null
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  statusFilter === f.key
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
                )}
              >
                {f.label}
                {f.key !== 'all' && count > 0 ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-[34px] w-[200px] rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      {/* Table or Kanban */}
      {viewMode === 'table' ? (
        <CaseTable cases={filteredCases} />
      ) : (
        <KanbanBoard cases={filteredCases} />
      )}
    </div>
  )
}
