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
      <div className="stat-card">
        <div className="stat-label">Total Checkouts</div>
        <div className="stat-value tabular-nums text-zinc-950">{cases.length}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">In Progress</div>
        <div className="stat-value tabular-nums text-sky-700">{inProgress}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Disputed</div>
        <div className="stat-value tabular-nums text-rose-700">{disputed}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Resolved</div>
        <div className="stat-value tabular-nums text-emerald-700">{resolved}</div>
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
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Tenant</th>
              <th>Status</th>
              <th className="hidden md:table-cell">Priority</th>
              <th className="hidden text-right md:table-cell">Deposit</th>
              <th className="hidden text-right lg:table-cell">Issues</th>
              <th className="text-right">Activity</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const address = buildCaseAddress(c.property)
              const meta = STATUS_META[c.status] ?? STATUS_META.draft
              const priBadge = PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.low
              return (
                <tr key={c.id} className="clickable">
                  <td>
                    <Link href={`/operator/cases/${c.id}`} prefetch={false} className="block">
                      <p className="font-medium text-zinc-900">{address}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">{c.id.slice(0, 8)}</p>
                    </Link>
                  </td>
                  <td className="text-zinc-700">{c.tenant_name}</td>
                  <td>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', meta.badge)}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', priBadge)}>
                      {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                    </span>
                  </td>
                  <td className="hidden text-right font-semibold tabular-nums text-zinc-950 md:table-cell">
                    {c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '\u2014'}
                  </td>
                  <td className="hidden text-right tabular-nums text-zinc-600 lg:table-cell">
                    {c.issue_count}
                  </td>
                  <td className="text-right text-xs text-zinc-400">
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
    <div className="kanban">
      {columns.map((col) => (
        <div key={col.status} className="kanban-col">
          <div className="kanban-col-header">
            <span className="kanban-col-dot" style={{ backgroundColor: col.color }} />
            <span className="kanban-col-title">{col.label}</span>
            <span className="kanban-col-count">{col.cards.length}</span>
          </div>
          <div className="kanban-cards">
            {col.cards.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-zinc-400">No cases</p>
            ) : (
              col.cards.map((c) => {
                const address = buildCaseAddress(c.property)
                const shortAddress = address.split(',')[0]
                return (
                  <Link
                    key={c.id}
                    href={`/operator/cases/${c.id}`}
                    prefetch={false}
                    className="kanban-card"
                  >
                    <div className="kanban-card-title">{shortAddress}</div>
                    <div className="kanban-card-sub">{c.tenant_name}</div>
                    <div className="kanban-card-footer">
                      <span className="kanban-card-amount">
                        {c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '\u2014'}
                      </span>
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.low)}>
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
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-zinc-900">Tenancies</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {cases.length} checkout case{cases.length !== 1 ? 's' : ''} across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'pill',
              viewMode === 'table' && 'active',
            )}
          >
            <List className="mr-1 inline h-3.5 w-3.5" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={cn(
              'pill',
              viewMode === 'kanban' && 'active',
            )}
          >
            <Columns3 className="mr-1 inline h-3.5 w-3.5" />
            Board
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <StatCards cases={cases} />

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="pill-row flex-1">
          {filters.map((f) => {
            const count = f.key === 'all' ? cases.length : (statusCounts[f.key] ?? 0)
            if (f.key !== 'all' && count === 0) return null
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={cn('pill', statusFilter === f.key && 'active')}
              >
                {f.label}
                {f.key !== 'all' && count > 0 ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
        <input
          type="text"
          placeholder="Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-[36px] min-w-[180px] max-w-[280px] flex-1 rounded-[var(--radius-lg)] border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-[3px] focus:ring-emerald-500/10"
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
