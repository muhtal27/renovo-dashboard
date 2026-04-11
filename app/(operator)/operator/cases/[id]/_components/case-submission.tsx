'use client'

import { CheckCircle2, Loader2, RefreshCw, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ActivityTimeline, EmptyState } from '@/app/operator-ui'
import { ClaimSummaryCard } from '@/app/(operator)/operator/cases/[id]/_components/claim-summary-card'
import { MessageThreadCard } from '@/app/(operator)/operator/cases/[id]/_components/message-thread-card'
import {
  WorkspaceActionButton,
  WorkspaceBadge,
  WorkspaceMetricCard,
  WorkspaceNotice,
  WorkspaceProgressBar,
  WorkspaceTable,
  WorkspaceTableCell,
  WorkspaceTableHeaderCell,
  WorkspaceTableRow,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import {
  formatCurrency,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import {
  checkClaimStatus,
  getEotCaseSubmission,
  submitClaimToScheme,
  uploadEvidenceToScheme,
} from '@/lib/eot-api'
import { toTimestamp } from '@/lib/operator-checkout-workspace-helpers'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'
import type { EotCaseSubmission, EotIssue } from '@/lib/eot-types'

type SubmissionTimelineTone = 'accent' | 'danger' | 'default' | 'warning'

function getSubmissionStatusPresentation(data: OperatorCheckoutWorkspaceData) {
  if (data.checkoutCase?.submittedAt || data.workspace.case.status === 'submitted') {
    return {
      label: 'Submitted',
      detail: 'The checkout has already been marked as submitted in the structured workspace.',
      tone: 'submitted' as const,
    }
  }

  if (data.checkoutCase?.submissionType === 'dispute' || data.workspace.case.status === 'disputed') {
    return {
      label: 'Dispute path',
      detail: 'The submission path is set to dispute handling and should retain full claim traceability.',
      tone: 'disputed' as const,
    }
  }

  if (data.workspace.claim || data.workspace.case.status === 'ready_for_claim') {
    return {
      label: 'Ready for submission',
      detail: 'The workspace has a claim-ready output and can be reviewed for final sign-off.',
      tone: 'accepted' as const,
    }
  }

  return {
    label: 'Still in review',
    detail: 'Submission work is not complete yet because the final claim package is still pending.',
    tone: 'pending' as const,
  }
}

function getRecommendationTone(issue: EotIssue) {
  switch (issue.recommendation?.decision) {
    case 'charge':
      return 'warning' as const
    case 'partial':
      return 'shared' as const
    case 'no_charge':
      return 'accepted' as const
    default:
      return 'neutral' as const
  }
}

function getTimelineTone(value: string) {
  const normalized = value.toLowerCase()

  if (
    normalized.includes('submit') ||
    normalized.includes('sent') ||
    normalized.includes('claim') ||
    normalized.includes('generated')
  ) {
    return 'accent' as const
  }

  if (
    normalized.includes('dispute') ||
    normalized.includes('liability') ||
    normalized.includes('charge')
  ) {
    return 'danger' as const
  }

  if (
    normalized.includes('review') ||
    normalized.includes('processing') ||
    normalized.includes('analyse')
  ) {
    return 'warning' as const
  }

  return 'default' as const
}

function buildFallbackTimeline(data: OperatorCheckoutWorkspaceData) {
  const items: Array<{
    detail: string
    id: string
    timestamp: string
    title: string
    tone: SubmissionTimelineTone
  }> = []
  const latestSentDraft = [...data.emailDrafts]
    .filter((draft) => draft.sentAt)
    .sort((left, right) => toTimestamp(right.sentAt) - toTimestamp(left.sentAt))[0]

  if (data.workspace.claim?.generated_at) {
    items.push({
      id: `claim-generated-${data.workspace.claim.id}`,
      timestamp: data.workspace.claim.generated_at,
      title: 'Claim pack generated',
      detail: `Current deductions total ${formatCurrency(data.workspace.claim.total_amount)}.`,
      tone: 'accent',
    })
  }

  if (latestSentDraft?.sentAt) {
    items.push({
      id: `draft-sent-${latestSentDraft.id}`,
      timestamp: latestSentDraft.sentAt,
      title: 'Outbound draft sent',
      detail: latestSentDraft.subject?.trim() || formatEnumLabel(latestSentDraft.draftType),
      tone: 'accent',
    })
  }

  if (data.checkoutCase?.submittedAt) {
    items.push({
      id: `submission-recorded-${data.checkoutCase.id}`,
      timestamp: data.checkoutCase.submittedAt,
      title: 'Submission recorded',
      detail: `The structured workspace was marked for ${formatEnumLabel(data.checkoutCase.submissionType ?? 'submission').toLowerCase()}.`,
      tone: 'accent',
    })
  }

  if (data.checkoutCase?.negotiationNotes?.trim()) {
    items.push({
      id: `negotiation-notes-${data.checkoutCase.id}`,
      timestamp: data.checkoutCase.updatedAt,
      title: 'Negotiation notes updated',
      detail: data.checkoutCase.negotiationNotes.trim().slice(0, 140),
      tone: getTimelineTone(data.checkoutCase.negotiationNotes),
    })
  }

  if (data.workspace.messages.length > 0) {
    const latestMessage = [...data.workspace.messages].sort((left, right) => {
      return toTimestamp(right.created_at) - toTimestamp(left.created_at)
    })[0]

    items.push({
      id: `message-${latestMessage.id}`,
      timestamp: latestMessage.created_at,
      title: `Latest ${latestMessage.sender_type} message`,
      detail: latestMessage.content.trim().slice(0, 140) || 'A new case message was added.',
      tone: getTimelineTone(latestMessage.sender_type),
    })
  }

  return items
    .sort((left, right) => toTimestamp(right.timestamp) - toTimestamp(left.timestamp))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      meta: formatDateTime(item.timestamp),
      tone: item.tone,
    }))
}

function buildSubmissionTimeline(data: OperatorCheckoutWorkspaceData) {
  const timelineItems =
    data.timeline.length > 0
      ? [...data.timeline]
          .sort((left, right) => toTimestamp(right.eventDate) - toTimestamp(left.eventDate))
          .slice(0, 6)
          .map((item) => ({
            id: item.id,
            title: item.eventType.trim() || 'Activity',
            detail: item.eventDescription.trim() || 'An event was recorded for this case.',
            meta: formatDateTime(item.eventDate),
            tone: getTimelineTone(`${item.eventType} ${item.eventDescription}`),
          }))
      : buildFallbackTimeline(data)

  return timelineItems
}

export function CaseSubmission({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isRefreshing, startTransition] = useTransition()
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const [submissionData, setSubmissionData] = useState<EotCaseSubmission | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false)
  const [isSubmittingToScheme, setIsSubmittingToScheme] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false)
  const [schemeStatusData, setSchemeStatusData] = useState<import('@/lib/eot-types').EotClaimStatusResult | null>(null)

  const caseStatus = data.workspace.case.status
  const caseId = data.workspace.case.id
  const claim = data.workspace.claim

  async function handleTransition(targetStatus: string) {
    setIsTransitioning(true)
    setTransitionError(null)
    try {
      const response = await fetch(`/api/eot/cases/${caseId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || 'Failed to update case status.')
      }
      startTransition(() => { router.refresh() })
    } catch (error) {
      setTransitionError(error instanceof Error ? error.message : 'Failed to update case status.')
    } finally {
      setIsTransitioning(false)
    }
  }

  async function handleSubmitToScheme() {
    setIsSubmittingToScheme(true)
    setTransitionError(null)
    try {
      const result = await submitClaimToScheme(caseId)
      toast.success(
        result.scheme_reference
          ? `Claim submitted to ${formatEnumLabel(result.scheme_provider ?? 'scheme')}: ${result.scheme_reference}`
          : 'Claim submitted to deposit scheme'
      )
      startTransition(() => { router.refresh() })
    } catch (error: any) {
      // 503 = no scheme connected, fall back to plain transition
      if (error?.status === 503) {
        toast('No deposit scheme connected. Submitting as manual claim.')
        await handleTransition('submitted')
        return
      }
      setTransitionError(
        error instanceof Error ? error.message : 'Failed to submit claim to deposit scheme.'
      )
    } finally {
      setIsSubmittingToScheme(false)
    }
  }

  async function handleCheckStatus() {
    setIsCheckingStatus(true)
    try {
      const status = await checkClaimStatus(caseId)
      setSchemeStatusData(status)
      toast.success(`Status: ${formatEnumLabel(status.scheme_status ?? 'unknown')}`)
      startTransition(() => { router.refresh() })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to check claim status.')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  async function handleUploadEvidence() {
    // Upload all case documents to the scheme
    const docs = data.workspace.documents
    if (docs.length === 0) {
      toast.error('No documents to upload. Add documents to the case first.')
      return
    }
    setIsUploadingEvidence(true)
    try {
      const files = docs.map((doc) => ({
        name: doc.name,
        document_type: doc.document_type,
        url: doc.file_url,
        mime_type: null,
      }))
      await uploadEvidenceToScheme(caseId, files)
      toast.success(`${files.length} document${files.length !== 1 ? 's' : ''} uploaded to scheme`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload evidence.')
    } finally {
      setIsUploadingEvidence(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadSubmission() {
      setIsLoadingSubmission(true)
      setSubmissionError(null)

      try {
        const result = await getEotCaseSubmission(data.workspace.case.id)

        if (!cancelled) {
          setSubmissionData(result)
        }
      } catch (error) {
        if (!cancelled) {
          setSubmissionError(
            error instanceof Error ? error.message : 'Unable to load submission traceability right now.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSubmission(false)
        }
      }
    }

    void loadSubmission()

    return () => {
      cancelled = true
    }
  }, [data.workspace.case.id])

  const submissionStatus = getSubmissionStatusPresentation(data)
  const fallbackSubmission: EotCaseSubmission = {
    claim: data.workspace.claim,
    issues: data.workspace.issues,
  }
  const activeSubmission = submissionData ?? fallbackSubmission
  const coreDocumentCount = [
    data.workspace.reportDocuments.checkIn,
    data.workspace.reportDocuments.checkOut,
    data.workspace.reportDocuments.tenancyAgreement,
  ].filter(Boolean).length
  const sentDraftCount = data.emailDrafts.filter((draft) => draft.status === 'sent').length
  const linkedEvidenceCount = activeSubmission.issues.reduce((sum, issue) => sum + issue.linked_evidence.length, 0)
  const readinessChecks = [
    Boolean(activeSubmission.claim),
    Boolean(data.checkoutCase?.submissionType),
    sentDraftCount > 0,
    coreDocumentCount >= 2,
  ]
  const readinessProgress =
    data.checkoutCase?.submittedAt || data.workspace.case.status === 'submitted'
      ? 100
      : Math.round((readinessChecks.filter(Boolean).length / readinessChecks.length) * 100)
  const timelineItems = buildSubmissionTimeline(data)

  const submissionNotice =
    data.checkoutCase?.submittedAt || data.workspace.case.status === 'submitted'
      ? {
          body: 'The structured checkout already records a submission event. Use this tab to audit the final pack, source issues, and communication trail.',
          title: 'Submission recorded',
          tone: 'success' as const,
        }
      : activeSubmission.claim
        ? {
            body: 'A claim package exists, so operators can perform final readiness checks and review source issue traceability before marking the case as submitted.',
            title: 'Submission pack available',
            tone: 'info' as const,
          }
        : {
            body: 'A formal claim pack has not been generated yet. Submission review stays limited until the final claim output exists.',
            title: 'Submission pack not ready',
            tone: 'warning' as const,
          }

  return (
    <div className="space-y-4">
      <WorkspaceNotice
        body={submissionNotice.body}
        title={submissionNotice.title}
        tone={submissionNotice.tone}
      />

      {submissionError ? (
        <WorkspaceNotice
          body="The dedicated submission traceability endpoint could not be loaded, so this tab is currently showing the already-loaded workspace claim and issue data instead."
          title={submissionError}
          tone="warning"
        />
      ) : null}

      <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
        <WorkspaceMetricCard
          detail={submissionStatus.detail}
          label="Submission state"
          tone={
            data.checkoutCase?.submittedAt || data.workspace.case.status === 'submitted'
              ? 'success'
              : activeSubmission.claim
                ? 'info'
                : 'warning'
          }
          value={submissionStatus.label}
        />
        <WorkspaceMetricCard
          detail={activeSubmission.claim ? `Generated ${formatDateTime(activeSubmission.claim.generated_at)}` : 'No formal claim record yet'}
          label="Claim pack"
          tone={activeSubmission.claim ? 'success' : 'warning'}
          value={activeSubmission.claim ? formatCurrency(activeSubmission.claim.total_amount) : 'Pending'}
        />
        <WorkspaceMetricCard
          detail={`${linkedEvidenceCount} linked evidence item${linkedEvidenceCount === 1 ? '' : 's'}`}
          label="Source issues"
          tone={activeSubmission.issues.length > 0 ? 'default' : 'warning'}
          value={activeSubmission.issues.length}
        />
        <WorkspaceMetricCard
          detail={`${sentDraftCount} sent draft${sentDraftCount === 1 ? '' : 's'} · ${coreDocumentCount}/3 core docs linked`}
          label="Final readiness"
          tone={readinessProgress === 100 ? 'success' : readinessProgress >= 50 ? 'info' : 'warning'}
          value={`${readinessProgress}%`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="border-b border-zinc-200 pb-4">
          <h3 className="text-sm font-semibold text-zinc-950">Submission pack review</h3>

          <div className="mt-2 space-y-4">
            <ClaimSummaryCard workspace={data.workspace} />

            {activeSubmission.claim ? (
              <div className="border border-zinc-200 bg-zinc-50/70 px-5 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                      Submission pack
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-zinc-950">
                      {formatCurrency(activeSubmission.claim.total_amount)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      Generated {formatDateTime(activeSubmission.claim.generated_at)} and updated{' '}
                      {formatDateTime(activeSubmission.claim.updated_at)}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <WorkspaceBadge label={submissionStatus.label} tone={submissionStatus.tone} />
                    <WorkspaceBadge label={`${activeSubmission.issues.length} source issues`} tone="neutral" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="border-l-2 border-zinc-200 pl-4">
          <h3 className="text-sm font-semibold text-zinc-950">Submission checklist</h3>

          <div className="mt-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <WorkspaceBadge label={submissionStatus.label} tone={submissionStatus.tone} />
              {data.checkoutCase?.submissionType ? (
                <WorkspaceBadge
                  label={`Path: ${formatEnumLabel(data.checkoutCase.submissionType)}`}
                  tone={data.checkoutCase.submissionType === 'dispute' ? 'disputed' : 'submitted'}
                />
              ) : null}
            </div>

            <div className="border border-zinc-200 bg-zinc-50/70 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Readiness</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-zinc-950">
                {readinessProgress}%
              </p>
              <div className="mt-4">
                <WorkspaceProgressBar
                  max={100}
                  tone={readinessProgress === 100 ? 'success' : readinessProgress >= 50 ? 'warning' : 'danger'}
                  value={readinessProgress}
                />
              </div>
            </div>

            <dl className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Claim generated</dt>
                <dd className="text-sm font-medium text-zinc-950">
                  {activeSubmission.claim ? 'Yes' : 'No'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Submission path</dt>
                <dd className="text-right text-sm font-medium text-zinc-950">
                  {data.checkoutCase?.submissionType
                    ? formatEnumLabel(data.checkoutCase.submissionType)
                    : 'Not selected'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Sent outbound drafts</dt>
                <dd className="text-sm font-medium text-zinc-950">{sentDraftCount}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Core evidence pack</dt>
                <dd className="text-sm font-medium text-zinc-950">{coreDocumentCount}/3</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Recorded submission</dt>
                <dd className="text-right text-sm font-medium text-zinc-950">
                  {data.checkoutCase?.submittedAt ? formatDateTime(data.checkoutCase.submittedAt) : 'Not recorded'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <section className="border-b border-zinc-200 pb-4">
        <h3 className="text-sm font-semibold text-zinc-950">Breakdown and traceability</h3>

        <div className="mt-2 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <div className="min-w-0">
            {data.workspace.claimBreakdown.length > 0 ? (
              <div className="overflow-hidden border border-zinc-200 bg-white">
                <WorkspaceTable>
                  <thead>
                    <tr>
                      <WorkspaceTableHeaderCell>Line item</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Decision</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell align="right">Amount</WorkspaceTableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workspace.claimBreakdown.map((item) => (
                      <WorkspaceTableRow key={item.id}>
                        <WorkspaceTableCell emphasis="strong">{item.title}</WorkspaceTableCell>
                        <WorkspaceTableCell>
                          {item.decision ? (
                            <WorkspaceBadge
                              label={formatEnumLabel(item.decision)}
                              tone={
                                item.decision === 'charge'
                                  ? 'warning'
                                  : item.decision === 'partial'
                                    ? 'shared'
                                    : 'accepted'
                              }
                            />
                          ) : (
                            'Not set'
                          )}
                        </WorkspaceTableCell>
                        <WorkspaceTableCell align="right">{formatCurrency(item.estimatedCost)}</WorkspaceTableCell>
                      </WorkspaceTableRow>
                    ))}
                  </tbody>
                </WorkspaceTable>
              </div>
            ) : activeSubmission.claim ? (
              <div className="overflow-hidden border border-zinc-200 bg-zinc-950">
                <pre className="overflow-x-auto px-5 py-5 text-xs leading-6 text-zinc-200">
                  {JSON.stringify(activeSubmission.claim.breakdown, null, 2)}
                </pre>
              </div>
            ) : (
              <EmptyState
                body="A formal claim breakdown will appear here once the claim pack has been generated."
                title="No claim breakdown yet"
              />
            )}
          </div>

          <div className="border-l-2 border-zinc-200 pl-4">
            <h3 className="text-sm font-semibold text-zinc-950">Source issue traceability</h3>

            <div className="mt-2 space-y-4">
              {isLoadingSubmission ? (
                <WorkspaceNotice
                  body="Refreshing the submission traceability view from the existing case submission endpoint."
                  title="Loading latest submission traceability"
                  tone="info"
                />
              ) : null}

              {activeSubmission.issues.length > 0 ? (
                activeSubmission.issues.map((issue) => (
                  <div key={issue.id} className="border border-zinc-200 bg-white px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkspaceBadge label={formatEnumLabel(issue.severity)} tone="review" />
                      {issue.recommendation?.decision ? (
                        <WorkspaceBadge
                          label={formatEnumLabel(issue.recommendation.decision)}
                          tone={getRecommendationTone(issue)}
                        />
                      ) : null}
                      <WorkspaceBadge
                        label={`${issue.linked_evidence.length} evidence`}
                        tone={issue.linked_evidence.length > 0 ? 'info' : 'neutral'}
                      />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-zinc-950 [overflow-wrap:anywhere]">
                      {issue.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
                      {issue.recommendation?.rationale || issue.description || 'No narrative recorded.'}
                    </p>
                    {issue.linked_evidence.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {issue.linked_evidence.map((item) => (
                          <WorkspaceBadge
                            key={item.id}
                            label={item.area || formatEnumLabel(item.type)}
                            tone={item.type === 'image' ? 'info' : item.type === 'video' ? 'maintenance' : 'neutral'}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState
                  body="No source issues are currently attached to the submission package."
                  title="No source issue traceability"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="border-b border-zinc-200 pb-4">
          <h3 className="text-sm font-semibold text-zinc-950">Submission history</h3>

          <div className="mt-2">
            {timelineItems.length > 0 ? (
              <ActivityTimeline items={timelineItems} />
            ) : (
              <EmptyState
                body="No submission events have been recorded yet."
                title="No submission history"
              />
            )}
          </div>
        </section>

        <section className="border-b border-zinc-200 pb-4">
          <h3 className="text-sm font-semibold text-zinc-950">Communication trail</h3>

          <div className="mt-2">
            <MessageThreadCard workspace={data.workspace} />
          </div>
        </section>
      </div>

      {transitionError ? (
        <WorkspaceNotice body={transitionError} title="Transition failed" tone="warning" />
      ) : null}

      {/* ── Submit to deposit scheme ── */}
      {caseStatus === 'ready_for_claim' ? (
        <section className="border border-zinc-200 bg-zinc-50/70 px-6 py-5">
          <h3 className="text-sm font-semibold text-zinc-950">Submit to deposit scheme</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Submit your claim to the connected deposit scheme (TDS, DPS, etc). The claim breakdown,
            evidence, and tenancy details will be sent automatically. If no scheme is connected, the
            case will be marked as submitted for manual processing.
          </p>
          <div className="mt-4">
            <WorkspaceActionButton
              disabled={isSubmittingToScheme || isTransitioning || isRefreshing}
              tone="primary"
              onClick={handleSubmitToScheme}
            >
              {isSubmittingToScheme ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Submit to scheme
            </WorkspaceActionButton>
          </div>
        </section>
      ) : null}

      {/* ── Deposit scheme tracking (submitted/disputed) ── */}
      {(caseStatus === 'submitted' || caseStatus === 'disputed') ? (
        <section className="border border-zinc-200 bg-zinc-50/70 px-6 py-5">
          <h3 className="text-sm font-semibold text-zinc-950">Deposit scheme tracking</h3>

          {/* Scheme info bar */}
          {(claim?.scheme_provider || schemeStatusData?.scheme_provider) ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3">
              <span className={`h-2.5 w-2.5 rounded-full ${caseStatus === 'disputed' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span className="text-sm font-semibold text-zinc-950">
                {formatEnumLabel(schemeStatusData?.scheme_provider ?? claim?.scheme_provider ?? '')}
              </span>
              {(schemeStatusData?.scheme_reference ?? claim?.scheme_reference) ? (
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  Ref: {schemeStatusData?.scheme_reference ?? claim?.scheme_reference}
                </span>
              ) : null}
              <WorkspaceBadge
                label={formatEnumLabel(schemeStatusData?.scheme_status ?? claim?.scheme_status ?? caseStatus)}
                tone={caseStatus === 'disputed' ? 'disputed' : 'submitted'}
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              No deposit scheme reference recorded. This claim may have been submitted manually.
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            <WorkspaceActionButton
              disabled={isUploadingEvidence || isRefreshing}
              tone="primary"
              onClick={handleUploadEvidence}
            >
              {isUploadingEvidence ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload evidence to scheme
            </WorkspaceActionButton>
            <WorkspaceActionButton
              disabled={isCheckingStatus || isRefreshing}
              tone="primary"
              onClick={handleCheckStatus}
            >
              {isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Check status
            </WorkspaceActionButton>
          </div>

          {/* Outcome display */}
          {(schemeStatusData?.outcome ?? claim?.outcome) ? (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                Adjudication outcome
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                {(schemeStatusData?.outcome ?? claim?.outcome)?.amount_awarded != null ? (
                  <div>
                    <dt className="text-xs text-emerald-600">Amount awarded</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-emerald-900">
                      {formatCurrency(String((schemeStatusData?.outcome ?? claim?.outcome)?.amount_awarded ?? '0'))}
                    </dd>
                  </div>
                ) : null}
                {(schemeStatusData?.outcome ?? claim?.outcome)?.amount_to_landlord != null ? (
                  <div>
                    <dt className="text-xs text-emerald-600">To landlord</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-emerald-900">
                      {formatCurrency(String((schemeStatusData?.outcome ?? claim?.outcome)?.amount_to_landlord ?? '0'))}
                    </dd>
                  </div>
                ) : null}
                {(schemeStatusData?.outcome ?? claim?.outcome)?.amount_to_tenant != null ? (
                  <div>
                    <dt className="text-xs text-zinc-500">To tenant</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-zinc-700">
                      {formatCurrency(String((schemeStatusData?.outcome ?? claim?.outcome)?.amount_to_tenant ?? '0'))}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {(schemeStatusData?.adjudicator_notes ?? claim?.adjudicator_notes) ? (
                <div className="mt-4 border-t border-emerald-200 pt-3">
                  <p className="text-xs font-medium text-emerald-700">Adjudicator notes</p>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-900">
                    {schemeStatusData?.adjudicator_notes ?? claim?.adjudicator_notes}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Resolution actions */}
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <h4 className="text-sm font-semibold text-zinc-950">
              {caseStatus === 'disputed' ? 'Dispute resolution' : 'Resolution'}
            </h4>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              {caseStatus === 'disputed'
                ? 'This case is under dispute. Resolve once the adjudication outcome is confirmed.'
                : 'Mark as resolved once the outcome is confirmed, or flag a dispute if contested.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <WorkspaceActionButton
                disabled={isTransitioning || isRefreshing}
                tone="primary"
                onClick={() => handleTransition('resolved')}
              >
                {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {caseStatus === 'disputed' ? 'Resolve dispute' : 'Mark resolved'}
              </WorkspaceActionButton>
              {caseStatus === 'submitted' ? (
                <WorkspaceActionButton
                  disabled={isTransitioning || isRefreshing}
                  tone="danger"
                  onClick={() => handleTransition('disputed')}
                >
                  {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Flag dispute
                </WorkspaceActionButton>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Resolved with outcome ── */}
      {caseStatus === 'resolved' && (claim?.outcome ?? schemeStatusData?.outcome) ? (
        <section className="border border-emerald-200 bg-emerald-50/50 px-6 py-5">
          <h3 className="text-sm font-semibold text-emerald-900">Case resolved</h3>
          {claim?.scheme_reference ? (
            <p className="mt-1 text-sm text-emerald-700">
              {formatEnumLabel(claim.scheme_provider ?? '')} ref: {claim.scheme_reference}
            </p>
          ) : null}
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {(claim?.outcome as any)?.amount_awarded != null ? (
              <div>
                <dt className="text-xs text-emerald-600">Amount awarded</dt>
                <dd className="mt-0.5 text-lg font-semibold text-emerald-900">
                  {formatCurrency(String((claim?.outcome as any)?.amount_awarded ?? '0'))}
                </dd>
              </div>
            ) : null}
          </dl>
          {claim?.adjudicator_notes ? (
            <p className="mt-3 text-sm leading-relaxed text-emerald-800">{claim.adjudicator_notes}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
