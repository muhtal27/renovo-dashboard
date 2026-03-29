'use client'

import { EmptyState } from '@/app/operator-ui'
import { IssueCard } from '@/app/(operator)/operator/cases/[id]/_components/issue-card'
import type { CaseWorkspaceIssue } from '@/lib/operator-case-workspace-types'

export function IssueList({
  issues,
  selectedIssueId,
  onSelectIssue,
}: {
  issues: CaseWorkspaceIssue[]
  selectedIssueId: string | null
  onSelectIssue: (issueId: string) => void
}) {
  if (!issues.length) {
    return (
      <EmptyState
        title="No issues recorded"
        body="Once evidence is reviewed, surfaced defects and deductions will appear here for operator decision-making."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
      {issues.map((issue) => (
        <div key={issue.id} className="border-b border-slate-200 last:border-b-0">
          <IssueCard
            issue={issue}
            selected={issue.id === selectedIssueId}
            onSelect={onSelectIssue}
          />
        </div>
      ))}
    </div>
  )
}
