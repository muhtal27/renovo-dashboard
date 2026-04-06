'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCcw } from 'lucide-react'
import { useEotTenancies } from '@/lib/queries/eot-queries'
import type { EotTenancyListItem } from '@/lib/eot-types'
import {
  EmptyState,
  SkeletonPanel,
  ToolbarPill,
  formatCurrency,
  formatDate,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'

type TenancyView = 'all' | 'active' | 'ending' | 'with_case' | 'no_case'

function buildAddress(property: EotTenancyListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode].filter(Boolean)
  return parts.join(', ') || property.name
}

function getTenancyStatus(tenancy: EotTenancyListItem) {
  if (tenancy.case_status) {
    return { label: formatEnumLabel(tenancy.case_status), tone: 'case' as const }
  }

  if (!tenancy.end_date) {
    return { label: 'Active', tone: 'active' as const }
  }

  const endDate = new Date(tenancy.end_date)
  const now = new Date()
  const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilEnd < 0) {
    return { label: 'Ended', tone: 'ended' as const }
  }

  if (daysUntilEnd <= 30) {
    return { label: `Ending in ${daysUntilEnd}d`, tone: 'ending' as const }
  }

  return { label: 'Active', tone: 'active' as const }
}

const STATUS_TONE_STYLES: Record<string, string> = {
  active: 'bg-emerald-500',
  ending: 'bg-amber-500',
  ended: 'bg-zinc-400',
  case: 'bg-sky-500',
}

export function TenanciesListClient({
  initialTenancies,
}: {
  initialTenancies?: EotTenancyListItem[] | null
}) {
  const { data: tenancies = [], isLoading: loading, error: queryError, isFetching: refreshing, refetch } = useEotTenancies(initialTenancies)
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load tenancies.') : null
  const searchParams = useSearchParams()
  const [view, setView] = useState<TenancyView>('all')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  function refreshTenancies() {
    void refetch()
  }

  const stats = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return {
      total: tenancies.length,
      active: tenancies.filter((t) => {
        if (!t.end_date) return true
        return new Date(t.end_date) >= now
      }).length,
      ending: tenancies.filter((t) => {
        if (!t.end_date) return false
        const end = new Date(t.end_date)
        return end >= now && end <= thirtyDaysFromNow
      }).length,
      withCase: tenancies.filter((t) => t.case_id !== null).length,
      noCase: tenancies.filter((t) => t.case_id === null).length,
    }
  }, [tenancies])

  const filteredTenancies = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const searchLower = search.toLowerCase()

    return tenancies.filter((t) => {
      if (searchLower) {
        const searchable = [
          t.tenant_name,
          t.tenant_email ?? '',
          t.landlord_name ?? '',
          t.property.address_line_1 ?? '',
          t.property.city ?? '',
          t.property.postcode ?? '',
          t.property.name,
          t.deposit_scheme ?? '',
        ].join(' ').toLowerCase()
        if (!searchable.includes(searchLower)) return false
      }

      if (view === 'active') {
        if (t.end_date && new Date(t.end_date) < now) return false
      }
      if (view === 'ending') {
        if (!t.end_date) return false
        const end = new Date(t.end_date)
        if (end < now || end > thirtyDaysFromNow) return false
      }
      if (view === 'with_case') {
        if (t.case_id === null) return false
      }
      if (view === 'no_case') {
        if (t.case_id !== null) return false
      }

      return true
    })
  }, [tenancies, view, search])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-0">
            {([
              { value: 'all' as const, label: `All (${stats.total})` },
              { value: 'active' as const, label: `Active (${stats.active})` },
              { value: 'ending' as const, label: `Ending soon (${stats.ending})` },
              { value: 'with_case' as const, label: `With case (${stats.withCase})` },
              { value: 'no_case' as const, label: `No case (${stats.noCase})` },
            ] as const).map((tab) => (
              <button key={tab.value} type="button" onClick={() => setView(tab.value)}>
                <ToolbarPill active={view === tab.value}>{tab.label}</ToolbarPill>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search tenancies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-48 border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 outline-none transition focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={() => void refreshTenancies()}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:text-zinc-950"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      ) : error ? (
        <EmptyState title="Unable to load tenancies" body={error} />
      ) : filteredTenancies.length === 0 ? (
        <EmptyState
          title={tenancies.length === 0 ? 'No tenancies yet' : 'No tenancies match this view'}
          body={
            tenancies.length === 0
              ? 'Tenancies will appear here when synced from inventory software or created alongside checkouts.'
              : 'Adjust the view or search to widen results.'
          }
        />
      ) : (
        <div className="space-y-0">
          {filteredTenancies.map((tenancy) => {
            const address = buildAddress(tenancy.property)
            const status = getTenancyStatus(tenancy)

            return (
              <Link
                key={tenancy.id}
                href={tenancy.case_id ? `/operator/cases/${tenancy.case_id}` : `/dashboard/${tenancy.id}`}
                prefetch={false}
                className="grid grid-cols-1 items-start gap-x-6 border-b border-zinc-200 px-5 py-5 transition hover:bg-zinc-50/60 sm:grid-cols-[1fr_160px] md:grid-cols-[1fr_160px_140px_120px_100px]"
              >
                {/* Property + tenant */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">{address}</p>
                  <p className="mt-1 truncate text-sm text-zinc-500">
                    <span className="text-xs text-zinc-400">Tenant </span>
                    {tenancy.tenant_name}
                  </p>
                  {tenancy.landlord_name ? (
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      Landlord: {tenancy.landlord_name}
                    </p>
                  ) : null}
                </div>

                {/* Tenancy dates */}
                <div className="hidden sm:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Tenancy period
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {tenancy.start_date ? formatDate(tenancy.start_date) : '—'}
                  </p>
                  <p className="text-xs text-zinc-600">
                    to {tenancy.end_date ? formatDate(tenancy.end_date) : 'ongoing'}
                  </p>
                </div>

                {/* Deposit */}
                <div className="hidden md:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Deposit
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-950">
                    {tenancy.deposit_amount
                      ? formatCurrency(Number(tenancy.deposit_amount))
                      : '—'}
                  </p>
                  {tenancy.deposit_scheme ? (
                    <p className="mt-0.5 text-xs text-zinc-500">{tenancy.deposit_scheme}</p>
                  ) : null}
                </div>

                {/* Status */}
                <div className="hidden md:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Status
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        STATUS_TONE_STYLES[status.tone] ?? 'bg-zinc-400'
                      }`}
                    />
                    <span className="text-zinc-700">{status.label}</span>
                  </p>
                </div>

                {/* Case link */}
                <div className="hidden md:block">
                  {tenancy.case_id ? (
                    <span className="mt-3 inline-flex items-center text-xs font-medium text-emerald-600">
                      Has case
                    </span>
                  ) : (
                    <span className="mt-3 inline-flex items-center text-xs text-zinc-400">
                      No case
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
