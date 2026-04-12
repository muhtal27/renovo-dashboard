'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { RefreshCcw } from 'lucide-react'
import { useInventoryFeedback } from '@/lib/queries/eot-queries'
import type { EotCaseListItem, EotIssue, EotRecommendationDecision } from '@/lib/eot-types'
import {
  StatusBadge,
  formatCurrency,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import { EmptyState, SkeletonPanel } from '@/app/operator-ui'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FeedbackRow = {
  issue: EotIssue
  caseItem: EotCaseListItem
}

type SeverityView = 'all' | 'high' | 'medium' | 'low'
type DecisionFilter = 'all' | 'charge' | 'no_charge' | 'partial' | 'pending'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildAddress(property: EotCaseListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode].filter(Boolean)
  return parts.join(', ') || property.name
}

function getDecisionTone(decision: EotRecommendationDecision | null | undefined): string {
  if (!decision) return 'draft'
  return decision
}

function sumEstimatedCosts(rows: FeedbackRow[]): number {
  return rows.reduce((sum, r) => {
    const cost = r.issue.recommendation?.estimated_cost
    return sum + (cost ? Number(cost) : 0)
  }, 0)
}

const SEVERITY_DOT: Record<string, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function InventoryFeedbackClient({
  initialData,
}: {
  initialData?: FeedbackRow[] | null
}) {
  const { data: rows = [], isLoading: loading, error: queryError, isFetching: refreshing, refetch } = useInventoryFeedback(initialData)
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load inventory feedback.') : null

  const [view, setView] = useState<SeverityView>('all')
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all')
  const [search, setSearch] = useState('')

  function refreshFeedback() {
    void refetch()
  }

  /* Stats */
  const stats = useMemo(() => ({
    total: rows.length,
    high: rows.filter((r) => r.issue.severity === 'high').length,
    medium: rows.filter((r) => r.issue.severity === 'medium').length,
    low: rows.filter((r) => r.issue.severity === 'low').length,
  }), [rows])

  const chargeRecommended = rows.filter(
    (r) => r.issue.recommendation?.decision === 'charge' || r.issue.recommendation?.decision === 'partial'
  ).length
  const pendingDecision = rows.filter((r) => !r.issue.recommendation?.decision).length
  const totalEstimatedCost = sumEstimatedCosts(rows)

  /* Filtering */
  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase()
    return rows.filter((r) => {
      if (view !== 'all' && r.issue.severity !== view) return false

      if (decisionFilter !== 'all') {
        const decision = r.issue.recommendation?.decision ?? null
        if (decisionFilter === 'pending' && decision !== null) return false
        if (decisionFilter !== 'pending' && decision !== decisionFilter) return false
      }

      if (searchLower) {
        const haystack = [
          r.issue.title,
          r.issue.description,
          r.caseItem.tenant_name,
          buildAddress(r.caseItem.property),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(searchLower)) return false
      }

      return true
    })
  }, [rows, view, decisionFilter, search])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Inventory Feedback</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {stats.total} issues &middot; {pendingDecision} pending &middot; {formatCurrency(totalEstimatedCost)} estimated recovery
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshFeedback()}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          {([
            { value: 'all' as const, label: `All (${stats.total})` },
            { value: 'high' as const, label: `High (${stats.high})` },
            { value: 'medium' as const, label: `Medium (${stats.medium})` },
            { value: 'low' as const, label: `Low (${stats.low})` },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setView(tab.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                view === tab.value
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={decisionFilter}
          onChange={(e) => setDecisionFilter(e.target.value as DecisionFilter)}
          className="h-[34px] rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700"
        >
          <option value="all">All decisions</option>
          <option value="charge">Charge</option>
          <option value="partial">Partial</option>
          <option value="no_charge">No charge</option>
          <option value="pending">Pending</option>
        </select>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-[34px] w-[200px] rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      ) : error ? (
        <EmptyState title="Unable to load feedback" body={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? 'No issues found' : 'No issues match this view'}
          body={
            rows.length === 0
              ? 'Issues identified across your checkout cases will appear here.'
              : 'Adjust the severity tab, decision filter, or search to widen the results.'
          }
        />
      ) : (
        <div className="space-y-0">
          {filtered.map((row) => {
            const rec = row.issue.recommendation
            return (
              <Link
                key={row.issue.id}
                href={`/operator/cases/${row.caseItem.id}`}
                prefetch={false}
                className="modern-table-row grid grid-cols-1 items-start gap-x-6 border-b border-zinc-200 px-5 py-5 transition sm:grid-cols-[1fr_120px] md:grid-cols-[1fr_120px_100px_100px_100px]"
              >
                {/* Issue + property + tenant */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">
                    {row.issue.title}
                  </p>
                  {row.issue.description ? (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {row.issue.description}
                    </p>
                  ) : null}
                  <p className="mt-1 truncate text-sm text-zinc-500">
                    <span className="text-xs text-zinc-400">Property </span>
                    {buildAddress(row.caseItem.property)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">
                    Tenant: {row.caseItem.tenant_name}
                  </p>
                </div>

                {/* Severity */}
                <div className="hidden sm:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Severity
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[row.issue.severity] ?? 'bg-zinc-400'}`}
                    />
                    <span className="font-medium text-zinc-700">{formatEnumLabel(row.issue.severity)}</span>
                  </p>
                </div>

                {/* Decision */}
                <div className="hidden md:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Decision
                  </p>
                  <div className="mt-1">
                    {rec?.decision ? (
                      <StatusBadge
                        label={formatEnumLabel(rec.decision)}
                        tone={getDecisionTone(rec.decision)}
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">Pending</span>
                    )}
                  </div>
                </div>

                {/* Estimated cost */}
                <div className="hidden md:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Est. cost
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-950">
                    {rec?.estimated_cost
                      ? formatCurrency(Number(rec.estimated_cost))
                      : '—'}
                  </p>
                </div>

                {/* Status */}
                <div className="hidden md:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Status
                  </p>
                  <div className="mt-1">
                    <StatusBadge
                      label={formatEnumLabel(row.issue.status)}
                      tone={row.issue.status === 'open' ? 'open' : row.issue.status}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
