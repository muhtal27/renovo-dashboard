'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, ClipboardCopy, Copy, Plus, RefreshCcw } from 'lucide-react'
import { createEotCase, EotApiError, listEotCases } from '@/lib/eot-api'
import { byLastActivityDesc } from '@/lib/eot-dashboard'
import type {
  CreateEotCaseInput,
  EotCaseListItem,
  EotCasePriority,
  EotCaseStatus,
} from '@/lib/eot-types'
import {
  EmptyState,
  getCaseAttentionTone,
  getCaseProgress,
  SkeletonPanel,
  ToolbarPill,
  formatCurrency,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'

function buildFullAddress(property: EotCaseListItem['property']): string {
  return [
    property.address_line_1,
    property.address_line_2,
    property.city,
    property.postcode,
  ]
    .filter(Boolean)
    .join(', ')
}

function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)

  if (!address) return null

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void navigator.clipboard.writeText(address).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="ml-2 inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-zinc-700"
      title="Copy address"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <ClipboardCopy className="h-3 w-3" />
      )}
    </button>
  )
}

const CASE_PRIORITIES: EotCasePriority[] = ['low', 'medium', 'high']
const CASE_STATUSES: EotCaseStatus[] = [
  'draft',
  'collecting_evidence',
  'analysis',
  'review',
  'ready_for_claim',
  'submitted',
  'disputed',
  'resolved',
]

const CASE_LIST_CACHE_TTL_MS = 30_000

let cachedCaseList: EotCaseListItem[] | null = null
let cachedCaseListAt = 0
let inFlightCaseListRequest: Promise<EotCaseListItem[]> | null = null

function primeCaseListCache(cases: EotCaseListItem[] | null | undefined) {
  if (!cases?.length) {
    return
  }

  cachedCaseList = cases
  cachedCaseListAt = Date.now()
}

type CreateCaseFormState = {
  propertyId: string
  summary: string
  priority: EotCasePriority
  status: EotCaseStatus
  tenantName: string
  tenantEmail: string
  startDate: string
  endDate: string
  depositAmount: string
  notes: string
}

type SavedView = 'all' | 'attention' | 'ready' | 'disputed' | 'recent'

type PreparedCaseRow = {
  caseItem: EotCaseListItem
  attention: ReturnType<typeof getCaseAttentionTone>
  progress: number
  searchableText: string
  isRecentlyActive: boolean
}

const DEFAULT_FORM_STATE: CreateCaseFormState = {
  propertyId: '',
  summary: '',
  priority: 'medium',
  status: 'draft',
  tenantName: '',
  tenantEmail: '',
  startDate: '',
  endDate: '',
  depositAmount: '',
  notes: '',
}

async function loadCaseList(forceRefresh = false) {
  const now = Date.now()

  if (!forceRefresh && cachedCaseList && now - cachedCaseListAt < CASE_LIST_CACHE_TTL_MS) {
    return cachedCaseList
  }

  if (!forceRefresh && inFlightCaseListRequest) {
    return inFlightCaseListRequest
  }

  const request = listEotCases()
    .then((nextCases) => {
      const sortedCases = [...nextCases].sort(byLastActivityDesc)
      cachedCaseList = sortedCases
      cachedCaseListAt = Date.now()
      return sortedCases
    })
    .finally(() => {
      if (inFlightCaseListRequest === request) {
        inFlightCaseListRequest = null
      }
    })

  inFlightCaseListRequest = request

  return request
}

export function EotCaseListClient({
  initialCases,
}: {
  initialCases?: EotCaseListItem[] | null
}) {
  primeCaseListCache(initialCases)

  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get('search')?.trim().toLowerCase() ?? ''

  const [cases, setCases] = useState<EotCaseListItem[]>(() => initialCases ?? cachedCaseList ?? [])
  const [loading, setLoading] = useState(initialCases == null && cachedCaseList === null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createPending, setCreatePending] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formState, setFormState] = useState<CreateCaseFormState>(DEFAULT_FORM_STATE)
  const [statusFilter, setStatusFilter] = useState<'all' | EotCaseStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | EotCasePriority>('all')
  const [savedView, setSavedView] = useState<SavedView>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCases() {
      if (initialCases) {
        return
      }

      const shouldRefreshInBackground = Boolean(cachedCaseList)

      if (!shouldRefreshInBackground) {
        setLoading(true)
        setError(null)
      }

      try {
        const nextCases = await loadCaseList(shouldRefreshInBackground)

        if (!cancelled) {
          setCases(nextCases)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load end-of-tenancy cases.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCases()

    return () => {
      cancelled = true
    }
  }, [initialCases])

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => cases.some((caseItem) => caseItem.id === id)))
  }, [cases])

  const preparedCaseRows = useMemo<PreparedCaseRow[]>(() => {
    const recentThresholdMs = 1000 * 60 * 60 * 24 * 2

    return cases.map((caseItem) => ({
      caseItem,
      attention: getCaseAttentionTone({
        priority: caseItem.priority,
        status: caseItem.status,
        lastActivityAt: caseItem.last_activity_at,
      }),
      progress: getCaseProgress(caseItem.status),
      searchableText: [
        caseItem.property.name,
        caseItem.property.reference ?? '',
        caseItem.property.address_line_1 ?? '',
        caseItem.property.city ?? '',
        caseItem.property.postcode ?? '',
        caseItem.tenant_name,
        caseItem.landlord_name ?? '',
        caseItem.deposit_scheme ?? '',
        caseItem.status,
        caseItem.priority,
        caseItem.id,
      ]
        .join(' ')
        .toLowerCase(),
      isRecentlyActive:
        Date.now() - new Date(caseItem.last_activity_at).getTime() <= recentThresholdMs,
    }))
  }, [cases])

  const visibleCaseRows = useMemo(() => {
    return preparedCaseRows.filter(({ attention, caseItem, isRecentlyActive, searchableText }) => {
      if (search) {
        if (!searchableText.includes(search)) {
          return false
        }
      }

      if (statusFilter !== 'all' && caseItem.status !== statusFilter) {
        return false
      }

      if (priorityFilter !== 'all' && caseItem.priority !== priorityFilter) {
        return false
      }

      if (savedView === 'attention' && attention.label !== 'High attention') {
        return false
      }

      if (savedView === 'ready' && caseItem.status !== 'ready_for_claim') {
        return false
      }

      if (savedView === 'disputed' && caseItem.status !== 'disputed') {
        return false
      }

      if (savedView === 'recent') {
        if (!isRecentlyActive) {
          return false
        }
      }

      return true
    })
  }, [preparedCaseRows, priorityFilter, savedView, search, statusFilter])

  const stats = useMemo(() => {
    const readyForClaim = preparedCaseRows.filter(
      ({ caseItem }) => caseItem.status === 'ready_for_claim'
    ).length
    const highPriority = preparedCaseRows.filter(({ caseItem }) => caseItem.priority === 'high').length
    const requiringAttention = preparedCaseRows.filter(
      ({ attention }) => attention.label === 'High attention'
    ).length

    return {
      total: preparedCaseRows.length,
      readyForClaim,
      highPriority,
      requiringAttention,
    }
  }, [preparedCaseRows])

  async function refreshCases() {
    setRefreshing(true)

    try {
      const nextCases = await loadCaseList(true)
      setCases(nextCases)
      setError(null)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh cases.')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleCreateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (createPending) return

    if (!formState.propertyId.trim()) {
      setCreateError('Property ID is required.')
      return
    }

    if (!formState.tenantName.trim()) {
      setCreateError('Tenant name is required.')
      return
    }

    setCreatePending(true)
    setCreateError(null)

    const payload: CreateEotCaseInput = {
      property_id: formState.propertyId.trim(),
      summary: formState.summary.trim() || null,
      status: formState.status,
      assigned_to: null,
      priority: formState.priority,
      tenancy: {
        tenant_name: formState.tenantName.trim(),
        tenant_email: formState.tenantEmail.trim() || null,
        start_date: formState.startDate || null,
        end_date: formState.endDate || null,
        deposit_amount: formState.depositAmount.trim() || null,
        notes: formState.notes.trim() || null,
      },
    }

    try {
      const workspace = await createEotCase(payload)
      cachedCaseList = null
      cachedCaseListAt = 0
      inFlightCaseListRequest = null
      setFormState(DEFAULT_FORM_STATE)
      setCreateOpen(false)
      router.push(`/eot/${workspace.case.id}`)
      router.refresh()
    } catch (createCaseError) {
      if (createCaseError instanceof EotApiError) {
        setCreateError(createCaseError.message)
      } else {
        setCreateError('Unable to create the checkout right now.')
      }
    } finally {
      setCreatePending(false)
    }
  }

  function toggleSelection(caseId: string) {
    setSelectedIds((current) =>
      current.includes(caseId) ? current.filter((id) => id !== caseId) : [...current, caseId]
    )
  }

  function toggleSelectAll() {
    if (selectedIds.length === visibleCaseRows.length) {
      setSelectedIds([])
      return
    }

    setSelectedIds(visibleCaseRows.map(({ caseItem }) => caseItem.id))
  }

  async function handleCopySelection() {
    if (!selectedIds.length) return
    await navigator.clipboard.writeText(selectedIds.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2 border-b border-zinc-200 pb-3">
        <button
          type="button"
          onClick={() => void refreshCases()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:text-zinc-950"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setCreateOpen((current) => !current)}
          className="inline-flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5" />
          {createOpen ? 'Close' : 'New'}
        </button>
      </div>

      {createOpen ? (
        <div className="border-b border-zinc-200 pb-4">
          <h3 className="text-sm font-semibold text-zinc-950">New checkout</h3>
          <form className="mt-3 grid gap-3" onSubmit={handleCreateCase}>
            <div className="grid gap-3 xl:grid-cols-4">
              <label className="text-sm">
                <span className="font-medium text-zinc-700">Property ID</span>
                <input
                  required
                  value={formState.propertyId}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, propertyId: event.target.value }))
                  }
                  className="mt-1 h-8 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
                  placeholder="UUID from the live property record"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-zinc-700">Tenant name</span>
                <input
                  required
                  value={formState.tenantName}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, tenantName: event.target.value }))
                  }
                  className="mt-1 h-8 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
                  placeholder="Primary tenancy contact"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-zinc-700">Tenant email</span>
                <input
                  type="email"
                  value={formState.tenantEmail}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, tenantEmail: event.target.value }))
                  }
                  className="mt-1 h-8 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
                  placeholder="tenant@example.com"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-zinc-700">Deposit amount</span>
                <input
                  value={formState.depositAmount}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, depositAmount: event.target.value }))
                  }
                  className="mt-1 h-8 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
                  placeholder="1200.00"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-zinc-700">Start date</span>
                <input
                  type="date"
                  value={formState.startDate}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className="mt-1 h-8 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-zinc-700">End date</span>
                <input
                  type="date"
                  value={formState.endDate}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className="mt-1 h-8 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-zinc-700">Priority</span>
                <select
                  value={formState.priority}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      priority: event.target.value as EotCasePriority,
                    }))
                  }
                  className="mt-1 h-8 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
                >
                  {CASE_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {formatEnumLabel(priority)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="font-medium text-zinc-700">Initial status</span>
                <select
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      status: event.target.value as EotCaseStatus,
                    }))
                  }
                  className="mt-1 h-8 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
                >
                  {CASE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatEnumLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="text-sm">
              <span className="font-medium text-zinc-700">Checkout summary</span>
              <textarea
                value={formState.summary}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, summary: event.target.value }))
                }
                className="mt-1 min-h-20 w-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900"
                placeholder="What is the tenancy-end context for this checkout?"
              />
            </label>

            <label className="text-sm">
              <span className="font-medium text-zinc-700">Tenancy notes</span>
              <textarea
                value={formState.notes}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, notes: event.target.value }))
                }
                className="mt-1 min-h-16 w-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900"
                placeholder="Deposit scheme, move-out context, or internal tenancy notes"
              />
            </label>

            {createError ? (
              <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {createError}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={createPending}
                className="bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {createPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-0">
            {[
              { value: 'all' as const, label: 'All' },
              { value: 'attention' as const, label: 'Attention' },
              { value: 'ready' as const, label: 'Ready' },
              { value: 'disputed' as const, label: 'Disputed' },
              { value: 'recent' as const, label: 'Recent' },
            ].map((view) => (
              <button key={view.value} type="button" onClick={() => setSavedView(view.value)}>
                <ToolbarPill active={savedView === view.value}>{view.label}</ToolbarPill>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | EotCaseStatus)}
              className="h-7 border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
            >
              <option value="all">All statuses</option>
              {CASE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatEnumLabel(status)}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as 'all' | EotCasePriority)
              }
              className="h-7 border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
            >
                <option value="all">All priorities</option>
                {CASE_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {formatEnumLabel(priority)}
                  </option>
                ))}
              </select>
            </div>
          {selectedIds.length ? (
            <span className="ml-3 text-xs text-zinc-500">
              {selectedIds.length} selected
              <button type="button" onClick={() => void handleCopySelection()} className="ml-2 text-zinc-700 underline">{copied ? 'Copied' : 'Copy IDs'}</button>
              <button type="button" onClick={() => setSelectedIds([])} className="ml-2 text-zinc-700 underline">Clear</button>
            </span>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      ) : error ? (
        <EmptyState title="Unable to load checkouts" body={error} />
      ) : visibleCaseRows.length === 0 ? (
        <EmptyState
          title={cases.length === 0 ? 'No live checkouts yet' : 'No checkouts match this view'}
          body={
            cases.length === 0
              ? 'Create the first checkout to start the operational workflow.'
              : 'Adjust the saved view or filters to widen the queue.'
          }
        />
      ) : (
        <div className="space-y-0">
          {visibleCaseRows.map(({ caseItem }) => {
            const fullAddress = buildFullAddress(caseItem.property)

            return (
              <Link
                key={caseItem.id}
                href={`/operator/cases/${caseItem.id}`}
                className="flex items-start gap-6 border-b border-zinc-200 px-5 py-6 transition hover:bg-zinc-50/60"
              >
                {/* Left: Property + tenant */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-zinc-950">
                      {fullAddress || caseItem.property.name}
                    </p>
                    <CopyAddressButton address={fullAddress || caseItem.property.name} />
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-500">
                    <span className="text-xs text-zinc-400">Tenant </span>
                    {caseItem.tenant_name}
                  </p>
                </div>

                {/* Middle: Landlord */}
                <div className="hidden shrink-0 sm:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Landlord
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-700">
                    {caseItem.landlord_name || '—'}
                  </p>
                </div>

                {/* Right: Deposit + scheme */}
                <div className="hidden shrink-0 text-right md:block">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Deposit
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-950">
                      {caseItem.deposit_amount
                        ? formatCurrency(Number(caseItem.deposit_amount))
                        : '—'}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Scheme
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {caseItem.deposit_scheme || '—'}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
          )}
    </div>
  )
}
