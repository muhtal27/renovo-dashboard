'use client'

import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepDraftSent({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isDraftSent = caseStatus === 'draft_sent'

  const landlordName = data.workspace.overview.landlords[0]?.fullName ?? 'Landlord'
  const tenantName = data.workspace.tenant?.name ?? data.workspace.tenancy.tenant_name
  const landlordEmail = data.checkoutCase?.landlordEmail
  const tenantEmail = data.checkoutCase?.tenantEmail ?? data.workspace.tenant?.email

  const issues = data.workspace.issues
  const claimTotal = data.workspace.claim?.total_amount ?? data.workspace.totals.totalClaimed
  const chargeableRecs = data.workspace.recommendations.filter((r) => r.decision !== 'no_charge')
  const deposit = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount

  function getIssueTitle(issueId: string) {
    return issues.find((i) => i.id === issueId)?.title ?? 'Untitled issue'
  }

  const sentDrafts = data.emailDrafts.filter((d) => d.status === 'sent')

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
              <dt className="text-zinc-500">Attachment</dt>
              <dd className="text-zinc-600">Checkout report (PDF)</dd>
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
              <dt className="text-zinc-500">Attachment</dt>
              <dd className="text-zinc-600">Checkout report (PDF)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Chargeable items</dt>
              <dd className="font-medium text-zinc-950">{chargeableRecs.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      {chargeableRecs.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Tenant liabilities sent</h3>
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
                {chargeableRecs.map((rec) => (
                  <tr key={rec.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-zinc-950">{getIssueTitle(rec.issue_id)}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{formatEnumLabel(rec.decision)}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-600">
                      {rec.estimated_cost != null ? formatCurrency(rec.estimated_cost) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

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

      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

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
      ) : null}
    </div>
  )
}
