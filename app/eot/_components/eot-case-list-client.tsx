'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, Copy, Plus, RefreshCcw } from 'lucide-react'
import { createEotCase, EotApiError, listEotCases } from '@/lib/eot-api'
import { byLastActivityDesc } from '@/lib/eot-dashboard'
import type {
  CreateEotCaseInput,
  EotCaseListItem,
  EotCasePriority,
  EotCaseStatus,
} from '@/lib/eot-types'
import {
  DataTable,
  EmptyState,
  FilterToolbar,
  getCaseAttentionTone,
  getCaseProgress,
  KPIStatCard,
  PageHeader,
  ProgressBar,
  SectionCard,
  SkeletonPanel,
  StatusBadge,
  ToolbarPill,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'

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
        caseItem.tenant_name,
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Checkouts"
        title="Operational checkout pipeline"
        description="Track active end-of-tenancy checkouts, prioritise dispute risk, and move operators into the correct workspace with fewer clicks."
        actions={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen((current) => !current)}
              className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              {createOpen ? 'Close intake' : 'New checkout'}
            </button>
            <button
              type="button"
              onClick={() => void refreshCases()}
              className="inline-flex items-center gap-2 border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <KPIStatCard
          label="Active checkouts"
          value={stats.total}
          detail="Live checkouts in the operational queue."
        />
        <KPIStatCard
          label="Needs attention"
          value={stats.requiringAttention}
          detail="High-priority, disputed, or stale checkouts."
          tone="danger"
        />
        <KPIStatCard
          label="Ready for submission"
          value={stats.readyForClaim}
          detail="Checkouts at final review or submission stage."
          tone="accent"
        />
        <KPIStatCard
          label="High risk"
          value={stats.highPriority}
          detail="Checkouts with elevated dispute risk."
          tone="warning"
        />
      </section>

      {createOpen ? (
        <SectionCard className="px-6 py-6">
          <PageHeader
            eyebrow="Intake"
            title="Create a new checkout"
            description="Create the live checkout record and tenancy context. New checkouts open directly into the workspace."
            className="border-none bg-transparent px-0 py-0 shadow-none"
          />

          <form className="mt-6 grid gap-4" onSubmit={handleCreateCase}>
            <div className="grid gap-4 xl:grid-cols-2">
              <label className="text-sm">
                <span className="font-medium text-zinc-700">Property ID</span>
                <input
                  required
                  value={formState.propertyId}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, propertyId: event.target.value }))
                  }
                  className="mt-2 h-12 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
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
                  className="mt-2 h-12 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
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
                  className="mt-2 h-12 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
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
                  className="mt-2 h-12 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
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
                  className="mt-2 h-12 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
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
                  className="mt-2 h-12 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
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
                  className="mt-2 h-12 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
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
                  className="mt-2 h-12 w-full border border-zinc-200 bg-zinc-50 px-4 text-zinc-900"
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
                className="mt-2 min-h-28 w-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900"
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
                className="mt-2 min-h-24 w-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900"
                placeholder="Deposit scheme, move-out context, or internal tenancy notes"
              />
            </label>

            {createError ? (
              <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {createError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={createPending}
                className="inline-flex items-center justify-center border border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {createPending ? 'Creating checkout...' : 'Create checkout'}
              </button>
              <p className="text-sm text-zinc-500">
                New checkouts are created against the live tenant and immediately open the workspace.
              </p>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard className="overflow-hidden">
        <div className="sticky top-4 z-10 border-b border-zinc-200 bg-white/95 px-6 py-5 backdrop-blur">
          <FilterToolbar>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: 'all' as const, label: 'All checkouts' },
                { value: 'attention' as const, label: 'Needs attention' },
                { value: 'ready' as const, label: 'Ready for submission' },
                { value: 'disputed' as const, label: 'Disputed' },
                { value: 'recent' as const, label: 'Recently active' },
              ].map((view) => (
                <button key={view.value} type="button" onClick={() => setSavedView(view.value)}>
                  <ToolbarPill active={savedView === view.value}>{view.label}</ToolbarPill>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | EotCaseStatus)}
                className="h-10 border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
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
                className="h-10 border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
              >
                <option value="all">All priorities</option>
                {CASE_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {formatEnumLabel(priority)}
                  </option>
                ))}
              </select>
            </div>
          </FilterToolbar>

          {selectedIds.length ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-sm text-zinc-700">
                {selectedIds.length} checkout{selectedIds.length === 1 ? '' : 's'} selected
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopySelection()}
                  className="inline-flex items-center gap-2 border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied IDs' : 'Copy IDs'}
                </button>
                <Link
                  href={`/eot/${selectedIds[0]}`}
                  className="inline-flex items-center border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                >
                  Open first selected
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="inline-flex items-center border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-6 py-6">
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
            <DataTable>
              <table className="min-w-full text-left">
                <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={visibleCaseRows.length > 0 && selectedIds.length === visibleCaseRows.length}
                        onChange={toggleSelectAll}
                        aria-label="Select all visible checkouts"
                      />
                    </th>
                    <th className="px-4 py-3">Checkout</th>
                    <th className="px-4 py-3">Workflow</th>
                    <th className="px-4 py-3">Attention</th>
                    <th className="px-4 py-3">Coverage</th>
                    <th className="px-4 py-3">Last updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {visibleCaseRows.map(({ attention, caseItem, progress }) => {
                    const selected = selectedIds.includes(caseItem.id)

                    return (
                      <tr
                        key={caseItem.id}
                        className={selected ? 'bg-zinc-50/90' : 'hover:bg-zinc-50/70'}
                      >
                        <td className="px-4 py-4 align-top">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelection(caseItem.id)}
                              aria-label={`Select checkout ${caseItem.id}`}
                            />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            <div>
                              <Link
                                href={`/operator/cases/${caseItem.id}`}
                                className="text-sm font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900"
                              >
                                {caseItem.property.name}
                              </Link>
                              <p className="mt-1 text-sm text-zinc-600">{caseItem.tenant_name}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge
                                label={caseItem.property.reference || 'Reference pending'}
                                tone="document"
                              />
                              <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-400">
                                {caseItem.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge
                                label={formatEnumLabel(caseItem.status)}
                                tone={caseItem.status}
                              />
                              <StatusBadge
                                label={formatEnumLabel(caseItem.priority)}
                                tone={caseItem.priority}
                              />
                            </div>
                            <ProgressBar
                              value={progress}
                              label={
                                <>
                                  <span>Progress</span>
                                  <span>{progress}%</span>
                                </>
                              }
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            <StatusBadge label={attention.label} tone={attention.tone} />
                            <p className="text-sm leading-6 text-zinc-600">
                              {caseItem.status === 'ready_for_claim'
                                ? 'Ready for final review and submission.'
                                : caseItem.status === 'disputed'
                                  ? 'Requires dispute handling and audit trace.'
                                  : 'Normal workflow progression.'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="grid gap-2">
                            <div className="border border-zinc-200 bg-zinc-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                                Evidence
                              </p>
                              <p className="mt-1 text-sm font-semibold text-zinc-950">
                                {caseItem.evidence_count}
                              </p>
                            </div>
                            <div className="border border-zinc-200 bg-zinc-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                                Issues
                              </p>
                              <p className="mt-1 text-sm font-semibold text-zinc-950">
                                {caseItem.issue_count}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div>
                            <p className="text-sm font-medium text-zinc-950">
                              {formatDateTime(caseItem.last_activity_at)}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">Latest checkout activity</p>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </DataTable>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
