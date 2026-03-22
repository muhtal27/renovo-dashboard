'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { OperatorLayout } from '@/app/operator-layout'
import { endOfTenancyApiRequest } from '@/lib/end-of-tenancy/client-api'
import type { EndOfTenancyCaseListItem } from '@/lib/end-of-tenancy/types'

type EndOfTenancyCaseRow = {
  id: string
  case_id: string
  tenancy_id: string
  workflow_status: string
  inspection_status: string
  move_out_date: string | null
  closed_at: string | null
  updated_at: string | null
}

type CaseRow = {
  id: string
  case_number: string | null
  status: string | null
  tenancy_id: string | null
  property_id: string | null
  assigned_user_id: string | null
  last_activity_at?: string | null
  updated_at: string | null
  created_at: string | null
}

type TenancyRow = {
  id: string
  property_id: string | null
  tenant_contact_id: string | null
  landlord_contact_id: string | null
  end_date: string | null
}

type PropertyRow = {
  id: string
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  postcode: string | null
}

type ContactRow = {
  id: string
  full_name: string | null
}

type UserProfileRow = {
  id: string
  full_name: string | null
}

type QueueRow = {
  eotCase: EndOfTenancyCaseRow
  case: CaseRow | null
  tenancy: TenancyRow | null
  property: PropertyRow | null
  tenant: ContactRow | null
  landlord: ContactRow | null
  assignedOperator: UserProfileRow | null
}

type EndOfTenancyCaseListResponse = {
  ok: boolean
  items: EndOfTenancyCaseListItem[]
}

const DENSITY_STORAGE_KEY = 'eot-dashboard-density'
const STUCK_THRESHOLDS_HOURS: Record<string, number> = {
  evidence_pending: 72,
  evidence_ready: 48,
  review_pending: 48,
  recommendation_drafted: 48,
  needs_manual_review: 24,
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return 'No recent activity'

  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getDaysInStatus(updatedAt: string | null | undefined) {
  if (!updatedAt) return null
  const diffMs = Date.now() - new Date(updatedAt).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getStuckState(
  workflowStatus: string | null,
  updatedAt: string | null | undefined
): 'stuck' | 'aging' | 'ok' {
  if (!updatedAt || !workflowStatus) return 'ok'
  const diffHours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60)
  const threshold = STUCK_THRESHOLDS_HOURS[workflowStatus]
  if (!threshold) return 'ok'
  if (diffHours >= threshold) return 'stuck'
  if (diffHours >= threshold * 0.75) return 'aging'
  return 'ok'
}

function getStuckTone(state: 'stuck' | 'aging' | 'ok') {
  switch (state) {
    case 'stuck':
      return 'text-red-600 font-semibold'
    case 'aging':
      return 'text-amber-600 font-medium'
    default:
      return 'text-stone-500'
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function buildAddress(property: PropertyRow | null) {
  if (!property) return 'Unknown property'
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

function getWorkflowTone(status: string | null) {
  switch (status) {
    case 'evidence_pending':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    case 'evidence_ready':
    case 'review_pending':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'recommendation_drafted':
      return 'border border-violet-200 bg-violet-50 text-violet-800'
    case 'recommendation_approved':
    case 'ready_for_claim':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'needs_manual_review':
      return 'border border-red-200 bg-red-50 text-red-800'
    case 'closed':
      return 'border border-stone-200 bg-stone-100 text-stone-700'
    default:
      return 'border border-stone-200 bg-stone-50 text-stone-700'
  }
}

function formatWorkflowLabel(status: string | null) {
  if (!status) return 'Unknown'
  if (status === 'recommendation_drafted') return 'Awaiting review'
  return status.replace(/_/g, ' ')
}

function getInspectionTone(status: string | null) {
  switch (status) {
    case 'completed':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'scheduled':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'waived':
      return 'border border-stone-200 bg-stone-100 text-stone-700'
    default:
      return 'border border-amber-200 bg-amber-50 text-amber-800'
  }
}

function formatInspectionLabel(status: string | null) {
  if (!status) return 'Not started'
  return status.replace(/_/g, ' ')
}

function mapListItemsToQueueRows(items: EndOfTenancyCaseListItem[]) {
  return items
    .map<QueueRow>((item) => ({
      eotCase: item.endOfTenancyCase,
      case: item.case,
      tenancy: item.tenancy,
      property: item.property,
      tenant: item.tenant,
      landlord: item.landlord,
      assignedOperator: item.assignedOperator,
    }))
    .sort((left, right) => {
      const leftActivity =
        left.case?.last_activity_at || left.case?.updated_at || left.case?.created_at || ''
      const rightActivity =
        right.case?.last_activity_at || right.case?.updated_at || right.case?.created_at || ''
      return rightActivity.localeCompare(leftActivity)
    })
}

function getRowSearchText(row: QueueRow) {
  return [
    row.case?.case_number,
    buildAddress(row.property),
    row.tenant?.full_name,
    row.landlord?.full_name,
    row.assignedOperator?.full_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getRowCellPadding(density: 'compact' | 'comfortable') {
  return density === 'compact' ? 'px-3 py-3' : 'px-3 py-4'
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: string
}) {
  return (
    <div className="app-surface rounded-[1.7rem] px-5 py-5">
      <p className="app-kicker">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${tone}`}>{value}</p>
    </div>
  )
}

function SkeletonTable({
  density,
}: {
  density: 'compact' | 'comfortable'
}) {
  const cellPadding = getRowCellPadding(density)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            <th className="w-10 px-3 py-2">
              <div className="h-4 w-4 animate-pulse rounded bg-stone-200" />
            </th>
            <th className="px-3 py-2">Case ref</th>
            <th className="px-3 py-2">Property address</th>
            <th className="px-3 py-2">Tenant name</th>
            <th className="px-3 py-2">Move-out date</th>
            <th className="px-3 py-2">Workflow status</th>
            <th className="px-3 py-2">In status</th>
            <th className="px-3 py-2">Inspection</th>
            <th className="px-3 py-2">Assigned to</th>
            <th className="px-3 py-2">Last activity</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, index) => (
            <tr key={index}>
              <td
                className={`w-10 rounded-l-[1.4rem] border-b border-l border-t border-stone-200 bg-white ${cellPadding}`}
              >
                <div className="h-4 w-4 animate-pulse rounded bg-stone-200" />
              </td>
              <td className={`border-y border-stone-200 bg-white ${cellPadding}`}>
                <div className="h-5 w-20 animate-pulse rounded-full bg-stone-200" />
              </td>
              <td className={`border-y border-stone-200 bg-white ${cellPadding}`}>
                <div className="h-5 w-40 animate-pulse rounded-full bg-stone-200" />
              </td>
              <td className={`border-y border-stone-200 bg-white ${cellPadding}`}>
                <div className="h-5 w-28 animate-pulse rounded-full bg-stone-200" />
              </td>
              <td className={`border-y border-stone-200 bg-white ${cellPadding}`}>
                <div className="h-5 w-24 animate-pulse rounded-full bg-stone-200" />
              </td>
              <td className={`border-y border-stone-200 bg-white ${cellPadding}`}>
                <div className="h-7 w-28 animate-pulse rounded-full bg-stone-200" />
              </td>
              <td className={`border-y border-stone-200 bg-white ${cellPadding}`}>
                <div className="h-5 w-14 animate-pulse rounded-full bg-stone-200" />
              </td>
              <td className={`border-y border-stone-200 bg-white ${cellPadding}`}>
                <div className="h-7 w-20 animate-pulse rounded-full bg-stone-200" />
              </td>
              <td className={`border-y border-stone-200 bg-white ${cellPadding}`}>
                <div className="h-5 w-24 animate-pulse rounded-full bg-stone-200" />
              </td>
              <td className={`border-y border-stone-200 bg-white ${cellPadding}`}>
                <div className="h-5 w-16 animate-pulse rounded-full bg-stone-200" />
              </td>
              <td
                className={`rounded-r-[1.4rem] border-b border-r border-t border-stone-200 bg-white text-right ${cellPadding}`}
              >
                <div className="ml-auto h-9 w-24 animate-pulse rounded-full bg-stone-200" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function EotCasesPage({
  initialItems,
}: {
  initialItems?: EndOfTenancyCaseListItem[]
}) {
  const initialRows = mapListItemsToQueueRows(initialItems ?? [])

  const [rows, setRows] = useState<QueueRow[]>(initialRows)
  const [loading, setLoading] = useState(initialItems === undefined)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable')
  const [densityHydrated, setDensityHydrated] = useState(false)

  const refreshQueue = useCallback(async () => {
    const response = await endOfTenancyApiRequest<EndOfTenancyCaseListResponse>(
      '/api/eot/cases?limit=250'
    )

    return mapListItemsToQueueRows(response.items)
  }, [])

  const loadCases = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const queueRows = await refreshQueue()
      setRows(queueRows)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the queue.')
    } finally {
      setLoading(false)
    }
  }, [refreshQueue])

  useEffect(() => {
    if (initialItems !== undefined) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)

      try {
        const queueRows = await refreshQueue()

        if (!cancelled) {
          setRows(queueRows)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load the queue.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [initialItems, refreshQueue])

  useEffect(() => {
    const storedDensity =
      typeof window !== 'undefined' ? window.localStorage.getItem(DENSITY_STORAGE_KEY) : null

    if (storedDensity === 'compact' || storedDensity === 'comfortable') {
      setDensity(storedDensity)
    }

    setDensityHydrated(true)
  }, [])

  useEffect(() => {
    if (!densityHydrated || typeof window === 'undefined') return
    window.localStorage.setItem(DENSITY_STORAGE_KEY, density)
  }, [density, densityHydrated])

  const openRows = useMemo(
    () => rows.filter((row) => (row.case?.status || '').toLowerCase() !== 'closed'),
    [rows]
  )

  const sortedOpenRows = useMemo(() => {
    return [...openRows].sort((left, right) => {
      const leftStuck = getStuckState(left.eotCase.workflow_status, left.eotCase.updated_at)
      const rightStuck = getStuckState(right.eotCase.workflow_status, right.eotCase.updated_at)
      const stuckOrder = { stuck: 0, aging: 1, ok: 2 }
      const stuckDiff = stuckOrder[leftStuck] - stuckOrder[rightStuck]
      if (stuckDiff !== 0) return stuckDiff

      const leftActivity =
        left.case?.last_activity_at || left.case?.updated_at || left.case?.created_at || ''
      const rightActivity =
        right.case?.last_activity_at || right.case?.updated_at || right.case?.created_at || ''
      return rightActivity.localeCompare(leftActivity)
    })
  }, [openRows])

  const filteredOpenRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return sortedOpenRows
    }

    return sortedOpenRows.filter((row) => getRowSearchText(row).includes(normalizedQuery))
  }, [searchQuery, sortedOpenRows])

  useEffect(() => {
    const visibleIds = new Set(filteredOpenRows.map((row) => row.eotCase.id))

    setSelectedIds((previous) => {
      const next = new Set(Array.from(previous).filter((id) => visibleIds.has(id)))
      const changed =
        previous.size !== next.size || Array.from(previous).some((id) => !visibleIds.has(id))

      return changed ? next : previous
    })
  }, [filteredOpenRows])

  const monthRange = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }, [])

  const rowCellPadding = getRowCellPadding(density)

  const stats = useMemo(
    () => ({
      totalOpen: openRows.length,
      awaitingReview: openRows.filter(
        (row) =>
          row.eotCase.workflow_status === 'recommendation_drafted' ||
          row.eotCase.workflow_status === 'needs_manual_review'
      ).length,
      evidencePending: openRows.filter((row) =>
        ['evidence_pending', 'evidence_ready'].includes(row.eotCase.workflow_status)
      ).length,
      stuckCases: openRows.filter(
        (row) => getStuckState(row.eotCase.workflow_status, row.eotCase.updated_at) === 'stuck'
      ).length,
      closedThisMonth: rows.filter(
        (row) => {
          const effectiveClosedAt = row.eotCase.closed_at ?? row.eotCase.updated_at

          return (
            row.eotCase.workflow_status === 'closed' &&
            effectiveClosedAt != null &&
            effectiveClosedAt >= monthRange.start &&
            effectiveClosedAt < monthRange.end
          )
        }
      ).length,
    }),
    [monthRange.end, monthRange.start, openRows, rows]
  )

  return (
    <OperatorLayout
      pageTitle="End-of-tenancy cases"
      pageDescription="Review the active move-out queue, pick up cases awaiting manager judgement, and move approved recommendations into claim-ready output."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total EOT cases open" value={stats.totalOpen} tone="text-stone-900" />
        <StatCard label="Needs your review" value={stats.awaitingReview} tone="text-violet-700" />
        <StatCard
          label="Evidence pending"
          value={stats.evidencePending}
          tone="text-amber-700"
        />
        <StatCard label="Stuck cases" value={stats.stuckCases} tone="text-red-600" />
        <StatCard label="Closed this month" value={stats.closedThisMonth} tone="text-emerald-700" />
      </section>

      <section className="app-surface rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="app-kicker">Team load</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              Cases per operator
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Rebalance work when one operator is overloaded to keep move-out dates on track.
            </p>
          </div>
        </div>

        <div className="app-divider my-6" />

        {(() => {
          const operatorCounts = new Map<
            string,
            { name: string; count: number; stuckCount: number }
          >()
          let unassignedCount = 0
          let unassignedStuck = 0

          for (const row of openRows) {
            const stuck =
              getStuckState(row.eotCase.workflow_status, row.eotCase.updated_at) === 'stuck'
            const operatorId = row.assignedOperator?.id
            const operatorName = row.assignedOperator?.full_name || null

            if (!operatorId || !operatorName) {
              unassignedCount++
              if (stuck) unassignedStuck++
              continue
            }

            const existing = operatorCounts.get(operatorId)
            if (existing) {
              existing.count++
              if (stuck) existing.stuckCount++
            } else {
              operatorCounts.set(operatorId, {
                name: operatorName,
                count: 1,
                stuckCount: stuck ? 1 : 0,
              })
            }
          }

          const sorted = Array.from(operatorCounts.values()).sort((a, b) => b.count - a.count)
          const maxCount = Math.max(1, ...sorted.map((operator) => operator.count), unassignedCount)

          return (
            <div className="space-y-3">
              {sorted.map((operator) => (
                <div key={operator.name} className="flex items-center gap-4">
                  <p className="w-36 truncate text-sm font-medium text-stone-800">
                    {operator.name}
                  </p>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                          operator.count >= maxCount * 0.8
                            ? 'bg-red-200'
                            : operator.count >= maxCount * 0.5
                              ? 'bg-amber-200'
                              : 'bg-emerald-200'
                        }`}
                        style={{ width: `${Math.max(4, (operator.count / maxCount) * 100)}%` }}
                      />
                      <span className="relative z-10 flex h-full items-center px-3 text-xs font-semibold text-stone-700">
                        {operator.count} case{operator.count === 1 ? '' : 's'}
                        {operator.stuckCount > 0 && (
                          <span className="ml-2 text-red-600">
                            ({operator.stuckCount} stuck)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {unassignedCount > 0 && (
                <div className="flex items-center gap-4">
                  <p className="w-36 truncate text-sm font-medium italic text-stone-500">
                    Unassigned
                  </p>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-stone-200"
                        style={{ width: `${Math.max(4, (unassignedCount / maxCount) * 100)}%` }}
                      />
                      <span className="relative z-10 flex h-full items-center px-3 text-xs font-semibold text-stone-500">
                        {unassignedCount} case{unassignedCount === 1 ? '' : 's'}
                        {unassignedStuck > 0 && (
                          <span className="ml-2 text-red-600">
                            ({unassignedStuck} stuck)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {sorted.length === 0 && unassignedCount === 0 && (
                <p className="text-sm text-stone-500">No active cases to display.</p>
              )}
            </div>
          )
        })()}
      </section>

      <section className="app-surface rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="app-kicker">Manager queue</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              Open cases
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              The queue is sorted by recent case activity so review work stays close to the live move-out position.
            </p>
          </div>
          <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
            {openRows.length} active cases
          </div>
        </div>

        <div className="app-divider my-6" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex-1">
              <span className="sr-only">Search cases</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by case, address, tenant, landlord, or assignee"
                className="app-field w-full rounded-full px-4 py-2.5 text-sm text-stone-700 placeholder:text-stone-400"
              />
            </label>
            <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  density === 'comfortable'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  density === 'compact'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
          <p className="text-xs text-stone-500">Showing the most recent 250 cases.</p>
        </div>

        <div className="app-divider my-6" />

        {error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <SkeletonTable density={density} />
        ) : filteredOpenRows.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-stone-300 bg-stone-50/80 px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-stone-900">
              {searchQuery.trim()
                ? 'No cases match your search'
                : 'No active end-of-tenancy cases'}
            </h3>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              {searchQuery.trim()
                ? 'Try a different search term or refresh the queue to check for new case activity.'
                : 'New EOT workspaces will appear here as soon as a case is opened for move-out review.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-700"
                >
                  Clear search
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void loadCases()}
                className="app-primary-button rounded-full px-4 py-2 text-sm font-medium"
              >
                Refresh queue
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={
                        filteredOpenRows.length > 0 && selectedIds.size === filteredOpenRows.length
                      }
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds(new Set(filteredOpenRows.map((row) => row.eotCase.id)))
                        } else {
                          setSelectedIds(new Set())
                        }
                      }}
                      className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                    />
                  </th>
                  <th className="px-3 py-2">Case ref</th>
                  <th className="px-3 py-2">Property address</th>
                  <th className="px-3 py-2">Tenant name</th>
                  <th className="px-3 py-2">Move-out date</th>
                  <th className="px-3 py-2">Workflow status</th>
                  <th className="px-3 py-2">In status</th>
                  <th className="px-3 py-2">Inspection</th>
                  <th className="px-3 py-2">Assigned to</th>
                  <th className="px-3 py-2">Last activity</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filteredOpenRows.map((row) => (
                  <tr
                    key={row.eotCase.id}
                    className="rounded-[1.4rem] border border-stone-200 bg-white shadow-sm"
                  >
                    <td className={`w-10 rounded-l-[1.4rem] ${rowCellPadding}`}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.eotCase.id)}
                        onChange={(event) => {
                          setSelectedIds((previous) => {
                            const next = new Set(previous)
                            if (event.target.checked) {
                              next.add(row.eotCase.id)
                            } else {
                              next.delete(row.eotCase.id)
                            }
                            return next
                          })
                        }}
                        className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                      />
                    </td>
                    <td className={`${rowCellPadding} text-sm font-semibold text-stone-900`}>
                      {row.case?.case_number || 'Unnumbered'}
                    </td>
                    <td className={`group relative cursor-default ${rowCellPadding} text-sm text-stone-700`}>
                      <span>{buildAddress(row.property)}</span>
                      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-72 rounded-[1.2rem] border border-stone-200 bg-white p-4 shadow-xl group-hover:block">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                          Quick view
                        </p>
                        <div className="mt-2 space-y-2 text-xs text-stone-600">
                          <p>
                            <span className="font-medium text-stone-800">Tenant:</span>{' '}
                            {row.tenant?.full_name || 'Unknown'}
                          </p>
                          <p>
                            <span className="font-medium text-stone-800">Landlord:</span>{' '}
                            {row.landlord?.full_name || 'Unknown'}
                          </p>
                          <p>
                            <span className="font-medium text-stone-800">Status:</span>{' '}
                            {formatWorkflowLabel(row.eotCase.workflow_status)}
                          </p>
                          <p>
                            <span className="font-medium text-stone-800">Last activity:</span>{' '}
                            {formatRelativeTime(
                              row.case?.last_activity_at || row.case?.updated_at
                            )}
                          </p>
                          <p>
                            <span className="font-medium text-stone-800">Move-out:</span>{' '}
                            {formatDate(row.eotCase.move_out_date || row.tenancy?.end_date)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${rowCellPadding} text-sm text-stone-700`}>
                      {row.tenant?.full_name || 'Unknown tenant'}
                    </td>
                    <td className={`${rowCellPadding} text-sm text-stone-700`}>
                      {formatDate(row.eotCase.move_out_date || row.tenancy?.end_date)}
                    </td>
                    <td className={`${rowCellPadding} text-sm`}>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getWorkflowTone(row.eotCase.workflow_status)}`}
                      >
                        {formatWorkflowLabel(row.eotCase.workflow_status)}
                      </span>
                    </td>
                    <td className={`${rowCellPadding} text-sm`}>
                      {(() => {
                        const days = getDaysInStatus(row.eotCase.updated_at)
                        const stuck = getStuckState(
                          row.eotCase.workflow_status,
                          row.eotCase.updated_at
                        )
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 ${getStuckTone(stuck)}`}
                          >
                            {stuck === 'stuck' && (
                              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                            )}
                            {stuck === 'aging' && (
                              <span className="h-2 w-2 rounded-full bg-amber-400" />
                            )}
                            {days !== null ? `${days}d` : '—'}
                          </span>
                        )
                      })()}
                    </td>
                    <td className={`${rowCellPadding} text-sm`}>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getInspectionTone(row.eotCase.inspection_status)}`}
                      >
                        {formatInspectionLabel(row.eotCase.inspection_status)}
                      </span>
                    </td>
                    <td className={`${rowCellPadding} text-sm text-stone-700`}>
                      {row.assignedOperator?.full_name || 'Unassigned'}
                    </td>
                    <td className={`${rowCellPadding} text-sm text-stone-500`}>
                      {formatRelativeTime(
                        row.case?.last_activity_at ||
                          row.case?.updated_at ||
                          row.eotCase.updated_at
                      )}
                    </td>
                    <td className={`rounded-r-[1.4rem] ${rowCellPadding} text-right`}>
                      <Link
                        href={`/cases/${row.case?.id || row.eotCase.case_id}`}
                        className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium text-stone-700"
                      >
                        Open case
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedIds.size > 0 && (
              <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-4 rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4 shadow-lg">
                <p className="text-sm font-medium text-stone-700">
                  {selectedIds.size} case{selectedIds.size === 1 ? '' : 's'} selected
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={async () => {
                      setBulkLoading(true)
                      try {
                        await Promise.all(
                          Array.from(selectedIds).map((id) =>
                            endOfTenancyApiRequest(`/api/eot/cases/${id}`, {
                              method: 'POST',
                              body: JSON.stringify({
                                action: 'mark_needs_manual_review',
                                note: 'Bulk flagged for manual review',
                              }),
                            })
                          )
                        )
                        setSelectedIds(new Set())
                        const queueRows = await refreshQueue()
                        setRows(queueRows)
                      } catch {
                        // Silently handle — individual errors are acceptable.
                      } finally {
                        setBulkLoading(false)
                      }
                    }}
                    className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
                  >
                    {bulkLoading ? 'Processing...' : 'Flag for review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-full px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </OperatorLayout>
  )
}
