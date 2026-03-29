'use client'

import { EmptyState } from '@/app/operator-ui'
import { StatusBadge, formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCaseWorkspaceData } from '@/lib/operator-case-workspace-types'

export function ClaimSummaryCard({
  workspace,
}: {
  workspace: OperatorCaseWorkspaceData
}) {
  return (
    <div className="border-t border-slate-200 pt-5">
      <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Claim summary</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Current deduction position against the recorded deposit.
      </p>

      <dl className="mt-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm text-slate-500">Total deductions</dt>
          <dd className="text-sm font-semibold text-slate-950">
            {formatCurrency(workspace.totals.proposedDeductions)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm text-slate-500">Deposit amount</dt>
          <dd className="text-sm font-semibold text-slate-950">
            {workspace.totals.depositAmount == null
              ? 'Not recorded'
              : formatCurrency(workspace.totals.depositAmount)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm text-slate-500">Return to tenant</dt>
          <dd className="text-sm font-semibold text-slate-950">
            {workspace.totals.returnToTenant == null
              ? 'Not available'
              : formatCurrency(workspace.totals.returnToTenant)}
          </dd>
        </div>
      </dl>

      {workspace.claimBreakdown.length ? (
        <div className="mt-5 overflow-hidden rounded-[18px] border border-slate-200 bg-white">
          {workspace.claimBreakdown.map((item) => (
            <div key={item.id} className="border-b border-slate-200 px-4 py-4 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">{item.title}</p>
                  {item.decision ? (
                    <div className="mt-2">
                      <StatusBadge label={formatEnumLabel(item.decision)} tone={item.decision} />
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
      ) : workspace.claim ? (
        <EmptyState
          title="No itemised breakdown"
          body="A claim total exists, but there is no itemised breakdown attached to this claim yet."
          className="mt-5"
        />
      ) : (
        <EmptyState
          title="No claim generated"
          body="Recommendations are visible, but a formal claim pack has not been generated yet."
          className="mt-5"
        />
      )}
    </div>
  )
}
