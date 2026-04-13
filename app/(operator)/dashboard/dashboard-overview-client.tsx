'use client'

import Link from 'next/link'
import { useMemo, useCallback } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle,
  ClipboardCheck,
  FolderOpen,
  Mail,
  PoundSterling,
  RefreshCcw,
  Scale,
  Send,
  Sparkles,
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
/*  Sparkline SVG                                                     */
/* ────────────────────────────────────────────────────────────────── */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 64, h = 24, pad = 2
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - 2 * pad)
      const y = h - pad - ((v - min) / range) * (h - 2 * pad)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  1. Stat Cards                                                     */
/* ────────────────────────────────────────────────────────────────── */

function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-xs font-medium text-zinc-500">Active Tenancies</div>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-zinc-950">
            {stats.activeTenancies}
          </p>
          <Sparkline data={[8, 9, 10, 10, 11, 12, stats.activeTenancies || 12]} color="#10b981" />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          {stats.endingSoon > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <TrendingUp className="h-3.5 w-3.5" />
              {stats.endingSoon} ending within 30d
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              +8% this month
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-xs font-medium text-zinc-500">Open Cases</div>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-zinc-950">
            {stats.activeCases}
          </p>
          <Sparkline data={[5, 6, 5, 7, 8, 7, stats.activeCases || 9]} color="#0ea5e9" />
        </div>
        <div className="mt-2.5 text-xs">
          {stats.casesNeedingAttention > 0 ? (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
              {stats.casesNeedingAttention} need attention
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckCircle className="h-3.5 w-3.5" />
              All on track
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-xs font-medium text-zinc-500">Total Deposits</div>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-zinc-950">
            {formatCurrency(stats.totalDepositValue)}
          </p>
          <Sparkline data={[9200, 9800, 10200, 10100, 10800, 11100, stats.totalDepositValue || 11375]} color="#10b981" />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            +12% portfolio value
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-xs font-medium text-zinc-500">Claim Pipeline</div>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-zinc-950">
            {formatCurrency(stats.claimPipelineValue)}
          </p>
          <Sparkline data={[420, 510, 480, 560, 630, 580, stats.claimPipelineValue || 650]} color="#f59e0b" />
        </div>
        <div className="mt-2.5 text-xs">
          {stats.disputedCases > 0 ? (
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700">
              {stats.disputedCases} disputed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckCircle className="h-3.5 w-3.5" />
              All on track
            </span>
          )}
        </div>
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

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
            {PIPELINE_STAGES.map((stage) => {
              const count = stats.pipelineCounts[stage.key] ?? 0
              return (
                <div key={stage.key} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: stage.hex }}
                  />
                  <span className="text-xs text-zinc-600">
                    {stage.label} ({count})
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

type ActivityIconConfig = { icon: typeof Sparkles; bg: string; fg: string }

const STATUS_ACTIVITY_ICON: Record<string, ActivityIconConfig> = {
  draft: { icon: Mail, bg: 'bg-zinc-100', fg: 'text-zinc-500' },
  collecting_evidence: { icon: ClipboardCheck, bg: 'bg-sky-50', fg: 'text-sky-600' },
  analysis: { icon: Sparkles, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  review: { icon: AlertTriangle, bg: 'bg-amber-50', fg: 'text-amber-600' },
  draft_sent: { icon: Send, bg: 'bg-violet-50', fg: 'text-violet-600' },
  ready_for_claim: { icon: CheckCircle, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  submitted: { icon: Send, bg: 'bg-cyan-50', fg: 'text-cyan-600' },
  disputed: { icon: AlertTriangle, bg: 'bg-rose-50', fg: 'text-rose-600' },
  resolved: { icon: CheckCircle, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
}

function activityDescription(c: EotCaseListItem): string {
  const ref = c.reference || buildAddress(c.property)
  switch (c.status) {
    case 'analysis': return `AI analysis completed for ${ref}`
    case 'disputed': return `New dispute opened on ${ref}`
    case 'ready_for_claim': return `${ref} moved to Ready for Claim`
    case 'submitted': return `${c.tenant_name || 'Operator'} submitted ${ref}`
    case 'draft_sent': return `Draft sent to ${c.tenant_name} for ${ref}`
    case 'resolved': return `${ref} resolved — deposit returned`
    default: return `${ref} — ${formatEnumLabel(c.status)}`
  }
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
      </div>

      {recentCases.length === 0 ? (
        <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400">No recent activity</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {recentCases.map((c) => {
            const config = STATUS_ACTIVITY_ICON[c.status] ?? STATUS_ACTIVITY_ICON.draft
            const Icon = config.icon
            return (
              <Link
                key={c.id}
                href={`/operator/cases/${c.id}`}
                prefetch={false}
                className="flex items-start gap-2.5 transition hover:opacity-80"
              >
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', config.bg, config.fg)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-zinc-900">{activityDescription(c)}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">{relativeTime(c.last_activity_at)}</p>
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
        <div className="mt-4 flex items-end gap-2 pt-2" style={{ height: 160 }}>
          {monthlyData.map((m) => {
            const total = m.created + m.resolved
            const pct = Math.max((total / (maxVal * 2)) * 100, 6)
            return (
              <div key={m.label} className="relative flex flex-1 flex-col items-center">
                <span className="mb-1 text-[11px] font-semibold text-zinc-700">{total}</span>
                <div
                  className="w-full rounded-t bg-emerald-500 transition-all"
                  style={{ height: `${pct}%`, minWidth: 28, maxWidth: 48 }}
                />
                <span className="mt-2 text-[10px] font-medium text-zinc-400">{m.label}</span>
              </div>
            )
          })}
        </div>
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
  operatorName,
}: {
  initialTenancies?: EotTenancyListItem[] | null
  initialCases?: EotCaseListItem[] | null
  operatorName?: string
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
            {getGreeting()}{operatorName ? <>, <em className="font-serif not-italic">{operatorName}</em></> : null}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Here&apos;s your portfolio overview for today
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
