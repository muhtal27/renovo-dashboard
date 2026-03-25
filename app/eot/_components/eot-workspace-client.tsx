'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  createEotEvidence,
  createEotMessage,
  getEotCaseWorkspace,
  upsertEotIssue,
} from '@/lib/eot-api'
import type {
  CreateEotEvidenceInput,
  CreateEotMessageInput,
  EotCaseWorkspace,
  EotEvidenceType,
  EotIssue,
  EotIssueSeverity,
  EotIssueStatus,
  EotMessageSenderType,
  EotRecommendationDecision,
  UpsertEotIssueInput,
} from '@/lib/eot-types'
import {
  EmptyState,
  EotBadge,
  EotCard,
  formatAddress,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'

type WorkspaceClientProps = {
  caseId: string
  tenantId: string | null
  defaultActor: string
}

type EvidenceFormState = {
  fileUrl: string
  type: EotEvidenceType
  area: string
  uploadedBy: string
  metadata: string
}

type IssueFormState = {
  issueId: string | null
  title: string
  description: string
  severity: EotIssueSeverity
  status: EotIssueStatus
  evidenceIds: string[]
  decision: EotRecommendationDecision | ''
  rationale: string
  estimatedCost: string
}

type MessageFormState = {
  senderType: EotMessageSenderType
  senderId: string
  content: string
  attachments: string
}

const DEFAULT_EVIDENCE_FORM = (defaultActor: string): EvidenceFormState => ({
  fileUrl: '',
  type: 'document',
  area: '',
  uploadedBy: defaultActor,
  metadata: '',
})

const DEFAULT_ISSUE_FORM: IssueFormState = {
  issueId: null,
  title: '',
  description: '',
  severity: 'medium',
  status: 'open',
  evidenceIds: [],
  decision: '',
  rationale: '',
  estimatedCost: '',
}

const DEFAULT_MESSAGE_FORM = (defaultActor: string): MessageFormState => ({
  senderType: 'manager',
  senderId: defaultActor,
  content: '',
  attachments: '',
})

export function EotWorkspaceClient({
  caseId,
  tenantId,
  defaultActor,
}: WorkspaceClientProps) {
  const searchParams = useSearchParams()
  const search = searchParams.get('search')?.trim().toLowerCase() ?? ''

  const [workspace, setWorkspace] = useState<EotCaseWorkspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedWorkspaceRef = useRef(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const [evidenceForm, setEvidenceForm] = useState<EvidenceFormState>(
    DEFAULT_EVIDENCE_FORM(defaultActor)
  )
  const [issueForm, setIssueForm] = useState<IssueFormState>(DEFAULT_ISSUE_FORM)
  const [messageForm, setMessageForm] = useState<MessageFormState>(DEFAULT_MESSAGE_FORM(defaultActor))

  const [evidencePending, setEvidencePending] = useState(false)
  const [issuePending, setIssuePending] = useState(false)
  const [messagePending, setMessagePending] = useState(false)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)

  useEffect(() => {
    setEvidenceForm(DEFAULT_EVIDENCE_FORM(defaultActor))
    setMessageForm(DEFAULT_MESSAGE_FORM(defaultActor))
  }, [defaultActor])

  useEffect(() => {
    const currentTenantId = tenantId

    if (!currentTenantId) {
      setLoading(false)
      return
    }
    const resolvedTenantId: string = currentTenantId

    let cancelled = false

    async function loadWorkspace() {
      const hasExistingWorkspace = hasLoadedWorkspaceRef.current

      if (hasExistingWorkspace) {
        setRefreshing(true)
        setRefreshError(null)
      } else {
        setLoading(true)
        setError(null)
      }

      try {
        const nextWorkspace = await getEotCaseWorkspace(resolvedTenantId, caseId)

        if (!cancelled) {
          setWorkspace(nextWorkspace)
          setError(null)
          setRefreshError(null)
          hasLoadedWorkspaceRef.current = true
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : 'Unable to load the case workspace.'

          if (hasExistingWorkspace) {
            setRefreshError(`${message} Showing last loaded workspace data.`)
          } else {
            setError(message)
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [caseId, tenantId])

  const visibleEvidence =
    workspace?.evidence.filter((item) => {
      if (!search) return true
      return [item.area ?? '', item.type, item.file_url, item.uploaded_by].join(' ').toLowerCase().includes(search)
    }) ?? []

  const visibleIssues =
    workspace?.issues.filter((item) => {
      if (!search) return true
      return [
        item.title,
        item.description ?? '',
        item.severity,
        item.status,
        item.recommendation?.decision ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    }) ?? []

  const visibleMessages =
    workspace?.messages.filter((item) => {
      if (!search) return true
      return [item.sender_type, item.sender_id, item.content].join(' ').toLowerCase().includes(search)
    }) ?? []

  const visibleRecommendations =
    workspace?.recommendations.filter((item) => {
      if (!search) return true
      return [
        item.decision ?? '',
        item.rationale ?? '',
        item.estimated_cost ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    }) ?? []

  async function refreshWorkspaceNow() {
    if (!tenantId) {
      throw new Error('No workspace tenant is configured for this operator.')
    }

    setRefreshing(true)
    setRefreshError(null)

    try {
      const nextWorkspace = await getEotCaseWorkspace(tenantId, caseId)
      setWorkspace(nextWorkspace)
      setError(null)
      hasLoadedWorkspaceRef.current = true
      return nextWorkspace
    } catch (refreshFailure) {
      const message =
        refreshFailure instanceof Error
          ? refreshFailure.message
          : 'Unable to refresh the case workspace.'
      setRefreshError(`${message} Showing last loaded workspace data.`)
      throw refreshFailure
    } finally {
      setRefreshing(false)
    }
  }

  function resetIssueForm() {
    setIssueForm(DEFAULT_ISSUE_FORM)
    setIssueError(null)
  }

  function startEditingIssue(issue: EotIssue) {
    setIssueForm({
      issueId: issue.id,
      title: issue.title,
      description: issue.description ?? '',
      severity: issue.severity,
      status: issue.status,
      evidenceIds: issue.linked_evidence.map((item) => item.id),
      decision: issue.recommendation?.decision ?? '',
      rationale: issue.recommendation?.rationale ?? '',
      estimatedCost: issue.recommendation?.estimated_cost ?? '',
    })
    setIssueError(null)
  }

  async function handleEvidenceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (evidencePending) {
      return
    }

    if (!tenantId) {
      setEvidenceError('No workspace tenant is configured for this operator.')
      return
    }

    if (!evidenceForm.fileUrl.trim()) {
      setEvidenceError('Evidence URL is required.')
      return
    }

    if (!evidenceForm.uploadedBy.trim()) {
      setEvidenceError('Uploaded by is required.')
      return
    }

    let metadata: Record<string, unknown> | null = null
    if (evidenceForm.metadata.trim()) {
      try {
        const parsedMetadata = JSON.parse(evidenceForm.metadata) as unknown
        if (!parsedMetadata || typeof parsedMetadata !== 'object' || Array.isArray(parsedMetadata)) {
          throw new Error('invalid metadata')
        }
        metadata = parsedMetadata as Record<string, unknown>
      } catch {
        setEvidenceError('Evidence metadata must be valid JSON.')
        return
      }
    }

    setEvidencePending(true)
    setEvidenceError(null)

    const payload: CreateEotEvidenceInput = {
      tenant_id: tenantId,
      case_id: caseId,
      file_url: evidenceForm.fileUrl.trim(),
      type: evidenceForm.type,
      area: evidenceForm.area.trim() || null,
      uploaded_by: evidenceForm.uploadedBy.trim(),
      metadata,
    }

    try {
      await createEotEvidence(payload)
      setEvidenceForm(DEFAULT_EVIDENCE_FORM(defaultActor))
      try {
        await refreshWorkspaceNow()
      } catch {
        // Keep the saved form state and show the non-destructive refresh banner.
      }
    } catch (submitError) {
      setEvidenceError(
        submitError instanceof Error ? submitError.message : 'Unable to register evidence.'
      )
    } finally {
      setEvidencePending(false)
    }
  }

  async function handleIssueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (issuePending) {
      return
    }

    if (!tenantId) {
      setIssueError('No workspace tenant is configured for this operator.')
      return
    }

    if (!issueForm.title.trim()) {
      setIssueError('Issue title is required.')
      return
    }

    setIssuePending(true)
    setIssueError(null)

    const payload: UpsertEotIssueInput = {
      tenant_id: tenantId,
      case_id: caseId,
      issue_id: issueForm.issueId ?? undefined,
      title: issueForm.title.trim() || undefined,
      description: issueForm.description.trim() || null,
      severity: issueForm.severity,
      status: issueForm.status,
      evidence_ids: issueForm.evidenceIds,
      recommendation: {
        decision: issueForm.decision || null,
        rationale: issueForm.rationale.trim() || null,
        estimated_cost: issueForm.estimatedCost.trim() || null,
      },
    }

    try {
      await upsertEotIssue(payload)
      resetIssueForm()
      try {
        await refreshWorkspaceNow()
      } catch {
        // The issue was saved; keep the last good workspace visible if refresh fails.
      }
    } catch (submitError) {
      setIssueError(submitError instanceof Error ? submitError.message : 'Unable to save the issue.')
    } finally {
      setIssuePending(false)
    }
  }

  async function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (messagePending) {
      return
    }

    if (!tenantId) {
      setMessageError('No workspace tenant is configured for this operator.')
      return
    }

    if (!messageForm.senderId.trim()) {
      setMessageError('Sender ID is required.')
      return
    }

    if (!messageForm.content.trim()) {
      setMessageError('Message content is required.')
      return
    }

    let attachments: Array<Record<string, unknown>> = []
    if (messageForm.attachments.trim()) {
      try {
        const parsedAttachments = JSON.parse(messageForm.attachments) as unknown
        if (!Array.isArray(parsedAttachments)) {
          throw new Error('invalid attachments')
        }
        attachments = parsedAttachments as Array<Record<string, unknown>>
      } catch {
        setMessageError('Message attachments must be a valid JSON array.')
        return
      }
    }

    setMessagePending(true)
    setMessageError(null)

    const payload: CreateEotMessageInput = {
      tenant_id: tenantId,
      case_id: caseId,
      sender_type: messageForm.senderType,
      sender_id: messageForm.senderId.trim(),
      content: messageForm.content.trim(),
      attachments,
    }

    try {
      await createEotMessage(payload)
      setMessageForm(DEFAULT_MESSAGE_FORM(defaultActor))
      try {
        await refreshWorkspaceNow()
      } catch {
        // The message was sent; keep the last good workspace visible if refresh fails.
      }
    } catch (submitError) {
      setMessageError(
        submitError instanceof Error ? submitError.message : 'Unable to send the case message.'
      )
    } finally {
      setMessagePending(false)
    }
  }

  if (!tenantId) {
    return (
      <EotCard className="px-6 py-6 md:px-8">
        <p className="app-kicker">Workspace configuration</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          Tenant ID required
        </h2>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          This operator does not currently resolve to an EOT tenant. Add `tenant_id` to Supabase
          user metadata or configure `EOT_TENANT_ID` / `NEXT_PUBLIC_EOT_TENANT_ID`.
        </p>
      </EotCard>
    )
  }

  if (loading) {
    return (
      <EotCard className="px-6 py-10 md:px-8">
        <p className="text-sm text-stone-500">Loading live case workspace...</p>
      </EotCard>
    )
  }

  if (error || !workspace) {
    return (
      <EotCard className="px-6 py-10 md:px-8">
        <EmptyState
          title="Unable to load workspace"
          body={error ?? 'The case workspace could not be loaded.'}
        />
      </EotCard>
    )
  }

  return (
    <div className="space-y-6">
      {refreshError ? (
        <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {refreshError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/eot"
          className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
        >
          Back to case list
        </Link>
        <div className="flex items-center gap-3">
          {refreshing ? <p className="text-sm text-stone-500">Refreshing workspace...</p> : null}
          <EotBadge label={formatEnumLabel(workspace.case.status)} tone={workspace.case.status} />
          <EotBadge
            label={formatEnumLabel(workspace.case.priority)}
            tone={workspace.case.priority}
          />
        </div>
      </div>

      <EotCard className="px-6 py-6 md:px-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
          <div>
            <p className="app-kicker">Case header</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
              {workspace.property.name}
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              {workspace.case.summary?.trim() || 'No case summary has been recorded yet.'}
            </p>
            <p className="mt-4 text-sm text-stone-500">
              {workspace.tenancy.tenant_name}
              {workspace.tenancy.tenant_email ? ` · ${workspace.tenancy.tenant_email}` : ''}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Last activity
              </p>
              <p className="mt-2 text-sm font-medium text-stone-900">
                {formatDateTime(workspace.case.last_activity_at)}
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Deposit
              </p>
              <p className="mt-2 text-sm font-medium text-stone-900">
                {workspace.tenancy.deposit_amount
                  ? formatCurrency(workspace.tenancy.deposit_amount)
                  : 'Not recorded'}
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Property reference
              </p>
              <p className="mt-2 text-sm font-medium text-stone-900">
                {workspace.property.reference || 'Not set'}
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Workspace counts
              </p>
              <p className="mt-2 text-sm font-medium text-stone-900">
                {workspace.evidence.length} evidence · {workspace.issues.length} issues
              </p>
            </div>
          </div>
        </div>
      </EotCard>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)_minmax(0,0.92fr)]">
        <div className="space-y-6">
          <EotCard className="px-6 py-6">
            <p className="app-kicker">Tenancy and property</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Address
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-700">
                  {formatAddress([
                    workspace.property.address_line_1,
                    workspace.property.address_line_2,
                    workspace.property.city,
                    workspace.property.postcode,
                    workspace.property.country_code,
                  ])}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Tenancy dates
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-700">
                  {formatDate(workspace.tenancy.start_date)} to {formatDate(workspace.tenancy.end_date)}
                </p>
              </div>
            </div>
            {workspace.tenancy.notes ? (
              <div className="mt-4 rounded-[1.2rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm leading-7 text-stone-600">
                {workspace.tenancy.notes}
              </div>
            ) : null}
          </EotCard>

          <EotCard className="px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="app-kicker">Evidence</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
                  Case evidence register
                </h3>
              </div>
              <p className="text-sm text-stone-500">{visibleEvidence.length} visible</p>
            </div>

            <div className="mt-5 space-y-3">
              {visibleEvidence.length === 0 ? (
                <EmptyState
                  title="No evidence recorded"
                  body="Register the first evidence item to begin issue assessment."
                />
              ) : (
                visibleEvidence.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.2rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <EotBadge label={formatEnumLabel(item.type)} tone={item.type} />
                          {item.area ? <span className="text-sm text-stone-500">{item.area}</span> : null}
                        </div>
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block break-all text-sm font-medium text-stone-900 underline decoration-stone-300 underline-offset-2"
                        >
                          {item.file_url}
                        </a>
                      </div>
                      <div className="text-right text-xs text-stone-500">
                        <p>{item.uploaded_by}</p>
                        <p className="mt-1">{formatDateTime(item.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className="mt-6 grid gap-4 border-t border-stone-200 pt-6" onSubmit={handleEvidenceSubmit}>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Evidence URL</span>
                <input
                  required
                  value={evidenceForm.fileUrl}
                  onChange={(event) =>
                    setEvidenceForm((current) => ({ ...current, fileUrl: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  placeholder="https://..."
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="font-medium text-stone-700">Type</span>
                  <select
                    value={evidenceForm.type}
                    onChange={(event) =>
                      setEvidenceForm((current) => ({
                        ...current,
                        type: event.target.value as EotEvidenceType,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  >
                    {(['document', 'image', 'video'] as EotEvidenceType[]).map((type) => (
                      <option key={type} value={type}>
                        {formatEnumLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-medium text-stone-700">Area</span>
                  <input
                    value={evidenceForm.area}
                    onChange={(event) =>
                      setEvidenceForm((current) => ({ ...current, area: event.target.value }))
                    }
                    className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                    placeholder="Kitchen, hallway, deposit docs..."
                  />
                </label>
              </div>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Uploaded by</span>
                <input
                  required
                  value={evidenceForm.uploadedBy}
                  onChange={(event) =>
                    setEvidenceForm((current) => ({ ...current, uploadedBy: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Metadata JSON</span>
                <textarea
                  value={evidenceForm.metadata}
                  onChange={(event) =>
                    setEvidenceForm((current) => ({ ...current, metadata: event.target.value }))
                  }
                  className="mt-2 min-h-24 w-full rounded-[1rem] border border-stone-300 bg-white px-4 py-3 text-stone-900"
                  placeholder='{"source":"inventory","page":"12"}'
                />
              </label>
              {evidenceError ? (
                <p className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {evidenceError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={evidencePending}
                className="inline-flex items-center justify-center rounded-[1rem] border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
              >
                {evidencePending ? 'Saving evidence...' : 'Add evidence'}
              </button>
            </form>
          </EotCard>

          <EotCard className="px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="app-kicker">Documents</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
                  Supporting files
                </h3>
              </div>
              <p className="text-sm text-stone-500">{workspace.documents.length} linked</p>
            </div>
            <div className="mt-5 space-y-3">
              {workspace.documents.length === 0 ? (
                <EmptyState
                  title="No supporting documents"
                  body="This case does not yet have any linked document records."
                />
              ) : (
                workspace.documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-[1.2rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-900">{document.name}</p>
                        <p className="mt-1 text-sm text-stone-500">
                          {formatEnumLabel(document.document_type)}
                        </p>
                      </div>
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-stone-700 underline decoration-stone-300 underline-offset-2"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </EotCard>
        </div>

        <div className="space-y-6">
          <EotCard className="px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="app-kicker">Issues</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
                  Assessment workspace
                </h3>
              </div>
              <p className="text-sm text-stone-500">{visibleIssues.length} visible</p>
            </div>

            <div className="mt-5 space-y-4">
              {visibleIssues.length === 0 ? (
                <EmptyState
                  title="No issues logged"
                  body="Create the first issue once evidence has been reviewed."
                />
              ) : (
                visibleIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-stone-900">{issue.title}</p>
                          <EotBadge label={formatEnumLabel(issue.severity)} tone={issue.severity} />
                          <EotBadge label={formatEnumLabel(issue.status)} tone={issue.status} />
                          {issue.recommendation?.decision ? (
                            <EotBadge
                              label={formatEnumLabel(issue.recommendation.decision)}
                              tone={issue.recommendation.decision}
                            />
                          ) : null}
                        </div>
                        {issue.description ? (
                          <p className="mt-3 text-sm leading-7 text-stone-600">{issue.description}</p>
                        ) : null}
                        <p className="mt-3 text-sm text-stone-500">
                          Evidence linked: {issue.linked_evidence.length}
                        </p>
                        {issue.recommendation?.rationale ? (
                          <p className="mt-3 rounded-[1rem] border border-stone-200 bg-white px-3 py-3 text-sm leading-6 text-stone-600">
                            {issue.recommendation.rationale}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                          Estimated cost
                        </p>
                        <p className="mt-2 text-xl font-semibold text-stone-900">
                          {issue.recommendation?.estimated_cost
                            ? formatCurrency(issue.recommendation.estimated_cost)
                            : 'Not set'}
                        </p>
                        <button
                          type="button"
                          onClick={() => startEditingIssue(issue)}
                          className="mt-4 inline-flex rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
                        >
                          Edit issue
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className="mt-6 grid gap-4 border-t border-stone-200 pt-6" onSubmit={handleIssueSubmit}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-stone-900">
                  {issueForm.issueId ? 'Update issue' : 'Create issue'}
                </p>
                {issueForm.issueId ? (
                  <button
                    type="button"
                    onClick={resetIssueForm}
                    className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
                  >
                    Clear edit state
                  </button>
                ) : null}
              </div>

              <label className="text-sm">
                <span className="font-medium text-stone-700">Issue title</span>
                <input
                  required
                  value={issueForm.title}
                  onChange={(event) =>
                    setIssueForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Description</span>
                <textarea
                  value={issueForm.description}
                  onChange={(event) =>
                    setIssueForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="mt-2 min-h-24 w-full rounded-[1rem] border border-stone-300 bg-white px-4 py-3 text-stone-900"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="font-medium text-stone-700">Severity</span>
                  <select
                    value={issueForm.severity}
                    onChange={(event) =>
                      setIssueForm((current) => ({
                        ...current,
                        severity: event.target.value as EotIssueSeverity,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  >
                    {(['low', 'medium', 'high'] as EotIssueSeverity[]).map((severity) => (
                      <option key={severity} value={severity}>
                        {formatEnumLabel(severity)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-medium text-stone-700">Status</span>
                  <select
                    value={issueForm.status}
                    onChange={(event) =>
                      setIssueForm((current) => ({
                        ...current,
                        status: event.target.value as EotIssueStatus,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  >
                    {(['open', 'resolved', 'disputed'] as EotIssueStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {formatEnumLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="text-sm">
                <legend className="font-medium text-stone-700">Linked evidence</legend>
                <div className="mt-3 grid gap-2">
                  {workspace.evidence.length === 0 ? (
                    <p className="text-sm text-stone-500">Add evidence before linking it to an issue.</p>
                  ) : (
                    workspace.evidence.map((item) => {
                      const checked = issueForm.evidenceIds.includes(item.id)

                      return (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 rounded-[1rem] border border-stone-200 bg-stone-50/70 px-4 py-3"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setIssueForm((current) => ({
                                ...current,
                                evidenceIds: event.target.checked
                                  ? [...current.evidenceIds, item.id]
                                  : current.evidenceIds.filter((value) => value !== item.id),
                              }))
                            }
                            className="mt-1"
                          />
                          <span>
                            <span className="block font-medium text-stone-900">
                              {item.area || formatEnumLabel(item.type)}
                            </span>
                            <span className="mt-1 block break-all text-xs text-stone-500">
                              {item.file_url}
                            </span>
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
              </fieldset>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="font-medium text-stone-700">Decision</span>
                  <select
                    value={issueForm.decision}
                    onChange={(event) =>
                      setIssueForm((current) => ({
                        ...current,
                        decision: event.target.value as EotRecommendationDecision | '',
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  >
                    <option value="">Not set</option>
                    {(['charge', 'partial', 'no_charge'] as EotRecommendationDecision[]).map((decision) => (
                      <option key={decision} value={decision}>
                        {formatEnumLabel(decision)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-medium text-stone-700">Estimated cost</span>
                  <input
                    value={issueForm.estimatedCost}
                    onChange={(event) =>
                      setIssueForm((current) => ({ ...current, estimatedCost: event.target.value }))
                    }
                    className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                    placeholder="0.00"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="font-medium text-stone-700">Recommendation rationale</span>
                <textarea
                  value={issueForm.rationale}
                  onChange={(event) =>
                    setIssueForm((current) => ({ ...current, rationale: event.target.value }))
                  }
                  className="mt-2 min-h-28 w-full rounded-[1rem] border border-stone-300 bg-white px-4 py-3 text-stone-900"
                />
              </label>

              {issueError ? (
                <p className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {issueError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={issuePending}
                className="inline-flex items-center justify-center rounded-[1rem] border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
              >
                {issuePending ? 'Saving issue...' : issueForm.issueId ? 'Update issue' : 'Create issue'}
              </button>
            </form>
          </EotCard>

          <EotCard className="px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="app-kicker">Recommendations and claim</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
                  Decision summary
                </h3>
              </div>
              <p className="text-sm text-stone-500">
                {workspace.claim ? formatCurrency(workspace.claim.total_amount) : 'No claim yet'}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {visibleRecommendations.length === 0 ? (
                <EmptyState
                  title="No recommendation records"
                  body="Issue recommendations will appear here as assessment decisions are recorded."
                />
              ) : (
                visibleRecommendations.map((recommendation) => {
                  const issue = workspace.issues.find((item) => item.id === recommendation.issue_id)

                  return (
                    <div
                      key={recommendation.id}
                      className="rounded-[1.2rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-stone-900">{issue?.title || 'Linked issue'}</p>
                          <p className="mt-1 text-sm text-stone-500">
                            {recommendation.rationale || 'No written rationale yet.'}
                          </p>
                        </div>
                        <div className="text-right">
                          <EotBadge
                            label={formatEnumLabel(recommendation.decision)}
                            tone={recommendation.decision ?? 'draft'}
                          />
                          <p className="mt-2 text-sm font-semibold text-stone-900">
                            {recommendation.estimated_cost
                              ? formatCurrency(recommendation.estimated_cost)
                              : 'No amount'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-emerald-200 bg-emerald-50/80 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                    Claim summary
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-950">
                    {workspace.claim ? formatCurrency(workspace.claim.total_amount) : formatCurrency(0)}
                  </p>
                </div>
                <p className="text-sm text-emerald-900">
                  Generated {formatDateTime(workspace.claim?.generated_at)}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {workspace.claim?.breakdown.length ? (
                  workspace.claim.breakdown.map((lineItem, index) => (
                    <div
                      key={`${lineItem.issue_id ?? 'line'}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-[1rem] border border-emerald-200 bg-white/80 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-stone-900">
                          {typeof lineItem.title === 'string' ? lineItem.title : 'Claim line item'}
                        </p>
                        <p className="mt-1 text-stone-500">
                          {typeof lineItem.decision === 'string'
                            ? formatEnumLabel(lineItem.decision)
                            : 'Decision pending'}
                        </p>
                      </div>
                      <p className="font-semibold text-stone-900">
                        {formatCurrency(
                          typeof lineItem.estimated_cost === 'string'
                            ? lineItem.estimated_cost
                            : 0
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-emerald-900">
                    Claim output will build here from issue recommendation decisions.
                  </p>
                )}
              </div>
            </div>
          </EotCard>
        </div>

        <div className="space-y-6">
          <EotCard className="px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="app-kicker">Inbox</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
                  Internal and external messages
                </h3>
              </div>
              <p className="text-sm text-stone-500">{visibleMessages.length} visible</p>
            </div>

            <div className="mt-5 space-y-3">
              {visibleMessages.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  body="Case conversation will appear here once the first message is sent."
                />
              ) : (
                visibleMessages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-[1.2rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <EotBadge
                          label={formatEnumLabel(message.sender_type)}
                          tone={message.sender_type}
                        />
                        <p className="text-sm font-medium text-stone-900">{message.sender_id}</p>
                      </div>
                      <p className="text-xs text-stone-500">{formatDateTime(message.created_at)}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-stone-700">{message.content}</p>
                    {message.attachments.length ? (
                      <pre className="mt-3 overflow-x-auto rounded-[1rem] border border-stone-200 bg-white px-3 py-3 text-xs text-stone-600">
                        {JSON.stringify(message.attachments, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <form className="mt-6 grid gap-4 border-t border-stone-200 pt-6" onSubmit={handleMessageSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="font-medium text-stone-700">Sender type</span>
                  <select
                    value={messageForm.senderType}
                    onChange={(event) =>
                      setMessageForm((current) => ({
                        ...current,
                        senderType: event.target.value as EotMessageSenderType,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  >
                    {(['manager', 'landlord', 'tenant'] as EotMessageSenderType[]).map((type) => (
                      <option key={type} value={type}>
                        {formatEnumLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-medium text-stone-700">Sender ID</span>
                  <input
                    required
                    value={messageForm.senderId}
                    onChange={(event) =>
                      setMessageForm((current) => ({ ...current, senderId: event.target.value }))
                    }
                    className="mt-2 h-12 w-full rounded-[1rem] border border-stone-300 bg-white px-4 text-stone-900"
                  />
                </label>
              </div>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Message content</span>
                <textarea
                  required
                  value={messageForm.content}
                  onChange={(event) =>
                    setMessageForm((current) => ({ ...current, content: event.target.value }))
                  }
                  className="mt-2 min-h-28 w-full rounded-[1rem] border border-stone-300 bg-white px-4 py-3 text-stone-900"
                />
              </label>
              <label className="text-sm">
                <span className="font-medium text-stone-700">Attachments JSON array</span>
                <textarea
                  value={messageForm.attachments}
                  onChange={(event) =>
                    setMessageForm((current) => ({ ...current, attachments: event.target.value }))
                  }
                  className="mt-2 min-h-24 w-full rounded-[1rem] border border-stone-300 bg-white px-4 py-3 text-stone-900"
                  placeholder='[{"file_url":"https://...","label":"Move-out quote"}]'
                />
              </label>
              {messageError ? (
                <p className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {messageError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={messagePending}
                className="inline-flex items-center justify-center rounded-[1rem] border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
              >
                {messagePending ? 'Sending message...' : 'Send message'}
              </button>
            </form>
          </EotCard>
        </div>
      </div>
    </div>
  )
}
