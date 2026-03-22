'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { CaseHeader } from '@/app/cases/[id]/components/CaseHeader'
import { ContextRail } from '@/app/cases/[id]/components/ContextRail'
import { SidebarNav } from '@/app/cases/[id]/components/SidebarNav'
import { ClaimOutput } from '@/app/cases/[id]/sections/ClaimOutput'
import { EvidencePack } from '@/app/cases/[id]/sections/EvidencePack'
import { Issues } from '@/app/cases/[id]/sections/Issues'
import { Recommendation } from '@/app/cases/[id]/sections/Recommendation'
import { TenancyDetails } from '@/app/cases/[id]/sections/TenancyDetails'
import type {
  ComplianceRecordRow,
  WorkspaceContact,
  WorkspaceEnvelope,
  WorkspaceSectionKey,
  WorkspaceSectionStatus,
} from '@/app/cases/[id]/workspace-types'
import {
  buildAddress,
  formatDate,
  formatLabel,
  formatMoney,
  formatRelativeTime,
  getContactName,
  getRecommendationProgressLabel,
  getRecommendationProgressStep,
  getWorkflowTone,
  toNumber,
} from '@/app/cases/[id]/workspace-utils'
import { OperatorNav } from '@/app/operator-nav'
import { endOfTenancyApiRequest } from '@/lib/end-of-tenancy/client-api'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'

type BaseCasePreview = {
  id: string
  case_number: string | null
  summary: string | null
  status: string | null
}

const CHECKLIST_LABELS: Record<string, string> = {
  keys: 'Keys',
  parking_permits: 'Parking permits',
  utility_readings: 'Utility readings',
  council_tax: 'Council tax',
  forwarding_address: 'Forwarding address',
  checkout_evidence: 'Checkout evidence',
  ai_review: 'AI review',
  claim_readiness: 'Claim readiness',
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-5">
      <p className="app-kicker">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{value}</p>
      <p className="mt-2 text-sm text-stone-500">{detail}</p>
    </div>
  )
}

function getChecklistTone(status: string) {
  switch (status) {
    case 'complete':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'in_progress':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'waiting':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    case 'blocked':
      return 'border border-red-200 bg-red-50 text-red-800'
    default:
      return 'border border-stone-200 bg-stone-100 text-stone-700'
  }
}

function CaseWorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="app-surface animate-pulse rounded-[2rem] px-6 py-10 md:px-8">
        <div className="h-6 w-32 rounded-full bg-stone-200" />
        <div className="mt-4 h-12 max-w-3xl rounded-[1rem] bg-stone-200" />
        <div className="mt-4 h-6 max-w-xl rounded-full bg-stone-200" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[200px,minmax(0,1fr),220px] lg:grid-cols-[200px,minmax(0,1fr)]">
        <div className="app-surface animate-pulse rounded-[1.8rem] p-5">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-10 rounded-[1rem] bg-stone-200" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="app-surface animate-pulse rounded-[2rem] px-6 py-10 md:px-8">
              <div className="h-6 w-36 rounded-full bg-stone-200" />
              <div className="mt-4 h-32 rounded-[1.4rem] bg-stone-200" />
            </div>
          ))}
        </div>
        <div className="space-y-4 lg:col-span-2 xl:col-span-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="app-surface animate-pulse rounded-[1.8rem] p-5">
              <div className="h-5 w-24 rounded-full bg-stone-200" />
              <div className="mt-4 h-24 rounded-[1rem] bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CaseWorkspacePage() {
  const params = useParams<{ id: string }>()
  const caseId = typeof params?.id === 'string' ? params.id : ''
  const { operator } = useOperatorGate()
  const [baseCase, setBaseCase] = useState<BaseCasePreview | null>(null)
  const [envelope, setEnvelope] = useState<WorkspaceEnvelope | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<WorkspaceSectionKey>('overview')
  const [initializing, setInitializing] = useState(false)

  const operatorLabel = getOperatorLabel(operator)

  const loadWorkspace = useCallback(async () => {
    if (!caseId) return

    setLoading(true)
    setError(null)

    const [caseResponse, eotResponse] = await Promise.all([
      supabase
        .from('cases')
        .select('id, case_number, summary, status')
        .eq('id', caseId)
        .maybeSingle(),
      supabase
        .from('end_of_tenancy_cases')
        .select('id')
        .eq('case_id', caseId)
        .maybeSingle(),
    ])

    const bootstrapError = caseResponse.error || eotResponse.error

    if (bootstrapError) {
      setError(bootstrapError.message)
      setLoading(false)
      return
    }

    const caseRow = (caseResponse.data as BaseCasePreview | null) ?? null
    setBaseCase(caseRow)

    if (!caseRow) {
      setError('Case not found.')
      setLoading(false)
      return
    }

    const endOfTenancyCaseId = (eotResponse.data as { id: string } | null)?.id ?? null

    if (!endOfTenancyCaseId) {
      setEnvelope(null)
      setLoading(false)
      return
    }

    try {
      const workspaceResponse = await endOfTenancyApiRequest<{
        ok: boolean
        workspace: WorkspaceEnvelope['workspace']
      }>(`/api/end-of-tenancy/${endOfTenancyCaseId}`)

      const workspace = workspaceResponse.workspace
      const tenantId = workspace.tenancy?.tenant_contact_id ?? null
      const landlordId =
        workspace.tenancy?.landlord_contact_id ?? workspace.property?.landlord_contact_id ?? null
      const propertyId = workspace.property?.id ?? null
      const latestRecommendation =
        [...workspace.recommendations].sort((left, right) =>
          (right.created_at || '').localeCompare(left.created_at || '')
        )[0] ?? null

      const actorIds = [
        ...new Set(
          [
            workspace.case?.assigned_user_id,
            ...workspace.documents.map((document) => document.uploaded_by_user_id),
            ...workspace.recommendations.flatMap((recommendation) =>
              recommendation.reviewActions.map((action) => action.actor_user_id)
            ),
          ].filter(Boolean)
        ),
      ] as string[]

      const [contactsResponse, complianceResponse, usersResponse, aiRunResponse] = await Promise.all([
        [tenantId, landlordId].filter(Boolean).length > 0
          ? supabase
              .from('contacts')
              .select('id, full_name, email, phone, company_name')
              .in('id', [tenantId, landlordId].filter(Boolean) as string[])
          : Promise.resolve({ data: [], error: null }),
        propertyId
          ? supabase
              .from('compliance_records')
              .select(
                'id, property_id, record_type, status, issue_date, expiry_date, reference_number, document_url, updated_at'
              )
              .eq('property_id', propertyId)
              .order('expiry_date', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        actorIds.length > 0
          ? supabase.from('users_profiles').select('id, full_name, email').in('id', actorIds)
          : Promise.resolve({ data: [], error: null }),
        latestRecommendation?.ai_run_id
          ? supabase
              .from('ai_runs')
              .select('id, confidence')
              .eq('id', latestRecommendation.ai_run_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])

      const firstError =
        contactsResponse.error ||
        complianceResponse.error ||
        usersResponse.error ||
        aiRunResponse.error

      if (firstError) {
        throw new Error(firstError.message)
      }

      const contacts = (contactsResponse.data || []) as WorkspaceContact[]
      const contactsById = new Map(contacts.map((contact) => [contact.id, contact] as const))
      const actorNames = Object.fromEntries(
        ((usersResponse.data || []) as Array<{ id: string; full_name: string | null; email?: string | null }>).map(
          (user) => [user.id, user.full_name?.trim() || user.email?.trim() || 'Unknown manager']
        )
      )

      setEnvelope({
        workspace,
        tenant: tenantId ? contactsById.get(tenantId) ?? null : null,
        landlord: landlordId ? contactsById.get(landlordId) ?? null : null,
        complianceRecords: (complianceResponse.data || []) as ComplianceRecordRow[],
        actorNames,
        latestRecommendationConfidence:
          ((aiRunResponse.data as { confidence: number | null } | null)?.confidence ?? null),
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the case workspace.')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    void loadWorkspace()
  }, [loadWorkspace])

  useEffect(() => {
    if (!envelope) return

    const sectionIds: WorkspaceSectionKey[] = [
      'overview',
      'evidence',
      'issues',
      'recommendation',
      'claim',
      'tenancy',
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        if (visible?.target.id) {
          setActiveSection(visible.target.id as WorkspaceSectionKey)
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0.2, 0.5, 0.8],
      }
    )

    for (const id of sectionIds) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [envelope])

  const latestRecommendation = useMemo(
    () =>
      envelope
        ? [...envelope.workspace.recommendations].sort((left, right) =>
            (right.created_at || '').localeCompare(left.created_at || '')
          )[0] ?? null
        : null,
    [envelope]
  )

  const sectionItems = useMemo(() => {
    if (!envelope) return []

    const workspace = envelope.workspace
    const issuesPending = workspace.issues.some((issue) =>
      ['open', 'under_review'].includes(issue.status)
    )
    const latestRecommendationStatus = latestRecommendation?.recommendation_status ?? null

    const items: Array<{
      id: WorkspaceSectionKey
      label: string
      href: string
      status: WorkspaceSectionStatus
    }> = [
      {
        id: 'overview',
        label: 'Overview',
        href: '#overview',
        status: workspace.case?.status === 'closed' ? 'gray' : 'green',
      },
      {
        id: 'evidence',
        label: 'Evidence pack',
        href: '#evidence',
        status: workspace.documents.length === 0 ? 'red' : 'green',
      },
      {
        id: 'issues',
        label: 'Issues',
        href: '#issues',
        status: issuesPending ? 'amber' : 'green',
      },
      {
        id: 'recommendation',
        label: 'Recommendation',
        href: '#recommendation',
        status:
          latestRecommendationStatus === 'accepted'
            ? 'green'
            : latestRecommendationStatus
              ? 'amber'
              : 'gray',
      },
      {
        id: 'claim',
        label: 'Claim output',
        href: '#claim',
        status: workspace.depositClaim ? 'green' : 'gray',
      },
      {
        id: 'tenancy',
        label: 'Tenancy details',
        href: '#tenancy',
        status: 'gray',
      },
    ]

    return items
  }, [envelope, latestRecommendation])

  async function handleInitializeWorkspace() {
    if (!caseId) return

    setInitializing(true)
    setError(null)

    try {
      await endOfTenancyApiRequest('/api/end-of-tenancy', {
        method: 'POST',
        body: JSON.stringify({
          action: 'initialize_case',
          caseId,
        }),
      })

      await loadWorkspace()
    } catch (initializeError) {
      setError(
        initializeError instanceof Error
          ? initializeError.message
          : 'Unable to initialise the EOT workspace.'
      )
    } finally {
      setInitializing(false)
    }
  }

  if (loading) {
    return (
      <main className="app-grid min-h-screen bg-stone-50 text-stone-900">
        <OperatorNav viewerName={operatorLabel} />
        <div className="px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1520px]">
            <CaseWorkspaceSkeleton />
          </div>
        </div>
      </main>
    )
  }

  if (error && !envelope) {
    return (
      <main className="app-grid min-h-screen bg-stone-50 text-stone-900">
        <OperatorNav viewerName={operatorLabel} />
        <div className="px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1520px]">
            <section className="app-surface rounded-[2rem] px-6 py-10 md:px-8">
              <p className="app-kicker">Case workspace</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                Unable to load this case
              </h1>
              <p className="mt-4 text-sm leading-6 text-red-700">{error}</p>
            </section>
          </div>
        </div>
      </main>
    )
  }

  if (!envelope) {
    return (
      <main className="app-grid min-h-screen bg-stone-50 text-stone-900">
        <OperatorNav viewerName={operatorLabel} />
        <div className="px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1520px]">
            <section className="app-surface rounded-[2rem] px-6 py-10 md:px-8">
              <p className="app-kicker">End-of-tenancy workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                {baseCase?.case_number || 'Case'} is not linked to an EOT workspace yet
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
                Start the end-of-tenancy workflow to collect evidence, assess issues, draft a recommendation, and prepare the claim output in one place.
              </p>
              {baseCase?.summary ? (
                <p className="mt-4 rounded-[1.4rem] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                  {baseCase.summary}
                </p>
              ) : null}
              {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
              <button
                type="button"
                onClick={() => void handleInitializeWorkspace()}
                disabled={initializing}
                className="app-primary-button mt-6 rounded-full px-5 py-3 text-sm font-medium disabled:opacity-60"
              >
                {initializing ? 'Starting workspace...' : 'Start EOT workflow'}
              </button>
            </section>
          </div>
        </div>
      </main>
    )
  }

  const { workspace, tenant, landlord, complianceRecords, actorNames, latestRecommendationConfidence } = envelope
  const propertyAddress = buildAddress(workspace.property)
  const tenantName = getContactName(tenant)
  const landlordName = getContactName(landlord)
  const progressStep = getRecommendationProgressStep(workspace.endOfTenancyCase.workflow_status)
  const openIssueCount = workspace.issues.filter((issue) =>
    ['open', 'under_review'].includes(issue.status)
  ).length
  const totalIssueAmount = workspace.issues.reduce((sum, issue) => {
    if (issue.responsibility === 'landlord') return sum
    return sum + (toNumber(issue.proposed_amount) ?? 0)
  }, 0)

  return (
    <main className="app-grid min-h-screen bg-stone-50 text-stone-900">
      <OperatorNav viewerName={operatorLabel} />
      <div className="px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-[1520px] space-y-6">
          <CaseHeader
            propertyAddress={propertyAddress}
            tenantName={tenantName}
            landlordName={landlordName}
            depositAmount={workspace.tenancy?.deposit_amount}
            workflowStatus={workspace.endOfTenancyCase.workflow_status}
            inspectionStatus={workspace.endOfTenancyCase.inspection_status}
            caseNumber={workspace.case?.case_number || baseCase?.case_number || null}
          />

          {error ? (
            <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[200px,minmax(0,1fr)] xl:grid-cols-[200px,minmax(0,1fr),220px]">
            <SidebarNav
              items={sectionItems}
              activeSection={activeSection}
              caseNumber={workspace.case?.case_number || baseCase?.case_number || null}
              workflowStatus={workspace.endOfTenancyCase.workflow_status}
            />

            <div className="space-y-6">
              <section id="overview" className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="app-kicker">Overview</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                      Move-out progress and next action
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
                      Keep the manager view anchored on the current workflow step, checklist, and recent audit activity.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4">
                    <p className="app-kicker">Workflow progress</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
                      {getRecommendationProgressLabel(progressStep)}
                    </p>
                    <div className="mt-3 h-2 w-48 rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${(progressStep / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getWorkflowTone(workspace.endOfTenancyCase.workflow_status)}`}>
                      {formatLabel(workspace.endOfTenancyCase.workflow_status)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    label="Current workflow"
                    value={formatLabel(workspace.endOfTenancyCase.workflow_status)}
                    detail={`Inspection ${formatLabel(workspace.endOfTenancyCase.inspection_status)}`}
                  />
                  <SummaryCard
                    label="Evidence pack"
                    value={`${workspace.documents.length}`}
                    detail={`${workspace.documents.filter((document) => document.extractions.length > 0).length} with extraction output`}
                  />
                  <SummaryCard
                    label="Issues"
                    value={`${workspace.issues.length}`}
                    detail={`${openIssueCount} still need review`}
                  />
                  <SummaryCard
                    label="Claimable amount"
                    value={formatMoney(totalIssueAmount)}
                    detail={`Last activity ${formatRelativeTime(workspace.case?.last_activity_at || workspace.case?.updated_at || workspace.endOfTenancyCase.updated_at)}`}
                  />
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr),360px]">
                  <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
                    <p className="app-kicker">Manager checklist</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {workspace.moveOutChecklistItems.length === 0 ? (
                        <p className="text-sm text-stone-500">Checklist items will appear as the move-out tracker advances.</p>
                      ) : (
                        workspace.moveOutChecklistItems.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-[1.2rem] px-4 py-3 text-sm font-medium ${getChecklistTone(item.status)}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span>{CHECKLIST_LABELS[item.item_key] || formatLabel(item.item_key)}</span>
                              <span className="text-xs uppercase tracking-[0.14em]">
                                {formatLabel(item.status)}
                              </span>
                            </div>
                            {item.notes ? <p className="mt-2 text-xs opacity-80">{item.notes}</p> : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
                    <p className="app-kicker">Next action</p>
                    <h3 className="mt-3 text-xl font-semibold text-stone-900">
                      {workspace.moveOutTracker?.next_action_title || 'Continue evidence and issue review'}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {workspace.moveOutTracker?.next_action_detail ||
                        'Attach checkout evidence, confirm the issue list, and keep the recommendation review trail explicit.'}
                    </p>
                    <div className="app-divider my-5" />
                    <p className="text-sm text-stone-500">
                      Move-out date {formatDate(workspace.endOfTenancyCase.move_out_date)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.6rem] border border-stone-200 bg-white p-5">
                  <p className="app-kicker">Audit trail</p>
                  <div className="mt-4 space-y-4">
                    {workspace.moveOutTrackerEvents.length === 0 ? (
                      <p className="text-sm text-stone-500">No move-out events have been recorded yet.</p>
                    ) : (
                      workspace.moveOutTrackerEvents
                        .slice()
                        .sort((left, right) => (right.created_at || '').localeCompare(left.created_at || ''))
                        .slice(0, 8)
                        .map((event) => (
                          <article
                            key={event.id}
                            className="rounded-[1.3rem] border border-stone-200 bg-stone-50/80 px-4 py-4"
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-stone-900">{event.title}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">
                                  {formatLabel(event.event_type)}
                                </p>
                              </div>
                              <p className="text-xs text-stone-500">
                                {formatRelativeTime(event.created_at)}
                              </p>
                            </div>
                            {event.detail ? (
                              <p className="mt-3 text-sm leading-6 text-stone-600">{event.detail}</p>
                            ) : null}
                          </article>
                        ))
                    )}
                  </div>
                </div>
              </section>

              <EvidencePack
                caseId={caseId}
                endOfTenancyCaseId={workspace.endOfTenancyCase.id}
                documents={workspace.documents}
                onRefresh={loadWorkspace}
              />

              <Issues
                endOfTenancyCaseId={workspace.endOfTenancyCase.id}
                issues={workspace.issues}
                onRefresh={loadWorkspace}
              />

              <Recommendation
                endOfTenancyCaseId={workspace.endOfTenancyCase.id}
                recommendations={workspace.recommendations}
                actorNames={actorNames}
                latestRecommendationConfidence={latestRecommendationConfidence}
                onRefresh={loadWorkspace}
              />

              <ClaimOutput
                endOfTenancyCaseId={workspace.endOfTenancyCase.id}
                workflowStatus={workspace.endOfTenancyCase.workflow_status}
                depositClaim={workspace.depositClaim}
                lineItems={workspace.lineItems}
                issues={workspace.issues}
                tenancy={workspace.tenancy}
                onRefresh={loadWorkspace}
              />

              <TenancyDetails
                workspace={workspace}
                tenant={tenant}
                landlord={landlord}
                complianceRecords={complianceRecords}
              />
            </div>

            <div className="lg:col-span-2 xl:col-span-1">
              <ContextRail
                tenant={tenant}
                landlord={landlord}
                tenancy={workspace.tenancy}
                property={workspace.property}
                workflowStatus={workspace.endOfTenancyCase.workflow_status}
                moveOutDate={workspace.endOfTenancyCase.move_out_date}
                inspectionStatus={workspace.endOfTenancyCase.inspection_status}
                complianceRecords={complianceRecords}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
