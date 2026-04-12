'use client'

import Link from 'next/link'
import { useMemo, useState, useCallback } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Eye,
  Filter,
  Flame,
  Layers,
  PoundSterling,
  RefreshCcw,
  Scale,
  Shield,
  TrendingUp,
  UserX,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEotTenancies, useEotCases, useEotAnalyticsDashboard } from '@/lib/queries/eot-queries'
import type { EotTenancyListItem, EotCaseListItem, EotCaseStatus } from '@/lib/eot-types'
import { SkeletonPanel } from '@/app/operator-ui'
import {
  formatCurrency,
  formatDate,
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

const PIPELINE_STAGES: { key: EotCaseStatus; label: string; color: string }[] = [
  { key: 'draft', label: 'Draft', color: 'bg-zinc-400' },
  { key: 'collecting_evidence', label: 'Collecting', color: 'bg-sky-500' },
  { key: 'analysis', label: 'Analysis', color: 'bg-indigo-500' },
  { key: 'review', label: 'Review', color: 'bg-amber-500' },
  { key: 'draft_sent', label: 'Draft Sent', color: 'bg-orange-500' },
  { key: 'ready_for_claim', label: 'Ready', color: 'bg-emerald-500' },
  { key: 'submitted', label: 'Submitted', color: 'bg-cyan-500' },
  { key: 'disputed', label: 'Disputed', color: 'bg-rose-500' },
  { key: 'resolved', label: 'Resolved', color: 'bg-emerald-600' },
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
/*  Urgency helpers                                                   */
/* ────────────────────────────────────────────────────────────────── */

type UrgencyBand = 'critical' | 'urgent' | 'watch' | 'monitor'

function getUrgencyBand(daysLeft: number): UrgencyBand {
  if (daysLeft <= 7) return 'critical'
  if (daysLeft <= 14) return 'urgent'
  if (daysLeft <= 30) return 'watch'
  return 'monitor'
}

function getUrgencyConfig(band: UrgencyBand) {
  switch (band) {
    case 'critical':
      return { label: 'Critical — 7 days or less', color: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500' }
    case 'urgent':
      return { label: 'Urgent — 8 to 14 days', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' }
    case 'watch':
      return { label: 'Watch — 15 to 30 days', color: 'text-sky-700', bg: 'bg-sky-50', dot: 'bg-sky-500' }
    case 'monitor':
      return { label: 'Monitor — 31 to 60 days', color: 'text-zinc-600', bg: 'bg-zinc-50', dot: 'bg-zinc-400' }
  }
}

/* ────────────────────────────────────────────────────────────────── */
/*  Action items builder                                              */
/* ────────────────────────────────────────────────────────────────── */

type ActionItem = {
  id: string
  type: 'review' | 'unassigned' | 'stale' | 'high_severity' | 'no_case'
  title: string
  subtitle: string
  urgency: number
  href: string
  actionLabel: string
  badge?: string
  badgeTone?: string
  meta?: string
}

function buildActionItems(
  cases: EotCaseListItem[],
  tenancies: EotTenancyListItem[],
): ActionItem[] {
  const now = Date.now()
  const items: ActionItem[] = []
  const seen = new Set<string>()

  // Cases awaiting review
  for (const c of cases.filter((c) => c.status === 'review')) {
    const daysSinceActivity = Math.floor(
      (now - new Date(c.last_activity_at).getTime()) / (1000 * 60 * 60 * 24),
    )
    seen.add(c.id)
    items.push({
      id: `review-${c.id}`,
      type: 'review',
      title: buildAddress(c.property),
      subtitle: c.tenant_name,
      urgency: 80 + (c.priority === 'high' ? 15 : c.priority === 'medium' ? 5 : 0) + Math.min(daysSinceActivity, 10),
      href: `/operator/cases/${c.id}`,
      actionLabel: 'Review',
      badge: formatEnumLabel(c.status),
      badgeTone: 'review',
      meta: relativeTime(c.last_activity_at),
    })
  }

  // Unassigned cases
  for (const c of cases.filter((c) => !c.assigned_to && c.status !== 'resolved')) {
    if (seen.has(c.id)) continue
    seen.add(c.id)
    items.push({
      id: `unassigned-${c.id}`,
      type: 'unassigned',
      title: buildAddress(c.property),
      subtitle: c.tenant_name,
      urgency: 70 + (c.priority === 'high' ? 15 : 0),
      href: '/admin',
      actionLabel: 'Assign',
      badge: 'Unassigned',
      badgeTone: 'draft',
      meta: formatEnumLabel(c.status),
    })
  }

  // Stale cases (>5 days no activity, not resolved/submitted)
  for (const c of cases.filter((c) => c.status !== 'resolved' && c.status !== 'submitted')) {
    if (seen.has(c.id)) continue
    const daysSinceActivity = Math.floor(
      (now - new Date(c.last_activity_at).getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysSinceActivity < 5) continue
    seen.add(c.id)
    items.push({
      id: `stale-${c.id}`,
      type: 'stale',
      title: buildAddress(c.property),
      subtitle: c.tenant_name,
      urgency: 50 + daysSinceActivity + (c.priority === 'high' ? 10 : 0),
      href: `/operator/cases/${c.id}`,
      actionLabel: 'Resume',
      badge: `${daysSinceActivity}d idle`,
      badgeTone: daysSinceActivity >= 10 ? 'high' : 'medium',
      meta: formatEnumLabel(c.status),
    })
  }

  // High priority active cases (not already captured)
  for (const c of cases.filter((c) => c.priority === 'high' && c.status !== 'resolved')) {
    if (seen.has(c.id)) continue
    seen.add(c.id)
    items.push({
      id: `high-${c.id}`,
      type: 'high_severity',
      title: buildAddress(c.property),
      subtitle: c.tenant_name,
      urgency: 60 + c.issue_count,
      href: `/operator/cases/${c.id}`,
      actionLabel: 'Investigate',
      badge: 'High priority',
      badgeTone: 'high',
      meta: `${c.issue_count} issues`,
    })
  }

  // Tenancies ending soon without a case started
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000
  for (const t of tenancies.filter((t) => t.end_date && !t.case_id)) {
    const endDate = new Date(t.end_date!)
    if (endDate.getTime() < now || endDate.getTime() > now + sixtyDaysMs) continue
    const daysLeft = Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24))
    items.push({
      id: `nocase-${t.id}`,
      type: 'no_case',
      title: buildAddress(t.property),
      subtitle: t.tenant_name,
      urgency: 90 + (60 - daysLeft),
      href: `/dashboard/${t.id}`,
      actionLabel: 'Start Checkout',
      badge: `${daysLeft}d left`,
      badgeTone: daysLeft <= 7 ? 'high' : daysLeft <= 14 ? 'medium' : 'low',
      meta: t.deposit_amount ? formatCurrency(Number(t.deposit_amount)) : undefined,
    })
  }

  items.sort((a, b) => b.urgency - a.urgency)
  return items
}

/* ────────────────────────────────────────────────────────────────── */
/*  1. Command Header                                                 */
/* ────────────────────────────────────────────────────────────────── */

function CommandHeader({
  stats,
  refreshing,
  onRefresh,
}: {
  stats: DashboardStats
  refreshing: boolean
  onRefresh: () => void
}) {
  return (
    <div className="dark-header animate-fade-in-up relative overflow-hidden rounded-xl border border-zinc-200 bg-white px-6 py-6 md:px-8 md:py-8">
      <div className="absolute inset-0 opacity-0" />
      <div className="absolute -right-16 -top-16 h-56 w-56 opacity-0" />
      <div className="absolute -bottom-12 -left-12 h-40 w-40 opacity-0" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">
            {getGreeting()}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your portfolio overview for today
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Link
            href="/tenancies"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Start Checkout
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Reports
          </Link>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white/70 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10"
            title="Refresh dashboard"
          >
            <RefreshCcw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <QuickStat label="Portfolio" value={stats.totalTenancies} suffix="tenancies" icon={<Layers className="h-3.5 w-3.5" />} />
        <QuickStat label="Active cases" value={stats.activeCases} icon={<Zap className="h-3.5 w-3.5" />} accent />
        <QuickStat label="Ending soon" value={stats.endingSoon} suffix="in 30d" icon={<Clock className="h-3.5 w-3.5" />} warning={stats.endingSoon > 0} />
        <QuickStat label="Disputed" value={stats.disputedCases} icon={<Scale className="h-3.5 w-3.5" />} warning={stats.disputedCases > 0} />
        <QuickStat label="Deposits held" value={formatCurrency(stats.totalDepositValue)} icon={<PoundSterling className="h-3.5 w-3.5" />} />
        <QuickStat label="High priority" value={stats.highPriorityCases} icon={<Flame className="h-3.5 w-3.5" />} warning={stats.highPriorityCases > 0} />
      </div>
    </div>
  )
}

function QuickStat({
  label,
  value,
  suffix,
  icon,
  accent,
  warning,
}: {
  label: string
  value: React.ReactNode
  suffix?: string
  icon: React.ReactNode
  accent?: boolean
  warning?: boolean
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <span className={cn('text-zinc-400', accent && 'text-emerald-600', warning && 'text-amber-600')}>
          {icon}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-lg font-bold tabular-nums leading-none',
            accent ? 'text-emerald-400' : warning ? 'text-amber-400' : 'text-white',
          )}
        >
          {value}
        </span>
        {suffix ? <span className="text-[10px] text-zinc-500">{suffix}</span> : null}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  2. Case Pipeline                                                  */
/* ────────────────────────────────────────────────────────────────── */

function CasePipeline({
  stats,
  onStageClick,
  activeFilter,
}: {
  stats: DashboardStats
  onStageClick: (stage: EotCaseStatus | null) => void
  activeFilter: EotCaseStatus | null
}) {
  const maxCount = Math.max(1, ...Object.values(stats.pipelineCounts))

  // Detect bottleneck (most cases stuck in any active stage)
  const activeStages = PIPELINE_STAGES.filter((s) => s.key !== 'resolved' && s.key !== 'draft')
  const bottleneck = activeStages.reduce(
    (max, stage) =>
      (stats.pipelineCounts[stage.key] ?? 0) > (stats.pipelineCounts[max.key] ?? 0) ? stage : max,
    activeStages[0],
  )
  const bottleneckCount = stats.pipelineCounts[bottleneck.key] ?? 0

  return (
    <div
      className="animate-fade-in-up overflow-hidden rounded-xl border border-zinc-200 bg-white"
      style={{ animationDelay: '80ms' }}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100/80">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-950">Case Pipeline</h3>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600">
            {stats.totalCases} total
          </span>
        </div>
        {activeFilter ? (
          <button
            type="button"
            onClick={() => onStageClick(null)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            Clear filter
            <Filter className="h-3 w-3" />
          </button>
        ) : null}
      </div>
      <div className="px-5 py-4">
        <div className="flex items-end gap-1.5">
          {PIPELINE_STAGES.map((stage) => {
            const count = stats.pipelineCounts[stage.key] ?? 0
            const heightPercent = count > 0 ? Math.max(12, (count / maxCount) * 100) : 4
            const isActive = activeFilter === stage.key
            const isFiltered = activeFilter !== null && !isActive

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => onStageClick(isActive ? null : stage.key)}
                className={cn(
                  'group flex flex-1 flex-col items-center gap-1.5 rounded-lg px-1 py-2 transition-all',
                  isActive && 'bg-zinc-100/80 ring-1 ring-zinc-200',
                  isFiltered && 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums transition',
                    count > 0 ? 'text-zinc-950' : 'text-zinc-300',
                    isActive && 'text-zinc-950',
                  )}
                >
                  {count}
                </span>
                <div
                  className={cn('w-full rounded-md transition-all', stage.color, 'group-hover:opacity-80')}
                  style={{ height: `${heightPercent}px`, minHeight: '4px' }}
                />
                <span
                  className={cn(
                    'text-[9px] font-medium uppercase tracking-wider',
                    isActive ? 'text-zinc-700' : 'text-zinc-400',
                  )}
                >
                  {stage.label}
                </span>
              </button>
            )
          })}
        </div>
        {bottleneckCount > 1 ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            Bottleneck: <span className="font-semibold text-zinc-700">{bottleneckCount} cases</span> in{' '}
            {bottleneck.label}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  3. Financial Overview                                             */
/* ────────────────────────────────────────────────────────────────── */

function FinancialOverview({
  stats,
  claimRecovery,
}: {
  stats: DashboardStats
  claimRecovery?: { total_claimed: string; total_recovered: string; success_rate: number } | null
}) {
  return (
    <div className="animate-fade-in-up grid grid-cols-2 gap-3 lg:grid-cols-4" style={{ animationDelay: '160ms' }}>
      <Link
        href="/tenancies"
        className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 px-5 py-5 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5"
      >
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-100/50 blur-2xl transition-all group-hover:bg-emerald-100/80" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Deposits Held
            </span>
          </div>
          <p className="mt-2 animate-count-up text-2xl font-bold tabular-nums tracking-tight text-zinc-950">
            {formatCurrency(stats.totalDepositValue)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">{stats.totalTenancies} tenancies</p>
        </div>
        <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-500" />
      </Link>

      <Link
        href="/tenancies"
        className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/40 px-5 py-5 shadow-sm transition-all duration-200 hover:border-sky-200 hover:shadow-md hover:-translate-y-0.5"
      >
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-sky-100/50 blur-2xl transition-all group-hover:bg-sky-100/80" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-sky-600" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">
              Claims Pipeline
            </span>
          </div>
          <p className="mt-2 animate-count-up text-2xl font-bold tabular-nums tracking-tight text-zinc-950">
            {formatCurrency(stats.claimPipelineValue)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {stats.claimPipelineCount} case{stats.claimPipelineCount !== 1 ? 's' : ''} ready / submitted
          </p>
        </div>
        <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-500" />
      </Link>

      <Link
        href="/disputes"
        className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/40 px-5 py-5 shadow-sm transition-all duration-200 hover:border-rose-200 hover:shadow-md hover:-translate-y-0.5"
      >
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-rose-100/50 blur-2xl transition-all group-hover:bg-rose-100/80" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-rose-600" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">
              At Risk
            </span>
          </div>
          <p className="mt-2 animate-count-up text-2xl font-bold tabular-nums tracking-tight text-zinc-950">
            {formatCurrency(stats.disputedValue)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {stats.disputedCases} disputed case{stats.disputedCases !== 1 ? 's' : ''}
          </p>
        </div>
        <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-rose-500" />
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/40 px-5 py-5 shadow-sm">
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-violet-100/50 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-600" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">
              Recovery Rate
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-zinc-950">
            {claimRecovery ? `${Math.round(claimRecovery.success_rate)}%` : '\u2014'}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {claimRecovery
              ? `${formatCurrency(claimRecovery.total_recovered)} recovered`
              : 'No claims data yet'}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  4. Action Centre                                                  */
/* ────────────────────────────────────────────────────────────────── */

const ACTION_TABS = [
  { id: 'all', label: 'All Actions', icon: Flame },
  { id: 'no_case', label: 'No Checkout', icon: Calendar },
  { id: 'review', label: 'Reviews', icon: Eye },
  { id: 'unassigned', label: 'Unassigned', icon: UserX },
  { id: 'stale', label: 'Stale', icon: Clock },
  { id: 'high_severity', label: 'High Priority', icon: AlertTriangle },
] as const

type ActionTabId = (typeof ACTION_TABS)[number]['id']

const BADGE_TONES: Record<string, string> = {
  review: 'bg-amber-50 text-amber-700 ring-amber-200/50',
  draft: 'bg-zinc-100 text-zinc-500 ring-zinc-200/50',
  high: 'bg-rose-50 text-rose-700 ring-rose-200/50',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200/50',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-200/50',
}

function ActionCenter({ items }: { items: ActionItem[] }) {
  const [activeTab, setActiveTab] = useState<ActionTabId>('all')

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items.slice(0, 12)
    return items.filter((i) => i.type === activeTab).slice(0, 10)
  }, [items, activeTab])

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    for (const item of items) counts[item.type] = (counts[item.type] ?? 0) + 1
    return counts
  }, [items])

  if (items.length === 0) {
    return (
      <div
        className="animate-fade-in-up rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 px-6 py-12 text-center backdrop-blur-sm"
        style={{ animationDelay: '240ms' }}
      >
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
        <p className="mt-3 text-sm font-medium text-emerald-700">All clear</p>
        <p className="mt-1 text-xs text-emerald-600/60">No items require your immediate attention</p>
      </div>
    )
  }

  return (
    <div
      className="animate-fade-in-up overflow-hidden rounded-xl border border-zinc-200 bg-white"
      style={{ animationDelay: '240ms' }}
    >
      <div className="border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/80">
            <Flame className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-950">Action Centre</h3>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-700">
            {items.length}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1 overflow-x-auto">
          {ACTION_TABS.map((tab) => {
            const count = tabCounts[tab.id] ?? 0
            if (tab.id !== 'all' && count === 0) return null
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  activeTab === tab.id
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100/60 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-zinc-200/60 text-zinc-500',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        {filteredItems.map((item, i) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            className="modern-table-row flex items-center gap-4 border-b border-zinc-100/80 px-5 py-3.5 last:border-b-0"
            style={{ animationDelay: `${i * 20}ms` }}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                item.type === 'review' && 'bg-amber-100/80 text-amber-600',
                item.type === 'unassigned' && 'bg-zinc-100/80 text-zinc-500',
                item.type === 'stale' && 'bg-rose-100/80 text-rose-500',
                item.type === 'high_severity' && 'bg-rose-100/80 text-rose-600',
                item.type === 'no_case' && 'bg-sky-100/80 text-sky-600',
              )}
            >
              {item.type === 'review' && <Eye className="h-3.5 w-3.5" />}
              {item.type === 'unassigned' && <UserX className="h-3.5 w-3.5" />}
              {item.type === 'stale' && <Clock className="h-3.5 w-3.5" />}
              {item.type === 'high_severity' && <AlertTriangle className="h-3.5 w-3.5" />}
              {item.type === 'no_case' && <Calendar className="h-3.5 w-3.5" />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-950">{item.title}</p>
              <p className="mt-0.5 truncate text-xs text-zinc-400">{item.subtitle}</p>
            </div>

            {item.badge ? (
              <span
                className={cn(
                  'hidden shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset sm:inline-flex',
                  BADGE_TONES[item.badgeTone ?? 'draft'] ?? BADGE_TONES.draft,
                )}
              >
                {item.badge}
              </span>
            ) : null}

            {item.meta ? (
              <span className="hidden shrink-0 text-[11px] text-zinc-400 md:block">{item.meta}</span>
            ) : null}

            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-zinc-800">
              {item.actionLabel}
              <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  5. Tenancy Lifecycle                                              */
/* ────────────────────────────────────────────────────────────────── */

function TenancyLifecycle({ tenancies }: { tenancies: EotTenancyListItem[] }) {
  const now = new Date()
  const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const endingSoon = useMemo(() => {
    return tenancies
      .filter((t) => {
        if (!t.end_date) return false
        const end = new Date(t.end_date)
        return end >= now && end <= sixtyDays
      })
      .map((t) => {
        const endDate = new Date(t.end_date!)
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return { ...t, daysLeft, urgencyBand: getUrgencyBand(daysLeft) }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 15)
  }, [tenancies])

  if (endingSoon.length === 0) {
    return (
      <div
        className="animate-fade-in-up rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-12 text-center backdrop-blur-sm"
        style={{ animationDelay: '320ms' }}
      >
        <Calendar className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-3 text-sm font-medium text-zinc-500">No tenancies ending in the next 60 days</p>
        <p className="mt-1 text-xs text-zinc-400">All tenancies are on track</p>
      </div>
    )
  }

  const grouped = new Map<UrgencyBand, typeof endingSoon>()
  for (const t of endingSoon) {
    if (!grouped.has(t.urgencyBand)) grouped.set(t.urgencyBand, [])
    grouped.get(t.urgencyBand)!.push(t)
  }

  return (
    <div
      className="animate-fade-in-up overflow-hidden rounded-xl border border-zinc-200 bg-white"
      style={{ animationDelay: '320ms' }}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/80">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-950">Tenancy Lifecycle</h3>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-700">
            {endingSoon.length}
          </span>
        </div>
        <Link
          href="/tenancies"
          prefetch={false}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div>
        {(['critical', 'urgent', 'watch', 'monitor'] as UrgencyBand[]).map((band) => {
          const bandItems = grouped.get(band)
          if (!bandItems?.length) return null
          const config = getUrgencyConfig(band)
          return (
            <div key={band}>
              <div className={cn('flex items-center gap-2 px-5 py-2', config.bg)}>
                <span className={cn('h-2 w-2 rounded-full', config.dot)} />
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.color)}>
                  {config.label}
                </span>
                <span className={cn('text-[10px] font-medium', config.color)}>
                  &middot; {bandItems.length}
                </span>
              </div>
              {bandItems.map((t) => {
                const address = buildAddress(t.property)
                return (
                  <Link
                    key={t.id}
                    href={t.case_id ? `/operator/cases/${t.case_id}` : `/dashboard/${t.id}`}
                    prefetch={false}
                    className="modern-table-row flex items-center gap-4 border-b border-zinc-100/80 px-5 py-3 last:border-b-0"
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums',
                        t.daysLeft <= 7
                          ? 'bg-rose-100 text-rose-700'
                          : t.daysLeft <= 14
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-zinc-100 text-zinc-500',
                      )}
                    >
                      {t.daysLeft}d
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-950">{address}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">{t.tenant_name}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-zinc-400">Ends {formatDate(t.end_date)}</p>
                    </div>
                    {t.deposit_amount ? (
                      <p className="hidden text-sm font-semibold tabular-nums text-zinc-950 md:block">
                        {formatCurrency(Number(t.deposit_amount))}
                      </p>
                    ) : null}
                    <div className="hidden md:block">
                      {t.case_id ? (
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                          {t.case_status ? formatEnumLabel(t.case_status) : 'Has case'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white">
                          Start Checkout
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  6. Recent Cases Table                                             */
/* ────────────────────────────────────────────────────────────────── */

function RecentCasesTable({
  cases,
  stageFilter,
}: {
  cases: EotCaseListItem[]
  stageFilter: EotCaseStatus | null
}) {
  const recentCases = useMemo(() => {
    let filtered = [...cases]
    if (stageFilter) filtered = filtered.filter((c) => c.status === stageFilter)
    return filtered
      .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
      .slice(0, 10)
  }, [cases, stageFilter])

  if (recentCases.length === 0) {
    return (
      <div
        className="animate-fade-in-up rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-12 text-center backdrop-blur-sm"
        style={{ animationDelay: '400ms' }}
      >
        <ClipboardCheck className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-3 text-sm font-medium text-zinc-500">
          {stageFilter ? `No cases in "${formatEnumLabel(stageFilter)}" stage` : 'No cases yet'}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          {stageFilter ? 'Try clearing the pipeline filter above' : 'Cases will appear here once created'}
        </p>
      </div>
    )
  }

  return (
    <div
      className="animate-fade-in-up overflow-hidden rounded-xl border border-zinc-200 bg-white"
      style={{ animationDelay: '400ms' }}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80">
            <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-950">
            {stageFilter ? `Cases — ${formatEnumLabel(stageFilter)}` : 'Recent Case Activity'}
          </h3>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600">
            {recentCases.length}
          </span>
        </div>
        <Link
          href="/tenancies"
          prefetch={false}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/40">
              <th className="px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Property
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Status
              </th>
              <th className="hidden px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400 md:table-cell">
                Priority
              </th>
              <th className="hidden px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400 md:table-cell">
                Evidence
              </th>
              <th className="hidden px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400 md:table-cell">
                Issues
              </th>
              <th className="hidden px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400 lg:table-cell">
                Deposit
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Activity
              </th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {recentCases.map((c, i) => {
              const address = buildAddress(c.property)
              return (
                <tr
                  key={c.id}
                  className="modern-table-row border-b border-zinc-100/80 transition last:border-0"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <td className="px-5 py-3">
                    <p className="truncate text-sm font-medium text-zinc-950">{address}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">{c.tenant_name}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                        c.status === 'review'
                          ? 'bg-amber-50 text-amber-700 ring-amber-200/50'
                          : c.status === 'submitted' || c.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/50'
                            : c.status === 'disputed'
                              ? 'bg-rose-50 text-rose-700 ring-rose-200/50'
                              : c.status === 'ready_for_claim'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/50'
                                : 'bg-zinc-100 text-zinc-500 ring-zinc-200/50',
                      )}
                    >
                      {formatEnumLabel(c.status)}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        c.priority === 'high'
                          ? 'text-rose-600'
                          : c.priority === 'medium'
                            ? 'text-amber-600'
                            : 'text-zinc-400',
                      )}
                    >
                      {formatEnumLabel(c.priority)}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-right tabular-nums text-zinc-600 md:table-cell">
                    {c.evidence_count}
                  </td>
                  <td className="hidden px-3 py-3 text-right tabular-nums text-zinc-600 md:table-cell">
                    {c.issue_count}
                  </td>
                  <td className="hidden px-3 py-3 text-right font-semibold tabular-nums text-zinc-950 lg:table-cell">
                    {c.deposit_amount ? (
                      formatCurrency(Number(c.deposit_amount))
                    ) : (
                      <span className="text-zinc-300">&mdash;</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-[11px] text-zinc-400" title={c.last_activity_at}>
                    {relativeTime(c.last_activity_at)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/operator/cases/${c.id}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-200"
                    >
                      Open
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
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

  // Optional analytics data for recovery rate (gracefully fails if no reporting permission)
  const { data: analytics } = useEotAnalyticsDashboard(30)

  const loading = tenanciesLoading || casesLoading
  const refreshing = tenanciesRefreshing || casesRefreshing

  const [stageFilter, setStageFilter] = useState<EotCaseStatus | null>(null)

  const stats = useMemo(() => computeStats(tenancies, cases), [tenancies, cases])
  const actionItems = useMemo(() => buildActionItems(cases, tenancies), [cases, tenancies])

  const handleRefresh = useCallback(() => {
    void refetchTenancies()
    void refetchCases()
    toast.success('Dashboard refreshed')
  }, [refetchTenancies, refetchCases])

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonPanel className="h-[200px]" />
        <SkeletonPanel className="h-[120px]" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonPanel className="h-32" />
          <SkeletonPanel className="h-32" />
          <SkeletonPanel className="h-32" />
          <SkeletonPanel className="h-32" />
        </div>
        <SkeletonPanel className="h-[300px]" />
        <SkeletonPanel className="h-[300px]" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <CommandHeader stats={stats} refreshing={refreshing} onRefresh={handleRefresh} />
      <CasePipeline stats={stats} onStageClick={setStageFilter} activeFilter={stageFilter} />
      <FinancialOverview stats={stats} claimRecovery={analytics?.claim_recovery} />
      <ActionCenter items={actionItems} />
      <TenancyLifecycle tenancies={tenancies} />
      <RecentCasesTable cases={cases} stageFilter={stageFilter} />
    </div>
  )
}
