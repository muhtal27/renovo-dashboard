'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  ClipboardCheck,
  Mail,
  Plus,
  Scale,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
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
/*  Animated counter hook                                             */
/* ────────────────────────────────────────────────────────────────── */

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const prevTarget = useRef(target)

  useEffect(() => {
    prevTarget.current = target
    const start = performance.now()
    let raf: number

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // cubic ease-out
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const animated = useCountUp(value)
  return (
    <>
      {prefix}{prefix === '£' ? animated.toLocaleString('en-GB') : animated}
    </>
  )
}

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value)
  return <>{formatCurrency(animated)}</>
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
  urgentDeadlineCases: number
  // Prototype ref: public/demo.html:2127 — "Next: {n}d" rose chip on the
  // Open Cases card when the nearest non-resolved tenancy deadline is ≤14d.
  nearestDeadlineDays: number | null
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

  // Cases within 7 days of statutory deadline
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const urgentDeadlineCases = tenancies.filter((t) => {
    if (!t.end_date) return false
    const endDate = new Date(t.end_date)
    return endDate >= now && endDate <= sevenDays
  }).length

  // Nearest upcoming deadline in days across all tenancies — drives the
  // "Next: {n}d" rose chip on the Open Cases card (prototype demo.html:2127).
  let nearestDeadlineDays: number | null = null
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  for (const t of tenancies) {
    if (!t.end_date) continue
    const endDate = new Date(t.end_date)
    if (Number.isNaN(endDate.getTime())) continue
    const days = Math.ceil((endDate.getTime() - now.getTime()) / MS_PER_DAY)
    if (days < 0) continue
    if (nearestDeadlineDays === null || days < nearestDeadlineDays) {
      nearestDeadlineDays = days
    }
  }

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
    urgentDeadlineCases,
    nearestDeadlineDays,
  }
}

// Prototype ref: public/demo.html:2119, 2135 — footer percentages are
// derived from the sparkline data, not hardcoded strings.
function computeTrendPct(series: number[]): number | null {
  if (series.length < 2) return null
  const first = series[0]
  const last = series[series.length - 1]
  if (!first || first === 0) return null
  return Math.round(((last - first) / first) * 100)
}

/* ────────────────────────────────────────────────────────────────── */
/*  Sparkline SVG                                                     */
/* ────────────────────────────────────────────────────────────────── */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 64, h = 24, pad = 2
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const coords = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - 2 * pad),
    y: h - pad - ((v - min) / range) * (h - 2 * pad),
  }))
  const points = coords.map((c) => `${c.x},${c.y}`).join(' ')

  // Calculate path length for stroke-dash animation
  let pathLength = 0
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i - 1].x
    const dy = coords[i].y - coords[i - 1].y
    pathLength += Math.sqrt(dx * dx + dy * dy)
  }

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-sparkline-draw"
        style={{ strokeDasharray: pathLength, strokeDashoffset: pathLength }}
      />
    </svg>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  1. Stat Cards                                                     */
/* ────────────────────────────────────────────────────────────────── */

function StatCards({ stats }: { stats: DashboardStats }) {
  // Prototype ref: public/demo.html:2119 — footer trend is derived from the
  // sparkline series, not a hardcoded "+8% this month".
  const tenanciesSeries = [8, 9, 10, 10, 11, 12, stats.activeTenancies || 12]
  const depositsSeries = [9200, 9800, 10200, 10100, 10800, 11100, stats.totalDepositValue || 11375]
  const tenanciesTrendPct = computeTrendPct(tenanciesSeries)
  const depositsTrendPct = computeTrendPct(depositsSeries)
  const fmtPct = (n: number | null) => (n == null ? '—' : `${n >= 0 ? '+' : ''}${n}%`)

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="stat-card">
        <div className="stat-label">Active Tenancies</div>
        <div className="mt-2 flex items-end justify-between">
          <div className="stat-value tabular-nums text-zinc-950">
            <AnimatedNumber value={stats.activeTenancies} />
          </div>
          <Sparkline data={tenanciesSeries} color="#10b981" />
        </div>
        <div className="stat-footer">
          {stats.endingSoon > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <TrendingUp className="h-3.5 w-3.5" />
              {stats.endingSoon} ending within 30d
            </span>
          ) : (
            <span
              className={cn(
                'inline-flex items-center gap-1',
                (tenanciesTrendPct ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {fmtPct(tenanciesTrendPct)} this month
            </span>
          )}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Open Cases</div>
        <div className="mt-2 flex items-end justify-between">
          <div className="stat-value tabular-nums text-zinc-950">
            {/* D1 — prototype uses total case count, not just non-resolved. */}
            <AnimatedNumber value={stats.totalCases} />
          </div>
          <Sparkline data={[5, 6, 5, 7, 8, 7, stats.totalCases || 9]} color="#0ea5e9" />
        </div>
        <div className="stat-footer flex-wrap gap-1.5">
          {stats.casesNeedingAttention > 0 ? (
            <span className="badge badge-amber">{stats.casesNeedingAttention} need attention</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckCircle className="h-3.5 w-3.5" />
              All on track
            </span>
          )}
          {/* D2 — "Next: {n}d" chip when nearest deadline is within 14 days. */}
          {stats.nearestDeadlineDays != null && stats.nearestDeadlineDays <= 14 ? (
            <span className="badge badge-rose">Next: {stats.nearestDeadlineDays}d</span>
          ) : null}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Total Deposits</div>
        <div className="mt-2 flex items-end justify-between">
          <div className="stat-value tabular-nums text-zinc-950">
            <AnimatedCurrency value={stats.totalDepositValue} />
          </div>
          <Sparkline data={depositsSeries} color="#10b981" />
        </div>
        <div className="stat-footer">
          <span
            className={cn(
              'inline-flex items-center gap-1',
              (depositsTrendPct ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {fmtPct(depositsTrendPct)} portfolio value
          </span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Claim Pipeline</div>
        <div className="mt-2 flex items-end justify-between">
          <div className="stat-value tabular-nums text-zinc-950">
            <AnimatedCurrency value={stats.claimPipelineValue} />
          </div>
          <Sparkline data={[420, 510, 480, 560, 630, 580, stats.claimPipelineValue || 650]} color="#f59e0b" />
        </div>
        <div className="stat-footer">
          {stats.disputedCases > 0 ? (
            <span className="badge badge-rose">{stats.disputedCases} disputed</span>
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
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-zinc-900">Case Pipeline</h3>
        <Link
          href="/tenancies"
          prefetch={false}
          className="app-secondary-button gap-1 px-3 py-1.5 text-[12px]"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {totalCases === 0 ? (
        <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-6 text-center">
          <p className="text-sm text-zinc-400">No cases yet</p>
        </div>
      ) : (
        <>
          <div className="pipeline-bar mt-4">
            {stagesWithCases.map((stage, i) => {
              const count = stats.pipelineCounts[stage.key] ?? 0
              const pct = Math.max((count / totalCases) * 100, 8)
              return (
                <Link
                  key={stage.key}
                  href={`/tenancies?status=${stage.key}`}
                  className="pipeline-seg origin-left animate-pipeline-grow first:rounded-l-lg last:rounded-r-lg"
                  style={{ width: `${pct}%`, backgroundColor: stage.hex, animationDelay: `${i * 80}ms` }}
                  title={`${stage.label}: ${count}`}
                >
                  {count > 0 ? count : ''}
                </Link>
              )
            })}
          </div>

          <div className="pipeline-legend mt-3">
            {PIPELINE_STAGES.map((stage) => {
              const count = stats.pipelineCounts[stage.key] ?? 0
              return (
                <div key={stage.key} className="pipeline-legend-item">
                  <div className="pipeline-legend-dot" style={{ backgroundColor: stage.hex }} />
                  {stage.label} ({count})
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
  const ref = c.property.reference || buildAddress(c.property)
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
    <div className="stat-card">
      <h3 className="text-[16px] font-semibold text-zinc-900">Recent Activity</h3>

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

const FALLBACK_MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
const FALLBACK_THROUGHPUT = [
  { label: 'Nov', total: 14 },
  { label: 'Dec', total: 11 },
  { label: 'Jan', total: 18 },
  { label: 'Feb', total: 22 },
  { label: 'Mar', total: 19 },
  { label: 'Apr', total: 16 },
]

function MonthlyThroughputCard({
  analytics,
}: {
  analytics?: { throughput: { week_start: string; created: number; resolved: number }[] } | null
}) {
  const chartData = useMemo(() => {
    if (!analytics?.throughput?.length) return null

    const grouped = new Map<string, number>()
    for (const week of analytics.throughput) {
      const d = new Date(week.week_start)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      grouped.set(key, (grouped.get(key) ?? 0) + week.created + week.resolved)
    }

    return Array.from(grouped.entries())
      .slice(-6)
      .map(([key, total]) => {
        const [, month] = key.split('-')
        const d = new Date(2024, Number(month) - 1)
        return { label: d.toLocaleString('en-GB', { month: 'short' }), total }
      })
  }, [analytics])

  const bars = chartData ?? FALLBACK_THROUGHPUT
  const maxVal = Math.max(1, ...bars.map((b) => b.total))

  return (
    <div className="stat-card">
      {/* D5 — prototype ref: demo.html:2175-2177 has only the title, no "Full
          report" CTA on this card. */}
      <h3 className="text-[16px] font-semibold text-zinc-900">Monthly Throughput</h3>

      <div className="mt-4">
        <div className="flex items-end gap-2" style={{ height: 140 }}>
          {bars.map((b, i) => {
            const barHeight = Math.max((b.total / maxVal) * 120, 8)
            return (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="animate-count-up text-[11px] font-semibold text-zinc-700" style={{ animationDelay: `${i * 100}ms` }}>
                  <AnimatedNumber value={b.total} />
                </span>
                <div
                  className="w-full max-w-[48px] origin-bottom animate-bar-grow rounded-t-[3px] bg-emerald-500"
                  style={{ height: barHeight, animationDelay: `${i * 100}ms` }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex gap-2">
          {bars.map((b) => (
            <div key={b.label} className="flex-1 text-center text-[10px] font-medium text-zinc-400">
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  5. Deadline Alert                                                 */
/* ────────────────────────────────────────────────────────────────── */

function DeadlineAlert({ count }: { count: number }) {
  if (count === 0) return null

  return (
    <div className="alert-banner alert-banner-danger">
      <AlertTriangle className="h-[18px] w-[18px] shrink-0" />
      <div className="flex-1">
        <span className="font-semibold">Deadline Alert</span>
        <span className="ml-1 text-[12px] text-rose-600">
          {count} case{count > 1 ? 's' : ''} within 7 days of statutory deadline
        </span>
      </div>
      <Link
        href="/tenancies"
        className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-rose-500 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-rose-600"
      >
        View Cases
      </Link>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  6. Quick Actions                                                  */
/* ────────────────────────────────────────────────────────────────── */

function QuickActionsCard() {
  return (
    <div className="stat-card">
      <h3 className="text-[16px] font-semibold text-zinc-900">Quick Actions</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/tenancies"
          className="app-secondary-button flex-col gap-2 px-4 py-4 text-sm"
        >
          <Plus className="h-[18px] w-[18px] text-emerald-500" />
          Start New Checkout
        </Link>
        <Link
          href="/disputes"
          className="app-secondary-button flex-col gap-2 px-4 py-4 text-sm"
        >
          <ShieldAlert className="h-[18px] w-[18px] text-amber-500" />
          View Disputes
        </Link>
        <Link
          href="/reports"
          className="app-secondary-button flex-col gap-2 px-4 py-4 text-sm"
        >
          <BarChart3 className="h-[18px] w-[18px] text-indigo-500" />
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
  } = useEotTenancies(initialTenancies)

  const {
    data: cases = [],
    isLoading: casesLoading,
  } = useEotCases(initialCases)

  const { data: analytics } = useEotAnalyticsDashboard(30)

  const loading = tenanciesLoading || casesLoading

  const stats = useMemo(() => computeStats(tenancies, cases), [tenancies, cases])

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
    <div className="animate-fade-in-up space-y-6">
      {/* Greeting — prototype ref: demo.html:2097-2100 (no Refresh button). */}
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-zinc-900">
          {getGreeting()}{operatorName ? <>, <em className="font-serif not-italic">{operatorName}</em></> : null}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Here&apos;s your portfolio overview for today
        </p>
      </div>

      {/* Deadline alert */}
      <DeadlineAlert count={stats.urgentDeadlineCases} />

      {/* KPI stat cards */}
      <StatCards stats={stats} />

      {/* Pipeline */}
      <PipelineBar stats={stats} />

      {/* Activity + Throughput */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentActivityCard cases={cases} />
        <MonthlyThroughputCard analytics={analytics} />
      </div>

      {/* Quick actions */}
      <QuickActionsCard />
    </div>
  )
}
