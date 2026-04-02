'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepReview({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isReview = caseStatus === 'review'
  const defects = data.defects
  const recommendations = data.workspace.recommendations
  const issues = data.workspace.issues
  const claim = data.workspace.claim
  const breakdown = data.workspace.claimBreakdown

  function getIssueTitle(issueId: string) {
    return issues.find((i) => i.id === issueId)?.title ?? 'Untitled issue'
  }

  const tenantName = data.workspace.tenant?.name ?? data.workspace.tenancy.tenant_name
  const landlordName = data.workspace.overview.landlords[0]?.fullName ?? 'Landlord'
  const tenantEmail = data.checkoutCase?.tenantEmail ?? data.workspace.tenant?.email
  const landlordEmail = data.checkoutCase?.landlordEmail

  const canSend = isReview && Boolean(landlordEmail || tenantEmail)

  async function handleSendDraft() {
    setIsSending(true)
    setError(null)
    try {
      // Send emails
      const sendResponse = await fetch(`/api/eot/cases/${caseId}/send-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!sendResponse.ok) {
        const err = await sendResponse.json().catch(() => null)
        throw new Error(err?.detail || err?.error || 'Failed to send draft emails.')
      }
      // Transition to draft_sent
      const transitionResponse = await fetch(`/api/eot/cases/${caseId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft_sent' }),
      })
      if (!transitionResponse.ok) {
        const err = await transitionResponse.json().catch(() => null)
        throw new Error(err?.detail || 'Emails sent but status transition failed.')
      }
      startTransition(() => { router.refresh() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send draft.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Defects</h3>
        {defects.length > 0 ? (
          <div className="mt-3 overflow-hidden border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Item</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Liability</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Confidence</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {defects.map((d) => {
                  const liability = d.operatorLiability ?? d.aiSuggestedLiability
                  return (
                    <tr key={d.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-zinc-950">{d.itemName}</p>
                        {d.description ? (
                          <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{d.description}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-600">{formatEnumLabel(d.defectType)}</td>
                      <td className="px-4 py-2.5">
                        {liability ? (
                          <span
                            className={
                              liability === 'tenant'
                                ? 'text-amber-700'
                                : liability === 'landlord'
                                  ? 'text-blue-700'
                                  : 'text-violet-700'
                            }
                          >
                            {formatEnumLabel(liability)}
                          </span>
                        ) : (
                          <span className="text-zinc-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-600">
                        {d.aiConfidence != null ? `${Math.round(d.aiConfidence * 100)}%` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-600">
                        {d.costEstimate != null ? formatCurrency(d.costEstimate) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No defects identified.</p>
        )}
      </section>

      <div className="border-t border-zinc-100" />

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Recommendations</h3>
        {recommendations.length > 0 ? (
          <div className="mt-3 space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-zinc-200 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-950">{getIssueTitle(rec.issue_id)}</p>
                    {rec.rationale ? (
                      <p className="mt-1 text-xs leading-5 text-zinc-500 line-clamp-2">{rec.rationale}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    <span
                      className={
                        rec.decision === 'charge'
                          ? 'font-medium text-amber-700'
                          : rec.decision === 'partial'
                            ? 'font-medium text-violet-700'
                            : 'text-emerald-700'
                      }
                    >
                      {formatEnumLabel(rec.decision)}
                    </span>
                    {rec.estimated_cost != null ? (
                      <span className="font-medium text-zinc-950">{formatCurrency(rec.estimated_cost)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No recommendations generated.</p>
        )}
      </section>

      <div className="border-t border-zinc-100" />

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Claim summary</h3>
        {claim ? (
          <>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              {formatCurrency(claim.total_amount)}
            </p>
            {breakdown.length > 0 ? (
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
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No claim generated yet.</p>
        )}
      </section>

      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

      {isReview ? (
        <div className="border-t border-zinc-200 pt-6">
          <p className="mb-3 text-sm text-zinc-600">
            Sending the draft will email the complete checkout report to{' '}
            <span className="font-medium text-zinc-950">{landlordName}</span>
            {landlordEmail ? ` (${landlordEmail})` : ''} and tenant liabilities to{' '}
            <span className="font-medium text-zinc-950">{tenantName}</span>
            {tenantEmail ? ` (${tenantEmail})` : ''}.
          </p>
          <WorkspaceActionButton disabled={!canSend || isSending} tone="primary" onClick={handleSendDraft}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send draft to parties
          </WorkspaceActionButton>
          {!canSend && isReview ? (
            <p className="mt-2 text-xs text-zinc-500">
              At least one email address (landlord or tenant) is required to send the draft.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
