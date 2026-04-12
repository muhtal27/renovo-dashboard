'use client'

import { CheckCircle2, Loader2, RefreshCw, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/app/components/ConfirmDialog'
import { WorkspaceActionButton, WorkspaceBadge } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import {
  checkClaimStatus,
  submitClaimToScheme,
  uploadEvidenceToScheme,
} from '@/lib/eot-api'
import { toTimestamp } from '@/lib/operator-checkout-workspace-helpers'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'
import type { EotClaimStatusResult } from '@/lib/eot-types'

export function StepRefund({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [isSubmittingToScheme, setIsSubmittingToScheme] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false)
  const [schemeStatusData, setSchemeStatusData] = useState<EotClaimStatusResult | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isReadyForClaim = caseStatus === 'ready_for_claim'
  const isSubmitted = caseStatus === 'submitted'
  const isDisputed = caseStatus === 'disputed'
  const isResolved = caseStatus === 'resolved'

  const claim = data.workspace.claim
  const submittedAt = data.checkoutCase?.submittedAt
  const totals = data.workspace.totals
  const summary = data.workspace.case.summary

  const schemeProvider = schemeStatusData?.scheme_provider ?? (claim as any)?.scheme_provider ?? null
  const schemeRef = schemeStatusData?.scheme_reference ?? (claim as any)?.scheme_reference ?? null
  const schemeStatus = schemeStatusData?.scheme_status ?? (claim as any)?.scheme_status ?? null
  const outcome = schemeStatusData?.outcome ?? (claim as any)?.outcome ?? null
  const adjudicatorNotes = schemeStatusData?.adjudicator_notes ?? (claim as any)?.adjudicator_notes ?? null

  const timelineItems = useMemo(
    () => [...data.timeline]
      .sort((a, b) => toTimestamp(b.eventDate) - toTimestamp(a.eventDate))
      .slice(0, 10),
    [data.timeline]
  )

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
      toast.success(targetStatus === 'resolved' ? 'Case resolved successfully' : 'Case flagged as disputed')
      startTransition(() => { router.refresh() })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update case status.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsTransitioning(false)
    }
  }

  async function handleSubmitToScheme() {
    setIsSubmittingToScheme(true)
    setError(null)
    try {
      const result = await submitClaimToScheme(caseId)
      toast.success(
        result.scheme_reference
          ? `Claim submitted to ${formatEnumLabel(result.scheme_provider ?? 'scheme')}: ${result.scheme_reference}`
          : 'Claim submitted to deposit scheme'
      )
      startTransition(() => { router.refresh() })
    } catch (err: any) {
      if (err?.status === 503) {
        toast('No deposit scheme connected. Submitting as manual claim.')
        await handleTransition('submitted')
        return
      }
      const msg = err instanceof Error ? err.message : 'Failed to submit to deposit scheme.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmittingToScheme(false)
    }
  }

  async function handleCheckStatus() {
    setIsCheckingStatus(true)
    try {
      const status = await checkClaimStatus(caseId)
      setSchemeStatusData(status)
      toast.success(`Status: ${formatEnumLabel(status.scheme_status ?? 'unknown')}`)
      startTransition(() => { router.refresh() })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to check claim status.')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  async function handleUploadEvidence() {
    const docs = data.workspace.documents
    if (docs.length === 0) {
      toast.error('No documents to upload. Add documents to the case first.')
      return
    }
    setIsUploadingEvidence(true)
    try {
      const files = docs.map((doc) => ({
        name: doc.name,
        document_type: doc.document_type,
        url: doc.file_url,
        mime_type: null,
      }))
      await uploadEvidenceToScheme(caseId, files)
      toast.success(`${files.length} document${files.length !== 1 ? 's' : ''} uploaded to scheme`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload evidence.')
    } finally {
      setIsUploadingEvidence(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">
          {isDisputed ? 'Dispute in progress' : isResolved ? 'Case resolved' : isSubmitted ? 'Submitted' : 'Submit claim'}
        </h3>
        {isReadyForClaim ? (
          <p className="mt-1 text-sm text-zinc-500">
            The case is ready for submission. Submit to the connected deposit scheme or mark as submitted manually.
          </p>
        ) : isSubmitted ? (
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
            The case has not yet reached the submission stage.
          </p>
        )}
      </section>

      {/* Final position */}
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
              {totals.depositAmount != null ? formatCurrency(totals.depositAmount) : '\u2014'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Return to tenant</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {totals.returnToTenant != null ? formatCurrency(totals.returnToTenant) : '\u2014'}
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
                <span className="text-zinc-400">Ready for claim</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Deposit scheme tracking (visible when submitted or disputed) */}
      {(isSubmitted || isDisputed) && schemeProvider ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Deposit scheme tracking</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3">
            <span className={`h-2.5 w-2.5 rounded-full ${isDisputed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="text-sm font-semibold text-zinc-950">{formatEnumLabel(schemeProvider)}</span>
            {schemeRef ? (
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                Ref: {schemeRef}
              </span>
            ) : null}
            <WorkspaceBadge
              label={formatEnumLabel(schemeStatus ?? caseStatus)}
              tone={isDisputed ? 'disputed' : 'submitted'}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <WorkspaceActionButton
              disabled={isUploadingEvidence}
              tone="primary"
              onClick={handleUploadEvidence}
            >
              {isUploadingEvidence ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload evidence to scheme
            </WorkspaceActionButton>
            <WorkspaceActionButton
              disabled={isCheckingStatus}
              tone="primary"
              onClick={handleCheckStatus}
            >
              {isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Check status
            </WorkspaceActionButton>
          </div>
        </section>
      ) : null}

      {/* Outcome display */}
      {outcome ? (
        <section className="rounded-md border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Adjudication outcome
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {outcome.amount_awarded != null ? (
              <div>
                <dt className="text-xs text-emerald-600">Amount awarded</dt>
                <dd className="mt-0.5 text-lg font-semibold text-emerald-900">
                  {formatCurrency(String(outcome.amount_awarded))}
                </dd>
              </div>
            ) : null}
            {outcome.amount_to_landlord != null ? (
              <div>
                <dt className="text-xs text-emerald-600">To landlord</dt>
                <dd className="mt-0.5 text-lg font-semibold text-emerald-900">
                  {formatCurrency(String(outcome.amount_to_landlord))}
                </dd>
              </div>
            ) : null}
            {outcome.amount_to_tenant != null ? (
              <div>
                <dt className="text-xs text-zinc-500">To tenant</dt>
                <dd className="mt-0.5 text-lg font-semibold text-zinc-700">
                  {formatCurrency(String(outcome.amount_to_tenant))}
                </dd>
              </div>
            ) : null}
          </dl>
          {adjudicatorNotes ? (
            <div className="mt-4 border-t border-emerald-200 pt-3">
              <p className="text-xs font-medium text-emerald-700">Adjudicator notes</p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-900">{adjudicatorNotes}</p>
            </div>
          ) : null}
        </section>
      ) : null}

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

      {/* Submit to scheme (ready_for_claim) */}
      {isReadyForClaim ? (
        <div className="border-t border-zinc-200 pt-6">
          <WorkspaceActionButton
            disabled={isSubmittingToScheme || isTransitioning}
            tone="primary"
            onClick={handleSubmitToScheme}
          >
            {isSubmittingToScheme ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit to deposit scheme
          </WorkspaceActionButton>
        </div>
      ) : null}

      {/* Resolution actions (submitted) */}
      {isSubmitted ? (
        <div className="flex gap-3 border-t border-zinc-200 pt-6">
          <WorkspaceActionButton
            disabled={isTransitioning}
            tone="primary"
            onClick={() => setConfirmAction('resolved')}
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
      ) : isDisputed ? (
        <div className="border-t border-zinc-200 pt-6">
          <WorkspaceActionButton disabled={isTransitioning} tone="primary" onClick={() => setConfirmAction('resolved')}>
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Resolve dispute
          </WorkspaceActionButton>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmAction === 'resolved'}
        title="Mark this case as resolved?"
        description="This will close the case permanently. This action cannot be undone."
        confirmLabel="Resolve case"
        cancelLabel="Cancel"
        onConfirm={() => handleTransition('resolved')}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'disputed'}
        title="Flag this case as disputed?"
        description="This will move the case into dispute handling. You can resolve it later."
        confirmLabel="Flag dispute"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={() => handleTransition('disputed')}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
