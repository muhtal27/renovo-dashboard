'use client'

import Link from 'next/link'
import {
  formatCurrency,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import type { EotReportSummary } from '@/lib/eot-types'

/* ────────────────────────────────────────────────────────────── */
/*  Distribution bar                                              */
/* ────────────────────────────────────────────────────────────── */

function DistributionBar({
  items,
}: {
  items: Array<{ label: string; value: number; color: string }>
}) {
  const total = items.reduce((sum, i) => sum + i.value, 0)

  if (total === 0) {
    return <p className="text-sm text-zinc-400">No data</p>
  }

  return (
    <div className="space-y-2.5">
      {/* Stacked bar */}
      <div className="flex h-2 overflow-hidden bg-zinc-100">
        {items
          .filter((i) => i.value > 0)
          .map((i) => (
            <div
              key={i.label}
              className={i.color}
              style={{ width: `${(i.value / total) * 100}%` }}
            />
          ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {items
          .filter((i) => i.value > 0)
          .map((i) => (
            <div key={i.label} className="flex items-center gap-1.5 text-xs">
              <span className={`inline-block h-2 w-2 rounded-full ${i.color}`} />
              <span className="text-zinc-500">{i.label}</span>
              <span className="font-medium text-zinc-950">{i.value}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Status colour helpers                                         */
/* ────────────────────────────────────────────────────────────── */

function statusBarColor(status: string) {
  switch (status) {
    case 'disputed':
      return 'bg-rose-500'
    case 'resolved':
      return 'bg-emerald-500'
    case 'submitted':
      return 'bg-blue-500'
    case 'ready_for_claim':
      return 'bg-emerald-400'
    case 'review':
    case 'draft_sent':
      return 'bg-amber-500'
    case 'analysis':
      return 'bg-amber-400'
    case 'collecting_evidence':
      return 'bg-zinc-400'
    case 'draft':
      return 'bg-zinc-300'
    default:
      return 'bg-zinc-400'
  }
}

function severityBarColor(severity: string) {
  switch (severity) {
    case 'high':
      return 'bg-rose-500'
    case 'medium':
      return 'bg-amber-500'
    case 'low':
      return 'bg-emerald-500'
    default:
      return 'bg-zinc-400'
  }
}

function statusTextColor(status: string) {
  switch (status) {
    case 'disputed':
      return 'text-rose-700'
    case 'resolved':
      return 'text-emerald-700'
    case 'submitted':
      return 'text-blue-700'
    case 'ready_for_claim':
      return 'text-emerald-700'
    case 'review':
    case 'draft_sent':
      return 'text-amber-700'
    default:
      return 'text-zinc-600'
  }
}

function priorityTextColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'text-rose-700'
    case 'medium':
      return 'text-amber-700'
    default:
      return 'text-zinc-500'
  }
}

/* ────────────────────────────────────────────────────────────── */
/*  Main component                                                */
/* ────────────────────────────────────────────────────────────── */

export function ReportsClient({
  initialSummary,
  error,
}: {
  initialSummary?: EotReportSummary | null
  error?: string | null
}) {
  if (error) {
    return (
      <div className="border border-zinc-200 bg-white px-6 py-10 text-center">
        <h3 className="text-sm font-semibold text-zinc-950">Unable to load reports</h3>
        <p className="mt-1 text-sm text-zinc-500">{error}</p>
      </div>
    )
  }

  if (!initialSummary || initialSummary.performance_rows.length === 0) {
    return (
      <div className="border border-zinc-200 bg-white px-6 py-10 text-center">
        <h3 className="text-sm font-semibold text-zinc-950">No data yet</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Create the first checkout to populate the reports.
        </p>
      </div>
    )
  }

  const { stats, status_breakdown, issue_severity_breakdown, performance_rows } = initialSummary

  const statusItems = Object.entries(status_breakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({
      label: formatEnumLabel(label),
      value,
      color: statusBarColor(label),
    }))

  const severityItems = Object.entries(issue_severity_breakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({
      label: formatEnumLabel(label),
      value,
      color: severityBarColor(label),
    }))

  return (
    <div className="space-y-6">
      {/* Key numbers */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Portfolio overview</h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-12 gap-y-5 text-sm md:grid-cols-3 xl:grid-cols-6">
          <div>
            <dt className="text-xs text-zinc-500">Total cases</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
              {stats.total_cases}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Active</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
              {stats.active_cases}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Ready for claim</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-emerald-700">
              {stats.ready_for_claim}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Disputed</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-rose-700">
              {stats.disputed}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Total claim value</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
              {formatCurrency(stats.claim_amount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Evidence / case</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
              {stats.average_evidence_per_case.toFixed(1)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Distributions */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
          <h3 className="text-sm font-semibold text-zinc-950">Case status distribution</h3>
          <div className="mt-4">
            <DistributionBar items={statusItems} />
          </div>
        </section>

        <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
          <h3 className="text-sm font-semibold text-zinc-950">Issue severity breakdown</h3>
          <div className="mt-4">
            <DistributionBar items={severityItems} />
          </div>
        </section>
      </div>

      {/* Submission readiness */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Submission readiness</h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-5">
          <div>
            <dt className="text-xs text-zinc-500">Ready for submission</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{stats.ready_for_claim}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Recommendations</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{stats.recommendation_count}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Generated claims</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{stats.generated_claim_count}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Total evidence</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{stats.total_evidence}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Issues assessed</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {stats.resolved_issues} / {stats.total_issues}
            </dd>
          </div>
        </dl>
      </section>

      {/* Performance table */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Case performance</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {performance_rows.length} case{performance_rows.length !== 1 ? 's' : ''} in the live
          portfolio.
        </p>
        <div className="mt-4 overflow-hidden border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                  Property
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                  Priority
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                  Evidence
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                  Issues
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                  Claim value
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                  Last activity
                </th>
              </tr>
            </thead>
            <tbody>
              {performance_rows.map((row) => (
                <tr
                  key={row.case_id}
                  className="border-b border-zinc-100 last:border-0 transition hover:bg-zinc-50/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/operator/cases/${row.case_id}`}
                      className="font-medium text-zinc-950 hover:underline"
                    >
                      {row.property_name}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-400">{row.tenant_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${statusTextColor(row.status)}`}>
                      {formatEnumLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${priorityTextColor(row.priority)}`}>
                      {formatEnumLabel(row.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600">{row.evidence_count}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{row.issue_count}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-950">
                    {row.claim_total_amount
                      ? formatCurrency(row.claim_total_amount)
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-400">
                    {formatDateTime(row.last_activity_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
