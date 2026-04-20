'use client'

import { CheckCircle2, Clock, FileText, Landmark, Loader2, RefreshCw, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/app/components/ConfirmDialog'
import { FinalClaimStatement, type FinalClaimDeduction } from '@/app/components/FinalClaimStatement'
import { WorkspaceActionButton, WorkspaceBadge } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatAddress, formatCurrency, formatDate, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import {
  checkClaimStatus,
  submitClaimToScheme,
  uploadEvidenceToScheme,
} from '@/lib/eot-api'
import { toTimestamp } from '@/lib/operator-checkout-workspace-helpers'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'
import type { EotClaimStatusResult } from '@/lib/eot-types'

const DEPOSIT_SCHEME_LABELS: Record<string, string> = {
  tds: 'TDS',
  dps: 'DPS',
  mydeposits: 'mydeposits',
  safedeposits_scotland: 'SafeDeposits Scotland',
}

type TimelineFilter = 'all' | 'key' | 'alerts' | 'activity'

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
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all')
  const [showFinalStatement, setShowFinalStatement] = useState(false)

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

  const claimRecord = claim as Record<string, unknown> | null
  const schemeProvider = schemeStatusData?.scheme_provider ?? (claimRecord?.scheme_provider as string | null) ?? null
  const schemeRef = schemeStatusData?.scheme_reference ?? (claimRecord?.scheme_reference as string | null) ?? null
  const schemeStatus = schemeStatusData?.scheme_status ?? (claimRecord?.scheme_status as string | null) ?? null
  const outcome = schemeStatusData?.outcome ?? (claimRecord?.outcome as EotClaimStatusResult['outcome']) ?? null
  const adjudicatorNotes = schemeStatusData?.adjudicator_notes ?? (claimRecord?.adjudicator_notes as string | null) ?? null

  const timelineItems = useMemo(
    () => [...data.timeline]
      .sort((a, b) => toTimestamp(b.eventDate) - toTimestamp(a.eventDate))
      .slice(0, 10),
    [data.timeline]
  )

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'all') return timelineItems
    if (timelineFilter === 'key') return timelineItems.filter((item) => item.eventType.includes('submitted') || item.eventType.includes('resolved') || item.eventType.includes('disputed'))
    if (timelineFilter === 'alerts') return timelineItems.filter((item) => item.eventType.includes('alert') || item.eventType.includes('warning') || item.eventType.includes('error'))
    return timelineItems.filter((item) => item.eventType.includes('activity') || item.eventType.includes('update') || item.eventType.includes('note'))
  }, [timelineItems, timelineFilter])

  function getTimelineIconTone(eventType: string): string {
    if (eventType.includes('resolved') || eventType.includes('submitted') || eventType.includes('approved')) return 'text-emerald-600'
    if (eventType.includes('alert') || eventType.includes('warning') || eventType.includes('disputed')) return 'text-amber-600'
    return 'text-zinc-500'
  }

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
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err && (err as Record<string, unknown>).status === 503) {
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

  /* ── Final Claim Statement props (only used while resolved) ── */
  const leadTenantName = data.workspace.tenant.name
  const leadLandlord = data.workspace.overview.landlords[0]
  const caseReference = data.checkoutCase?.caseReference ?? caseId.slice(0, 8).toUpperCase()
  const property = data.workspace.property
  const propertyLine = formatAddress([
    property.address_line_1,
    property.address_line_2,
    property.city,
    property.postcode,
  ])
  const tenancyPeriodLabel =
    data.workspace.tenancy.start_date && data.workspace.tenancy.end_date
      ? `${formatDate(data.workspace.tenancy.start_date)} – ${formatDate(data.workspace.tenancy.end_date)}`
      : '—'
  const depositSchemeKey = data.checkoutCase?.depositScheme ?? ''
  const depositSchemeLabel = DEPOSIT_SCHEME_LABELS[depositSchemeKey] ?? '—'
  const depositAmount = totals.depositAmount ?? 0
  const totalClaim = totals.totalClaimed ?? 0

  // Phase 3a-4: response-tracking is not yet persisted per-item, so we fold
  // everything into "agreed" for the Negotiation Summary. When tenant /
  // landlord response tracking lands, populate the disputed / countered
  // buckets from the corresponding records.
  const agreedAmount = outcome?.amount_to_landlord != null
    ? Number(outcome.amount_to_landlord)
    : totalClaim
  const disputedAmount = 0
  const counteredAmount = 0

  const finalDeductions: FinalClaimDeduction[] = (data.workspace.claimBreakdown ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    room: '',
    amount: Number(item.estimatedCost ?? 0),
    tenantStatus: null,
    tenantCounterAmount: null,
    landlordStatus: null,
  }))

  const generatedAtLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  /* ── Resolved state ────────────────────────────────────────── */
  if (isResolved) {
    return (
      <div className="space-y-6">
        <div className="rounded-[10px] border-2 border-emerald-200 bg-emerald-50 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-emerald-700">Case Resolved</h3>
          <p className="mt-2 text-sm text-emerald-600/80">
            This case has been resolved and closed.
            {submittedAt ? ` Claim submitted on ${formatDateTime(submittedAt)}.` : ''}
          </p>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowFinalStatement(true)}
              className="btn btn-accent btn-sm"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>View Final Claim Statement</span>
            </button>
          </div>

          {/* Breakdown */}
          <div className="mx-auto mt-8 max-w-md space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span className="text-zinc-600">To Landlord</span>
              </div>
              <span className="font-semibold text-zinc-900">
                {outcome?.amount_to_landlord != null
                  ? formatCurrency(String(outcome.amount_to_landlord))
                  : totals.totalClaimed
                    ? formatCurrency(totals.totalClaimed)
                    : '\u2014'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
                <span className="text-zinc-600">To Tenant</span>
              </div>
              <span className="font-semibold text-zinc-900">
                {outcome?.amount_to_tenant != null
                  ? formatCurrency(String(outcome.amount_to_tenant))
                  : totals.returnToTenant != null
                    ? formatCurrency(totals.returnToTenant)
                    : '\u2014'}
              </span>
            </div>
            <div className="border-t border-emerald-200 pt-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="font-medium text-zinc-700">Total Deposit</span>
                </div>
                <span className="font-semibold text-zinc-900">
                  {totals.depositAmount != null ? formatCurrency(totals.depositAmount) : '\u2014'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {summary ? (
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-950">Case Summary</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{summary}</p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

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

        {/* Final Claim Statement overlay — prototype: demo.html:1610-1682 */}
        <FinalClaimStatement
          open={showFinalStatement}
          caseRef={caseReference}
          generatedAtLabel={generatedAtLabel}
          property={propertyLine}
          depositScheme={depositSchemeLabel}
          tenancyPeriodLabel={tenancyPeriodLabel}
          depositType={data.checkoutCase?.depositType ?? 'custodial'}
          tenant={leadTenantName}
          landlord={leadLandlord?.fullName || 'Landlord'}
          managingAgent={data.checkoutCase?.agencyName ?? 'Managing Agent'}
          depositAmount={depositAmount}
          totalClaim={totalClaim}
          agreedAmount={agreedAmount}
          disputedAmount={disputedAmount}
          counteredAmount={counteredAmount}
          deductions={finalDeductions}
          onClose={() => setShowFinalStatement(false)}
        />
      </div>
    )
  }

  /* ── Processing state (not resolved) ───────────────────────── */
  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-500">Total Claimed</p>
          <p className="mt-2 text-xl font-bold tabular-nums text-emerald-600">
            {claim ? formatCurrency(claim.total_amount) : formatCurrency(totals.totalClaimed)}
          </p>
        </div>
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-500">Deposit Held</p>
          <p className="mt-2 text-xl font-bold tabular-nums text-zinc-950">
            {totals.depositAmount != null ? formatCurrency(totals.depositAmount) : '\u2014'}
          </p>
        </div>
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-500">Return to Tenant</p>
          <p className="mt-2 text-xl font-bold tabular-nums text-zinc-950">
            {totals.returnToTenant != null ? formatCurrency(totals.returnToTenant) : '\u2014'}
          </p>
        </div>
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-500">Return to Landlord</p>
          <p className="mt-2 text-xl font-bold tabular-nums text-zinc-950">
            {totals.totalClaimed ? formatCurrency(totals.totalClaimed) : '\u2014'}
          </p>
        </div>
      </div>

      {/* 2-column layout: Deposit Breakdown + Scheme Submission */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Deposit Breakdown */}
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-950">Deposit Breakdown</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span className="text-zinc-600">To Landlord</span>
              </div>
              <span className="font-semibold text-zinc-900">
                {claim ? formatCurrency(claim.total_amount) : formatCurrency(totals.totalClaimed)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
                <span className="text-zinc-600">To Tenant</span>
              </div>
              <span className="font-semibold text-zinc-900">
                {totals.returnToTenant != null ? formatCurrency(totals.returnToTenant) : '\u2014'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Scheme Submission */}
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-950">Scheme Submission</h3>

          {/* Submission status box */}
          <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
            <div className="flex items-center gap-3">
              {schemeProvider || isSubmitted || isDisputed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <Landmark className="h-5 w-5 shrink-0 text-zinc-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">
                  {schemeProvider ? formatEnumLabel(schemeProvider) : 'Deposit Scheme'}
                </p>
                {schemeRef ? (
                  <p className="text-xs text-zinc-500">Ref: {schemeRef}</p>
                ) : null}
              </div>
              {isSubmitted || isDisputed ? (
                <WorkspaceBadge
                  label={formatEnumLabel(schemeStatus ?? caseStatus)}
                  tone={isDisputed ? 'disputed' : 'submitted'}
                />
              ) : (
                <WorkspaceBadge label="Pending" tone="pending" />
              )}
            </div>
          </div>

          {/* Scheme action buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {isReadyForClaim ? (
              <button
                disabled={isSubmittingToScheme || isTransitioning}
                onClick={() => setConfirmAction('submit_scheme')}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingToScheme ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Submit to Scheme
              </button>
            ) : (isSubmitted || isDisputed) ? (
              <>
                <button
                  disabled={isUploadingEvidence}
                  onClick={handleUploadEvidence}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploadingEvidence ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Evidence
                </button>
                <button
                  disabled={isCheckingStatus}
                  onClick={handleCheckStatus}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Check Status
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Adjudication Outcome */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950">Adjudication Outcome</h3>
          {!outcome ? (
            <WorkspaceBadge label="Awaiting" tone="warning" />
          ) : null}
        </div>

        {outcome ? (
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              {outcome.amount_awarded != null ? (
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <p className="text-xs font-medium text-zinc-500">Amount Claimed</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                    {claim ? formatCurrency(claim.total_amount) : formatCurrency(totals.totalClaimed)}
                  </p>
                </div>
              ) : null}
              {outcome.amount_awarded != null ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-medium text-emerald-600">Amount Awarded</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-700">
                    {formatCurrency(String(outcome.amount_awarded))}
                  </p>
                </div>
              ) : null}
              {outcome.amount_awarded != null && totals.totalClaimed ? (
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <p className="text-xs font-medium text-zinc-500">Success Rate</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                    {Math.round(
                      (Number(outcome.amount_awarded) /
                        (claim ? Number(claim.total_amount) : Number(totals.totalClaimed))) *
                        100
                    )}%
                  </p>
                </div>
              ) : null}
            </div>
            {adjudicatorNotes ? (
              <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium text-zinc-500">Adjudicator Notes</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700">{adjudicatorNotes}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <p className="mt-3 text-sm text-zinc-500">No adjudication outcome received yet</p>
          </div>
        )}
      </div>

      {summary ? (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-950">Case Summary</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{summary}</p>
        </div>
      ) : null}

      {/* Case Timeline */}
      {timelineItems.length > 0 ? (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-950">Case Timeline</h3>
            <div className="flex gap-1">
              {(['all', 'key', 'alerts', 'activity'] as TimelineFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTimelineFilter(filter)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    timelineFilter === filter
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-0">
            {filteredTimeline.map((item) => (
              <div key={item.id} className="flex items-start gap-3 border-b border-zinc-100 py-3 last:border-0">
                <div className={`mt-0.5 shrink-0 ${getTimelineIconTone(item.eventType)}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{formatEnumLabel(item.eventType)}</p>
                  <p className="text-xs text-zinc-500">{item.eventDescription}</p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">{formatDateTime(item.eventDate)}</span>
              </div>
            ))}
            {filteredTimeline.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">No timeline events match this filter</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {/* Bottom action buttons */}
      {isSubmitted ? (
        <div className="flex gap-3 pt-2">
          <button
            disabled={isTransitioning}
            onClick={() => setConfirmAction('disputed')}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark Disputed
          </button>
          <button
            disabled={isTransitioning}
            onClick={() => setConfirmAction('resolved')}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark Resolved
          </button>
        </div>
      ) : isDisputed ? (
        <div className="flex gap-3 pt-2">
          <button
            disabled={isTransitioning}
            onClick={() => setConfirmAction('disputed')}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark Disputed
          </button>
          <button
            disabled={isTransitioning}
            onClick={() => setConfirmAction('resolved')}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark Resolved
          </button>
        </div>
      ) : isReadyForClaim ? (
        <div className="flex gap-3 pt-2">
          <p className="text-sm text-zinc-500">
            The case is ready for submission. Submit to the connected deposit scheme or mark as submitted manually.
          </p>
        </div>
      ) : null}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmAction === 'submit_scheme'}
        title="Submit claim to deposit scheme?"
        description="This will submit the claim to the connected deposit scheme. Ensure all deductions and evidence are finalised before proceeding."
        confirmLabel="Submit to scheme"
        cancelLabel="Cancel"
        onConfirm={() => {
          setConfirmAction(null)
          handleSubmitToScheme()
        }}
        onCancel={() => setConfirmAction(null)}
      />
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
