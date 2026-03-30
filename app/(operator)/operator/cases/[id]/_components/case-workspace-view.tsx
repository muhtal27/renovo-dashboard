'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { formatAddress, formatCurrency, formatDate } from '@/app/eot/_components/eot-ui'
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

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
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
  const propertyAddress = formatAddress([
    workspace.property.address_line_1,
    workspace.property.address_line_2,
    workspace.property.city,
    workspace.property.postcode,
    workspace.property.country_code,
  ])
  const caseReference = workspace.case.id.slice(0, 8).toUpperCase()

  const metadataItems = [
    {
      label: 'Tenant',
      value: workspace.tenant.email ? `${workspace.tenant.name} · ${workspace.tenant.email}` : workspace.tenant.name,
    },
    {
      label: 'Status',
      value: submissionState.label,
    },
    {
      label: 'Tenancy',
      value: `${formatDate(workspace.tenancy.start_date)} to ${formatDate(workspace.tenancy.end_date)}`,
    },
    {
      label: 'Case reference',
      value: caseReference,
    },
    {
      label: 'Address',
      value: propertyAddress,
    },
    {
      label: 'Proposed deductions',
      value: formatCurrency(workspace.totals.proposedDeductions),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8 md:py-10">
      <div className="space-y-8">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium text-slate-500">{`Case #${caseReference}`}</p>
                <CaseStatusBadge status={workspace.case.status} />
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 [overflow-wrap:anywhere]">
                {propertyAddress}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                Review evidence, issues, recommendation, and submission state in one continuous workspace.
              </p>
            </div>
          </div>

          <dl className="grid gap-x-6 gap-y-4 text-sm md:grid-cols-2 xl:grid-cols-3">
            {metadataItems.map((item) => (
              <div key={item.label} className="min-w-0 space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {item.label}
                </dt>
                <dd className="text-sm leading-6 text-slate-900 [overflow-wrap:anywhere]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="border-b border-slate-200" />

        <Section
          title="Summary"
          description="Current deduction totals and claim position against the recorded deposit."
        >
          <ClaimSummaryCard workspace={workspace} />
        </Section>

        <div className="border-b border-slate-200" />

        <Section
          title="Evidence"
          description="Analysis inputs and supporting tenancy records kept together in one review flow."
        >
          <ReportComparisonCard workspace={workspace} />
          <SupportingDocumentsPanel
            caseId={workspace.case.id}
            documents={workspace.supportingDocuments}
            onRefresh={() => router.refresh()}
          />
        </Section>

        <div className="border-b border-slate-200" />

        <Section
          title="Issues"
          description="Select an issue to inspect the live recommendation and deduction outcome."
        >
          <IssueList
            issues={workspace.issues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={setSelectedIssueId}
          />
        </Section>

        <div className="border-b border-slate-200" />

        <Section
          title="Decision / Recommendation"
          description="Review the selected issue, current claim position, and the amount that remains in dispute."
        >
          <RecommendationDetailCard issue={selectedIssue} />
        </Section>

        <div className="border-b border-slate-200" />

        <Section
          title="Submission / Next Steps"
          description="Check claim readiness and review the attached communication trail before sign-off."
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <CaseStatusBadge status={submissionState.tone} />
              <p className="text-sm font-semibold text-slate-950">{submissionState.label}</p>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
              {submissionState.description}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Message thread</h3>
            <p className="text-sm leading-6 text-slate-600">
              Operator, tenant, and landlord communication attached to this case.
            </p>
          </div>
          <MessageThreadCard workspace={workspace} />
        </Section>
      </div>
    </div>
  )
}
