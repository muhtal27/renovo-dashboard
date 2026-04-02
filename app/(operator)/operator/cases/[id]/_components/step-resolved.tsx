'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatDateTime } from '@/app/eot/_components/eot-ui'
import { toTimestamp } from '@/lib/operator-checkout-workspace-helpers'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepResolved({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isDisputed = caseStatus === 'disputed'
  const isResolved = caseStatus === 'resolved'

  const claim = data.workspace.claim
  const totals = data.workspace.totals
  const summary = data.workspace.case.summary

  const timelineItems = [...data.timeline]
    .sort((a, b) => toTimestamp(b.eventDate) - toTimestamp(a.eventDate))
    .slice(0, 10)

  async function handleResolve() {
    setIsTransitioning(true)
    setError(null)
    try {
      const response = await fetch(`/api/eot/cases/${caseId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || 'Failed to resolve dispute.')
      }
      startTransition(() => { router.refresh() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resolve dispute.')
    } finally {
      setIsTransitioning(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">
          {isDisputed ? 'Dispute in progress' : isResolved ? 'Case resolved' : 'Resolution'}
        </h3>
        {isDisputed ? (
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
            The case has not yet reached the resolution stage.
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

      {isDisputed ? (
        <div className="border-t border-zinc-200 pt-6">
          <WorkspaceActionButton disabled={isTransitioning} tone="primary" onClick={handleResolve}>
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Resolve dispute
          </WorkspaceActionButton>
        </div>
      ) : null}
    </div>
  )
}
