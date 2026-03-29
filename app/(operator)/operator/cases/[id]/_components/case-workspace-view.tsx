'use client'

import { useState } from 'react'
import { WorkspaceSection } from '@/app/eot/_components/eot-ui'
import { ClaimSummaryCard } from '@/app/(operator)/operator/cases/[id]/_components/claim-summary-card'
import { IssueList } from '@/app/(operator)/operator/cases/[id]/_components/issue-list'
import { MessageThreadCard } from '@/app/(operator)/operator/cases/[id]/_components/message-thread-card'
import { RecommendationDetailCard } from '@/app/(operator)/operator/cases/[id]/_components/recommendation-detail-card'
import { ReportComparisonCard } from '@/app/(operator)/operator/cases/[id]/_components/report-comparison-card'
import { CaseStatusBadge } from '@/app/(operator)/operator/cases/[id]/_components/case-status-badge'
import type { OperatorCaseWorkspaceData } from '@/lib/operator-case-workspace-types'

function getSubmissionState(workspace: OperatorCaseWorkspaceData) {
  if (workspace.case.status === 'submitted') {
    return {
      label: 'Submitted',
      description: 'Claim output has moved past operator approval and is now in the submission trail.',
      tone: 'submitted',
    } as const
  }

  if (workspace.claim || workspace.case.status === 'ready_for_claim') {
    return {
      label: 'Claim-ready',
      description: 'The workspace has enough structure for final approval and claim export.',
      tone: 'ready_for_claim',
    } as const
  }

  return {
    label: 'In review',
    description: 'Evidence and recommendation review are still active before submission sign-off.',
    tone: 'review',
  } as const
}

function SubmissionActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled
        className="inline-flex h-10 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500"
      >
        Approve claim
      </button>
      <button
        type="button"
        disabled
        className="inline-flex h-10 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500"
      >
        Export claim
      </button>
    </div>
  )
}

export function CaseWorkspaceView({
  workspace,
}: {
  workspace: OperatorCaseWorkspaceData
}) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(workspace.issues[0]?.id ?? null)
  const selectedIssue = workspace.issues.find((issue) => issue.id === selectedIssueId) ?? null
  const submissionState = getSubmissionState(workspace)

  return (
    <div className="space-y-6">
      <WorkspaceSection
        title="Evidence"
        description="Anchor the operator review in tenancy metadata and the check-in versus check-out file."
      >
        <ReportComparisonCard workspace={workspace} />
      </WorkspaceSection>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
        <WorkspaceSection
          className="min-w-0"
          title="Issues"
          description="Select an issue to inspect the live recommendation and deduction outcome."
        >
          <IssueList
            issues={workspace.issues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={setSelectedIssueId}
          />
        </WorkspaceSection>

        <WorkspaceSection
          className="min-w-0 2xl:sticky 2xl:top-6 2xl:self-start"
          title="Decision"
          description="Recommendation detail and current claim position for the selected issue."
        >
          <div className="space-y-5">
            <RecommendationDetailCard issue={selectedIssue} />
            <ClaimSummaryCard workspace={workspace} />
          </div>
        </WorkspaceSection>
      </div>

      <WorkspaceSection
        title="Submission"
        description="Check claim readiness and review the attached communication trail before sign-off."
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <CaseStatusBadge status={submissionState.tone} />
              <p className="mt-3 text-sm font-semibold text-slate-950">{submissionState.label}</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                {submissionState.description}
              </p>
            </div>
            <SubmissionActions />
          </div>

          <div>
            <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Message thread</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Operator, tenant, and landlord communication attached to this case.
            </p>
            <div className="mt-5">
              <MessageThreadCard workspace={workspace} />
            </div>
          </div>
        </div>
      </WorkspaceSection>
    </div>
  )
}
