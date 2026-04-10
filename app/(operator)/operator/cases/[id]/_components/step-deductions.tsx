'use client'

import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/app/components/ConfirmDialog'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepDeductions({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isDraftSent = caseStatus === 'draft_sent'
  const isReady = caseStatus === 'ready_for_claim'

  const landlordName = data.workspace.overview.landlords[0]?.fullName ?? 'Landlord'
  const tenantName = data.workspace.tenant?.name ?? data.workspace.tenancy.tenant_name
  const landlordEmail = data.checkoutCase?.landlordEmail
  const tenantEmail = data.checkoutCase?.tenantEmail ?? data.workspace.tenant?.email

  const issues = data.workspace.issues
  const claim = data.workspace.claim
  const claimTotal = claim?.total_amount ?? data.workspace.totals.totalClaimed
  const breakdown = data.workspace.claimBreakdown
  const chargeableRecs = data.workspace.recommendations.filter((r) => r.decision !== 'no_charge')
  const deposit = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const totals = data.workspace.totals
  const negotiationNotes = data.checkoutCase?.negotiationNotes

  function getIssueTitle(issueId: string) {
    return issues.find((i) => i.id === issueId)?.title ?? 'Untitled issue'
  }

  const sentDrafts = data.emailDrafts.filter((d) => d.status === 'sent')

  async function handleTransition(targetStatus: string) {
    setIsTransitioning(true)
    setError(null)
    setConfirmAction(null)
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
      toast.success(targetStatus === 'submitted' ? 'Claim submitted successfully' : 'Case status updated')
      startTransition(() => { router.refresh() })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update case status.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsTransitioning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Draft sent section */}
      {(isDraftSent || isReady || ['submitted', 'resolved', 'disputed'].includes(caseStatus)) ? (
        <>
          <section>
            <h3 className="text-sm font-semibold text-zinc-950">Draft sent to parties</h3>
            <p className="mt-1 text-sm text-zinc-500">
              The checkout report draft has been sent. Review the delivery status below.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-zinc-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-50">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-zinc-950">Landlord — complete report</p>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Recipient</dt>
                  <dd className="font-medium text-zinc-950">{landlordName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="text-zinc-600">{landlordEmail || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Total claim</dt>
                  <dd className="font-medium text-zinc-950">{formatCurrency(claimTotal)}</dd>
                </div>
              </dl>
            </div>

            <div className="border border-zinc-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-50">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-zinc-950">Tenant — liabilities only</p>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Recipient</dt>
                  <dd className="font-medium text-zinc-950">{tenantName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="text-zinc-600">{tenantEmail || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Chargeable items</dt>
                  <dd className="font-medium text-zinc-950">{chargeableRecs.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      ) : null}

      {/* Awaiting deductions */}
      {!isDraftSent && !isReady && !['submitted', 'resolved', 'disputed'].includes(caseStatus) ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Awaiting deposit deductions</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Complete the review step and send the draft to parties before deductions can be finalised.
          </p>
        </section>
      ) : null}

      {/* Financial position */}
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

      {/* Claim breakdown */}
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

      {/* Email delivery log */}
      {sentDrafts.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Email delivery log</h3>
          <div className="mt-3 space-y-2">
            {sentDrafts.map((draft) => (
              <div key={draft.id} className="flex items-center justify-between border-b border-zinc-100 py-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-950">{draft.subject || formatEnumLabel(draft.draftType)}</p>
                  <p className="text-xs text-zinc-500">{draft.sentTo || '—'}</p>
                </div>
                <span className="text-xs font-medium text-emerald-700">Sent</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Negotiation notes */}
      {negotiationNotes ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Negotiation notes</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{negotiationNotes}</p>
        </section>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

      {/* Actions */}
      {isDraftSent ? (
        <div className="flex gap-3 border-t border-zinc-200 pt-6">
          <WorkspaceActionButton
            disabled={isTransitioning}
            tone="primary"
            onClick={() => handleTransition('ready_for_claim')}
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Proceed to claim
          </WorkspaceActionButton>
          <WorkspaceActionButton
            disabled={isTransitioning}
            tone="secondary"
            onClick={() => handleTransition('review')}
          >
            Back to review
          </WorkspaceActionButton>
        </div>
      ) : isReady ? (
        <div className="border-t border-zinc-200 pt-6">
          <p className="mb-3 text-sm text-zinc-600">
            Once submitted, the case moves to the submitted state and cannot be edited without dispute
            resolution.
          </p>
          <WorkspaceActionButton disabled={isTransitioning} tone="primary" onClick={() => setConfirmAction('submitted')}>
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit claim
          </WorkspaceActionButton>
          <ConfirmDialog
            open={confirmAction === 'submitted'}
            title="Submit this claim?"
            description="Once submitted, the case cannot be edited without dispute resolution. This action is irreversible."
            confirmLabel="Submit claim"
            cancelLabel="Cancel"
            onConfirm={() => handleTransition('submitted')}
            onCancel={() => setConfirmAction(null)}
          />
        </div>
      ) : null}
    </div>
  )
}
