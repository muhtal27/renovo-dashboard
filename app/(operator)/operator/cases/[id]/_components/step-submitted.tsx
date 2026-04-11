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
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [schemeStatus, setSchemeStatus] = useState<{
    scheme_provider: string | null
    scheme_reference: string | null
    scheme_status: string | null
    adjudicator_notes: string | null
    submitted_at: string | null
  } | null>(null)

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

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950">Deposit scheme</h3>
          <button
            type="button"
            disabled={isCheckingStatus}
            onClick={async () => {
              setIsCheckingStatus(true)
              try {
                const res = await fetch(`/api/integrations/cases/${caseId}/claim-status`)
                if (res.status === 503) {
                  setSchemeStatus(null)
                  return
                }
                if (res.ok) {
                  const data = await res.json()
                  setSchemeStatus(data)
                }
              } catch {
                // Silently ignore — scheme status is supplementary
              } finally {
                setIsCheckingStatus(false)
              }
            }}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {isCheckingStatus ? 'Checking...' : 'Check status'}
          </button>
        </div>
        {schemeStatus?.scheme_provider ? (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm xl:grid-cols-3">
              <div>
                <dt className="text-xs text-zinc-500">Scheme</dt>
                <dd className="mt-0.5 font-medium text-zinc-950">{schemeStatus.scheme_provider}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Reference</dt>
                <dd className="mt-0.5 font-medium text-zinc-950">{schemeStatus.scheme_reference || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Status</dt>
                <dd className="mt-0.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    schemeStatus.scheme_status === 'submitted' ? 'bg-blue-50 text-blue-700' :
                    schemeStatus.scheme_status === 'under_review' ? 'bg-amber-50 text-amber-700' :
                    schemeStatus.scheme_status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                    schemeStatus.scheme_status === 'disputed' ? 'bg-rose-50 text-rose-700' :
                    'bg-zinc-100 text-zinc-600'
                  }`}>
                    {schemeStatus.scheme_status || 'unknown'}
                  </span>
                </dd>
              </div>
            </dl>
            {schemeStatus.adjudicator_notes ? (
              <div className="mt-3 border-t border-zinc-200 pt-3">
                <p className="text-xs text-zinc-500">Adjudicator notes</p>
                <p className="mt-1 text-sm text-zinc-700">{schemeStatus.adjudicator_notes}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            No deposit scheme submission linked. Click &quot;Check status&quot; to refresh.
          </p>
        )}
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
