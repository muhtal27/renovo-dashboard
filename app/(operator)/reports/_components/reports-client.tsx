'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { useEotAnalyticsDashboard } from '@/lib/queries/eot-queries'
import { SkeletonPanel } from '@/app/operator-ui'
import type { EotReportSummary, EotAnalyticsDashboard } from '@/lib/eot-types'
import { AnalyticsThroughput } from './analytics-throughput'
import { AnalyticsResolutionTime } from './analytics-resolution-time'
import { AnalyticsClaimRecovery } from './analytics-claim-recovery'
import { AnalyticsTeamWorkload } from './analytics-team-workload'
import { AnalyticsIntegrationHealth } from './analytics-integration-health'
import {
  formatCurrency,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'

/* ────────────────────────────────────────────────────────────── */
/*  Tabs config                                                    */
/* ────────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'throughput', label: 'Throughput' },
  { id: 'claims', label: 'Claim Recovery' },
  { id: 'resolution', label: 'Resolution Time' },
  { id: 'workload', label: 'Team Workload' },
  { id: 'health', label: 'Integration Health' },
] as const

type TabId = (typeof TABS)[number]['id']

/* ────────────────────────────────────────────────────────────── */
/*  Status distribution bar (for throughput tab)                   */
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

function StatusDistribution({
  breakdown,
}: {
  breakdown: Record<string, number>
}) {
  const entries = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
  const total = entries.reduce((sum, [, v]) => sum + v, 0)

  if (total === 0) return <p className="text-sm text-zinc-400">No data</p>

  const maxVal = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="space-y-4">
      {entries.map(([status, count]) => (
        <div key={status} className="flex items-center gap-2.5">
          <span className="w-20 text-xs text-zinc-600">{formatEnumLabel(status)}</span>
          <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${statusBarColor(status)} transition-all`}
              style={{ width: `${(count / maxVal) * 100}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-zinc-500 w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Main component                                                */
/* ────────────────────────────────────────────────────────────── */

export function ReportsClient({
  initialSummary,
  initialAnalytics,
  error,
}: {
  initialSummary?: EotReportSummary | null
  initialAnalytics?: EotAnalyticsDashboard | null
  error?: string | null
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = (searchParams.get('tab') as TabId) || 'throughput'
  const [days, setDays] = useState(30)

  const { data: analyticsData, isLoading } = useEotAnalyticsDashboard(days, initialAnalytics)

  const performanceRows = initialSummary?.performance_rows ?? []

  function handleExportCSV() {
    const headers = ['Property', 'Tenant', 'Status', 'Priority', 'Evidence', 'Issues', 'Claim Value', 'Last Activity']
    const rows = performanceRows.map((row) => [
      row.property_name,
      row.tenant_name,
      formatEnumLabel(row.status),
      formatEnumLabel(row.priority),
      String(row.evidence_count),
      String(row.issue_count),
      row.claim_total_amount ? String(row.claim_total_amount) : '',
      row.last_activity_at,
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `renovo-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported as CSV')
  }

  if (error) {
    return (
      <div className="rounded-[10px] border border-zinc-200 bg-white px-6 py-10 text-center">
        <h3 className="text-sm font-semibold text-zinc-950">Unable to load reports</h3>
        <p className="mt-1 text-sm text-zinc-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Reports</h2>
          <p className="mt-1 text-sm text-zinc-500">Portfolio analytics and performance</p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:border-zinc-300"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto border-b border-zinc-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              if (tab.id === 'throughput') {
                params.delete('tab')
              } else {
                params.set('tab', tab.id)
              }
              const qs = params.toString()
              router.replace(`/reports${qs ? `?${qs}` : ''}`, { scroll: false })
            }}
            className={`whitespace-nowrap border-b-2 px-[18px] py-2.5 text-[13px] font-medium transition ${
              activeTab === tab.id
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && !analyticsData ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <SkeletonPanel className="h-[240px]" />
            <SkeletonPanel className="h-[240px]" />
          </div>
        </div>
      ) : !analyticsData ? (
        <div className="mt-4 rounded-[10px] border border-zinc-200 bg-white px-6 py-10 text-center">
          <h3 className="text-sm font-semibold text-zinc-950">No analytics data</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create cases and process claims to populate analytics.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          {/* ── Throughput tab ── */}
          {activeTab === 'throughput' && (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
                <h4 className="mb-4 text-sm font-semibold text-zinc-900">Cases Processed</h4>
                <AnalyticsThroughput data={analyticsData.throughput} />
              </div>
              <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
                <h4 className="mb-4 text-sm font-semibold text-zinc-900">Status Distribution</h4>
                {initialSummary ? (
                  <StatusDistribution breakdown={initialSummary.status_breakdown} />
                ) : (
                  <p className="text-sm text-zinc-400">No status data available</p>
                )}
              </div>
            </div>
          )}

          {/* ── Claim Recovery tab ── */}
          {activeTab === 'claims' && (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
                <h4 className="mb-4 text-sm font-semibold text-zinc-900">Recovery Summary</h4>
                <AnalyticsClaimRecovery data={analyticsData.claim_recovery} />
              </div>
              <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
                <h4 className="mb-4 text-sm font-semibold text-zinc-900">Per-Case Recovery</h4>
                {performanceRows.filter((r) => r.claim_total_amount && Number(r.claim_total_amount) > 0).length > 0 ? (
                  <div className="space-y-4">
                    {performanceRows
                      .filter((r) => r.claim_total_amount && Number(r.claim_total_amount) > 0)
                      .map((row) => (
                        <div key={row.case_id} className="flex items-center justify-between">
                          <div>
                            <div className="text-[13px] font-medium text-zinc-900">{row.property_name.split(',')[0]}</div>
                            <div className="text-[11px] text-zinc-500">{row.tenant_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[13px] font-semibold tabular-nums text-zinc-900">
                              {formatCurrency(row.claim_total_amount!)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No claims data yet</p>
                )}
              </div>
            </div>
          )}

          {/* ── Resolution Time tab ── */}
          {activeTab === 'resolution' && (
            <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
              <h4 className="mb-4 text-sm font-semibold text-zinc-900">Average Days per Stage</h4>
              <AnalyticsResolutionTime data={analyticsData.resolution_time} />
            </div>
          )}

          {/* ── Team Workload tab ── */}
          {activeTab === 'workload' && (
            <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
              <h4 className="mb-4 text-sm font-semibold text-zinc-900">Team Workload</h4>
              <AnalyticsTeamWorkload data={analyticsData.team_workload} />
            </div>
          )}

          {/* ── Integration Health tab ── */}
          {activeTab === 'health' && (
            <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
              <h4 className="mb-4 text-sm font-semibold text-zinc-900">Integration Health</h4>
              <AnalyticsIntegrationHealth data={analyticsData.integration_health} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
