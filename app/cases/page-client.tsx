'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  created_at: string | null
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
const QUEUE_VIEW_STATE_STORAGE_KEY = 'eot-dashboard-queue-view'
const STUCK_THRESHOLDS_HOURS: Record<string, number> = {
  evidence_pending: 48,
  evidence_ready: 48,
  review_pending: 48,
  recommendation_drafted: 48,
  needs_manual_review: 24,
}
const SORT_KEYS = [
  'default',
  'caseRef',
  'propertyAddress',
  'tenantName',
  'moveOutDate',
  'workflowStatus',
  'inStatus',
  'inspection',
  'assignedTo',
  'lastActivity',
] as const

type QueueSortKey = (typeof SORT_KEYS)[number]
type SortDirection = 'asc' | 'desc'

type SavedQueueViewState = {
  searchQuery?: string
  workflowFilter?: string
  sortKey?: QueueSortKey
  sortDirection?: SortDirection
  scrollY?: number
}

const SORT_DEFAULT_DIRECTIONS: Record<Exclude<QueueSortKey, 'default'>, SortDirection> = {
  caseRef: 'asc',
  propertyAddress: 'asc',
  tenantName: 'asc',
  moveOutDate: 'asc',
  workflowStatus: 'asc',
  inStatus: 'desc',
  inspection: 'asc',
  assignedTo: 'asc',
  lastActivity: 'desc',
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

function getStatusBaseline(
  workflowStatus: string | null,
  createdAt: string | null | undefined,
  updatedAt: string | null | undefined
) {
  if (!workflowStatus) return updatedAt || createdAt || null

  if (workflowStatus === 'evidence_pending') {
    return createdAt || updatedAt || null
  }

  return updatedAt || createdAt || null
}

function getDaysInStatus(
  workflowStatus: string | null,
  createdAt: string | null | undefined,
  updatedAt: string | null | undefined
) {
  const baseline = getStatusBaseline(workflowStatus, createdAt, updatedAt)
  if (!baseline) return null
  const diffMs = Date.now() - new Date(baseline).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getStuckState(
  workflowStatus: string | null,
  createdAt: string | null | undefined,
  updatedAt: string | null | undefined
): 'stuck' | 'aging' | 'ok' {
  const baseline = getStatusBaseline(workflowStatus, createdAt, updatedAt)
  if (!baseline || !workflowStatus) return 'ok'
  const diffHours = (Date.now() - new Date(baseline).getTime()) / (1000 * 60 * 60)
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

function getEffectiveMoveOutDate(row: QueueRow) {
  return row.eotCase.move_out_date || row.tenancy?.end_date || null
}

function isUnassigned(row: QueueRow) {
  return !row.assignedOperator?.full_name?.trim()
}

function isOverdueMoveOut(row: QueueRow) {
  const moveOutDate = getEffectiveMoveOutDate(row)
  if (!moveOutDate) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return new Date(moveOutDate).getTime() < today.getTime()
}

function isAwaitingReview(row: QueueRow) {
  return (
    row.eotCase.workflow_status === 'recommendation_drafted' ||
    row.eotCase.workflow_status === 'needs_manual_review'
  )
}

function isEvidencePending(row: QueueRow) {
  return ['evidence_pending', 'evidence_ready'].includes(row.eotCase.workflow_status)
}

function isStuckRow(row: QueueRow) {
  return (
    getStuckState(row.eotCase.workflow_status, row.eotCase.created_at, row.eotCase.updated_at) ===
    'stuck'
  )
}

function isNeedsActionToday(row: QueueRow) {
  return isStuckRow(row) || isOverdueMoveOut(row)
}

function isAssigneeFilter(value: string) {
  return value.startsWith('assignee:')
}

function getLastActivityValue(row: QueueRow) {
  return row.case?.last_activity_at || row.case?.updated_at || row.eotCase.updated_at
}

function getLastActivityState(value: string | null | undefined) {
  if (!value) return 'ok'

  const diffHours = (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60)

  if (diffHours >= 120) return 'stale'
  if (diffHours >= 72) return 'aging'
  return 'ok'
}

function getLastActivityTone(state: 'stale' | 'aging' | 'ok') {
  switch (state) {
    case 'stale':
      return 'text-red-600 font-medium'
    case 'aging':
      return 'text-amber-600 font-medium'
    default:
      return 'text-stone-500'
  }
}

function matchesQueueFilter(row: QueueRow, filterValue: string) {
  switch (filterValue) {
    case 'all':
      return true
    case 'awaiting_review':
      return isAwaitingReview(row)
    case 'evidence_pending':
      return isEvidencePending(row)
    case 'stuck':
      return isStuckRow(row)
    case 'unassigned':
      return isUnassigned(row)
    case 'overdue_move_out':
      return isOverdueMoveOut(row)
    case 'needs_action_today':
      return isNeedsActionToday(row)
    default:
      if (isAssigneeFilter(filterValue)) {
        return row.assignedOperator?.id === filterValue.slice('assignee:'.length)
      }

      return false
  }
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

function isValidSortKey(value: string): value is QueueSortKey {
  return SORT_KEYS.includes(value as QueueSortKey)
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, 'en-GB', { numeric: true, sensitivity: 'base' })
}

function getQueueRowHref(row: QueueRow) {
  return `/cases/${row.case?.id || row.eotCase.case_id}`
}

function getComparableValue(row: QueueRow, sortKey: Exclude<QueueSortKey, 'default'>) {
  switch (sortKey) {
    case 'caseRef':
      return row.case?.case_number || ''
    case 'propertyAddress':
      return buildAddress(row.property)
    case 'tenantName':
      return row.tenant?.full_name || ''
    case 'moveOutDate':
      return getEffectiveMoveOutDate(row) || ''
    case 'workflowStatus':
      return formatWorkflowLabel(row.eotCase.workflow_status)
    case 'inStatus':
      return (
        getDaysInStatus(
          row.eotCase.workflow_status,
          row.eotCase.created_at,
          row.eotCase.updated_at
        ) ?? -1
      )
    case 'inspection':
      return formatInspectionLabel(row.eotCase.inspection_status)
    case 'assignedTo':
      return row.assignedOperator?.full_name || 'Unassigned'
    case 'lastActivity':
      return row.case?.last_activity_at || row.case?.updated_at || row.case?.created_at || ''
  }
}

function sortQueueRows(
  rows: QueueRow[],
  sortKey: QueueSortKey,
  sortDirection: SortDirection,
  fallbackOrder: Map<string, number>
) {
  if (sortKey === 'default') {
    return rows
  }

  const directionMultiplier = sortDirection === 'asc' ? 1 : -1

  return [...rows].sort((left, right) => {
    const leftValue = getComparableValue(left, sortKey)
    const rightValue = getComparableValue(right, sortKey)
    const leftMissing = leftValue === '' || leftValue === null
    const rightMissing = rightValue === '' || rightValue === null

    if (leftMissing && !rightMissing) return 1
    if (!leftMissing && rightMissing) return -1

    let comparison = 0

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      comparison = leftValue - rightValue
    } else {
      comparison = compareText(String(leftValue), String(rightValue))
    }

    if (comparison !== 0) {
      return comparison * directionMultiplier
    }

    return (
      (fallbackOrder.get(left.eotCase.id) ?? Number.MAX_SAFE_INTEGER) -
      (fallbackOrder.get(right.eotCase.id) ?? Number.MAX_SAFE_INTEGER)
    )
  })
}

function getSortIndicator(sortKey: QueueSortKey, activeSortKey: QueueSortKey, direction: SortDirection) {
  if (sortKey !== activeSortKey) return '↕'
  return direction === 'asc' ? '↑' : '↓'
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
  const router = useRouter()
  const initialRows = mapListItemsToQueueRows(initialItems ?? [])

  const [rows, setRows] = useState<QueueRow[]>(initialRows)
  const [loading, setLoading] = useState(initialItems === undefined)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable')
  const [densityHydrated, setDensityHydrated] = useState(false)
  const [workflowFilter, setWorkflowFilter] = useState('all')
  const [sortKey, setSortKey] = useState<QueueSortKey>('default')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const restoredScrollRef = useRef<number | null>(null)

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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedState = window.sessionStorage.getItem(QUEUE_VIEW_STATE_STORAGE_KEY)

    if (!savedState) return

    window.sessionStorage.removeItem(QUEUE_VIEW_STATE_STORAGE_KEY)

    try {
      const parsed = JSON.parse(savedState) as SavedQueueViewState

      if (typeof parsed.searchQuery === 'string') {
        setSearchQuery(parsed.searchQuery)
      }

      if (typeof parsed.workflowFilter === 'string') {
        setWorkflowFilter(parsed.workflowFilter)
      }

      if (typeof parsed.sortKey === 'string' && isValidSortKey(parsed.sortKey)) {
        setSortKey(parsed.sortKey)
      }

      if (parsed.sortDirection === 'asc' || parsed.sortDirection === 'desc') {
        setSortDirection(parsed.sortDirection)
      }

      if (
        typeof parsed.scrollY === 'number' &&
        Number.isFinite(parsed.scrollY) &&
        parsed.scrollY >= 0
      ) {
        restoredScrollRef.current = parsed.scrollY
      }
    } catch {
      // Ignore invalid sessionStorage state.
    }
  }, [])

  const openRows = useMemo(
    () => rows.filter((row) => (row.case?.status || '').toLowerCase() !== 'closed'),
    [rows]
  )

  const baselineOpenRows = useMemo(() => {
    return [...openRows].sort((left, right) => {
      const leftStuck = getStuckState(
        left.eotCase.workflow_status,
        left.eotCase.created_at,
        left.eotCase.updated_at
      )
      const rightStuck = getStuckState(
        right.eotCase.workflow_status,
        right.eotCase.created_at,
        right.eotCase.updated_at
      )
      const stuckOrder = { stuck: 0, aging: 1, ok: 2 }
      const stuckDiff = stuckOrder[leftStuck] - stuckOrder[rightStuck]
      if (stuckDiff !== 0) return stuckDiff

      const leftActivity = getLastActivityValue(left) || left.case?.created_at || ''
      const rightActivity = getLastActivityValue(right) || right.case?.created_at || ''
      return rightActivity.localeCompare(leftActivity)
    })
  }, [openRows])

  const searchFilteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return baselineOpenRows
    }

    return baselineOpenRows.filter((row) => getRowSearchText(row).includes(normalizedQuery))
  }, [baselineOpenRows, searchQuery])

  const filteredRows = useMemo(() => {
    if (workflowFilter === 'all') {
      return searchFilteredRows
    }

    return searchFilteredRows.filter((row) => matchesQueueFilter(row, workflowFilter))
  }, [searchFilteredRows, workflowFilter])

  const defaultOrderMap = useMemo(
    () =>
      new Map(baselineOpenRows.map((row, index) => [row.eotCase.id, index] as const)),
    [baselineOpenRows]
  )

  const displayRows = useMemo(
    () => sortQueueRows(filteredRows, sortKey, sortDirection, defaultOrderMap),
    [defaultOrderMap, filteredRows, sortDirection, sortKey]
  )

  const teamLoadEntries = useMemo(() => {
    const operatorCounts = new Map<
      string,
      { id: string; label: string; count: number; stuckCount: number }
    >()
    let unassignedCount = 0
    let unassignedStuck = 0

    for (const row of openRows) {
      if (isUnassigned(row)) {
        unassignedCount++
        if (isStuckRow(row)) {
          unassignedStuck++
        }
        continue
      }

      const operatorId = row.assignedOperator?.id
      const operatorName = row.assignedOperator?.full_name?.trim()

      if (!operatorId || !operatorName) continue

      const existing = operatorCounts.get(operatorId)
      if (existing) {
        existing.count++
        if (isStuckRow(row)) {
          existing.stuckCount++
        }
      } else {
        operatorCounts.set(operatorId, {
          id: operatorId,
          label: operatorName,
          count: 1,
          stuckCount: isStuckRow(row) ? 1 : 0,
        })
      }
    }

    const operatorEntries = Array.from(operatorCounts.values())
      .sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count
        return compareText(left.label, right.label)
      })
      .map((entry) => ({
        key: entry.id,
        label: entry.label,
        count: entry.count,
        stuckCount: entry.stuckCount,
        filterValue: `assignee:${entry.id}`,
        tone: 'stone' as const,
      }))

    return [
      ...(unassignedCount > 0
        ? [
            {
              key: 'unassigned',
              label: 'Unassigned',
              count: unassignedCount,
              stuckCount: unassignedStuck,
              filterValue: 'unassigned',
              tone: 'amber' as const,
            },
          ]
        : []),
      ...operatorEntries,
    ]
  }, [openRows])

  useEffect(() => {
    const visibleIds = new Set(displayRows.map((row) => row.eotCase.id))

    setSelectedIds((previous) => {
      const next = new Set(Array.from(previous).filter((id) => visibleIds.has(id)))
      const changed =
        previous.size !== next.size || Array.from(previous).some((id) => !visibleIds.has(id))

      return changed ? next : previous
    })
  }, [displayRows])

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

  const saveQueueViewState = useCallback(() => {
    if (typeof window === 'undefined') return

    const nextState: SavedQueueViewState = {
      searchQuery,
      workflowFilter,
      sortKey,
      sortDirection,
      scrollY: window.scrollY,
    }

    window.sessionStorage.setItem(QUEUE_VIEW_STATE_STORAGE_KEY, JSON.stringify(nextState))
  }, [searchQuery, sortDirection, sortKey, workflowFilter])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = () => {
      saveQueueViewState()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      saveQueueViewState()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [saveQueueViewState])

  useEffect(() => {
    if (typeof window === 'undefined' || restoredScrollRef.current === null || loading) return

    const nextScrollY = restoredScrollRef.current
    restoredScrollRef.current = null

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: nextScrollY, behavior: 'auto' })
    })
  }, [loading])

  const stats = useMemo(
    () => ({
      totalOpen: openRows.length,
      awaitingReview: openRows.filter((row) => isAwaitingReview(row)).length,
      evidencePending: openRows.filter((row) => isEvidencePending(row)).length,
      stuckCases: openRows.filter((row) => isStuckRow(row)).length,
      unassigned: openRows.filter((row) => isUnassigned(row)).length,
      overdueMoveOut: openRows.filter((row) => isOverdueMoveOut(row)).length,
      needsActionToday: openRows.filter((row) => isNeedsActionToday(row)).length,
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

  const summaryLine = useMemo(() => {
    if (stats.stuckCases > 0) {
      return `${stats.totalOpen} active · ${stats.stuckCases} stuck · ${stats.unassigned} unassigned`
    }

    if (stats.overdueMoveOut > 0) {
      return `${stats.totalOpen} active · ${stats.overdueMoveOut} overdue move-out · ${stats.unassigned} unassigned`
    }

    return `${stats.totalOpen} active · ${stats.evidencePending} awaiting evidence · ${stats.unassigned} unassigned`
  }, [stats.evidencePending, stats.overdueMoveOut, stats.stuckCases, stats.totalOpen, stats.unassigned])

  const kpiChips = useMemo(
    () => [
      { value: 'all', label: 'All', count: stats.totalOpen, tone: 'neutral' as const },
      {
        value: 'awaiting_review',
        label: 'Awaiting review',
        count: stats.awaitingReview,
        tone: 'review' as const,
      },
      {
        value: 'evidence_pending',
        label: 'Evidence pending',
        count: stats.evidencePending,
        tone: 'pending' as const,
      },
      { value: 'stuck', label: 'Stuck', count: stats.stuckCases, tone: 'danger' as const },
      {
        value: 'unassigned',
        label: 'Unassigned',
        count: stats.unassigned,
        tone: 'warning' as const,
      },
      {
        value: 'overdue_move_out',
        label: 'Overdue move-out',
        count: stats.overdueMoveOut,
        tone: 'danger' as const,
      },
    ],
    [
      stats.awaitingReview,
      stats.evidencePending,
      stats.overdueMoveOut,
      stats.stuckCases,
      stats.totalOpen,
      stats.unassigned,
    ]
  )

  const presetOptions = useMemo(
    () => [
      {
        value: 'needs_action_today',
        label: 'Needs action today',
        count: stats.needsActionToday,
      },
      { value: 'stuck', label: 'Stuck', count: stats.stuckCases },
      { value: 'overdue_move_out', label: 'Overdue', count: stats.overdueMoveOut },
      { value: 'unassigned', label: 'Unassigned', count: stats.unassigned },
    ],
    [stats.needsActionToday, stats.overdueMoveOut, stats.stuckCases, stats.unassigned]
  )

  const validFilterValues = useMemo(
    () =>
      new Set([
        ...kpiChips.map((chip) => chip.value),
        ...presetOptions.map((preset) => preset.value),
        ...teamLoadEntries.map((entry) => entry.filterValue),
      ]),
    [kpiChips, presetOptions, teamLoadEntries]
  )

  useEffect(() => {
    if (loading) return
    if (workflowFilter === 'all') return

    if (!validFilterValues.has(workflowFilter)) {
      setWorkflowFilter('all')
    }
  }, [loading, validFilterValues, workflowFilter])

  const hasActiveFilters = searchQuery.trim().length > 0 || workflowFilter !== 'all'

  function handleSort(nextSortKey: Exclude<QueueSortKey, 'default'>) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextSortKey)
    setSortDirection(SORT_DEFAULT_DIRECTIONS[nextSortKey])
  }

  function handleOpenCase(row: QueueRow) {
    saveQueueViewState()
    router.push(getQueueRowHref(row))
  }

  return (
    <OperatorLayout
      pageTitle="Cases"
      pageDescription="Review the active end-of-tenancy queue, pick up work awaiting manager judgement, and move approved recommendations into claim-ready output."
    >
      <section className="sticky top-4 z-20 mb-5">
        <div className="rounded-[2rem] border border-stone-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85 md:px-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div>
              <p className="app-kicker">Manager triage</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                Open cases
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">{summaryLine}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {kpiChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setWorkflowFilter(chip.value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      workflowFilter === chip.value
                        ? chip.tone === 'danger'
                          ? 'border-red-600 bg-red-600 text-white'
                          : chip.tone === 'pending'
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : chip.tone === 'review'
                              ? 'border-violet-600 bg-violet-600 text-white'
                              : chip.tone === 'warning'
                                ? 'border-amber-700 bg-amber-700 text-white'
                                : 'border-stone-900 bg-stone-900 text-white'
                        : chip.tone === 'danger'
                          ? 'border-red-200 bg-red-50 text-red-700 hover:border-red-300'
                          : chip.tone === 'pending'
                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'
                            : chip.tone === 'review'
                              ? 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300'
                              : chip.tone === 'warning'
                                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'
                                : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className="font-semibold">{chip.count}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Presets
                </span>
                {presetOptions.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setWorkflowFilter(preset.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      workflowFilter === preset.value
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="font-semibold">{preset.count}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
                  <div className="inline-flex shrink-0 rounded-full border border-stone-200 bg-stone-50 p-1">
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
                  <span className="inline-flex shrink-0 items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600">
                    {displayRows.length === openRows.length
                      ? `${openRows.length} active`
                      : `${displayRows.length} of ${openRows.length}`}
                  </span>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setWorkflowFilter('all')
                      }}
                      className="inline-flex shrink-0 items-center rounded-full px-3 py-2 text-xs font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
                    >
                      Clear filters
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-stone-500 xl:shrink-0">
                  Showing the most recent 250 cases.
                </p>
              </div>
            </div>

            <aside className="rounded-[1.4rem] border border-stone-200 bg-stone-50/90 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Team load
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Click a lane to focus the queue by assignee.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {teamLoadEntries.length > 0 ? (
                  teamLoadEntries.map((entry) => (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={() => setWorkflowFilter(entry.filterValue)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        workflowFilter === entry.filterValue
                          ? entry.tone === 'amber'
                            ? 'border-amber-700 bg-amber-700 text-white'
                            : 'border-stone-900 bg-stone-900 text-white'
                          : entry.tone === 'amber'
                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <span className="max-w-[11rem] truncate">{entry.label}</span>
                      <span className="font-semibold">{entry.count}</span>
                      {entry.stuckCount > 0 ? (
                        <span
                          className={`text-xs ${
                            workflowFilter === entry.filterValue ? 'text-white/85' : 'text-red-600'
                          }`}
                        >
                          • {entry.stuckCount}
                        </span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-stone-500">No active cases to rebalance.</span>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[2rem] p-4 md:p-5">
        {error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <SkeletonTable density={density} />
        ) : displayRows.length === 0 ? (
          <div
            className={`rounded-[1.6rem] px-6 py-12 text-center ${
              hasActiveFilters
                ? 'border border-dashed border-stone-300 bg-stone-50/80'
                : 'border border-emerald-200 bg-emerald-50/80'
            }`}
          >
            <h3
              className={`text-lg font-semibold ${
                hasActiveFilters ? 'text-stone-900' : 'text-emerald-900'
              }`}
            >
              {hasActiveFilters ? 'No cases match your current filters' : 'Queue is clear'}
            </h3>
            <p
              className={`mt-3 text-sm leading-6 ${
                hasActiveFilters ? 'text-stone-500' : 'text-emerald-800/80'
              }`}
            >
              {hasActiveFilters
                ? 'Try clearing your search or triage filters, or refresh the queue to check for new case activity.'
                : 'There are no open end-of-tenancy cases needing attention right now.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setWorkflowFilter('all')
                  }}
                  className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-700"
                >
                  Clear filters
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
                        displayRows.length > 0 && selectedIds.size === displayRows.length
                      }
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds(new Set(displayRows.map((row) => row.eotCase.id)))
                        } else {
                          setSelectedIds(new Set())
                        }
                      }}
                      className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                    />
                  </th>
                  <th
                    className="px-3 py-2"
                    aria-sort={
                      sortKey === 'caseRef'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('caseRef')}
                      className="inline-flex items-center gap-1 hover:text-stone-700"
                    >
                      <span>Case ref</span>
                      <span aria-hidden="true">{getSortIndicator('caseRef', sortKey, sortDirection)}</span>
                    </button>
                  </th>
                  <th
                    className="px-3 py-2"
                    aria-sort={
                      sortKey === 'propertyAddress'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('propertyAddress')}
                      className="inline-flex items-center gap-1 hover:text-stone-700"
                    >
                      <span>Property address</span>
                      <span aria-hidden="true">{getSortIndicator('propertyAddress', sortKey, sortDirection)}</span>
                    </button>
                  </th>
                  <th
                    className="px-3 py-2"
                    aria-sort={
                      sortKey === 'tenantName'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('tenantName')}
                      className="inline-flex items-center gap-1 hover:text-stone-700"
                    >
                      <span>Tenant name</span>
                      <span aria-hidden="true">{getSortIndicator('tenantName', sortKey, sortDirection)}</span>
                    </button>
                  </th>
                  <th
                    className="px-3 py-2"
                    aria-sort={
                      sortKey === 'moveOutDate'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('moveOutDate')}
                      className="inline-flex items-center gap-1 hover:text-stone-700"
                    >
                      <span>Move-out date</span>
                      <span aria-hidden="true">{getSortIndicator('moveOutDate', sortKey, sortDirection)}</span>
                    </button>
                  </th>
                  <th
                    className="px-3 py-2"
                    aria-sort={
                      sortKey === 'workflowStatus'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('workflowStatus')}
                      className="inline-flex items-center gap-1 hover:text-stone-700"
                    >
                      <span>Workflow status</span>
                      <span aria-hidden="true">{getSortIndicator('workflowStatus', sortKey, sortDirection)}</span>
                    </button>
                  </th>
                  <th
                    className="px-3 py-2"
                    aria-sort={
                      sortKey === 'inStatus'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('inStatus')}
                      className="inline-flex items-center gap-1 hover:text-stone-700"
                    >
                      <span>In status</span>
                      <span aria-hidden="true">{getSortIndicator('inStatus', sortKey, sortDirection)}</span>
                    </button>
                  </th>
                  <th
                    className="px-3 py-2"
                    aria-sort={
                      sortKey === 'inspection'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('inspection')}
                      className="inline-flex items-center gap-1 hover:text-stone-700"
                    >
                      <span>Inspection</span>
                      <span aria-hidden="true">{getSortIndicator('inspection', sortKey, sortDirection)}</span>
                    </button>
                  </th>
                  <th
                    className="px-3 py-2"
                    aria-sort={
                      sortKey === 'assignedTo'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('assignedTo')}
                      className="inline-flex items-center gap-1 hover:text-stone-700"
                    >
                      <span>Assigned to</span>
                      <span aria-hidden="true">{getSortIndicator('assignedTo', sortKey, sortDirection)}</span>
                    </button>
                  </th>
                  <th
                    className="px-3 py-2"
                    aria-sort={
                      sortKey === 'lastActivity'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('lastActivity')}
                      className="inline-flex items-center gap-1 hover:text-stone-700"
                    >
                      <span>Last activity</span>
                      <span aria-hidden="true">{getSortIndicator('lastActivity', sortKey, sortDirection)}</span>
                    </button>
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => {
                  const overdueMoveOut = isOverdueMoveOut(row)
                  const stuckState = getStuckState(
                    row.eotCase.workflow_status,
                    row.eotCase.created_at,
                    row.eotCase.updated_at
                  )
                  const daysInStatus = getDaysInStatus(
                    row.eotCase.workflow_status,
                    row.eotCase.created_at,
                    row.eotCase.updated_at
                  )
                  const lastActivityValue = getLastActivityValue(row)
                  const lastActivityState = getLastActivityState(lastActivityValue)
                  const assignedName = row.assignedOperator?.full_name?.trim() || null
                  const rowTone =
                    stuckState === 'stuck' || overdueMoveOut
                      ? 'border-red-200 bg-red-50/20'
                      : !assignedName
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-stone-200 bg-white'

                  return (
                    <tr
                      key={row.eotCase.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => handleOpenCase(row)}
                      onKeyDown={(event) => {
                        const target = event.target as HTMLElement

                        if (target.closest('a, button, input, label')) return

                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleOpenCase(row)
                        }
                      }}
                      className={`cursor-pointer rounded-[1.4rem] border shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-stone-300 ${rowTone}`}
                    >
                      <td className={`w-10 rounded-l-[1.4rem] ${rowCellPadding}`}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.eotCase.id)}
                          onClick={(event) => event.stopPropagation()}
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
                      <td
                        className={`group relative cursor-default ${rowCellPadding} text-sm text-stone-700`}
                      >
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
                              {formatRelativeTime(lastActivityValue)}
                            </p>
                            <p>
                              <span className="font-medium text-stone-800">Move-out:</span>{' '}
                              {formatDate(getEffectiveMoveOutDate(row))}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`${rowCellPadding} text-sm text-stone-700`}>
                        {row.tenant?.full_name || 'Unknown tenant'}
                      </td>
                      <td
                        className={`${rowCellPadding} text-sm ${overdueMoveOut ? 'text-red-700' : 'text-stone-700'}`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className={overdueMoveOut ? 'font-semibold' : undefined}>
                            {formatDate(getEffectiveMoveOutDate(row))}
                          </span>
                          {overdueMoveOut ? (
                            <span className="inline-flex w-fit rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                              Overdue
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className={`${rowCellPadding} text-sm`}>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getWorkflowTone(row.eotCase.workflow_status)}`}
                        >
                          {formatWorkflowLabel(row.eotCase.workflow_status)}
                        </span>
                      </td>
                      <td className={`${rowCellPadding} text-sm`}>
                        <span
                          className={`inline-flex items-center gap-1.5 ${getStuckTone(stuckState)}`}
                        >
                          {stuckState === 'stuck' && (
                            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                          )}
                          {stuckState === 'aging' && (
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                          )}
                          {daysInStatus !== null ? `${daysInStatus}d` : '—'}
                        </span>
                      </td>
                      <td className={`${rowCellPadding} text-sm`}>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getInspectionTone(row.eotCase.inspection_status)}`}
                        >
                          {formatInspectionLabel(row.eotCase.inspection_status)}
                        </span>
                      </td>
                      <td className={`${rowCellPadding} text-sm`}>
                        {assignedName ? (
                          <span className="text-stone-700">{assignedName}</span>
                        ) : (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td
                        className={`${rowCellPadding} text-sm ${getLastActivityTone(lastActivityState)}`}
                      >
                        {formatRelativeTime(lastActivityValue)}
                      </td>
                      <td className={`rounded-r-[1.4rem] ${rowCellPadding} text-right`}>
                        <Link
                          href={getQueueRowHref(row)}
                          onClick={(event) => {
                            event.stopPropagation()
                            saveQueueViewState()
                          }}
                          className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium text-stone-700"
                        >
                          Open case
                        </Link>
                      </td>
                    </tr>
                  )
                })}
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
