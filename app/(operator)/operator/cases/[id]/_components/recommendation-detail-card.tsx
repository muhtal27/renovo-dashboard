'use client'

import { EmptyState } from '@/app/operator-ui'
import { StatusBadge, formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { CaseWorkspaceIssue } from '@/lib/operator-case-workspace-types'
import { cn } from '@/lib/ui'

function getOutcomeClasses(outcome: string | null | undefined) {
  if (outcome === 'charge') {
    return 'border-rose-200 bg-rose-50/80'
  }

  if (outcome === 'partial') {
    return 'border-amber-200 bg-amber-50/80'
  }

  if (outcome === 'no_charge') {
    return 'border-emerald-200 bg-emerald-50/80'
  }

  return 'border-zinc-200 bg-zinc-50/80'
}

function getWearAndTearExplanation(issue: CaseWorkspaceIssue) {
  const rationale = issue.recommendation?.rationale?.trim()

  if (!rationale) {
    return null
  }

  const normalized = rationale.toLowerCase()

  if (
    normalized.includes('fair wear') ||
    normalized.includes('wear and tear') ||
    normalized.includes('betterment') ||
    normalized.includes('apportion') ||
    normalized.includes('proportion')
  ) {
    return rationale
  }

  if (issue.recommendation?.decision === 'partial') {
    return rationale
  }

  return null
}

export function RecommendationDetailCard({
  issue,
}: {
  issue: CaseWorkspaceIssue | null
}) {
  if (!issue) {
    return (
      <EmptyState
        title="No issue selected"
        body="Select an issue to inspect the current recommendation outcome and deduction rationale."
      />
    )
  }

  const recommendation = issue.recommendation
  const wearAndTearExplanation = getWearAndTearExplanation(issue)

  if (!recommendation) {
    return (
      <div className="rounded-xl border border-zinc-200 px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={formatEnumLabel(issue.severity)} tone={issue.severity} />
          <StatusBadge label={formatEnumLabel(issue.status)} tone={issue.status} />
        </div>
        <p className="mt-4 text-sm font-semibold text-zinc-950 [overflow-wrap:anywhere]">{issue.title}</p>
        <p className="mt-2 text-sm text-zinc-500 [overflow-wrap:anywhere]">{issue.area || 'Area not specified'}</p>
        <EmptyState
          title="No recommendation yet"
          body="This issue has not reached a charge outcome, rationale, or cost estimate."
          className="mt-5"
        />
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border px-5 py-5', getOutcomeClasses(recommendation.decision))}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          label={formatEnumLabel(recommendation.decision || 'pending')}
          tone={recommendation.decision || 'document'}
        />
        <StatusBadge label={formatEnumLabel(issue.severity)} tone={issue.severity} />
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-zinc-950 [overflow-wrap:anywhere]">{issue.title}</p>
        <p className="mt-2 text-sm text-zinc-600 [overflow-wrap:anywhere]">{issue.area || 'Area not specified'}</p>
      </div>

      <div className="mt-5 space-y-4 border-t border-current/10 pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Rationale</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 [overflow-wrap:anywhere]">
            {recommendation.rationale?.trim() || 'No rationale has been recorded.'}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Estimated cost</p>
          <p className="mt-2 text-base font-semibold text-zinc-950">
            {recommendation.estimated_cost ? formatCurrency(recommendation.estimated_cost) : 'Not estimated'}
          </p>
        </div>

        {wearAndTearExplanation ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Fair wear / betterment
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 [overflow-wrap:anywhere]">
              {wearAndTearExplanation}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
