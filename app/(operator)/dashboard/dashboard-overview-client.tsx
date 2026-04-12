'use client'

import Link from 'next/link'
import { useMemo, useCallback } from 'react'
import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  FolderOpen,
  PoundSterling,
  RefreshCcw,
  Scale,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEotTenancies, useEotCases, useEotAnalyticsDashboard } from '@/lib/queries/eot-queries'
import type { EotTenancyListItem, EotCaseListItem, EotCaseStatus } from '@/lib/eot-types'
import { SkeletonPanel } from '@/app/operator-ui'
import {
  formatCurrency,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'

/* ────────────────────────────────────────────────────────────────── */
/*  Helpers                                                           */
/* ────────────────────────────────────────────────────────────────── */

function buildAddress(property: EotTenancyListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode].filter(Boolean)
  return parts.join(', ') || property.name
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ────────────────────────────────────────────────────────────────── */
/*  Pipeline stage config                                             */
/* ────────────────────────────────────────────────────────────────── */

const PIPELINE_STAGES: { key: EotCaseStatus; label: string; color: string; hex: string }[] = [
  { key: 'draft', label: 'Draft', color: 'bg-zinc-400', hex: '#a1a1aa' },
  { key: 'collecting_evidence', label: 'Collecting', color: 'bg-sky-500', hex: '#0ea5e9' },
  { key: 'analysis', label: 'Analysis', color: 'bg-indigo-500', hex: '#6366f1' },
  { key: 'review', label: 'Review', color: 'bg-amber-500', hex: '#f59e0b' },
  { key: 'draft_sent', label: 'Draft Sent', color: 'bg-violet-500', hex: '#8b5cf6' },
  { key: 'ready_for_claim', label: 'Ready', color: 'bg-emerald-500', hex: '#10b981' },
  { key: 'submitted', label: 'Submitted', color: 'bg-cyan-500', hex: '#06b6d4' },
  { key: 'disputed', label: 'Disputed', color: 'bg-rose-500', hex: '#f43f5e' },
  { key: 'resolved', label: 'Resolved', color: 'bg-emerald-600', hex: '#059669' },
]

/* ────────────────────────────────────────────────────────────────── */
/*  Stats computation                                                 */
/* ────────────────────────────────────────────────────────────────── */

type DashboardStats = {
  totalTenancies: number
  activeTenancies: number
  endingSoon: number
  ended: number
  totalCases: number
  activeCases: number
  casesNeedingAttention: number
  disputedCases: number
  totalDepositValue: number
  claimPipelineValue: number
  claimPipelineCount: number
  disputedValue: number
  pipelineCounts: Record<string, number>
  highPriorityCases: number
}

function computeStats(
  tenancies: EotTenancyListItem[],
  cases: EotCaseListItem[],
): DashboardStats {
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  let activeTenancies = 0
  let endingSoon = 0
  let ended = 0
  let totalDepositValue = 0

  for (const t of tenancies) {
    if (t.deposit_amount) totalDepositValue += Number(t.deposit_amount)
    if (!t.end_date) {
      activeTenancies++
      continue
    }
    const endDate = new Date(t.end_date)
    if (endDate < now) {
      ended++
    } else if (endDate <= thirtyDays) {
      endingSoon++
      activeTenancies++
    } else {
      activeTenancies++
    }
  }

  const pipelineCounts: Record<string, number> = {}
  for (const stage of PIPELINE_STAGES) pipelineCounts[stage.key] = 0
  for (const c of cases) pipelineCounts[c.status] = (pipelineCounts[c.status] ?? 0) + 1

  const disputedCases = cases.filter((c) => c.status === 'disputed')
  const activeCases = cases.filter((c) => c.status !== 'resolved')
  const attentionStatuses = new Set(['collecting_evidence', 'analysis', 'review'])
  const casesNeedingAttention = cases.filter((c) => attentionStatuses.has(c.status)).length
  const highPriorityCases = cases.filter((c) => c.priority === 'high' && c.status !== 'resolved').length

  const claimPipelineCases = cases.filter(
    (c) => c.status === 'ready_for_claim' || c.status === 'submitted',
  )
  const claimPipelineValue = claimPipelineCases.reduce(
    (sum, c) => sum + Number(c.deposit_amount ?? 0),
    0,
  )
  const disputedValue = disputedCases.reduce(
    (sum, c) => sum + Number(c.deposit_amount ?? 0),
    0,
  )

  return {
    totalTenancies: tenancies.length,
    activeTenancies,
    endingSoon,
    ended,
    totalCases: cases.length,
    activeCases: activeCases.length,
    casesNeedingAttention,
    disputedCases: disputedCases.length,
    totalDepositValue,
    claimPipelineValue,
    claimPipelineCount: claimPipelineCases.length,
    disputedValue,
    pipelineCounts,
    highPriorityCases,
  }
}

/* ────────────────────────────────────────────────────────────────── */
/*  1. Stat Cards                                                     */
/* ────────────────────────────────────────────────────────────────── */

function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-500">Active Tenancies</span>
        </div>
        <p className="mt-3 text-[28px] font-bold tabular-nums leading-none tracking-tight text-zinc-950">
          {stats.activeTenancies}
        </p>
        <p className="mt-2.5 text-xs text-zinc-400">
          {stats.endingSoon > 0 ? (
            <span className="text-amber-600">{stats.endingSoon} ending within 30d</span>
          ) : (
            <span>{stats.totalTenancies} total in portfolio</span>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-500">Open Cases</span>
        </div>
        <p className="mt-3 text-[28px] font-bold tabular-nums leading-none tracking-tight text-zinc-950">
          {stats.activeCases}
        </p>
        <p className="mt-2.5 text-xs text-zinc-400">
          {stats.casesNeedingAttention > 0 ? (
            <span className="text-amber-600">{stats.casesNeedingAttention} need attention</span>
          ) : (
            <span>All on track</span>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <PoundSterling className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-500">Total Deposits</span>
        </div>
        <p className="mt-3 text-[28px] font-bold tabular-nums leading-none tracking-tight text-zinc-950">
          {formatCurrency(stats.totalDepositValue)}
        </p>
        <p className="mt-2.5 text-xs text-zinc-400">
          Across {stats.totalTenancies} tenancies
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-500">Claim Pipeline</span>
        </div>
        <p className="mt-3 text-[28px] font-bold tabular-nums leading-none tracking-tight text-zinc-950">
          {formatCurrency(stats.claimPipelineValue)}
        </p>
        <p className="mt-2.5 text-xs text-zinc-400">
          {stats.disputedCases > 0 ? (
            <span className="text-rose-600">{stats.disputedCases} disputed</span>
          ) : (
            <span>{stats.claimPipelineCount} cases in pipeline</span>
          )}
        </p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  2. Pipeline Bar                                                   */
/* ────────────────────────────────────────────────────────────────── */

function PipelineBar({ stats }: { stats: DashboardStats }) {
  const totalCases = stats.totalCases
  const stagesWithCases = PIPELINE_STAGES.filter((s) => (stats.pipelineCounts[s.key] ?? 0) > 0)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-950">Case Pipeline</h3>
        <Link
          href="/tenancies"
          prefetch={false}
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-zinc-600"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {totalCases === 0 ? (
        <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-6 text-center">
          <p className="text-sm text-zinc-400">No cases yet</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex h-8 overflow-hidden rounded-lg bg-zinc-100">
            {stagesWithCases.map((stage) => {
              const count = stats.pipelineCounts[stage.key] ?? 0
              const pct = Math.max((count / totalCases) * 100, 8)
              return (
                <div
                  key={stage.key}
                  className="flex items-center justify-center text-[11px] font-semibold text-white transition-all first:rounded-l-lg last:rounded-r-lg"
                  style={{ width: `${pct}%`, backgroundColor: stage.hex }}
                  title={`${stage.label}: ${count}`}
                >
                  {count > 0 ? count : ''}
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {PIPELINE_STAGES.map((stage) => {
              const count = stats.pipelineCounts[stage.key] ?? 0
              if (count === 0) return null
              return (
                <div key={stage.key} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: stage.hex }}
                  />
                  <span className="text-[11px] text-zinc-500">
                    {stage.label} <span className="font-semibold text-zinc-700">{count}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  3. Recent Activity                                                */
/* ────────────────────────────────────────────────────────────────── */

const STATUS_DOT_COLOR: Record<string, string> = {
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

function RecentActivityCard({ cases }: { cases: EotCaseListItem[] }) {
  const recentCases = useMemo(() => {
    return [...cases]
      .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
      .slice(0, 6)
  }, [cases])

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-950">Recent Activity</h3>
        <Link
          href="/tenancies"
          prefetch={false}
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-zinc-600"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {recentCases.length === 0 ? (
        <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400">No recent activity</p>
        </div>
      ) : (
        <div className="mt-4 space-y-0">
          {recentCases.map((c) => {
            const address = buildAddress(c.property)
            const dotColor = STATUS_DOT_COLOR[c.status] ?? '#a1a1aa'
            return (
              <Link
                key={c.id}
                href={`/operator/cases/${c.id}`}
                prefetch={false}
                className="flex items-start gap-3 rounded-lg px-1 py-2.5 transition hover:bg-zinc-50"
              >
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-zinc-900">
                    {address}
                    <span className="ml-1.5 font-normal text-zinc-400">— {formatEnumLabel(c.status)}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {c.tenant_name} &middot; {relativeTime(c.last_activity_at)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  4. Monthly Throughput Chart                                       */
/* ────────────────────────────────────────────────────────────────── */

function MonthlyThroughputCard({
  analytics,
}: {
  analytics?: { throughput: { week_start: string; created: number; resolved: number }[] } | null
}) {
  const monthlyData = useMemo(() => {
    if (!analytics?.throughput?.length) return []

    const grouped = new Map<string, { created: number; resolved: number }>()
    for (const week of analytics.throughput) {
      const d = new Date(week.week_start)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-GB', { month: 'short' })
      const existing = grouped.get(key)
      if (existing) {
        existing.created += week.created
        existing.resolved += week.resolved
      } else {
        grouped.set(key, { created: week.created, resolved: week.resolved })
      }
    }

    return Array.from(grouped.entries())
      .slice(-6)
      .map(([key, vals]) => {
        const [, month] = key.split('-')
        const d = new Date(2024, Number(month) - 1)
        return {
          label: d.toLocaleString('en-GB', { month: 'short' }),
          created: vals.created,
          resolved: vals.resolved,
        }
      })
  }, [analytics])

  const maxVal = Math.max(1, ...monthlyData.map((m) => Math.max(m.created, m.resolved)))

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-950">Monthly Throughput</h3>
        <Link
          href="/reports"
          prefetch={false}
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-zinc-600"
        >
          Full report
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {monthlyData.length === 0 ? (
        <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400">No throughput data yet</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end gap-2" style={{ height: 140 }}>
            {monthlyData.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 120 }}>
                  <div
                    className="w-3 rounded-t bg-emerald-500 transition-all"
                    style={{ height: `${Math.max((m.created / maxVal) * 100, 4)}%` }}
                    title={`Created: ${m.created}`}
                  />
                  <div
                    className="w-3 rounded-t bg-zinc-300 transition-all"
                    style={{ height: `${Math.max((m.resolved / maxVal) * 100, 4)}%` }}
                    title={`Resolved: ${m.resolved}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-zinc-400">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-zinc-500">Created</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-zinc-300" />
              <span className="text-[11px] text-zinc-500">Resolved</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  5. Quick Actions                                                  */
/* ────────────────────────────────────────────────────────────────── */

function QuickActionsCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-950">Quick Actions</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/tenancies"
          className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <Plus className="h-5 w-5 text-emerald-500" />
          Start New Checkout
        </Link>
        <Link
          href="/disputes"
          className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <Scale className="h-5 w-5 text-amber-500" />
          View Disputes
        </Link>
        <Link
          href="/reports"
          className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Generate Report
        </Link>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Main export                                                       */
/* ────────────────────────────────────────────────────────────────── */

export function DashboardOverviewClient({
  initialTenancies,
  initialCases,
}: {
  initialTenancies?: EotTenancyListItem[] | null
  initialCases?: EotCaseListItem[] | null
}) {
  const {
    data: tenancies = [],
    isLoading: tenanciesLoading,
    isFetching: tenanciesRefreshing,
    refetch: refetchTenancies,
  } = useEotTenancies(initialTenancies)

  const {
    data: cases = [],
    isLoading: casesLoading,
    isFetching: casesRefreshing,
    refetch: refetchCases,
  } = useEotCases(initialCases)

  const { data: analytics } = useEotAnalyticsDashboard(30)

  const loading = tenanciesLoading || casesLoading
  const refreshing = tenanciesRefreshing || casesRefreshing

  const stats = useMemo(() => computeStats(tenancies, cases), [tenancies, cases])

  const handleRefresh = useCallback(() => {
    void refetchTenancies()
    void refetchCases()
    toast.success('Dashboard refreshed')
  }, [refetchTenancies, refetchCases])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SkeletonPanel className="h-28" />
          <SkeletonPanel className="h-28" />
          <SkeletonPanel className="h-28" />
          <SkeletonPanel className="h-28" />
        </div>
        <SkeletonPanel className="h-32" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonPanel className="h-64" />
          <SkeletonPanel className="h-64" />
        </div>
        <SkeletonPanel className="h-24" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            {getGreeting()}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Your portfolio overview for today
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
          title="Refresh dashboard"
        >
          <RefreshCcw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </button>
      </div>

      <StatCards stats={stats} />
      <PipelineBar stats={stats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentActivityCard cases={cases} />
        <MonthlyThroughputCard analytics={analytics} />
      </div>

      <QuickActionsCard />
    </div>
  )
}
