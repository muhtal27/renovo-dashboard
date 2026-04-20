'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  List,
} from 'lucide-react'
import { useEotTenancies, useEotCases } from '@/lib/queries/eot-queries'
import type { EotTenancyListItem, EotCaseListItem, EotCaseStatus } from '@/lib/eot-types'
import { EmptyState, SkeletonPanel } from '@/app/operator-ui'
import {
  formatCurrency,
} from '@/app/eot/_components/eot-ui'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'
import { useDebounce } from '@/lib/use-debounce'

const PAGE_SIZE = 10

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
  draft: { label: 'Draft', badge: 'badge-zinc' },
  collecting_evidence: { label: 'Collecting', badge: 'badge-sky' },
  analysis: { label: 'Analysis', badge: 'badge-indigo' },
  review: { label: 'Review', badge: 'badge-amber' },
  draft_sent: { label: 'Draft Sent', badge: 'badge-violet' },
  ready_for_claim: { label: 'Ready', badge: 'badge-emerald' },
  submitted: { label: 'Submitted', badge: 'badge-cyan' },
  disputed: { label: 'Disputed', badge: 'badge-rose' },
  resolved: { label: 'Resolved', badge: 'badge-emerald' },
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'badge-rose',
  medium: 'badge-amber',
  low: 'badge-zinc',
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

// Prototype ref: public/demo.html:1402 — days-until badge (rose ≤7 / amber ≤14).
function DeadlineCell({ tenancy }: { tenancy: EotTenancyListItem | null | undefined }) {
  if (!tenancy?.end_date) return <span className="text-zinc-400">—</span>
  const end = new Date(tenancy.end_date)
  if (Number.isNaN(end.getTime())) return <span className="text-zinc-400">—</span>
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (days < 0) return <span className="badge badge-rose" style={{ fontSize: 10 }}>{Math.abs(days)}d overdue</span>
  if (days <= 7) return <span className="badge badge-rose" style={{ fontSize: 10 }}>{days}d left</span>
  if (days <= 14) return <span className="badge badge-amber" style={{ fontSize: 10 }}>{days}d left</span>
  return <span className="badge badge-zinc" style={{ fontSize: 10 }}>{days}d</span>
}

function CaseTable({
  cases,
  tenancyById,
  page,
  pageCount,
  onPageChange,
}: {
  cases: EotCaseListItem[]
  tenancyById: Map<string, EotTenancyListItem>
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
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
              <th className="hidden md:table-cell">Assigned</th>
              <th className="hidden md:table-cell">Priority</th>
              <th className="hidden text-right md:table-cell">Deposit</th>
              <th className="hidden md:table-cell">Deadline</th>
              <th className="hidden text-right lg:table-cell">Issues</th>
              <th className="text-right">Activity</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const address = buildCaseAddress(c.property)
              const meta = STATUS_META[c.status] ?? STATUS_META.draft
              const priBadge = PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.low
              const tenancy = tenancyById.get(c.id)
              return (
                <tr key={c.id} className="clickable">
                  <td>
                    <Link href={`/operator/cases/${c.id}`} prefetch={false} className="block">
                      <p className="font-medium text-zinc-900">{address}</p>
                      {/* TN4 — full case ID, not a truncated slice. */}
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-400">{c.id}</p>
                    </Link>
                  </td>
                  <td className="text-zinc-700">{c.tenant_name}</td>
                  <td>
                    <span className={cn('badge', meta.badge)}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="hidden text-zinc-700 md:table-cell">
                    {c.assigned_to ? (
                      <span className="text-[13px]">{c.assigned_to}</span>
                    ) : (
                      <span className="badge badge-amber" style={{ fontSize: 10 }}>Unassigned</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell">
                    <span className={cn('badge', priBadge)}>
                      {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                    </span>
                  </td>
                  <td className="hidden text-right font-semibold tabular-nums text-zinc-950 md:table-cell">
                    {c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '\u2014'}
                  </td>
                  <td className="hidden md:table-cell">
                    {c.status === 'resolved' ? (
                      <span className="badge badge-zinc" style={{ fontSize: 10 }}>Closed</span>
                    ) : (
                      <DeadlineCell tenancy={tenancy} />
                    )}
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

      {/* TN3 — pagination. Prototype ref: demo.html:2275 (10/page Prev/Next). */}
      {pageCount > 1 ? (
        <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-[12px] text-zinc-500">
          <span>
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              <ChevronLeft className="h-3 w-3" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              <span>Next</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : null}
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
                      <span className={cn('badge', PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.low)}>
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
  } = useEotTenancies(initialTenancies)

  const {
    data: cases = [],
    isLoading: casesLoading,
  } = useEotCases()

  const loading = tenanciesLoading || casesLoading

  // Build a case-id → tenancy lookup so the Deadline column can read
  // the tenancy end-date without refetching per-row.
  const tenancyById = useMemo(() => {
    const map = new Map<string, EotTenancyListItem>()
    for (const t of tenancies) {
      if (t.case_id) map.set(t.case_id, t)
    }
    return map
  }, [tenancies])

  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [statusFilter, setStatusFilter] = useState<EotCaseStatus | 'all'>('all')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [page, setPage] = useState(0)
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

  const pageCount = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE))
  const clampedPage = Math.min(page, pageCount - 1)
  const pagedCases = useMemo(
    () => filteredCases.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE),
    [filteredCases, clampedPage]
  )

  function handleFilterChange(next: EotCaseStatus | 'all') {
    setStatusFilter(next)
    setPage(0)
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

      {/* Filters + search — TN5: always render every status pill. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="pill-row flex-1">
          {filters.map((f) => {
            const count = f.key === 'all' ? cases.length : (statusCounts[f.key] ?? 0)
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterChange(f.key)}
                className={cn('pill', statusFilter === f.key && 'active')}
              >
                {f.label}
                {f.key !== 'all' ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
        <input
          type="text"
          placeholder="Search cases..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="h-[36px] min-w-[180px] max-w-[280px] flex-1 rounded-[var(--radius-lg)] border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      {/* Table or Kanban */}
      {viewMode === 'table' ? (
        <CaseTable
          cases={pagedCases}
          tenancyById={tenancyById}
          page={clampedPage}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      ) : (
        <KanbanBoard cases={filteredCases} />
      )}
    </div>
  )
}
