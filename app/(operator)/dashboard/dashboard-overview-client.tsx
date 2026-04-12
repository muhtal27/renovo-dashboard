'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ClipboardCheck,
  Clock,
  Eye,
  Layers,
  PoundSterling,
  RefreshCcw,
  Scale,
  UserX,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEotTenancies, useEotCases } from '@/lib/queries/eot-queries'
import type { EotTenancyListItem, EotCaseListItem } from '@/lib/eot-types'
import { SkeletonPanel } from '@/app/operator-ui'
import {
  formatCurrency,
  formatDate,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'

function buildAddress(property: EotTenancyListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode].filter(Boolean)
  return parts.join(', ') || property.name
}

type DashboardStats = {
  totalTenancies: number
  activeTenancies: number
  endingSoon: number
  ended: number
  totalCases: number
  casesNeedingAttention: number
  disputedCases: number
  totalDepositValue: number
}

function computeStats(
  tenancies: EotTenancyListItem[],
  cases: EotCaseListItem[]
): DashboardStats {
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  let activeTenancies = 0
  let endingSoon = 0
  let ended = 0
  let totalDepositValue = 0

  for (const t of tenancies) {
    if (t.deposit_amount) {
      totalDepositValue += Number(t.deposit_amount)
    }

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

  const disputedCases = cases.filter((c) => c.status === 'disputed').length
  const attentionStatuses = new Set(['collecting_evidence', 'analysis', 'review'])
  const casesNeedingAttention = cases.filter((c) => attentionStatuses.has(c.status)).length

  return {
    totalTenancies: tenancies.length,
    activeTenancies,
    endingSoon,
    ended,
    totalCases: cases.length,
    casesNeedingAttention,
    disputedCases,
    totalDepositValue,
  }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function GreetingHeader({
  stats,
  refreshing,
  onRefresh,
}: {
  stats: DashboardStats
  refreshing: boolean
  onRefresh: () => void
}) {
  return (
    <div className="dark-header animate-fade-in-up relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-6 text-white shadow-lg md:px-8 md:py-8">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-emerald-400/8 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            {getGreeting()}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Here&apos;s your portfolio overview for today
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10"
        >
          <RefreshCcw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickStat
          label="Portfolio"
          value={stats.totalTenancies}
          suffix="tenancies"
          icon={<Layers className="h-3.5 w-3.5" />}
        />
        <QuickStat
          label="Active"
          value={stats.activeTenancies}
          suffix="live"
          icon={<Zap className="h-3.5 w-3.5" />}
          accent
        />
        <QuickStat
          label="Ending soon"
          value={stats.endingSoon}
          suffix="in 30d"
          icon={<Clock className="h-3.5 w-3.5" />}
          warning={stats.endingSoon > 0}
        />
        <QuickStat
          label="Deposits"
          value={formatCurrency(stats.totalDepositValue)}
          icon={<PoundSterling className="h-3.5 w-3.5" />}
        />
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
    <div className="rounded-xl border border-white/8 bg-white/5 px-3.5 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span className={cn(
          'text-zinc-500',
          accent && 'text-emerald-400',
          warning && 'text-amber-400',
        )}>
          {icon}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className={cn(
          'text-lg font-bold tabular-nums leading-none',
          accent ? 'text-emerald-400' : warning ? 'text-amber-400' : 'text-white',
        )}>
          {value}
        </span>
        {suffix ? <span className="text-[10px] text-zinc-500">{suffix}</span> : null}
      </div>
    </div>
  )
}

function CaseSummaryCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="animate-fade-in-up grid grid-cols-1 gap-3 sm:grid-cols-3" style={{ animationDelay: '160ms' }}>
      <Link
        href="/tenancies"
        className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 px-5 py-5 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5"
      >
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-100/50 blur-2xl transition-all group-hover:bg-emerald-100/80" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="animate-count-up text-3xl font-bold tabular-nums tracking-tight text-zinc-950">{stats.totalCases}</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-500">Active cases</p>
          </div>
          <ArrowUpRight className="mt-0.5 h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-500" />
        </div>
      </Link>

      <Link
        href="/disputes"
        className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/40 px-5 py-5 shadow-sm transition-all duration-200 hover:border-rose-200 hover:shadow-md hover:-translate-y-0.5"
      >
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-rose-100/50 blur-2xl transition-all group-hover:bg-rose-100/80" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100/80 text-rose-600 shadow-sm">
            <Scale className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="animate-count-up text-3xl font-bold tabular-nums tracking-tight text-zinc-950">{stats.disputedCases}</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-500">Disputed cases</p>
          </div>
          <ArrowUpRight className="mt-0.5 h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-rose-500" />
        </div>
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 px-5 py-5 shadow-sm">
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-100/50 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-600 shadow-sm">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="animate-count-up text-3xl font-bold tabular-nums tracking-tight text-zinc-950">{stats.casesNeedingAttention}</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-500">Need attention</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EndingSoonTable({ tenancies }: { tenancies: EotTenancyListItem[] }) {
  const now = new Date()
  const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const endingSoon = useMemo(() => {
    return tenancies
      .filter((t) => {
        if (!t.end_date) return false
        const end = new Date(t.end_date)
        return end >= now && end <= sixtyDays
      })
      .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
      .slice(0, 10)
  }, [tenancies])

  if (endingSoon.length === 0) {
    return (
      <div className="animate-fade-in-up rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-12 text-center backdrop-blur-sm" style={{ animationDelay: '320ms' }}>
        <Calendar className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-3 text-sm font-medium text-zinc-500">No tenancies ending in the next 60 days</p>
        <p className="mt-1 text-xs text-zinc-400">All tenancies are on track</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-sm" style={{ animationDelay: '320ms' }}>
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/80">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-950">Tenancies ending soon</h3>
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
        {endingSoon.map((tenancy, i) => {
          const address = buildAddress(tenancy.property)
          const endDate = new Date(tenancy.end_date!)
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          return (
            <Link
              key={tenancy.id}
              href={
                tenancy.case_id
                  ? `/operator/cases/${tenancy.case_id}`
                  : `/dashboard/${tenancy.id}`
              }
              prefetch={false}
              className="modern-table-row flex items-center gap-4 border-b border-zinc-100/80 px-5 py-3.5 last:border-b-0"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100/80 text-xs font-bold tabular-nums text-zinc-500">
                {daysLeft}d
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-950">{address}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-400">{tenancy.tenant_name}</p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs text-zinc-400">Ends {formatDate(tenancy.end_date)}</p>
                <p
                  className={cn(
                    'mt-0.5 text-xs font-semibold',
                    daysLeft <= 7
                      ? 'text-rose-600'
                      : daysLeft <= 30
                        ? 'text-amber-600'
                        : 'text-zinc-400'
                  )}
                >
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                </p>
              </div>
              <div className="hidden md:block">
                {tenancy.deposit_amount ? (
                  <p className="text-sm font-semibold tabular-nums text-zinc-950">
                    {formatCurrency(Number(tenancy.deposit_amount))}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-300">No deposit</p>
                )}
              </div>
              <div className="hidden md:block">
                {tenancy.case_id ? (
                  <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                    {tenancy.case_status ? formatEnumLabel(tenancy.case_status) : 'Has case'}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                    No case
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function NeedsAttentionWidget({ cases }: { cases: EotCaseListItem[] }) {
  const reviewCases = useMemo(
    () => cases.filter((c) => c.status === 'review').slice(0, 5),
    [cases]
  )
  const unassignedCases = useMemo(
    () => cases.filter((c) => !c.assigned_to).slice(0, 5),
    [cases]
  )

  if (reviewCases.length === 0 && unassignedCases.length === 0) return null

  return (
    <div className="animate-fade-in-up grid gap-3 xl:grid-cols-2" style={{ animationDelay: '240ms' }}>
      {reviewCases.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-amber-100 px-5 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/80">
              <Eye className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-950">Awaiting your review</h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-700">
              {reviewCases.length}
            </span>
          </div>
          <div className="bg-white/60">
            {reviewCases.map((c) => (
              <Link
                key={c.id}
                href={`/operator/cases/${c.id}`}
                prefetch={false}
                className="modern-table-row flex items-center justify-between gap-4 border-b border-zinc-100/60 px-5 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-950">
                    {buildAddress(c.property)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">{c.tenant_name}</p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-zinc-400" title={c.last_activity_at}>
                  {relativeTime(c.last_activity_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {unassignedCases.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-zinc-50/50 to-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 px-5 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100/80">
              <UserX className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-950">Unassigned cases</h3>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600">
              {unassignedCases.length}
            </span>
          </div>
          <div className="bg-white/60">
            {unassignedCases.map((c) => (
              <Link
                key={c.id}
                href="/admin"
                prefetch={false}
                className="modern-table-row flex items-center justify-between gap-4 border-b border-zinc-100/60 px-5 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-950">
                    {buildAddress(c.property)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">{c.tenant_name}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500">
                  {formatEnumLabel(c.status)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RecentCasesTable({ cases }: { cases: EotCaseListItem[] }) {
  const recentCases = useMemo(() => {
    return [...cases]
      .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
      .slice(0, 8)
  }, [cases])

  if (recentCases.length === 0) {
    return (
      <div className="animate-fade-in-up rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-12 text-center backdrop-blur-sm" style={{ animationDelay: '400ms' }}>
        <ClipboardCheck className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-3 text-sm font-medium text-zinc-500">No cases yet</p>
        <p className="mt-1 text-xs text-zinc-400">Cases will appear here once created</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-sm" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80">
            <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-950">Recent case activity</h3>
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
        {recentCases.map((c, i) => {
          const address = buildAddress(c.property)
          return (
            <Link
              key={c.id}
              href={`/operator/cases/${c.id}`}
              prefetch={false}
              className="modern-table-row flex items-center gap-4 border-b border-zinc-100/80 px-5 py-3.5 last:border-b-0"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-950">{address}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-400">{c.tenant_name}</p>
              </div>
              <div className="hidden sm:block">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    c.status === 'review'
                      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50'
                      : c.status === 'submitted' || c.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50'
                        : 'bg-zinc-100 text-zinc-500'
                  )}
                >
                  {formatEnumLabel(c.status)}
                </span>
              </div>
              <div className="hidden text-right md:block">
                <p className="text-[11px] tabular-nums text-zinc-400">
                  {c.issue_count} issue{c.issue_count !== 1 ? 's' : ''}
                </p>
                <p className="text-[11px] tabular-nums text-zinc-400">
                  {c.evidence_count} evidence
                </p>
              </div>
              {c.deposit_amount ? (
                <p className="hidden text-sm font-semibold tabular-nums text-zinc-950 md:block">
                  {formatCurrency(Number(c.deposit_amount))}
                </p>
              ) : null}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

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

  const loading = tenanciesLoading || casesLoading
  const refreshing = tenanciesRefreshing || casesRefreshing

  const stats = useMemo(() => computeStats(tenancies, cases), [tenancies, cases])

  function handleRefresh() {
    void refetchTenancies()
    void refetchCases()
    toast.success('Dashboard refreshed')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonPanel className="h-[180px]" />
        <div className="grid gap-3 sm:grid-cols-3">
          <SkeletonPanel className="h-28" />
          <SkeletonPanel className="h-28" />
          <SkeletonPanel className="h-28" />
        </div>
        <SkeletonPanel className="h-[300px]" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <GreetingHeader stats={stats} refreshing={refreshing} onRefresh={handleRefresh} />
      <CaseSummaryCards stats={stats} />
      <NeedsAttentionWidget cases={cases} />
      <EndingSoonTable tenancies={tenancies} />
      <RecentCasesTable cases={cases} />
    </div>
  )
}
