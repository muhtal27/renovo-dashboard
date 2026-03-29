'use client'

import { StatusBadge, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { cn } from '@/lib/ui'
import type { CaseWorkspaceIssue } from '@/lib/operator-case-workspace-types'

export function IssueCard({
  issue,
  selected,
  onSelect,
}: {
  issue: CaseWorkspaceIssue
  selected: boolean
  onSelect: (issueId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(issue.id)}
      className={cn(
        'w-full border-l-4 px-5 py-4 text-left transition',
        selected
          ? 'border-l-slate-900 bg-slate-100'
          : 'border-l-transparent bg-white hover:bg-slate-50'
      )}
    >
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
        <div className="min-w-0">
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

          <p className="mt-3 text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">{issue.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
            {issue.description?.trim() || 'No supporting description has been recorded for this issue.'}
          </p>
        </div>

        <div className="min-w-0 xl:text-right">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
            {issue.area || 'Area not specified'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {issue.recommendation?.decision
              ? `${formatEnumLabel(issue.recommendation.decision)} recommendation linked`
              : 'No recommendation linked yet'}
          </p>
        </div>
      </div>
    </button>
  )
}
