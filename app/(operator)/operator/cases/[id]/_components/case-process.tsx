'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { EmptyState, SectionCard } from '@/app/operator-ui'
import {
  WorkspaceActionButton,
  WorkspaceBadge,
  WorkspaceMetricCard,
  WorkspaceNotice,
  WorkspaceProgressBar,
  WorkspaceSectionTitle,
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
import { getCheckoutSelectedLiability } from '@/lib/operator-checkout-workspace-helpers'
import type {
  CheckoutWorkspaceDefectRecord,
  CheckoutWorkspaceLiability,
  OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'
import type { EotCaseStatus, EotRecommendation, EotRecommendationDecision } from '@/lib/eot-types'

type AnalyseCaseResponse = {
  success: boolean
  caseId: string
  issueCount: number
  recommendationCount: number
  claimTotal: number
  status: EotCaseStatus
}

type AnalyseCaseError = {
  detail?: string
  error?: string
}

function getPrimaryCost(defect: CheckoutWorkspaceDefectRecord) {
  return defect.costAdjusted ?? defect.costEstimate ?? 0
}

function getLiabilityTone(value: CheckoutWorkspaceLiability | null | undefined) {
  switch (value) {
    case 'tenant':
      return 'tenant' as const
    case 'landlord':
      return 'landlord' as const
    case 'shared':
      return 'shared' as const
    default:
      return 'neutral' as const
  }
}

function getDecisionTone(decision: EotRecommendationDecision | null | undefined) {
  switch (decision) {
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

function getStatusTone(status: EotCaseStatus) {
  switch (status) {
    case 'analysis':
      return 'processing' as const
    case 'review':
      return 'review' as const
    case 'ready_for_claim':
      return 'accepted' as const
    case 'submitted':
      return 'submitted' as const
    case 'disputed':
      return 'disputed' as const
    case 'resolved':
      return 'accepted' as const
    case 'collecting_evidence':
      return 'info' as const
    case 'draft':
    default:
      return 'pending' as const
  }
}

function getRoomLabel(
  roomId: string,
  rooms: OperatorCheckoutWorkspaceData['rooms']
) {
  if (!roomId) {
    return 'Room not linked'
  }

  return rooms.find((room) => room.id === roomId)?.roomName ?? 'Room not linked'
}

function getDefectReviewLabel(defect: CheckoutWorkspaceDefectRecord) {
  if (defect.operatorLiability) {
    return 'Operator reviewed'
  }

  if (defect.aiSuggestedLiability) {
    return 'AI suggested'
  }

  return 'Pending input'
}

function getWorkflowReadiness(data: OperatorCheckoutWorkspaceData) {
  const checklist = [
    Boolean(data.workspace.reportDocuments.checkIn),
    Boolean(data.workspace.reportDocuments.checkOut),
    data.defects.length > 0 || data.workspace.issues.length > 0,
  ]
  const completed = checklist.filter(Boolean).length

  return Math.round((completed / checklist.length) * 100)
}

function getRecommendationCost(value: string | null | undefined) {
  const numericValue = value ? Number(value) : 0

  return Number.isFinite(numericValue) ? numericValue : 0
}

function sortRecommendations(recommendations: EotRecommendation[]) {
  return [...recommendations].sort((left, right) => {
    const costDifference = getRecommendationCost(right.estimated_cost) - getRecommendationCost(left.estimated_cost)

    if (costDifference !== 0) {
      return costDifference
    }

    return Date.parse(right.updated_at) - Date.parse(left.updated_at)
  })
}

export function CaseProcess({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [isRefreshing, startTransition] = useTransition()
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalyseCaseResponse | null>(null)

  const linkedCoreReports = [
    data.workspace.reportDocuments.checkIn,
    data.workspace.reportDocuments.checkOut,
  ].filter(Boolean).length
  const linkedEvidencePack = [
    data.workspace.reportDocuments.checkIn,
    data.workspace.reportDocuments.checkOut,
    data.workspace.reportDocuments.tenancyAgreement,
  ].filter(Boolean).length
  const hasRequiredReports = linkedCoreReports === 2
  const reviewedDefects = data.defects.filter((defect) => Boolean(defect.operatorLiability)).length
  const aiDefectCoverage = data.defects.filter((defect) => Boolean(defect.aiSuggestedLiability)).length
  const structuredExposure = data.defects.reduce((sum, defect) => sum + getPrimaryCost(defect), 0)
  const currentClaimTotal = data.workspace.claim?.total_amount ?? data.workspace.totals.totalClaimed
  const workflowReadiness = getWorkflowReadiness(data)
  const recommendationRows = sortRecommendations(data.workspace.recommendations)
  const issueById = new Map(data.workspace.issues.map((issue) => [issue.id, issue]))
  const defectRows = [...data.defects].sort((left, right) => getPrimaryCost(right) - getPrimaryCost(left))
  const runButtonLabel =
    data.workspace.recommendations.length > 0 || data.workspace.claim
      ? 'Re-run AI analysis'
      : 'Run AI analysis'
  const buttonDisabled = isAnalysing || isRefreshing || !hasRequiredReports

  async function handleAnalyse() {
    if (buttonDisabled) {
      return
    }

    setIsAnalysing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    try {
      const response = await fetch(`/api/operator/cases/${data.workspace.case.id}/analyse`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })
      const payload = (await response.json().catch(() => null)) as AnalyseCaseResponse | AnalyseCaseError | null

      if (!response.ok || !payload || !('success' in payload) || !payload.success) {
        throw new Error(
          payload && 'detail' in payload
            ? payload.detail || payload.error || 'Unable to analyse this case right now.'
            : 'Unable to analyse this case right now.'
        )
      }

      setAnalysisResult(payload)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : 'Unable to analyse this case right now.'
      )
    } finally {
      setIsAnalysing(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <WorkspaceMetricCard
          detail={`${linkedEvidencePack}/3 evidence-pack files linked`}
          label="Core reports"
          tone={hasRequiredReports ? 'success' : 'warning'}
          value={`${linkedCoreReports}/2`}
        />
        <WorkspaceMetricCard
          detail={
            data.defects.length > 0
              ? `${reviewedDefects}/${data.defects.length} reviewed`
              : 'No structured defects recorded yet'
          }
          label="Structured defects"
          tone={
            data.defects.length === 0
              ? 'info'
              : reviewedDefects === data.defects.length
                ? 'success'
                : 'warning'
          }
          value={data.defects.length}
        />
        <WorkspaceMetricCard
          detail={`${data.workspace.issues.length} issues in the current operator workspace`}
          label="Recommendations"
          tone={data.workspace.recommendations.length > 0 ? 'info' : 'default'}
          value={data.workspace.recommendations.length}
        />
        <WorkspaceMetricCard
          detail={`${formatCurrency(structuredExposure)} structured defect exposure`}
          label="Claim position"
          tone={data.workspace.claim ? 'warning' : 'default'}
          value={formatCurrency(currentClaimTotal)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <SectionCard className="px-6 py-6 md:px-7">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
            <WorkspaceSectionTitle>AI analysis control</WorkspaceSectionTitle>
            <p className="text-sm leading-6 text-slate-600">
              This step reuses the existing operator analysis route. Core reports are the only hard blocker; structured defects enrich the review when they exist.
            </p>
          </div>

          <div className="grid gap-6 pt-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
            <div className="space-y-4">
              <WorkspaceNotice
                body={
                  hasRequiredReports
                    ? 'Check-in and check-out reports are linked, so the backend analysis can be run safely from this workspace.'
                    : 'Link both check-in and check-out reports in Documents before running backend analysis.'
                }
                title={hasRequiredReports ? 'Required reports linked' : 'Required reports missing'}
                tone={hasRequiredReports ? 'success' : 'warning'}
              />

              <WorkspaceNotice
                body={
                  data.defects.length > 0
                    ? `${data.defects.length} structured defects are available and will stay visible as operator context alongside the backend-generated issues and recommendations.`
                    : 'No structured defects are recorded yet. Analysis still runs on the linked reports and existing workspace evidence.'
                }
                title={data.defects.length > 0 ? 'Structured defect context available' : 'No structured defect context yet'}
                tone={data.defects.length > 0 ? 'info' : 'neutral'}
              />

              {analysisResult ? (
                <WorkspaceNotice
                  body={`${analysisResult.issueCount} issues, ${analysisResult.recommendationCount} recommendations, and ${formatCurrency(analysisResult.claimTotal)} returned from the latest backend run.`}
                  title={`Latest run moved the case to ${formatEnumLabel(analysisResult.status)}`}
                  tone="success"
                />
              ) : null}

              {analysisError ? (
                <WorkspaceNotice
                  body={analysisError}
                  title="Analysis failed"
                  tone="danger"
                />
              ) : null}
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    AI workflow readiness
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {workflowReadiness}%
                  </p>
                </div>
                <WorkspaceBadge
                  label={formatEnumLabel(data.workspace.case.status)}
                  tone={getStatusTone(data.workspace.case.status)}
                />
              </div>

              <div className="mt-4">
                <WorkspaceProgressBar
                  max={100}
                  tone={hasRequiredReports ? 'success' : 'warning'}
                  value={workflowReadiness}
                />
              </div>

              <dl className="mt-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-slate-500">Check-in report</dt>
                  <dd className="text-sm font-medium text-slate-950">
                    {data.workspace.reportDocuments.checkIn ? 'Linked' : 'Missing'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-slate-500">Check-out report</dt>
                  <dd className="text-sm font-medium text-slate-950">
                    {data.workspace.reportDocuments.checkOut ? 'Linked' : 'Missing'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-slate-500">Defect context</dt>
                  <dd className="text-sm font-medium text-slate-950">
                    {data.defects.length > 0 ? `${data.defects.length} structured items` : `${data.workspace.issues.length} legacy issues`}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-slate-500">Last workspace update</dt>
                  <dd className="text-right text-sm font-medium text-slate-950">
                    {formatDateTime(data.workspace.case.updated_at)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <WorkspaceActionButton
                  disabled={buttonDisabled}
                  onClick={() => {
                    void handleAnalyse()
                  }}
                  tone="primary"
                >
                  {isAnalysing || isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isAnalysing ? 'Running analysis...' : isRefreshing ? 'Refreshing results...' : runButtonLabel}
                </WorkspaceActionButton>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="px-6 py-6 md:px-7">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
            <WorkspaceSectionTitle>Current output state</WorkspaceSectionTitle>
            <p className="text-sm leading-6 text-slate-600">
              Existing operator outputs remain the source of truth after each run.
            </p>
          </div>

          <div className="space-y-5 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <WorkspaceBadge label={formatEnumLabel(data.workspace.case.status)} tone={getStatusTone(data.workspace.case.status)} />
              {data.workspace.claim ? <WorkspaceBadge label="Claim generated" tone="warning" /> : null}
              {data.workspace.recommendations.length > 0 ? (
                <WorkspaceBadge label="Recommendations present" tone="info" />
              ) : null}
              {aiDefectCoverage > 0 ? (
                <WorkspaceBadge label={`${aiDefectCoverage} AI-tagged defects`} tone="tenant" />
              ) : null}
            </div>

            <dl className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Current issues</dt>
                <dd className="text-sm font-medium text-slate-950">{data.workspace.issues.length}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Current recommendations</dt>
                <dd className="text-sm font-medium text-slate-950">{data.workspace.recommendations.length}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Claim total</dt>
                <dd className="text-sm font-medium text-slate-950">{formatCurrency(currentClaimTotal)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Claim generated</dt>
                <dd className="text-right text-sm font-medium text-slate-950">
                  {data.workspace.claim ? formatDateTime(data.workspace.claim.generated_at) : 'Not generated'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Deposit held</dt>
                <dd className="text-sm font-medium text-slate-950">
                  {data.checkoutCase?.depositHeld == null
                    ? 'Not recorded'
                    : formatCurrency(data.checkoutCase.depositHeld)}
                </dd>
              </div>
            </dl>
          </div>
        </SectionCard>
      </div>

      <SectionCard className="px-6 py-6 md:px-7">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
          <WorkspaceSectionTitle>Structured defect inputs</WorkspaceSectionTitle>
          <p className="text-sm leading-6 text-slate-600">
            Review context from the structured defect model, kept visible here so operators can compare it against the backend-generated issue list after each run.
          </p>
        </div>

        <div className="pt-5">
          {defectRows.length > 0 ? (
            <WorkspaceTable>
              <thead>
                <tr>
                  <WorkspaceTableHeaderCell>Room / item</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell>Defect type</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell>Liability signal</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell align="center">AI confidence</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell align="right">Exposure</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell align="right">Review state</WorkspaceTableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {defectRows.map((defect) => {
                  const selectedLiability = getCheckoutSelectedLiability(defect)

                  return (
                    <WorkspaceTableRow key={defect.id}>
                      <WorkspaceTableCell emphasis="strong">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950 [overflow-wrap:anywhere]">
                            {defect.itemName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">
                            {getRoomLabel(defect.roomId, data.rooms)}
                          </p>
                        </div>
                      </WorkspaceTableCell>
                      <WorkspaceTableCell>{formatEnumLabel(defect.defectType)}</WorkspaceTableCell>
                      <WorkspaceTableCell>
                        <WorkspaceBadge
                          label={selectedLiability ? formatEnumLabel(selectedLiability) : 'No signal'}
                          tone={getLiabilityTone(selectedLiability)}
                        />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell align="center">
                        {defect.aiConfidence == null ? 'Not set' : `${Math.round(defect.aiConfidence * 100)}%`}
                      </WorkspaceTableCell>
                      <WorkspaceTableCell align="right">{formatCurrency(getPrimaryCost(defect))}</WorkspaceTableCell>
                      <WorkspaceTableCell align="right">{getDefectReviewLabel(defect)}</WorkspaceTableCell>
                    </WorkspaceTableRow>
                  )
                })}
              </tbody>
            </WorkspaceTable>
          ) : (
            <EmptyState
              body="No structured defects are available yet. When defect extraction or operator review records exist, they will appear here as analysis input context."
              title="No structured defect inputs"
            />
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <SectionCard className="px-6 py-6 md:px-7">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
            <WorkspaceSectionTitle>Generated recommendations</WorkspaceSectionTitle>
            <p className="text-sm leading-6 text-slate-600">
              These are the live recommendation records currently attached to the operator workspace.
            </p>
          </div>

          <div className="space-y-4 pt-5">
            {recommendationRows.length > 0 ? (
              recommendationRows.map((recommendation) => {
                const issue = issueById.get(recommendation.issue_id)

                return (
                  <div
                    key={recommendation.id}
                    className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-5 py-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <WorkspaceBadge
                            label={formatEnumLabel(recommendation.decision)}
                            tone={getDecisionTone(recommendation.decision)}
                          />
                          {issue?.severity ? (
                            <WorkspaceBadge label={formatEnumLabel(issue.severity)} tone="review" />
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">
                          {issue?.title ?? 'Issue not linked'}
                        </p>
                        {issue?.area ? (
                          <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">
                            {issue.area}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-slate-950">
                        {formatCurrency(recommendation.estimated_cost)}
                      </p>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {recommendation.rationale || 'No rationale recorded yet.'}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Updated {formatDateTime(recommendation.updated_at)}
                    </p>
                  </div>
                )
              })
            ) : (
              <EmptyState
                body="No recommendations have been generated yet. Run analysis once the required reports are linked to populate this section."
                title="No recommendations yet"
              />
            )}
          </div>
        </SectionCard>

        <SectionCard className="px-6 py-6 md:px-7">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
            <WorkspaceSectionTitle>Claim output</WorkspaceSectionTitle>
            <p className="text-sm leading-6 text-slate-600">
              Itemised claim output from the current workspace state.
            </p>
          </div>

          <div className="space-y-4 pt-5">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Current total</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {formatCurrency(currentClaimTotal)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {data.workspace.claim
                  ? `Generated ${formatDateTime(data.workspace.claim.generated_at)}`
                  : 'Using current recommendation totals until a formal claim record is generated.'}
              </p>
            </div>

            {data.workspace.claimBreakdown.length > 0 ? (
              <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
                {data.workspace.claimBreakdown.map((item) => (
                  <div key={item.id} className="border-b border-slate-200 px-4 py-4 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">
                          {item.title}
                        </p>
                        {item.decision ? (
                          <div className="mt-2">
                            <WorkspaceBadge
                              label={formatEnumLabel(item.decision)}
                              tone={getDecisionTone(item.decision as EotRecommendationDecision)}
                            />
                          </div>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-slate-950">
                        {formatCurrency(item.estimatedCost)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : data.workspace.claim ? (
              <WorkspaceNotice
                body="A formal claim total exists, but no itemised breakdown is attached to the current claim record."
                title="Claim breakdown unavailable"
                tone="warning"
              />
            ) : (
              <EmptyState
                body="A formal claim record has not been generated yet. Once the backend writes one, the breakdown will appear here."
                title="No claim output yet"
              />
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
