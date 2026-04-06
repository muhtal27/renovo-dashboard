'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useInventoryFeedback } from '@/lib/queries/eot-queries'
import type { EotCaseListItem, EotIssue, EotRecommendationDecision } from '@/lib/eot-types'
import {
  StatusBadge,
  formatCurrency,
  formatEnumLabel,
  formatDate,
} from '@/app/eot/_components/eot-ui'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FeedbackRow = {
  issue: EotIssue
  caseItem: EotCaseListItem
}

type SeverityFilter = 'all' | 'high' | 'medium' | 'low'
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function InventoryFeedbackClient({
  initialData,
}: {
  initialData?: FeedbackRow[] | null
}) {
  const { data: rows = [], isLoading: loading, error: queryError } = useInventoryFeedback(initialData)
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load inventory feedback.') : null

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  /* Filtering */
  const filtered = rows.filter((r) => {
    if (severityFilter !== 'all' && r.issue.severity !== severityFilter) return false

    if (decisionFilter !== 'all') {
      const decision = r.issue.recommendation?.decision ?? null
      if (decisionFilter === 'pending' && decision !== null) return false
      if (decisionFilter !== 'pending' && decision !== decisionFilter) return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const haystack = [
        r.issue.title,
        r.issue.description,
        r.caseItem.tenant_name,
        buildAddress(r.caseItem.property),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })

  /* Stats */
  const totalIssues = rows.length
  const highSeverity = rows.filter((r) => r.issue.severity === 'high').length
  const chargeRecommended = rows.filter(
    (r) => r.issue.recommendation?.decision === 'charge' || r.issue.recommendation?.decision === 'partial'
  ).length
  const pendingDecision = rows.filter((r) => !r.issue.recommendation?.decision).length
  const totalEstimatedCost = sumEstimatedCosts(rows)

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-zinc-400">
        Loading inventory feedback...
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'Total issues', value: String(totalIssues) },
          { label: 'High severity', value: String(highSeverity) },
          { label: 'Charge recommended', value: String(chargeRecommended) },
          { label: 'Pending decision', value: String(pendingDecision) },
          { label: 'Est. recovery', value: formatCurrency(totalEstimatedCost) },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="border border-zinc-200 bg-white px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              {kpi.label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-950">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by issue, property, or tenant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 w-full max-w-xs border border-zinc-200 bg-white px-3 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
          className="h-8 border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
        >
          <option value="all">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={decisionFilter}
          onChange={(e) => setDecisionFilter(e.target.value as DecisionFilter)}
          className="h-8 border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
        >
          <option value="all">All decisions</option>
          <option value="charge">Charge</option>
          <option value="partial">Partial</option>
          <option value="no_charge">No charge</option>
          <option value="pending">Pending</option>
        </select>

        {(severityFilter !== 'all' || decisionFilter !== 'all' || searchQuery.trim()) && (
          <button
            type="button"
            onClick={() => {
              setSeverityFilter('all')
              setDecisionFilter('all')
              setSearchQuery('')
            }}
            className="text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-zinc-400">
          {filtered.length} of {totalIssues} issues
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">
          {totalIssues === 0
            ? 'No issues found across your cases.'
            : 'No issues match the current filters.'}
        </p>
      ) : (
        <div className="overflow-hidden border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    Issue
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    Property
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    Tenant
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    Severity
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    Decision
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                    Est. cost
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                    Case
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const rec = row.issue.recommendation
                  return (
                    <tr
                      key={row.issue.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      {/* Issue title + description */}
                      <td className="max-w-[240px] px-4 py-2.5">
                        <p className="truncate font-medium text-zinc-950">
                          {row.issue.title}
                        </p>
                        {row.issue.description ? (
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {row.issue.description}
                          </p>
                        ) : null}
                      </td>

                      {/* Property */}
                      <td className="max-w-[180px] px-4 py-2.5">
                        <p className="truncate text-zinc-600">
                          {buildAddress(row.caseItem.property)}
                        </p>
                      </td>

                      {/* Tenant */}
                      <td className="px-4 py-2.5 text-zinc-600">
                        {row.caseItem.tenant_name}
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-2.5">
                        <StatusBadge
                          label={formatEnumLabel(row.issue.severity)}
                          tone={row.issue.severity}
                        />
                      </td>

                      {/* Recommendation decision */}
                      <td className="px-4 py-2.5">
                        {rec?.decision ? (
                          <StatusBadge
                            label={formatEnumLabel(rec.decision)}
                            tone={getDecisionTone(rec.decision)}
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">Pending</span>
                        )}
                      </td>

                      {/* Estimated cost */}
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">
                        {rec?.estimated_cost
                          ? formatCurrency(Number(rec.estimated_cost))
                          : <span className="text-zinc-400">&mdash;</span>}
                      </td>

                      {/* Issue status */}
                      <td className="px-4 py-2.5">
                        <StatusBadge
                          label={formatEnumLabel(row.issue.status)}
                          tone={row.issue.status === 'open' ? 'open' : row.issue.status}
                        />
                      </td>

                      {/* Link to case */}
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/operator/cases/${row.caseItem.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 transition hover:text-zinc-900"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
