'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatDateTime } from '@/app/eot/_components/eot-ui'
import { toTimestamp } from '@/lib/operator-checkout-workspace-helpers'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepRefund({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isSubmitted = caseStatus === 'submitted'
  const isDisputed = caseStatus === 'disputed'
  const isResolved = caseStatus === 'resolved'

  const claim = data.workspace.claim
  const submittedAt = data.checkoutCase?.submittedAt
  const totals = data.workspace.totals
  const summary = data.workspace.case.summary

  const timelineItems = useMemo(
    () => [...data.timeline]
      .sort((a, b) => toTimestamp(b.eventDate) - toTimestamp(a.eventDate))
      .slice(0, 10),
    [data.timeline]
  )

  async function handleTransition(targetStatus: string) {
    setIsTransitioning(true)
    setError(null)
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update case status.')
    } finally {
      setIsTransitioning(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">
          {isDisputed ? 'Dispute in progress' : isResolved ? 'Case resolved' : isSubmitted ? 'Submitted' : 'Refund'}
        </h3>
        {isSubmitted ? (
          <p className="mt-1 text-sm text-zinc-500">
            {submittedAt
              ? `Claim submitted on ${formatDateTime(submittedAt)}.`
              : 'Claim has been submitted and is awaiting resolution.'}
          </p>
        ) : isDisputed ? (
          <p className="mt-1 text-sm text-zinc-500">
            This case is currently under dispute. Once the dispute has been settled, mark it as
            resolved to close the case.
          </p>
        ) : isResolved ? (
          <p className="mt-1 text-sm text-zinc-500">
            This case has been resolved and closed.
          </p>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">
            The case has not yet reached the refund stage.
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Final position</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">Claim total</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {claim ? formatCurrency(claim.total_amount) : formatCurrency(totals.totalClaimed)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Deposit held</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {totals.depositAmount != null ? formatCurrency(totals.depositAmount) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Return to tenant</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {totals.returnToTenant != null ? formatCurrency(totals.returnToTenant) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Status</dt>
            <dd className="mt-0.5 font-medium">
              {isDisputed ? (
                <span className="text-rose-700">Disputed</span>
              ) : isResolved ? (
                <span className="text-emerald-700">Resolved</span>
              ) : isSubmitted ? (
                <span className="text-amber-700">Awaiting resolution</span>
              ) : (
                <span className="text-zinc-400">Pending</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {summary ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Case summary</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{summary}</p>
        </section>
      ) : null}

      {timelineItems.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Case timeline</h3>
          <div className="mt-3 space-y-1">
            {timelineItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between border-b border-zinc-100 py-2.5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-950">{item.eventType}</p>
                  <p className="text-xs text-zinc-500">{item.eventDescription}</p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">{formatDateTime(item.eventDate)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

      {isSubmitted ? (
        <div className="border-t border-zinc-200 pt-6">
          {confirmAction ? (
            <div className={`border px-4 py-4 ${confirmAction === 'disputed' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className={`text-sm font-medium ${confirmAction === 'disputed' ? 'text-rose-900' : 'text-amber-900'}`}>
                {confirmAction === 'disputed'
                  ? 'Are you sure you want to flag this case as disputed?'
                  : 'Are you sure you want to mark this case as resolved?'}
              </p>
              <p className={`mt-1 text-xs ${confirmAction === 'disputed' ? 'text-rose-700' : 'text-amber-700'}`}>
                {confirmAction === 'disputed'
                  ? 'This will move the case into dispute handling. You can resolve it later.'
                  : 'This will close the case permanently.'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <WorkspaceActionButton
                  disabled={isTransitioning}
                  tone={confirmAction === 'disputed' ? 'danger' : 'primary'}
                  onClick={() => handleTransition(confirmAction)}
                >
                  {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {confirmAction === 'disputed' ? 'Confirm dispute' : 'Confirm resolve'}
                </WorkspaceActionButton>
                <WorkspaceActionButton
                  disabled={isTransitioning}
                  tone="secondary"
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </WorkspaceActionButton>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <WorkspaceActionButton
                disabled={isTransitioning}
                tone="primary"
                onClick={() => setConfirmAction('resolved')}
              >
                Mark resolved
              </WorkspaceActionButton>
              <WorkspaceActionButton
                disabled={isTransitioning}
                tone="danger"
                onClick={() => setConfirmAction('disputed')}
              >
                Flag dispute
              </WorkspaceActionButton>
            </div>
          )}
        </div>
      ) : isDisputed ? (
        <div className="border-t border-zinc-200 pt-6">
          {confirmAction === 'resolved' ? (
            <div className="border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-medium text-amber-900">
                Are you sure you want to resolve this dispute?
              </p>
              <p className="mt-1 text-xs text-amber-700">
                This will close the case permanently.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <WorkspaceActionButton disabled={isTransitioning} tone="primary" onClick={() => handleTransition('resolved')}>
                  {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirm resolve
                </WorkspaceActionButton>
                <WorkspaceActionButton disabled={isTransitioning} tone="secondary" onClick={() => setConfirmAction(null)}>
                  Cancel
                </WorkspaceActionButton>
              </div>
            </div>
          ) : (
            <WorkspaceActionButton disabled={isTransitioning} tone="primary" onClick={() => setConfirmAction('resolved')}>
              Resolve dispute
            </WorkspaceActionButton>
          )}
        </div>
      ) : null}
    </div>
  )
}
