'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ClipboardCheck,
  Eye,
  RefreshCcw,
  Scale,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEotTenancies, useEotCases } from '@/lib/queries/eot-queries'
import type { EotTenancyListItem, EotCaseListItem } from '@/lib/eot-types'
import { KPIStatCard, SkeletonPanel } from '@/app/operator-ui'
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

function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 md:grid-cols-4">
      <div className="bg-white px-5 py-4">
        <KPIStatCard
          label="Total tenancies"
          value={stats.totalTenancies}
          tone="default"
        />
      </div>
      <div className="bg-white px-5 py-4">
        <KPIStatCard
          label="Active tenancies"
          value={stats.activeTenancies}
          tone="accent"
        />
      </div>
      <div className="bg-white px-5 py-4">
        <KPIStatCard
          label="Ending within 30 days"
          value={stats.endingSoon}
          tone={stats.endingSoon > 0 ? 'warning' : 'default'}
        />
      </div>
      <div className="bg-white px-5 py-4">
        <KPIStatCard
          label="Deposit value"
          value={formatCurrency(stats.totalDepositValue)}
          tone="default"
        />
      </div>
    </div>
  )
}

function CaseSummaryCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Link
        href="/tenancies"
        className="group flex items-start gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 transition hover:border-zinc-300 hover:shadow-sm"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums text-zinc-950">{stats.totalCases}</p>
          <p className="mt-0.5 text-sm text-zinc-500">Active cases</p>
        </div>
        <ArrowRight className="ml-auto mt-1 h-4 w-4 text-zinc-300 transition group-hover:text-zinc-500" />
      </Link>

      <Link
        href="/disputes"
        className="group flex items-start gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 transition hover:border-zinc-300 hover:shadow-sm"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <Scale className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums text-zinc-950">{stats.disputedCases}</p>
          <p className="mt-0.5 text-sm text-zinc-500">Disputed cases</p>
        </div>
        <ArrowRight className="ml-auto mt-1 h-4 w-4 text-zinc-300 transition group-hover:text-zinc-500" />
      </Link>

      <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums text-zinc-950">{stats.casesNeedingAttention}</p>
          <p className="mt-0.5 text-sm text-zinc-500">Cases needing attention</p>
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
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-zinc-500">No tenancies ending in the next 60 days.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-zinc-950">Tenancies ending soon</h3>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            {endingSoon.length}
          </span>
        </div>
        <Link
          href="/tenancies"
          prefetch={false}
          className="text-xs font-medium text-emerald-600 transition hover:text-emerald-700"
        >
          View all tenancies
        </Link>
      </div>
      <div>
        {endingSoon.map((tenancy) => {
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
              className="flex items-center gap-4 border-b border-zinc-100 px-5 py-3.5 transition last:border-b-0 hover:bg-zinc-50/60"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-950">{address}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{tenancy.tenant_name}</p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs text-zinc-500">Ends {formatDate(tenancy.end_date)}</p>
                <p
                  className={cn(
                    'mt-0.5 text-xs font-medium',
                    daysLeft <= 7
                      ? 'text-rose-600'
                      : daysLeft <= 30
                        ? 'text-amber-600'
                        : 'text-zinc-500'
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
                  <p className="text-xs text-zinc-400">No deposit</p>
                )}
              </div>
              <div className="hidden md:block">
                {tenancy.case_id ? (
                  <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                    {tenancy.case_status ? formatEnumLabel(tenancy.case_status) : 'Has case'}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
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
    <div className="grid gap-4 xl:grid-cols-2">
      {reviewCases.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-2 border-b border-amber-200 px-5 py-3">
            <Eye className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-zinc-950">Awaiting your review</h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {reviewCases.length}
            </span>
          </div>
          <div className="bg-white">
            {reviewCases.map((c) => (
              <Link
                key={c.id}
                href={`/operator/cases/${c.id}`}
                prefetch={false}
                className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-3 transition last:border-b-0 hover:bg-zinc-50/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-950">
                    {buildAddress(c.property)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{c.tenant_name}</p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400" title={c.last_activity_at}>
                  {relativeTime(c.last_activity_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {unassignedCases.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/30">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-3">
            <UserX className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-950">Unassigned cases</h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {unassignedCases.length}
            </span>
          </div>
          <div className="bg-white">
            {unassignedCases.map((c) => (
              <Link
                key={c.id}
                href="/admin"
                prefetch={false}
                className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-3 transition last:border-b-0 hover:bg-zinc-50/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-950">
                    {buildAddress(c.property)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{c.tenant_name}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
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
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-zinc-500">No cases yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-zinc-950">Recent case activity</h3>
        <Link
          href="/tenancies"
          prefetch={false}
          className="text-xs font-medium text-emerald-600 transition hover:text-emerald-700"
        >
          View all cases
        </Link>
      </div>
      <div>
        {recentCases.map((c) => {
          const address = buildAddress(c.property)
          return (
            <Link
              key={c.id}
              href={`/operator/cases/${c.id}`}
              prefetch={false}
              className="flex items-center gap-4 border-b border-zinc-100 px-5 py-3.5 transition last:border-b-0 hover:bg-zinc-50/60"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-950">{address}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{c.tenant_name}</p>
              </div>
              <div className="hidden sm:block">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    c.status === 'review'
                      ? 'bg-amber-50 text-amber-700'
                      : c.status === 'submitted' || c.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-600'
                  )}
                >
                  {formatEnumLabel(c.status)}
                </span>
              </div>
              <div className="hidden text-right md:block">
                <p className="text-xs text-zinc-400">
                  {c.issue_count} issue{c.issue_count !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-zinc-400">
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
        <SkeletonPanel className="h-24" />
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonPanel className="h-24" />
          <SkeletonPanel className="h-24" />
          <SkeletonPanel className="h-24" />
        </div>
        <SkeletonPanel className="h-[300px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Portfolio overview across all tenancies and cases.</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
        >
          <RefreshCcw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <StatCards stats={stats} />
      <CaseSummaryCards stats={stats} />
      <NeedsAttentionWidget cases={cases} />
      <EndingSoonTable tenancies={tenancies} />
      <RecentCasesTable cases={cases} />
    </div>
  )
}
