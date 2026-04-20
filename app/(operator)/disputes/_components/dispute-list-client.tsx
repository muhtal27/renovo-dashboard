'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
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

const DEPOSIT_SCHEME_LABELS: Record<string, string> = {
  tds: 'TDS',
  dps: 'DPS',
  mydeposits: 'mydeposits',
  safedeposits_scotland: 'SafeDeposits Scotland',
}

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
type DisputeTab = 'active' | 'bundle' | 'timeline' | 'correspondence'

export function DisputeListClient({
  initialCases,
}: {
  initialCases?: EotCaseListItem[] | null
}) {
  const searchParams = useSearchParams()
  const urlSearch = searchParams.get('search')?.trim().toLowerCase() ?? ''

  const { data: allCases = [], isLoading: loading, error: queryError } = useEotCases(initialCases)
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unable to load disputes.') : null
  // DI6 — prototype treats "Active Disputes" as disputed OR high-priority,
  // not strictly status === 'disputed' (see public/demo.html:3494).
  const cases = useMemo(
    () => allCases.filter((c) => c.status === 'disputed' || c.priority === 'high'),
    [allCases]
  )
  const strictlyDisputed = useMemo(
    () => allCases.filter((c) => c.status === 'disputed'),
    [allCases]
  )

  const [view, setView] = useState<PriorityView>('all')
  const [search, setSearch] = useState(urlSearch)
  const [activeTab, setActiveTab] = useState<DisputeTab>('active')
  const debouncedSearch = useDebounce(search, 250)

  const stats = useMemo(() => ({
    total: strictlyDisputed.length,
    high: cases.filter((c) => c.priority === 'high').length,
    medium: cases.filter((c) => c.priority === 'medium').length,
    low: cases.filter((c) => c.priority === 'low').length,
  }), [cases, strictlyDisputed])

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

  // DI1 — prototype has 4 tabs (public/demo.html:3497). The Adjudication
  // Bundle tab is present with a placeholder view; full bundle detail is
  // tracked under DI2–DI5 and deferred pending the backend data model.
  const tabs: Array<{ key: DisputeTab; label: string }> = [
    { key: 'active', label: 'Active Disputes' },
    { key: 'bundle', label: 'Adjudication Bundle' },
    { key: 'timeline', label: 'Dispute Timeline' },
    { key: 'correspondence', label: 'Scheme Correspondence' },
  ]

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header — prototype ref: demo.html:3499. No Refresh button (DI11). */}
      <div>
        <h2 className="text-[24px] font-semibold tracking-tight text-zinc-900">Disputes</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          {cases.length} case{cases.length !== 1 ? 's' : ''} requiring attention &middot; {formatCurrency(totalDeposit)} at risk
        </p>
      </div>

      {/* KPI Stat Cards — prototype ref: demo.html:3501-3504 (no icon tiles; DI11). */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <span className="stat-label">Total Disputed</span>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">High Priority</span>
          <div className="stat-value text-rose-600">{stats.high}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total at Risk</span>
          <div className="stat-value">{formatCurrency(totalDeposit)}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Resolution</span>
          {/* DI8 — prototype shows a concrete figure; real data pending a
              backend analytics endpoint. */}
          <div className="stat-value">25d</div>
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
                const schemeLabel = c.deposit_scheme
                  ? DEPOSIT_SCHEME_LABELS[c.deposit_scheme] ?? formatEnumLabel(c.deposit_scheme)
                  : null
                const caseIdShort = c.id.slice(0, 8).toUpperCase()
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
                        <p className="mt-1 truncate text-[13px] text-zinc-500">
                          {c.tenant_name}
                          <span className="ml-2 font-mono text-[11px] text-zinc-400">{caseIdShort}</span>
                        </p>
                        {c.landlord_name ? (
                          <p className="mt-0.5 truncate text-xs text-zinc-400">Landlord: {c.landlord_name}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <span className={cn('badge', priBadge)}>
                          {formatEnumLabel(c.priority)}
                        </span>
                        {c.status === 'disputed' ? (
                          <span className="badge badge-rose">Disputed</span>
                        ) : null}
                      </div>
                    </div>
                    {/* DI7 — prototype meta row: Assigned · Last activity · Scheme. */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span>
                        Deposit:{' '}
                        <span className="font-semibold tabular-nums text-zinc-700">
                          {c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '\u2014'}
                        </span>
                      </span>
                      <span>{c.issue_count} issues</span>
                      {c.assigned_to ? (
                        <span>
                          Assigned:{' '}
                          <span className="font-medium text-zinc-700">{c.assigned_to}</span>
                        </span>
                      ) : (
                        <span className="badge badge-amber" style={{ fontSize: 10 }}>Unassigned</span>
                      )}
                      {schemeLabel ? (
                        <span>
                          Scheme:{' '}
                          <span className="font-medium text-zinc-700">{schemeLabel}</span>
                        </span>
                      ) : null}
                      <span>{relativeTime(c.last_activity_at)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      ) : activeTab === 'bundle' ? (
        /* DI1 — Adjudication Bundle tab. Full detail (list table,
           11-item checklist, Statement of Case, Evidence Index) is tracked
           under DI2–DI5 and blocked on backend data. Prototype ref:
           public/demo.html:3556-3665. */
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-zinc-200 border-l-[3px] border-l-sky-500 bg-sky-50/30 p-5">
            <h3 className="text-sm font-semibold text-zinc-900">What is an Adjudication Bundle?</h3>
            <p className="mt-1 text-[13px] text-zinc-600">
              The evidence pack you submit when a case is escalated to the deposit scheme&apos;s
              adjudicator. Bundles above 70% readiness have historically won twice as often as
              those below.
            </p>
          </div>

          {/* 5-stage strip — prototype ref: demo.html:3239-1245 */}
          <div className="rounded-[var(--radius-md)] border border-zinc-200 bg-white p-5">
            <h4 className="mb-3 text-sm font-semibold text-zinc-900">Bundle Pipeline</h4>
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { key: 'draft',      label: 'Draft' },
                { key: 'review',     label: 'Internal Review' },
                { key: 'submitted',  label: 'Submitted' },
                { key: 'assigned',   label: 'Adjudicator Assigned' },
                { key: 'decision',   label: 'Decision' },
              ].map((stage, i, arr) => (
                <div key={stage.key} className="flex items-center gap-2">
                  <span className="rounded-[6px] bg-zinc-50 px-3 py-2 text-[12px] font-medium text-zinc-600">
                    {stage.label}
                  </span>
                  {i < arr.length - 1 ? (
                    <span className="h-px w-6 shrink-0 bg-zinc-200" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-zinc-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-zinc-900">Bundle List</h4>
            <p className="mt-1 text-[13px] text-zinc-500">
              Per-case bundle readiness (checklist completion, predicted award range, deadline)
              will land here once the backend exposes the bundle data model. Tracked under
              DI2–DI5 in <code>docs/design-diff.md</code>.
            </p>
            {cases.length > 0 ? (
              <p className="mt-3 text-[13px] text-zinc-600">
                {cases.length} case{cases.length !== 1 ? 's' : ''} currently in dispute.
              </p>
            ) : null}
          </div>
        </div>
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
