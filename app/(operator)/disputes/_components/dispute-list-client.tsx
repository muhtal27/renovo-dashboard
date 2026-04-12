'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useEotCases } from '@/lib/queries/eot-queries'
import type { EotCaseListItem } from '@/lib/eot-types'
import { EmptyState, SkeletonPanel } from '@/app/operator-ui'
import {
  formatCurrency,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import { useDebounce } from '@/lib/use-debounce'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'

function buildFullAddress(property: EotCaseListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
  return parts || property.name
}

const PRIORITY_BORDER: Record<string, string> = {
  high: 'border-l-rose-500',
  medium: 'border-l-amber-500',
  low: 'border-l-zinc-300',
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-rose-50 text-rose-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-zinc-100 text-zinc-600',
}

type PriorityView = 'all' | 'high' | 'medium' | 'low'

export function DisputeListClient({
  initialCases,
}: {
  initialCases?: EotCaseListItem[] | null
}) {
  const searchParams = useSearchParams()
  const urlSearch = searchParams.get('search')?.trim().toLowerCase() ?? ''

  const { data: allCases = [], isLoading: loading, error: queryError, isFetching: refreshing, refetch } = useEotCases(initialCases)
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unable to load disputes.') : null
  const cases = useMemo(() => allCases.filter((c) => c.status === 'disputed'), [allCases])

  const [view, setView] = useState<PriorityView>('all')
  const [search, setSearch] = useState(urlSearch)
  const debouncedSearch = useDebounce(search, 250)

  function refreshCases() {
    void refetch()
    toast.success('Disputes refreshed')
  }

  const stats = useMemo(() => ({
    total: cases.length,
    high: cases.filter((c) => c.priority === 'high').length,
    medium: cases.filter((c) => c.priority === 'medium').length,
    low: cases.filter((c) => c.priority === 'low').length,
  }), [cases])

  const visible = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase()
    return cases.filter((c) => {
      if (view !== 'all' && c.priority !== view) return false
      if (searchLower) {
        const haystack = [
          c.property.name,
          c.property.address_line_1,
          c.property.city,
          c.property.postcode,
          c.tenant_name,
          c.landlord_name,
          c.id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(searchLower)) return false
      }
      return true
    })
  }, [cases, view, debouncedSearch])

  const totalDeposit = cases.reduce((sum, c) => sum + (c.deposit_amount ? Number(c.deposit_amount) : 0), 0)

  const filters: Array<{ key: PriorityView; label: string; count: number }> = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'high', label: 'High', count: stats.high },
    { key: 'medium', label: 'Medium', count: stats.medium },
    { key: 'low', label: 'Low', count: stats.low },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Disputes</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {stats.total} disputed case{stats.total !== 1 ? 's' : ''} &middot; {formatCurrency(totalDeposit)} at risk
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshCases()}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          <RefreshCcw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Filter pills + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setView(f.key)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                view === f.key
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-[34px] w-[200px] rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      {/* Dispute cards */}
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      ) : error ? (
        <EmptyState title="Unable to load disputes" body={error} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={cases.length === 0 ? 'No active disputes' : 'No disputes match'}
          body={
            cases.length === 0
              ? 'Cases that are disputed will appear here.'
              : 'Adjust the priority filter or search.'
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((c) => {
            const address = buildFullAddress(c.property)
            const priBorder = PRIORITY_BORDER[c.priority] ?? 'border-l-zinc-300'
            const priBadge = PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.low
            return (
              <Link
                key={c.id}
                href={`/operator/cases/${c.id}?step=refund`}
                prefetch={false}
                className={cn(
                  'block rounded-xl border border-zinc-200 border-l-[3px] bg-white px-5 py-4 transition hover:shadow-sm',
                  priBorder,
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-950">{address}</p>
                    <p className="mt-1 truncate text-[13px] text-zinc-500">{c.tenant_name}</p>
                    {c.landlord_name ? (
                      <p className="mt-0.5 truncate text-xs text-zinc-400">Landlord: {c.landlord_name}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', priBadge)}>
                      {formatEnumLabel(c.priority)}
                    </span>
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                      Disputed
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
                  <span>Deposit: <span className="font-semibold tabular-nums text-zinc-700">{c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '\u2014'}</span></span>
                  <span>{c.issue_count} issues</span>
                  <span>{relativeTime(c.last_activity_at)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
