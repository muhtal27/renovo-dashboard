'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { createEotCase, listEotCases, EotApiError } from '@/lib/eot-api'
import type {
  CreateEotCaseInput,
  EotCaseListItem,
  EotCasePriority,
  EotCaseStatus,
} from '@/lib/eot-types'
import {
  EmptyState,
  EotBadge,
  EotCard,
  formatDate,
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

type CaseListClientProps = {
  tenantId: string | null
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

export function EotCaseListClient({ tenantId }: CaseListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get('search')?.trim().toLowerCase() ?? ''

  const [cases, setCases] = useState<EotCaseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createPending, setCreatePending] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formState, setFormState] = useState<CreateCaseFormState>(DEFAULT_FORM_STATE)

  useEffect(() => {
    const currentTenantId = tenantId

    if (!currentTenantId) {
      setLoading(false)
      return
    }
    const resolvedTenantId: string = currentTenantId

    let cancelled = false

    async function loadCases() {
      setLoading(true)
      setError(null)

      try {
        const nextCases = await listEotCases(resolvedTenantId)

        if (!cancelled) {
          setCases(nextCases)
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
  }, [tenantId])

  const visibleCases = cases.filter((caseItem) => {
    if (!search) return true

    const haystack = [
      caseItem.property.name,
      caseItem.property.reference ?? '',
      caseItem.tenant_name,
      caseItem.status,
      caseItem.priority,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(search)
  })

  async function handleCreateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (createPending) {
      return
    }

    if (!tenantId) {
      setCreateError('No workspace tenant is configured for this operator.')
      return
    }

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
      tenant_id: tenantId,
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
      setFormState(DEFAULT_FORM_STATE)
      setCreateOpen(false)
      router.push(`/eot/${workspace.case.id}`)
      router.refresh()
    } catch (createCaseError) {
      if (createCaseError instanceof EotApiError) {
        setCreateError(createCaseError.message)
      } else {
        setCreateError('Unable to create the case right now.')
      }
    } finally {
      setCreatePending(false)
    }
  }

  if (!tenantId) {
    return (
      <EotCard className="px-6 py-6 md:px-8">
        <p className="app-kicker">Workspace configuration</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          Tenant ID required
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">
          Renovo needs an EOT tenant identifier to load the live workspace. Add
          `EOT_TENANT_ID`, `NEXT_PUBLIC_EOT_TENANT_ID`, or include `tenant_id` in the signed-in
          user&apos;s Supabase metadata.
        </p>
      </EotCard>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <EotCard className="px-5 py-5">
          <p className="text-sm text-stone-500">Active cases</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{cases.length}</p>
        </EotCard>
        <EotCard className="px-5 py-5">
          <p className="text-sm text-stone-500">Ready for claim</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
            {cases.filter((caseItem) => caseItem.status === 'ready_for_claim').length}
          </p>
        </EotCard>
        <EotCard className="px-5 py-5">
          <p className="text-sm text-stone-500">High priority</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
            {cases.filter((caseItem) => caseItem.priority === 'high').length}
          </p>
        </EotCard>
        <EotCard className="px-5 py-5">
          <p className="text-sm text-stone-500">Last activity</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-stone-900">
            {cases[0] ? formatDateTime(cases[0].last_activity_at) : 'No activity yet'}
          </p>
        </EotCard>
      </section>

      <EotCard className="px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="app-kicker">Cases</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              Live end-of-tenancy pipeline
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              Review active case status, last activity, evidence volume, and issue count. Search
              filters the loaded cases client-side without changing the backend query contract.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen((current) => !current)}
            className="inline-flex items-center justify-center rounded-[1rem] border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            {createOpen ? 'Close form' : 'New case'}
          </button>
        </div>

        {createOpen ? (
          <form className="mt-6 grid gap-4 border-t border-stone-200 pt-6" onSubmit={handleCreateCase}>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="text-sm">
                <span className="font-medium text-stone-700">Property ID</span>
                <input
                  required
                  value={formState.propertyId}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, propertyId: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  placeholder="UUID from the live property record"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Tenant name</span>
                <input
                  required
                  value={formState.tenantName}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, tenantName: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  placeholder="Primary tenancy contact"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Tenant email</span>
                <input
                  type="email"
                  value={formState.tenantEmail}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, tenantEmail: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  placeholder="tenant@example.com"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Deposit amount</span>
                <input
                  value={formState.depositAmount}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, depositAmount: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  placeholder="1200.00"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Start date</span>
                <input
                  type="date"
                  value={formState.startDate}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">End date</span>
                <input
                  type="date"
                  value={formState.endDate}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Priority</span>
                <select
                  value={formState.priority}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      priority: event.target.value as EotCasePriority,
                    }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                >
                  {CASE_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {formatEnumLabel(priority)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Initial status</span>
                <select
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      status: event.target.value as EotCaseStatus,
                    }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
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
              <span className="font-medium text-stone-700">Case summary</span>
              <textarea
                value={formState.summary}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, summary: event.target.value }))
                }
                className="mt-2 min-h-28 w-full rounded-[1rem] border border-stone-300 bg-white px-4 py-3 text-stone-900"
                placeholder="What is the tenancy-end context for this case?"
              />
            </label>

            <label className="text-sm">
              <span className="font-medium text-stone-700">Tenancy notes</span>
              <textarea
                value={formState.notes}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, notes: event.target.value }))
                }
                className="mt-2 min-h-24 w-full rounded-[1rem] border border-stone-300 bg-white px-4 py-3 text-stone-900"
                placeholder="Deposit scheme, move-out context, or internal tenancy notes"
              />
            </label>

            {createError ? (
              <p className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={createPending}
                className="inline-flex items-center justify-center rounded-[1rem] border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
              >
                {createPending ? 'Creating case...' : 'Create case'}
              </button>
              <p className="text-sm text-stone-500">
                New cases are created against the live tenant and immediately open the workspace.
              </p>
            </div>
          </form>
        ) : null}
      </EotCard>

      <EotCard className="overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 text-sm text-stone-500">Loading live case data...</div>
        ) : error ? (
          <div className="px-6 py-10">
            <EmptyState title="Unable to load cases" body={error} />
          </div>
        ) : visibleCases.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState
              title={cases.length === 0 ? 'No live cases yet' : 'No cases match this search'}
              body={
                cases.length === 0
                  ? 'Create the first case to start the live end-of-tenancy workflow.'
                  : 'Try a different property, tenant, status, or priority term.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50/90">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  <th className="px-5 py-3">Property</th>
                  <th className="px-5 py-3">Tenant</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Evidence</th>
                  <th className="px-5 py-3">Issues</th>
                  <th className="px-5 py-3">Last activity</th>
                  <th className="px-5 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {visibleCases.map((caseItem) => (
                  <tr key={caseItem.id} className="text-sm text-stone-700">
                    <td className="px-5 py-4">
                      <p className="font-medium text-stone-900">{caseItem.property.name}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {caseItem.property.reference || 'No property reference'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-stone-900">{caseItem.tenant_name}</p>
                      <p className="mt-1 text-xs text-stone-500">Last activity {formatDate(caseItem.last_activity_at)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <EotBadge label={formatEnumLabel(caseItem.status)} tone={caseItem.status} />
                    </td>
                    <td className="px-5 py-4">
                      <EotBadge
                        label={formatEnumLabel(caseItem.priority)}
                        tone={caseItem.priority}
                      />
                    </td>
                    <td className="px-5 py-4">{caseItem.evidence_count}</td>
                    <td className="px-5 py-4">{caseItem.issue_count}</td>
                    <td className="px-5 py-4">{formatDateTime(caseItem.last_activity_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/eot/${caseItem.id}`}
                        className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-white hover:text-stone-900"
                      >
                        Open case
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </EotCard>
    </div>
  )
}
