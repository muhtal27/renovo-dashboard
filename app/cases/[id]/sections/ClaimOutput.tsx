'use client'

import { useMemo, useState } from 'react'
import { endOfTenancyApiRequest } from '@/lib/end-of-tenancy/client-api'
import type { EndOfTenancyWorkspacePayload } from '@/lib/end-of-tenancy/types'
import { supabase } from '@/lib/supabase'
import { formatLabel, formatMoney, getClaimStatusTone, toNumber } from '@/app/cases/[id]/workspace-utils'

function getLineItemTone(status: string | null) {
  switch (status) {
    case 'resolved':
    case 'agreed':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'submitted':
    case 'proposed':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'disputed':
      return 'border border-red-200 bg-red-50 text-red-800'
    default:
      return 'border border-amber-200 bg-amber-50 text-amber-800'
  }
}

export function ClaimOutput({
  endOfTenancyCaseId,
  workflowStatus,
  depositClaim,
  lineItems,
  issues,
  tenancy,
  onRefresh,
}: {
  endOfTenancyCaseId: string
  workflowStatus: string | null
  depositClaim: EndOfTenancyWorkspacePayload['depositClaim']
  lineItems: EndOfTenancyWorkspacePayload['lineItems']
  issues: EndOfTenancyWorkspacePayload['issues']
  tenancy: EndOfTenancyWorkspacePayload['tenancy']
  onRefresh: () => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [amountAgreedDrafts, setAmountAgreedDrafts] = useState<Record<string, string>>({})

  const claimUnlocked =
    workflowStatus === 'recommendation_approved' || workflowStatus === 'ready_for_claim'

  const issueMap = useMemo(
    () => new Map(issues.map((issue) => [issue.id, issue] as const)),
    [issues]
  )

  const totalClaimed = useMemo(
    () =>
      lineItems.reduce((sum, item) => sum + (toNumber(item.amount_claimed) ?? 0), 0),
    [lineItems]
  )

  const totalAgreed = useMemo(
    () =>
      lineItems.reduce((sum, item) => {
        const draft = amountAgreedDrafts[item.id]
        const amount = draft != null && draft !== '' ? Number(draft) : toNumber(item.amount_agreed)
        const safeAmount = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
        return sum + safeAmount
      }, 0),
    [amountAgreedDrafts, lineItems]
  )

  async function handleGenerateClaim() {
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await endOfTenancyApiRequest('/api/eot/generate-claim', {
        method: 'POST',
        body: JSON.stringify({
          eot_case_id: endOfTenancyCaseId,
        }),
      })

      setMessage('Draft claim generated.')
      await onRefresh()
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Unable to generate the claim.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveAmountAgreed(lineItemId: string) {
    const nextValue = amountAgreedDrafts[lineItemId]
    const normalizedValue = (nextValue ?? '').trim()
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const { error: updateError } = await supabase
        .from('deposit_claim_line_items')
        .update({
          amount_agreed: normalizedValue ? Number(normalizedValue) : null,
        })
        .eq('id', lineItemId)

      if (updateError) {
        throw updateError
      }

      setMessage('Line item updated.')
      await onRefresh()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update the line item.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMarkSubmitted() {
    if (!depositClaim) return

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const { error: updateError } = await supabase
        .from('deposit_claims')
        .update({
          claim_status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', depositClaim.id)

      if (updateError) {
        throw updateError
      }

      setMessage('Claim marked as submitted.')
      await onRefresh()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update the claim.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="claim" className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
      <div>
        <p className="app-kicker">Claim output</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          Deposit claim summary and line items
        </h2>
      </div>

      <div className="app-divider my-6" />

      {!claimUnlocked ? (
        <div className="rounded-[1.6rem] border border-dashed border-stone-300 bg-stone-50/80 px-6 py-10 text-sm text-stone-500">
          Approve the recommendation first to generate the claim.
        </div>
      ) : !depositClaim ? (
        <div className="rounded-[1.6rem] border border-dashed border-stone-300 bg-stone-50/80 px-6 py-10">
          <h3 className="text-lg font-semibold text-stone-900">No deposit claim generated yet</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            Approved issues can now be turned into a draft claim and line-item pack.
          </p>
          <button
            type="button"
            onClick={() => void handleGenerateClaim()}
            disabled={submitting}
            className="app-primary-button mt-6 rounded-full px-5 py-3 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? 'Generating claim...' : 'Generate claim'}
          </button>
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-5">
              <p className="app-kicker">Total claim amount</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
                {formatMoney(depositClaim.total_claim_amount)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-5">
              <p className="app-kicker">Deposit amount</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
                {formatMoney(tenancy?.deposit_amount)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-5">
              <p className="app-kicker">Scheme</p>
              <p className="mt-3 text-sm font-semibold text-stone-900">
                {tenancy?.deposit_scheme_name || 'Not recorded'}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                {tenancy?.deposit_reference || depositClaim.scheme_reference || 'No reference'}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-5">
              <p className="app-kicker">Claim status</p>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getClaimStatusTone(depositClaim.claim_status)}`}>
                {formatLabel(depositClaim.claim_status)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Responsibility</th>
                  <th className="px-3 py-2">Amount claimed</th>
                  <th className="px-3 py-2">Amount agreed</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="rounded-l-[1.4rem] border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm font-medium text-stone-900">
                      {item.description}
                    </td>
                    <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                        {formatLabel(item.category)}
                      </span>
                    </td>
                    <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                      {formatLabel(
                        item.end_of_tenancy_issue_id
                          ? issueMap.get(item.end_of_tenancy_issue_id)?.responsibility || 'not_linked'
                          : 'not_linked'
                      )}
                    </td>
                    <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                      {formatMoney(item.amount_claimed)}
                    </td>
                    <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountAgreedDrafts[item.id] ?? (item.amount_agreed == null ? '' : String(item.amount_agreed))}
                          onChange={(event) =>
                            setAmountAgreedDrafts((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="app-field w-28"
                        />
                        <button
                          type="button"
                          onClick={() => void handleSaveAmountAgreed(item.id)}
                          disabled={submitting}
                          className="app-secondary-button rounded-full px-3 py-2 text-xs font-medium text-stone-700 disabled:opacity-60"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td className="rounded-r-[1.4rem] border border-stone-200 bg-white px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getLineItemTone(item.line_item_status)}`}>
                        {formatLabel(item.line_item_status)}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="px-3 pt-4 text-right text-sm font-semibold text-stone-900">
                    Totals
                  </td>
                  <td className="px-3 pt-4 text-sm font-semibold text-stone-900">
                    {formatMoney(totalClaimed)}
                  </td>
                  <td className="px-3 pt-4 text-sm font-semibold text-stone-900">
                    {formatMoney(totalAgreed)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleMarkSubmitted()}
              disabled={submitting}
              className="app-primary-button rounded-full px-5 py-3 text-sm font-medium disabled:opacity-60"
            >
              Mark as submitted
            </button>
            <button
              type="button"
              disabled
              title="PDF export coming soon"
              className="app-secondary-button cursor-not-allowed rounded-full px-5 py-3 text-sm font-medium text-stone-400"
            >
              Download summary
            </button>
          </div>

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      )}
    </section>
  )
}
