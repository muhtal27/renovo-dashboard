'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  ImageIcon,
  MessageSquareText,
  RefreshCcw,
  Send,
  TriangleAlert,
  Upload,
  Video,
} from 'lucide-react'
import {
  createEotEvidence,
  createEotMessage,
  getEotCaseWorkspace,
  upsertEotIssue,
} from '@/lib/eot-api'
import {
  buildWorkspaceTimeline,
  getClaimReadiness,
  getOpenHighSeverityIssues,
} from '@/lib/eot-dashboard'
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
  ActivityTimeline,
  DetailPanel,
  EmptyState,
  KPIStatCard,
  KeyValueList,
  MetaItem,
  PageHeader,
  ProgressBar,
  SectionCard,
  SkeletonPanel,
  StatusBadge,
  WorkspaceSection,
  formatAddress,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnumLabel,
  getCaseProgress,
} from '@/app/eot/_components/eot-ui'

type WorkspaceClientProps = {
  caseId: string
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

function EvidenceIcon({ type }: { type: EotEvidenceType }) {
  if (type === 'image') return <ImageIcon className="h-4 w-4" />
  if (type === 'video') return <Video className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

function IssueCard({
  issue,
  active,
  onEdit,
}: {
  issue: EotIssue
  active: boolean
  onEdit: (issue: EotIssue) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onEdit(issue)}
      className={`w-full rounded-[18px] border px-4 py-4 text-left transition ${
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_16px_40px_rgba(15,23,42,0.22)]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={formatEnumLabel(issue.severity)} tone={issue.severity} />
        <StatusBadge label={formatEnumLabel(issue.status)} tone={issue.status} />
        {issue.recommendation?.decision ? (
          <StatusBadge
            label={formatEnumLabel(issue.recommendation.decision)}
            tone={issue.recommendation.decision}
          />
        ) : null}
      </div>
      <p className={`mt-3 text-sm font-semibold ${active ? 'text-white' : 'text-slate-950'}`}>
        {issue.title}
      </p>
      <p className={`mt-2 text-sm leading-6 ${active ? 'text-slate-200' : 'text-slate-600'}`}>
        {issue.description?.trim() || 'No narrative has been added for this issue yet.'}
      </p>
      <div className={`mt-3 text-xs uppercase tracking-[0.14em] ${active ? 'text-slate-300' : 'text-slate-400'}`}>
        {issue.linked_evidence.length} linked evidence item{issue.linked_evidence.length === 1 ? '' : 's'}
      </div>
    </button>
  )
}

export function EotWorkspaceClient({
  caseId,
  defaultActor,
}: WorkspaceClientProps) {
  const searchParams = useSearchParams()
  const search = searchParams.get('search')?.trim().toLowerCase() ?? ''

  const [workspace, setWorkspace] = useState<EotCaseWorkspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const hasLoadedWorkspaceRef = useRef(false)

  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null)
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
        const nextWorkspace = await getEotCaseWorkspace(caseId)

        if (!cancelled) {
          setWorkspace(nextWorkspace)
          setSelectedEvidenceId((current) => current ?? nextWorkspace.evidence[0]?.id ?? null)
          setError(null)
          setRefreshError(null)
          hasLoadedWorkspaceRef.current = true
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : 'Unable to load the case workspace.'

          if (hasExistingWorkspace) {
            setRefreshError(`${message} Showing the last loaded workspace data.`)
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
  }, [caseId])

  const visibleEvidence = useMemo(() => {
    return (
      workspace?.evidence.filter((item) => {
        if (!search) return true
        return [item.area ?? '', item.type, item.file_url, item.uploaded_by].join(' ').toLowerCase().includes(search)
      }) ?? []
    )
  }, [search, workspace])

  const visibleIssues = useMemo(() => {
    return (
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
    )
  }, [search, workspace])

  const visibleMessages = useMemo(() => {
    return (
      workspace?.messages.filter((item) => {
        if (!search) return true
        return [item.sender_type, item.sender_id, item.content].join(' ').toLowerCase().includes(search)
      }) ?? []
    )
  }, [search, workspace])

  const selectedEvidence = useMemo(() => {
    if (!visibleEvidence.length) return null
    return (
      visibleEvidence.find((item) => item.id === selectedEvidenceId) ??
      visibleEvidence[0] ??
      null
    )
  }, [selectedEvidenceId, visibleEvidence])

  useEffect(() => {
    if (!visibleEvidence.length) {
      setSelectedEvidenceId(null)
      return
    }

    if (!selectedEvidence) {
      setSelectedEvidenceId(visibleEvidence[0].id)
    }
  }, [selectedEvidence, visibleEvidence])

  async function refreshWorkspaceNow() {
    setRefreshing(true)
    setRefreshError(null)

    try {
      const nextWorkspace = await getEotCaseWorkspace(caseId)
      setWorkspace(nextWorkspace)
      setSelectedEvidenceId((current) => current ?? nextWorkspace.evidence[0]?.id ?? null)
      setError(null)
      hasLoadedWorkspaceRef.current = true
      return nextWorkspace
    } catch (refreshFailure) {
      const message =
        refreshFailure instanceof Error
          ? refreshFailure.message
          : 'Unable to refresh the case workspace.'
      setRefreshError(`${message} Showing the last loaded workspace data.`)
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

    if (evidencePending) return

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
      await refreshWorkspaceNow()
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

    if (issuePending) return

    if (!issueForm.title.trim()) {
      setIssueError('Issue title is required.')
      return
    }

    setIssuePending(true)
    setIssueError(null)

    const payload: UpsertEotIssueInput = {
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
      await refreshWorkspaceNow()
    } catch (submitError) {
      setIssueError(submitError instanceof Error ? submitError.message : 'Unable to save the issue.')
    } finally {
      setIssuePending(false)
    }
  }

  async function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (messagePending) return

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
      case_id: caseId,
      sender_type: messageForm.senderType,
      sender_id: messageForm.senderId.trim(),
      content: messageForm.content.trim(),
      attachments,
    }

    try {
      await createEotMessage(payload)
      setMessageForm(DEFAULT_MESSAGE_FORM(defaultActor))
      await refreshWorkspaceNow()
    } catch (submitError) {
      setMessageError(
        submitError instanceof Error ? submitError.message : 'Unable to send the case message.'
      )
    } finally {
      setMessagePending(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="space-y-4">
          <SkeletonPanel />
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
        <div className="space-y-4">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <SectionCard className="px-6 py-10">
        <EmptyState
          title="Unable to load workspace"
          body={error ?? 'The case workspace could not be loaded.'}
        />
      </SectionCard>
    )
  }

  const progress = getCaseProgress(workspace.case.status)
  const highSeverityOpenIssues = getOpenHighSeverityIssues(workspace.issues)
  const claimReadiness = getClaimReadiness(workspace)
  const timelineItems = buildWorkspaceTimeline(workspace)

  return (
    <div className="space-y-6">
      {refreshError ? (
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {refreshError}
        </div>
      ) : null}

      <PageHeader
        eyebrow="Case workspace"
        title={workspace.property.name}
        description={workspace.case.summary?.trim() || 'No case summary has been recorded yet.'}
        actions={
          <>
            <Link
              href="/eot"
              className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to cases
            </Link>
            <button
              type="button"
              onClick={() => void refreshWorkspaceNow()}
              className="inline-flex items-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <SectionCard className="px-6 py-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={formatEnumLabel(workspace.case.status)} tone={workspace.case.status} />
                  <StatusBadge label={formatEnumLabel(workspace.case.priority)} tone={workspace.case.priority} />
                  <StatusBadge label={claimReadiness.label} tone={claimReadiness.tone === 'ready' ? 'ready_for_claim' : claimReadiness.tone === 'attention' ? 'attention' : 'document'} />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {workspace.tenancy.tenant_name}
                  {workspace.tenancy.tenant_email ? ` · ${workspace.tenancy.tenant_email}` : ''}
                </p>
              </div>

              <ProgressBar
                value={progress}
                label={
                  <>
                    <span>Workflow completion</span>
                    <span>{progress}%</span>
                  </>
                }
              />

              <div className="grid gap-4 md:grid-cols-3">
                <MetaItem label="Last activity" value={formatDateTime(workspace.case.last_activity_at)} />
                <MetaItem
                  label="Deposit"
                  value={
                    workspace.tenancy.deposit_amount
                      ? formatCurrency(workspace.tenancy.deposit_amount)
                      : 'Not recorded'
                  }
                />
                <MetaItem
                  label="Property reference"
                  value={workspace.property.reference || 'Not set'}
                />
              </div>
            </div>

            <DetailPanel
              title="Operator focus"
              description="Priority items surfaced from current evidence, issues, and output state."
            >
              <KeyValueList
                items={[
                  {
                    label: 'High severity issues',
                    value: highSeverityOpenIssues.length || 'None',
                  },
                  {
                    label: 'Evidence logged',
                    value: workspace.evidence.length,
                  },
                  {
                    label: 'Recommendations',
                    value: workspace.recommendations.length,
                  },
                  {
                    label: 'Claim readiness',
                    value: claimReadiness.label,
                  },
                ]}
              />
              <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                {claimReadiness.description}
              </div>
            </DetailPanel>
          </div>
        </SectionCard>

        <DetailPanel
          title="Case metadata"
          description="Property, tenancy, and audit context."
        >
          <KeyValueList
            items={[
              { label: 'Case ID', value: workspace.case.id.slice(0, 8) },
              { label: 'Created', value: formatDate(workspace.case.created_at) },
              { label: 'Tenancy dates', value: `${formatDate(workspace.tenancy.start_date)} to ${formatDate(workspace.tenancy.end_date)}` },
              { label: 'Address', value: formatAddress([
                workspace.property.address_line_1,
                workspace.property.address_line_2,
                workspace.property.city,
                workspace.property.postcode,
                workspace.property.country_code,
              ]) },
            ]}
          />
          {workspace.tenancy.notes ? (
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
              {workspace.tenancy.notes}
            </div>
          ) : null}
        </DetailPanel>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <KPIStatCard label="Evidence" value={workspace.evidence.length} detail="Registered evidence items." />
            <KPIStatCard label="Open issues" value={workspace.issues.filter((issue) => issue.status !== 'resolved').length} detail="Issues still under operator review." tone="warning" />
            <KPIStatCard label="Resolved issues" value={workspace.issues.filter((issue) => issue.status === 'resolved').length} detail="Issues already closed out." tone="accent" />
            <KPIStatCard label="Case notes" value={workspace.messages.length} detail="Logged communication and internal updates." />
          </section>

          <WorkspaceSection
            title="Evidence review"
            description="Preview-first evidence workflow with structured metadata and direct intake controls."
            aside={
              <div className="flex items-center gap-2">
                <StatusBadge label={`${visibleEvidence.length} visible`} tone="document" />
                <StatusBadge label={`${workspace.documents.length} documents`} tone="document" />
              </div>
            }
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-3">
                {visibleEvidence.length === 0 ? (
                  <EmptyState
                    title="No evidence recorded"
                    body="Register the first evidence item to begin issue assessment."
                  />
                ) : (
                  visibleEvidence.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedEvidenceId(item.id)}
                      className={`w-full rounded-[18px] border px-4 py-4 text-left transition ${
                        selectedEvidence?.id === item.id
                          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_16px_40px_rgba(15,23,42,0.22)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-[12px] ${
                          selectedEvidence?.id === item.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <EvidenceIcon type={item.type} />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${selectedEvidence?.id === item.id ? 'text-white' : 'text-slate-950'}`}>
                            {item.area || formatEnumLabel(item.type)}
                          </p>
                          <p className={`mt-1 truncate text-sm ${selectedEvidence?.id === item.id ? 'text-slate-200' : 'text-slate-600'}`}>
                            {item.file_url}
                          </p>
                        </div>
                      </div>
                      <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs ${selectedEvidence?.id === item.id ? 'text-slate-300' : 'text-slate-400'}`}>
                        <span>{item.uploaded_by}</span>
                        <span>•</span>
                        <span>{formatDateTime(item.created_at)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="space-y-4">
                {selectedEvidence ? (
                  <SectionCard className="overflow-hidden border-slate-200">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={formatEnumLabel(selectedEvidence.type)} tone={selectedEvidence.type} />
                        {selectedEvidence.area ? (
                          <StatusBadge label={selectedEvidence.area} tone="document" />
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-950">{selectedEvidence.file_url}</p>
                    </div>

                    <div className="px-5 py-5">
                      {selectedEvidence.type === 'image' ? (
                        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
                          {/* Remote evidence URLs are provided by the case system and are not known at build time. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedEvidence.file_url}
                            alt={selectedEvidence.area || 'Evidence preview'}
                            className="h-[360px] w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="rounded-[20px] border border-dashed border-slate-300 bg-[#f8fafc] px-5 py-10 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-slate-600 shadow-sm">
                            <EvidenceIcon type={selectedEvidence.type} />
                          </div>
                          <p className="mt-4 text-sm font-semibold text-slate-950">
                            Preview opens in a new tab
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Use the source link for full-size document or media review.
                          </p>
                          <a
                            href={selectedEvidence.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
                          >
                            Open source
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      )}

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <MetaItem label="Uploaded by" value={selectedEvidence.uploaded_by} />
                        <MetaItem label="Created" value={formatDateTime(selectedEvidence.created_at)} />
                      </div>

                      {selectedEvidence.metadata ? (
                        <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-950">
                          <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-slate-200">
                            {JSON.stringify(selectedEvidence.metadata, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  </SectionCard>
                ) : null}

                <SectionCard className="px-5 py-5">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-950">Add evidence</h3>
                  </div>
                  <form className="mt-4 grid gap-4" onSubmit={handleEvidenceSubmit}>
                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Evidence URL</span>
                      <input
                        required
                        value={evidenceForm.fileUrl}
                        onChange={(event) =>
                          setEvidenceForm((current) => ({ ...current, fileUrl: event.target.value }))
                        }
                        className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                        placeholder="https://..."
                      />
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-sm">
                        <span className="font-medium text-slate-700">Type</span>
                        <select
                          value={evidenceForm.type}
                          onChange={(event) =>
                            setEvidenceForm((current) => ({
                              ...current,
                              type: event.target.value as EotEvidenceType,
                            }))
                          }
                          className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                        >
                          {(['document', 'image', 'video'] as EotEvidenceType[]).map((type) => (
                            <option key={type} value={type}>
                              {formatEnumLabel(type)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm">
                        <span className="font-medium text-slate-700">Area</span>
                        <input
                          value={evidenceForm.area}
                          onChange={(event) =>
                            setEvidenceForm((current) => ({ ...current, area: event.target.value }))
                          }
                          className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                          placeholder="Kitchen, hallway, inventory..."
                        />
                      </label>
                    </div>
                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Uploaded by</span>
                      <input
                        required
                        value={evidenceForm.uploadedBy}
                        onChange={(event) =>
                          setEvidenceForm((current) => ({ ...current, uploadedBy: event.target.value }))
                        }
                        className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Metadata JSON</span>
                      <textarea
                        value={evidenceForm.metadata}
                        onChange={(event) =>
                          setEvidenceForm((current) => ({ ...current, metadata: event.target.value }))
                        }
                        className="mt-2 min-h-24 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-slate-900"
                        placeholder='{"source":"inventory","page":"12"}'
                      />
                    </label>
                    {evidenceError ? (
                      <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {evidenceError}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={evidencePending}
                      className="inline-flex items-center justify-center rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {evidencePending ? 'Saving evidence...' : 'Add evidence'}
                    </button>
                  </form>
                </SectionCard>
              </div>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            title="Issues and recommendations"
            description="Link evidence, capture issue responsibility, and record charge recommendations in one review surface."
            aside={
              <div className="flex items-center gap-2">
                <StatusBadge label={`${visibleIssues.length} visible`} tone="document" />
                {highSeverityOpenIssues.length ? (
                  <StatusBadge label={`${highSeverityOpenIssues.length} high severity`} tone="risk" />
                ) : null}
              </div>
            }
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-3">
                {visibleIssues.length === 0 ? (
                  <EmptyState
                    title="No issues recorded"
                    body="Assess evidence and log the first issue to start recommendation review."
                  />
                ) : (
                  visibleIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      active={issueForm.issueId === issue.id}
                      onEdit={startEditingIssue}
                    />
                  ))
                )}
              </div>

              <SectionCard className="px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {issueForm.issueId ? 'Edit issue' : 'Add issue'}
                  </h3>
                  {issueForm.issueId ? (
                    <button
                      type="button"
                      onClick={resetIssueForm}
                      className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      Clear selection
                    </button>
                  ) : null}
                </div>

                <form className="mt-4 grid gap-4" onSubmit={handleIssueSubmit}>
                  <label className="text-sm">
                    <span className="font-medium text-slate-700">Issue title</span>
                    <input
                      required
                      value={issueForm.title}
                      onChange={(event) =>
                        setIssueForm((current) => ({ ...current, title: event.target.value }))
                      }
                      className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                      placeholder="Damage, cleaning, missing item..."
                    />
                  </label>

                  <label className="text-sm">
                    <span className="font-medium text-slate-700">Description</span>
                    <textarea
                      value={issueForm.description}
                      onChange={(event) =>
                        setIssueForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className="mt-2 min-h-28 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-slate-900"
                      placeholder="What happened, where, and why does it matter?"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Severity</span>
                      <select
                        value={issueForm.severity}
                        onChange={(event) =>
                          setIssueForm((current) => ({
                            ...current,
                            severity: event.target.value as EotIssueSeverity,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                      >
                        {(['low', 'medium', 'high'] as EotIssueSeverity[]).map((severity) => (
                          <option key={severity} value={severity}>
                            {formatEnumLabel(severity)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Status</span>
                      <select
                        value={issueForm.status}
                        onChange={(event) =>
                          setIssueForm((current) => ({
                            ...current,
                            status: event.target.value as EotIssueStatus,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                      >
                        {(['open', 'resolved', 'disputed'] as EotIssueStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {formatEnumLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium text-slate-700">Link evidence</span>
                    <div className="mt-2 grid gap-2">
                      {workspace.evidence.length === 0 ? (
                        <p className="rounded-[14px] border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                          Add evidence first to link it to this issue.
                        </p>
                      ) : (
                        workspace.evidence.map((evidence) => {
                          const checked = issueForm.evidenceIds.includes(evidence.id)

                          return (
                            <label
                              key={evidence.id}
                              className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-3 py-3"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setIssueForm((current) => ({
                                    ...current,
                                    evidenceIds: checked
                                      ? current.evidenceIds.filter((id) => id !== evidence.id)
                                      : [...current.evidenceIds, evidence.id],
                                  }))
                                }
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900">
                                  {evidence.area || formatEnumLabel(evidence.type)}
                                </p>
                                <p className="truncate text-sm text-slate-500">{evidence.file_url}</p>
                              </div>
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Recommendation</span>
                      <select
                        value={issueForm.decision}
                        onChange={(event) =>
                          setIssueForm((current) => ({
                            ...current,
                            decision: event.target.value as EotRecommendationDecision | '',
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                      >
                        <option value="">No recommendation yet</option>
                        {(['charge', 'partial', 'no_charge'] as EotRecommendationDecision[]).map(
                          (decision) => (
                            <option key={decision} value={decision}>
                              {formatEnumLabel(decision)}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Estimated cost</span>
                      <input
                        value={issueForm.estimatedCost}
                        onChange={(event) =>
                          setIssueForm((current) => ({
                            ...current,
                            estimatedCost: event.target.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                        placeholder="250.00"
                      />
                    </label>
                  </div>

                  <label className="text-sm">
                    <span className="font-medium text-slate-700">Recommendation rationale</span>
                    <textarea
                      value={issueForm.rationale}
                      onChange={(event) =>
                        setIssueForm((current) => ({ ...current, rationale: event.target.value }))
                      }
                      className="mt-2 min-h-24 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-slate-900"
                      placeholder="Explain liability, confidence, and proportionality."
                    />
                  </label>

                  {issueError ? (
                    <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {issueError}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={issuePending}
                      className="inline-flex items-center justify-center rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {issuePending ? 'Saving issue...' : issueForm.issueId ? 'Update issue' : 'Add issue'}
                    </button>
                    {issueForm.issueId ? (
                      <button
                        type="button"
                        onClick={resetIssueForm}
                        className="inline-flex items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              </SectionCard>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            title="Claim output review"
            description="Review the case output in a document-style layout with traceability back to evidence and issue decisions."
          >
            {workspace.claim ? (
              <div className="space-y-5">
                <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Claim output
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        {formatCurrency(workspace.claim.total_amount)}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Generated {formatDateTime(workspace.claim.generated_at)} and updated{' '}
                        {formatDateTime(workspace.claim.updated_at)}.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label="Claim generated" tone="ready_for_claim" />
                      <StatusBadge label={`${workspace.issues.length} source issues`} tone="document" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <SectionCard className="overflow-hidden">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-semibold text-slate-950">Breakdown</h3>
                    </div>
                    <div className="overflow-hidden rounded-b-[24px] bg-slate-950">
                      <pre className="overflow-x-auto px-5 py-5 text-xs leading-6 text-slate-200">
                        {JSON.stringify(workspace.claim.breakdown, null, 2)}
                      </pre>
                    </div>
                  </SectionCard>

                  <DetailPanel
                    title="Traceability"
                    description="Recommended charges and supporting evidence."
                  >
                    {workspace.issues.length === 0 ? (
                      <EmptyState
                        title="No issue traceability"
                        body="Issues will appear here once they are linked to the claim package."
                      />
                    ) : (
                      workspace.issues.map((issue) => (
                        <div key={issue.id} className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge label={formatEnumLabel(issue.severity)} tone={issue.severity} />
                            {issue.recommendation?.decision ? (
                              <StatusBadge
                                label={formatEnumLabel(issue.recommendation.decision)}
                                tone={issue.recommendation.decision}
                              />
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm font-semibold text-slate-950">{issue.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {issue.recommendation?.rationale || issue.description || 'No narrative recorded.'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {issue.linked_evidence.map((item) => (
                              <StatusBadge
                                key={item.id}
                                label={item.area || formatEnumLabel(item.type)}
                                tone={item.type}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </DetailPanel>
                </div>
              </div>
            ) : (
              <EmptyState
                title={claimReadiness.label}
                body={claimReadiness.description}
                action={
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <TriangleAlert className="h-4 w-4" />
                    Track issue recommendations and move the case to ready-for-claim when the file is complete.
                  </div>
                }
              />
            )}
          </WorkspaceSection>
        </div>

        <div className="space-y-6">
          <DetailPanel
            title="Activity timeline"
            description="Most recent case events across intake, evidence, issue review, and messaging."
          >
            <ActivityTimeline
              items={timelineItems.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.detail,
                meta: item.meta,
                tone: item.tone,
              }))}
            />
          </DetailPanel>

          <DetailPanel
            title="Supporting documents"
            description="Linked case documents and document records."
          >
            {workspace.documents.length === 0 ? (
              <EmptyState
                title="No supporting documents"
                body="This case does not yet have linked document records."
              />
            ) : (
              workspace.documents.map((document) => (
                <a
                  key={document.id}
                  href={document.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[18px] border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{document.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatEnumLabel(document.document_type)}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                </a>
              ))
            )}
          </DetailPanel>

          <DetailPanel
            title="Case notes and communication"
            description="Internal operator updates and outbound case communication log."
          >
            <div className="space-y-3">
              {visibleMessages.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  body="Case notes and outbound communication will appear here."
                />
              ) : (
                visibleMessages.map((message) => (
                  <div key={message.id} className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={formatEnumLabel(message.sender_type)} tone={message.sender_type} />
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{message.content}</p>
                  </div>
                ))
              )}
            </div>

            <form className="grid gap-4" onSubmit={handleMessageSubmit}>
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-950">Add case note</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="font-medium text-slate-700">Sender type</span>
                  <select
                    value={messageForm.senderType}
                    onChange={(event) =>
                      setMessageForm((current) => ({
                        ...current,
                        senderType: event.target.value as EotMessageSenderType,
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-slate-900"
                  >
                    {(['manager', 'landlord', 'tenant'] as EotMessageSenderType[]).map((senderType) => (
                      <option key={senderType} value={senderType}>
                        {formatEnumLabel(senderType)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-medium text-slate-700">Sender ID</span>
                  <input
                    required
                    value={messageForm.senderId}
                    onChange={(event) =>
                      setMessageForm((current) => ({ ...current, senderId: event.target.value }))
                    }
                    className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-slate-900"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="font-medium text-slate-700">Message</span>
                <textarea
                  required
                  value={messageForm.content}
                  onChange={(event) =>
                    setMessageForm((current) => ({ ...current, content: event.target.value }))
                  }
                  className="mt-2 min-h-24 w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-900"
                  placeholder="Record an operator note or outbound case update."
                />
              </label>

              <label className="text-sm">
                <span className="font-medium text-slate-700">Attachments JSON</span>
                <textarea
                  value={messageForm.attachments}
                  onChange={(event) =>
                    setMessageForm((current) => ({ ...current, attachments: event.target.value }))
                  }
                  className="mt-2 min-h-20 w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-900"
                  placeholder='[{"name":"invoice.pdf","url":"https://..."}]'
                />
              </label>

              {messageError ? (
                <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {messageError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={messagePending}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {messagePending ? 'Saving note...' : 'Add case note'}
              </button>
            </form>
          </DetailPanel>
        </div>
      </div>
    </div>
  )
}
