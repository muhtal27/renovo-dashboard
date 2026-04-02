'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepReady({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isReady = caseStatus === 'ready_for_claim'

  const claim = data.workspace.claim
  const breakdown = data.workspace.claimBreakdown
  const deposit = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const totals = data.workspace.totals
  const negotiationNotes = data.checkoutCase?.negotiationNotes

  async function handleSubmit() {
    setIsTransitioning(true)
    setError(null)
    try {
      const response = await fetch(`/api/eot/cases/${caseId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || 'Failed to submit claim.')
      }
      startTransition(() => { router.refresh() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit claim.')
    } finally {
      setIsTransitioning(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Claim summary</h3>
        {claim ? (
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            {formatCurrency(claim.total_amount)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No claim generated.</p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Financial position</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">Deposit held</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {deposit != null ? formatCurrency(deposit) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Total claimed</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{formatCurrency(totals.totalClaimed)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Return to tenant</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {totals.returnToTenant != null ? formatCurrency(totals.returnToTenant) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Disputed amount</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {totals.disputedAmount > 0 ? (
                <span className="text-rose-700">{formatCurrency(totals.disputedAmount)}</span>
              ) : (
                formatCurrency(0)
              )}
            </dd>
          </div>
        </dl>
      </section>

      {breakdown.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Claim breakdown</h3>
          <div className="mt-3 overflow-hidden border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Item</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Decision</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-zinc-950">{item.title}</td>
                    <td className="px-4 py-2.5 text-zinc-600">
                      {item.decision ? formatEnumLabel(item.decision) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-zinc-600">
                      {formatCurrency(item.estimatedCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {negotiationNotes ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Negotiation notes</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{negotiationNotes}</p>
        </section>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

      {isReady ? (
        <div className="border-t border-zinc-200 pt-6">
          <p className="mb-3 text-sm text-zinc-600">
            Once submitted, the case moves to the submitted state and cannot be edited without dispute
            resolution.
          </p>
          <WorkspaceActionButton disabled={isTransitioning} tone="primary" onClick={handleSubmit}>
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit claim
          </WorkspaceActionButton>
        </div>
      ) : null}
    </div>
  )
}
