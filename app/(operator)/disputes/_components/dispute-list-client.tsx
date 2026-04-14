'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Clock,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEotCases } from '@/lib/queries/eot-queries'
import type { EotCaseListItem } from '@/lib/eot-types'
import { EmptyState, SkeletonPanel } from '@/app/operator-ui'
import {
  formatCurrency,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import { useDebounce } from '@/lib/use-debounce'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'

function buildFullAddress(property: EotCaseListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
  return parts || property.name
}

const PRIORITY_BORDER: Record<string, string> = {
  high: 'border-l-rose-500',
  medium: 'border-l-amber-500',
  low: 'border-l-zinc-300',
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'badge-rose',
  medium: 'badge-amber',
  low: 'badge-zinc',
}

type PriorityView = 'all' | 'high' | 'medium' | 'low'
type DisputeTab = 'active' | 'timeline' | 'correspondence'

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
  const [activeTab, setActiveTab] = useState<DisputeTab>('active')
  const debouncedSearch = useDebounce(search, 250)

  function refreshCases() {
    void refetch()
    toast.success('Disputes refreshed')
  }

  const stats = useMemo(() => ({
    total: cases.length,
    high: cases.filter((c) => c.priority === 'high').length,
    medium: cases.filter((c) => c.priority === 'medium').length,
    low: cases.filter((c) => c.priority === 'low').length,
  }), [cases])

  const totalDeposit = cases.reduce((sum, c) => sum + (c.deposit_amount ? Number(c.deposit_amount) : 0), 0)

  const visible = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase()
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
  }, [cases, view, debouncedSearch])

  const filters: Array<{ key: PriorityView; label: string; count: number }> = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'high', label: 'High', count: stats.high },
    { key: 'medium', label: 'Medium', count: stats.medium },
    { key: 'low', label: 'Low', count: stats.low },
  ]

  const tabs: Array<{ key: DisputeTab; label: string }> = [
    { key: 'active', label: 'Active Disputes' },
    { key: 'timeline', label: 'Dispute Timeline' },
    { key: 'correspondence', label: 'Scheme Correspondence' },
  ]

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-zinc-900">Disputes</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {stats.total} disputed case{stats.total !== 1 ? 's' : ''} &middot; {formatCurrency(totalDeposit)} at risk
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshCases()}
          className="app-secondary-button"
        >
          <RefreshCcw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="h-[18px] w-[18px]" />
            </div>
            <div>
              <span className="stat-label">Total Disputed</span>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-[18px] w-[18px]" />
            </div>
            <div>
              <span className="stat-label">High Priority</span>
              <div className="stat-value text-rose-600">{stats.high}</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500">
              <span className="text-base font-bold">&pound;</span>
            </div>
            <div>
              <span className="stat-label">Total at Risk</span>
              <div className="stat-value">{formatCurrency(totalDeposit)}</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Clock className="h-[18px] w-[18px]" />
            </div>
            <div>
              <span className="stat-label">Avg Resolution</span>
              <div className="stat-value">&mdash;</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-[18px] py-2.5 text-[13px] font-medium transition',
              activeTab === tab.key
                ? 'border-b-2 border-zinc-900 text-zinc-900'
                : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'active' ? (
        <>
          {/* Filter pills + search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setView(f.key)}
                  className={cn(
                    'pill',
                    view === f.key && 'active',
                  )}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search disputes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[34px] w-[200px] rounded-[var(--radius-lg)] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>

          {/* Dispute cards */}
          {loading ? (
            <div className="space-y-3">
              <SkeletonPanel className="h-24" />
              <SkeletonPanel className="h-24" />
              <SkeletonPanel className="h-24" />
            </div>
          ) : error ? (
            <EmptyState title="Unable to load disputes" body={error} />
          ) : visible.length === 0 ? (
            <EmptyState
              title={cases.length === 0 ? 'No active disputes' : 'No disputes match'}
              body={
                cases.length === 0
                  ? 'Cases that are disputed will appear here.'
                  : 'Adjust the priority filter or search.'
              }
            />
          ) : (
            <div className="space-y-3">
              {visible.map((c) => {
                const address = buildFullAddress(c.property)
                const priBorder = PRIORITY_BORDER[c.priority] ?? 'border-l-zinc-300'
                const priBadge = PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.low
                return (
                  <Link
                    key={c.id}
                    href={`/operator/cases/${c.id}?step=refund`}
                    prefetch={false}
                    className={cn(
                      'block rounded-[var(--radius-md)] border border-zinc-200 border-l-[3px] bg-white px-5 py-4 transition hover:shadow-sm',
                      priBorder,
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-950">{address}</p>
                        <p className="mt-1 truncate text-[13px] text-zinc-500">{c.tenant_name}</p>
                        {c.landlord_name ? (
                          <p className="mt-0.5 truncate text-xs text-zinc-400">Landlord: {c.landlord_name}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={cn('badge', priBadge)}>
                          {formatEnumLabel(c.priority)}
                        </span>
                        <span className="badge badge-rose">Disputed</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
                      <span>Deposit: <span className="font-semibold tabular-nums text-zinc-700">{c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '\u2014'}</span></span>
                      <span>{c.issue_count} issues</span>
                      <span>{relativeTime(c.last_activity_at)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      ) : activeTab === 'timeline' ? (
        <div className="space-y-3">
          {loading ? (
            <SkeletonPanel className="h-48" />
          ) : cases.length === 0 ? (
            <EmptyState title="No dispute timeline" body="Timeline events will appear here as disputes progress." />
          ) : (
            <div className="rounded-[var(--radius-md)] border border-zinc-200 bg-white p-5">
              <div className="space-y-0">
                {cases
                  .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
                  .map((c) => {
                    const address = buildFullAddress(c.property)
                    const priBorder = c.priority === 'high' ? 'bg-rose-500' : c.priority === 'medium' ? 'bg-amber-500' : 'bg-zinc-400'
                    return (
                      <Link
                        key={c.id}
                        href={`/operator/cases/${c.id}?step=refund`}
                        prefetch={false}
                        className="flex gap-3 border-b border-zinc-100 py-3 last:border-b-0 transition hover:bg-zinc-50 rounded-md px-2 -mx-2"
                      >
                        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', priBorder)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-[13px] font-medium text-zinc-900">{address}</p>
                            <span className="shrink-0 text-[11px] text-zinc-400">{relativeTime(c.last_activity_at)}</span>
                          </div>
                          <p className="mt-0.5 text-sm text-zinc-500">
                            {c.tenant_name} &middot; {c.issue_count} issues &middot; {c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : 'No deposit'}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Scheme Correspondence */
        <div className="space-y-3">
          {loading ? (
            <SkeletonPanel className="h-48" />
          ) : cases.length === 0 ? (
            <EmptyState title="No correspondence" body="Deposit scheme correspondence will appear here." />
          ) : (
            cases.map((c) => {
              const address = buildFullAddress(c.property)
              const statusColor = c.status === 'disputed' ? 'border-l-rose-500' : c.status === 'resolved' ? 'border-l-emerald-500' : 'border-l-zinc-300'
              const statusBadge = c.status === 'disputed' ? 'badge-rose' : c.status === 'resolved' ? 'badge-emerald' : 'badge-zinc'
              return (
                <Link
                  key={c.id}
                  href={`/operator/cases/${c.id}?step=refund`}
                  prefetch={false}
                  className={cn(
                    'block rounded-[var(--radius-md)] border border-zinc-200 border-l-[3px] bg-white px-5 py-4 transition hover:shadow-sm',
                    statusColor,
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-950">{address}</p>
                      <p className="mt-1 text-[13px] text-zinc-500">{c.tenant_name}</p>
                    </div>
                    <span className={cn('badge', statusBadge)}>
                      {formatEnumLabel(c.status)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">
                    {c.deposit_amount ? `${formatCurrency(Number(c.deposit_amount))} deposit` : 'No deposit'} &middot; {relativeTime(c.last_activity_at)}
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
