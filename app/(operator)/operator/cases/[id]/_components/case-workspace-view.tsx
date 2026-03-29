'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SectionCard, SectionHeading } from '@/app/operator-ui'
import { ClaimSummaryCard } from '@/app/(operator)/operator/cases/[id]/_components/claim-summary-card'
import { IssueList } from '@/app/(operator)/operator/cases/[id]/_components/issue-list'
import { MessageThreadCard } from '@/app/(operator)/operator/cases/[id]/_components/message-thread-card'
import { RecommendationDetailCard } from '@/app/(operator)/operator/cases/[id]/_components/recommendation-detail-card'
import { ReportComparisonCard } from '@/app/(operator)/operator/cases/[id]/_components/report-comparison-card'
import { CaseStatusBadge } from '@/app/(operator)/operator/cases/[id]/_components/case-status-badge'
import { SupportingDocumentsPanel } from '@/app/(operator)/operator/cases/[id]/_components/supporting-documents-panel'
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

export function CaseWorkspaceView({
  workspace,
}: {
  workspace: OperatorCaseWorkspaceData
}) {
  const router = useRouter()
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(workspace.issues[0]?.id ?? null)
  const selectedIssue = workspace.issues.find((issue) => issue.id === selectedIssueId) ?? null
  const submissionState = getSubmissionState(workspace)

  return (
    <SectionCard className="overflow-hidden">
      <section className="px-6 py-6 md:px-7">
        <SectionHeading
          title="Evidence"
          description="Keep the analysis inputs and supporting tenancy records together in one operational area."
        />
        <div className="mt-5 space-y-5">
          <ReportComparisonCard workspace={workspace} />
          <SupportingDocumentsPanel
            caseId={workspace.case.id}
            documents={workspace.supportingDocuments}
            onRefresh={() => router.refresh()}
          />
        </div>
      </section>

      <section className="border-t border-slate-200 px-6 py-6 md:px-7">
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)]">
          <div className="min-w-0">
            <SectionHeading
              title="Issues"
              description="Select an issue to inspect the live recommendation and deduction outcome."
            />
            <div className="mt-5">
              <IssueList
                issues={workspace.issues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={setSelectedIssueId}
              />
            </div>
          </div>

          <div className="min-w-0 2xl:sticky 2xl:top-6 2xl:self-start">
            <SectionHeading
              title="Decision"
              description="Review the selected issue, current claim position, and the amount that remains in dispute."
            />
            <div className="mt-5 space-y-5">
              <RecommendationDetailCard issue={selectedIssue} />
              <ClaimSummaryCard workspace={workspace} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 px-6 py-6 md:px-7">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <SectionHeading
            title="Submission"
            description="Check claim readiness and review the attached communication trail before sign-off."
          />
          <div className="min-w-0">
            <CaseStatusBadge status={submissionState.tone} />
            <p className="mt-3 text-sm font-semibold text-slate-950">{submissionState.label}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
              {submissionState.description}
            </p>
          </div>
        </div>

        <div className="pt-5">
          <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Message thread</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Operator, tenant, and landlord communication attached to this case.
          </p>
          <div className="mt-5">
            <MessageThreadCard workspace={workspace} />
          </div>
        </div>
      </section>
    </SectionCard>
  )
}
