'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatDateTime } from '@/app/eot/_components/eot-ui'
import { toTimestamp } from '@/lib/operator-checkout-workspace-helpers'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepSubmitted({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isSubmitted = caseStatus === 'submitted'

  const claim = data.workspace.claim
  const submittedAt = data.checkoutCase?.submittedAt
  const totals = data.workspace.totals

  const timelineItems = [...data.timeline]
    .sort((a, b) => toTimestamp(b.eventDate) - toTimestamp(a.eventDate))
    .slice(0, 8)

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
        <h3 className="text-sm font-semibold text-zinc-950">Submission</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {submittedAt
            ? `Claim submitted on ${formatDateTime(submittedAt)}.`
            : 'Claim has been submitted and is awaiting resolution.'}
        </p>
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
            <dt className="text-xs text-zinc-500">Disputed</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {totals.disputedAmount > 0 ? (
                <span className="text-rose-700">{formatCurrency(totals.disputedAmount)}</span>
              ) : (
                'None'
              )}
            </dd>
          </div>
        </dl>
      </section>

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
        <div className="flex gap-3 border-t border-zinc-200 pt-6">
          <WorkspaceActionButton
            disabled={isTransitioning}
            tone="primary"
            onClick={() => handleTransition('resolved')}
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Mark resolved
          </WorkspaceActionButton>
          <WorkspaceActionButton
            disabled={isTransitioning}
            tone="danger"
            onClick={() => handleTransition('disputed')}
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Flag dispute
          </WorkspaceActionButton>
        </div>
      ) : null}
    </div>
  )
}
