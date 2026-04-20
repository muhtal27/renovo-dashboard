'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/ui'
import { useEotAnalyticsDashboard } from '@/lib/queries/eot-queries'
import { SkeletonPanel } from '@/app/operator-ui'
import type { EotReportSummary, EotAnalyticsDashboard } from '@/lib/eot-types'
import { AnalyticsThroughput } from './analytics-throughput'
import { AnalyticsResolutionTime } from './analytics-resolution-time'
import { AnalyticsClaimRecovery } from './analytics-claim-recovery'
import { AnalyticsTeamWorkload } from './analytics-team-workload'
import { AnalyticsIntegrationHealth } from './analytics-integration-health'
import { AnalyticsAiAccuracy } from './analytics-ai-accuracy'
import { AnalyticsSlaMetrics } from './analytics-sla-metrics'
import { AnalyticsRecoveryDetail } from './analytics-recovery-detail'
import {
  MOCK_AI_ACCURACY,
  MOCK_SLA,
  MOCK_RECOVERY_BY_SCHEME,
} from '@/lib/mock/report-fixtures'
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
  { id: 'recovery-analytics', label: 'Recovery Analytics' },
  { id: 'ai-accuracy', label: 'AI Accuracy' },
  { id: 'resolution', label: 'Resolution Time' },
  { id: 'workload', label: 'Team Workload' },
  { id: 'sla', label: 'SLA Metrics' },
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

/* ── Pre-computed recovery totals (static mock data) ─────────── */

const RECOVERY_TOTAL_CLAIMED = MOCK_RECOVERY_BY_SCHEME.reduce((s, r) => s + r.claimed, 0)
const RECOVERY_TOTAL_AWARDED = MOCK_RECOVERY_BY_SCHEME.reduce((s, r) => s + r.awarded, 0)

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
          <h1 className="text-[24px] font-semibold tracking-tight text-zinc-900">Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">Portfolio analytics and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-[34px] rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
          >
            {/* R1 — prototype option set. Prototype ref: demo.html:4019. */}
            <option value={180}>Last 6 months</option>
            <option value={90}>Last quarter</option>
            <option value={30}>Last month</option>
            <option value={365}>Year to date</option>
            <option value={365}>Last 12 months</option>
          </select>
          <button
            type="button"
            onClick={handleExportCSV}
            className="app-secondary-button gap-1.5 px-4 py-2 text-[13px]"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto border-b border-zinc-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
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
              className={cn(
                'whitespace-nowrap border-b-2 px-[18px] py-2.5 text-[13px] font-medium transition',
                isActive
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              )}
            >
              {tab.label}
            </button>
          )
        })}
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
              <div className="stat-card">
                <h4 className="mb-4 text-sm font-semibold text-zinc-900">Cases Processed</h4>
                <AnalyticsThroughput data={analyticsData.throughput} />
              </div>
              <div className="stat-card">
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
              <div className="stat-card">
                <h4 className="mb-4 text-sm font-semibold text-zinc-900">Recovery Summary</h4>
                <AnalyticsClaimRecovery data={analyticsData.claim_recovery} />
              </div>
              <div className="stat-card">
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
            <div className="stat-card">
              <h4 className="mb-4 text-sm font-semibold text-zinc-900">Average Days per Stage</h4>
              <AnalyticsResolutionTime data={analyticsData.resolution_time} />
            </div>
          )}

          {/* ── Team Workload tab ── */}
          {activeTab === 'workload' && (
            <div className="stat-card">
              <h4 className="mb-4 text-sm font-semibold text-zinc-900">Team Workload</h4>
              <AnalyticsTeamWorkload data={analyticsData.team_workload} />
            </div>
          )}

          {/* ── Integration Health tab ── */}
          {activeTab === 'health' && (
            <div className="stat-card">
              <h4 className="mb-4 text-sm font-semibold text-zinc-900">Integration Health</h4>
              <AnalyticsIntegrationHealth data={analyticsData.integration_health} />
            </div>
          )}

          {/* ── Recovery Analytics tab ── */}
          {activeTab === 'recovery-analytics' && (
            <AnalyticsRecoveryDetail
              schemes={MOCK_RECOVERY_BY_SCHEME}
              totalClaimed={RECOVERY_TOTAL_CLAIMED}
              totalAwarded={RECOVERY_TOTAL_AWARDED}
            />
          )}

          {/* ── AI Accuracy tab ── */}
          {activeTab === 'ai-accuracy' && (
            <AnalyticsAiAccuracy data={MOCK_AI_ACCURACY} />
          )}

          {/* ── SLA Metrics tab ── */}
          {activeTab === 'sla' && (
            <AnalyticsSlaMetrics data={MOCK_SLA} />
          )}
        </div>
      )}
    </div>
  )
}
