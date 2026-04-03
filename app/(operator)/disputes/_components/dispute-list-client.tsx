'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { useEotCases } from '@/lib/queries/eot-queries'
import type { EotCaseListItem, EotCasePriority } from '@/lib/eot-types'
import {
  EmptyState,
  SkeletonPanel,
  formatCurrency,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'

function buildFullAddress(property: EotCaseListItem['property']): string {
  const parts = [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
  return parts || property.name
}

function priorityColor(priority: EotCasePriority) {
  switch (priority) {
    case 'high':
      return 'text-rose-700'
    case 'medium':
      return 'text-amber-700'
    default:
      return 'text-zinc-500'
  }
}

export function DisputeListClient({
  initialCases,
}: {
  initialCases?: import('@/lib/eot-types').EotCaseListItem[] | null
}) {
  const searchParams = useSearchParams()
  const search = searchParams.get('search')?.trim().toLowerCase() ?? ''

  const { data: allCases = [], isLoading: loading, error: queryError, isFetching: refreshing, refetch } = useEotCases(initialCases)
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unable to load disputes.') : null
  const cases = useMemo(() => allCases.filter((c) => c.status === 'disputed'), [allCases])
  const [priorityFilter, setPriorityFilter] = useState<'all' | EotCasePriority>('all')

  function refreshCases() {
    void refetch()
  }

  const visible = useMemo(() => {
    return cases.filter((c) => {
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false
      if (search) {
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
        if (!haystack.includes(search)) return false
      }
      return true
    })
  }, [cases, priorityFilter, search])

  const totalDeposit = visible.reduce((sum, c) => sum + (c.deposit_amount ? Number(c.deposit_amount) : 0), 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-6 border-b border-zinc-200 pb-4 xl:grid-cols-4">
        <div>
          <p className="text-xs text-zinc-500">Active disputes</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">{cases.length}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">High priority</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-rose-700">
            {cases.filter((c) => c.priority === 'high').length}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Total deposit at risk</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
            {formatCurrency(totalDeposit)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Total issues</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
            {cases.reduce((sum, c) => sum + c.issue_count, 0)}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | EotCasePriority)}
            className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <span className="text-xs text-zinc-400">
            {visible.length} dispute{visible.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void refreshCases()}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:text-zinc-950"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      ) : error ? (
        <EmptyState title="Unable to load disputes" body={error} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={cases.length === 0 ? 'No active disputes' : 'No disputes match this filter'}
          body={
            cases.length === 0
              ? 'Cases that are flagged as disputed will appear here.'
              : 'Adjust the priority filter or search to widen the results.'
          }
        />
      ) : (
        <div className="overflow-hidden border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Property</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Tenant</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Landlord</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Priority</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Deposit</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Issues</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} className="border-b border-zinc-100 last:border-0 transition hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/operator/cases/${c.id}?step=resolved`}
                      className="font-medium text-zinc-950 hover:underline"
                    >
                      {buildFullAddress(c.property)}
                    </Link>
                    {c.property.postcode ? (
                      <p className="mt-0.5 text-xs text-zinc-400">{c.property.postcode}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{c.tenant_name}</td>
                  <td className="px-4 py-3 text-zinc-600">{c.landlord_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${priorityColor(c.priority)}`}>
                      {formatEnumLabel(c.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-950">
                    {c.deposit_amount ? formatCurrency(Number(c.deposit_amount)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600">{c.issue_count}</td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-400">
                    {formatDateTime(c.last_activity_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
