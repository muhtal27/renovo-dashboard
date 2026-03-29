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
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
      <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Claim summary</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Current deduction position against the recorded deposit.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total claimed</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {formatCurrency(workspace.totals.totalClaimed)}
          </p>
        </div>
        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Return to landlord</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {formatCurrency(workspace.totals.returnToLandlord)}
          </p>
        </div>
        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Return to tenant</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {workspace.totals.returnToTenant == null
              ? 'Not available'
              : formatCurrency(workspace.totals.returnToTenant)}
          </p>
        </div>
        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Disputed amount</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {formatCurrency(workspace.totals.disputedAmount)}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 border-t border-slate-200 pt-5">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm text-slate-500">Deposit amount</dt>
          <dd className="text-sm font-semibold text-slate-950">
            {workspace.totals.depositAmount == null
              ? 'Not recorded'
              : formatCurrency(workspace.totals.depositAmount)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm text-slate-500">Claim source</dt>
          <dd className="text-sm font-semibold text-slate-950">
            {workspace.claim ? 'Generated claim record' : 'Recommendation totals'}
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
