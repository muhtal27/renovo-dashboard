'use client'

import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Save,
  Send,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/app/components/ConfirmDialog'
import {
  WorkspaceBadge,
  WorkspaceNotice,
  WorkspaceOptionButton,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { MessageThreadCard } from '@/app/(operator)/operator/cases/[id]/_components/message-thread-card'
import { formatCurrency, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { cn } from '@/lib/ui'
import {
  getCheckoutNegotiationPresentation,
  toTimestamp,
} from '@/lib/operator-checkout-workspace-helpers'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

/* ────────────────────────────────────────────────────────────── */
/*  Negotiation status controls                                   */
/* ────────────────────────────────────────────────────────────── */

function NegotiationActions({
  caseId,
  currentStatus,
  onUpdated,
}: {
  caseId: string
  currentStatus: string | null | undefined
  onUpdated: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  async function handleStatusChange(status: string) {
    setSaving(true)
    setConfirmAction(null)
    try {
      const res = await fetch(`/api/operator/cases/${caseId}/negotiation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negotiation_status: status }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to update')
      }
      toast.success(`Negotiation marked as ${status}.`)
      onUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update negotiation status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={saving}
        onClick={() => currentStatus !== 'pending' ? handleStatusChange('pending') : undefined}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium transition',
          currentStatus === 'pending'
            ? 'border-amber-300 bg-amber-50 text-amber-700'
            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
        )}
      >
        Pending
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => currentStatus !== 'agreed' ? setConfirmAction('agreed') : undefined}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium transition',
          currentStatus === 'agreed'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
        )}
      >
        <Check className="h-3.5 w-3.5" />
        Agreed
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => currentStatus !== 'disputed' ? setConfirmAction('disputed') : undefined}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium transition',
          currentStatus === 'disputed'
            ? 'border-rose-300 bg-rose-50 text-rose-700'
            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
        )}
      >
        <X className="h-3.5 w-3.5" />
        Disputed
      </button>

      <ConfirmDialog
        open={confirmAction === 'agreed'}
        title="Mark negotiation as agreed?"
        description="This confirms both parties have reached agreement on deductions. You can change this later if needed."
        confirmLabel="Mark Agreed"
        onConfirm={() => handleStatusChange('agreed')}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'disputed'}
        title="Mark negotiation as disputed?"
        description="This flags the case for dispute resolution. The case will need to go through the dispute process."
        confirmLabel="Mark Disputed"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={() => handleStatusChange('disputed')}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Inline notes editor                                           */
/* ────────────────────────────────────────────────────────────── */

function NegotiationNotes({
  caseId,
  initialNotes,
  onUpdated,
}: {
  caseId: string
  initialNotes: string | null
  onUpdated: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/operator/cases/${caseId}/negotiation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negotiation_notes: notes }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Notes saved.')
      setEditing(false)
      onUpdated()
    } catch {
      toast.error('Failed to save notes.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          disabled={saving}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] leading-6 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500"
          placeholder="Add negotiation notes, key points, agreements..."
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-[13px] font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setNotes(initialNotes ?? '')
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      <p className="whitespace-pre-wrap text-[13px] leading-6 text-zinc-600 [overflow-wrap:anywhere]">
        {initialNotes?.trim() || 'No negotiation notes recorded yet.'}
      </p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-600"
      >
        <Edit3 className="h-3 w-3" />
        {initialNotes?.trim() ? 'Edit notes' : 'Add notes'}
      </button>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Email draft compose form                                      */
/* ────────────────────────────────────────────────────────────── */

function EmailDraftCompose({
  caseId,
  landlordName,
  landlordEmail,
  tenantName,
  tenantEmail,
  propertyAddress,
  caseRef,
  aiDrafts,
  onSent,
  onCancel,
}: {
  caseId: string
  landlordName: string
  landlordEmail: string | null
  tenantName: string
  tenantEmail: string | null
  propertyAddress: string
  caseRef: string
  aiDrafts: OperatorCheckoutWorkspaceData['aiDrafts']
  onSent: () => void
  onCancel: () => void
}) {
  const [sendTo, setSendTo] = useState<'both' | 'landlord' | 'tenant'>('both')
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedAiDraft, setSelectedAiDraft] = useState<string | null>(null)

  const effectiveLandlordEmail = sendTo !== 'tenant' ? landlordEmail : null
  const effectiveTenantEmail = sendTo !== 'landlord' ? tenantEmail : null
  const canSend = effectiveLandlordEmail || effectiveTenantEmail

  const selectedDraft = aiDrafts.find((d) => d.id === selectedAiDraft)

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    try {
      const res = await fetch(`/api/eot/cases/${caseId}/send-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landlordEmail: effectiveLandlordEmail || '',
          landlordName,
          tenantEmail: effectiveTenantEmail || '',
          tenantName,
          propertyAddress,
          caseRef,
          reportUrl: '',
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to send')
      }
      const result = (await res.json()) as { ok: boolean; sent?: string[]; errors?: string[] }
      if (result.errors?.length) {
        toast.warning(`Sent with warnings: ${result.errors.join(', ')}`)
      } else {
        toast.success(`Email sent to ${result.sent?.join(' and ') || 'recipients'}.`)
      }
      onSent()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-zinc-500" />
          <h4 className="text-sm font-semibold text-zinc-950">Send Checkout Report</h4>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {/* Recipients */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Send to
          </p>
          <div className="mt-2 flex gap-2">
            {(['both', 'landlord', 'tenant'] as const).map((option) => (
              <WorkspaceOptionButton
                key={option}
                selected={sendTo === option}
                tone="default"
                onClick={() => setSendTo(option)}
                className="px-3 py-1.5 text-xs"
              >
                {option === 'both' ? 'Both parties' : option === 'landlord' ? 'Landlord only' : 'Tenant only'}
              </WorkspaceOptionButton>
            ))}
          </div>
        </div>

        {/* Recipient details */}
        <div className="grid gap-3 sm:grid-cols-2">
          {sendTo !== 'tenant' ? (
            <div className={cn('rounded-lg border px-4 py-3', landlordEmail ? 'border-zinc-200' : 'border-amber-200 bg-amber-50/50')}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Landlord</p>
              <p className="mt-1 text-sm font-medium text-zinc-950">{landlordName}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{landlordEmail || 'No email on file'}</p>
            </div>
          ) : null}
          {sendTo !== 'landlord' ? (
            <div className={cn('rounded-lg border px-4 py-3', tenantEmail ? 'border-zinc-200' : 'border-amber-200 bg-amber-50/50')}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Tenant</p>
              <p className="mt-1 text-sm font-medium text-zinc-950">{tenantName}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{tenantEmail || 'No email on file'}</p>
            </div>
          ) : null}
        </div>

        {/* AI draft insertion */}
        {aiDrafts.length > 0 ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Reference AI draft (optional)
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {aiDrafts.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => setSelectedAiDraft(selectedAiDraft === draft.id ? null : draft.id)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-medium transition',
                    selectedAiDraft === draft.id
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                  )}
                >
                  <FileText className="h-3 w-3" />
                  {draft.title || formatEnumLabel(draft.draftType)}
                </button>
              ))}
            </div>
            {selectedDraft ? (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-emerald-200 bg-emerald-50/30 px-3 py-2">
                <p className="line-clamp-6 whitespace-pre-wrap text-xs leading-5 text-zinc-600">
                  {selectedDraft.content}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-700"
        >
          {showPreview ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {showPreview ? 'Hide preview' : 'Preview email'}
        </button>

        {showPreview ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Subject</p>
            <p className="mt-1 text-sm text-zinc-900">Checkout Report — {propertyAddress}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Body preview</p>
            <div className="mt-1 text-sm leading-6 text-zinc-600">
              {sendTo === 'both' ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Landlord version</p>
                  <p>Dear {landlordName},</p>
                  <p className="mt-1">
                    Please find the checkout report for {propertyAddress} (Ref: {caseRef}). This report contains the property condition assessment, recommended deductions, and supporting evidence.
                  </p>
                  <div className="my-3 border-t border-zinc-200" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Tenant version</p>
                  <p>Dear {tenantName},</p>
                  <p className="mt-1">
                    The checkout inspection for {propertyAddress} (Ref: {caseRef}) has been completed. Please review the report carefully. If you have any queries or wish to dispute any items, please respond to this email.
                  </p>
                </>
              ) : (
                <>
                  <p>Dear {sendTo === 'landlord' ? landlordName : tenantName},</p>
                  <p className="mt-2">
                    {sendTo === 'landlord'
                      ? `Please find the checkout report for ${propertyAddress} (Ref: ${caseRef}). This report contains the property condition assessment, recommended deductions, and supporting evidence.`
                      : `The checkout inspection for ${propertyAddress} (Ref: ${caseRef}) has been completed. Please review the report carefully. If you have any queries or wish to dispute any items, please respond to this email.`}
                  </p>
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* Actions */}
        {!canSend ? (
          <WorkspaceNotice
            title="Missing recipient email"
            body="At least one recipient must have an email address on file to send."
            tone="warning"
          />
        ) : null}

        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !canSend}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-[13px] font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Main step-deductions (enhanced)                               */
/* ────────────────────────────────────────────────────────────── */

export function StepDeductions({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [showEmailCompose, setShowEmailCompose] = useState(false)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isDraftSent = caseStatus === 'draft_sent'
  const isReady = caseStatus === 'ready_for_claim'

  const landlordName = data.workspace.overview.landlords[0]?.fullName ?? 'Landlord'
  const tenantName = data.workspace.tenant?.name ?? data.workspace.tenancy.tenant_name
  const landlordEmail = data.checkoutCase?.landlordEmail
  const tenantEmail = data.checkoutCase?.tenantEmail ?? data.workspace.tenant?.email

  const claim = data.workspace.claim
  const claimTotal = claim?.total_amount ?? data.workspace.totals.totalClaimed
  const breakdown = data.workspace.claimBreakdown
  const chargeableRecs = data.workspace.recommendations.filter((r) => r.decision !== 'no_charge')
  const deposit = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const totals = data.workspace.totals

  const negotiationStatus = data.checkoutCase?.negotiationStatus
  const negotiationPresentation = getCheckoutNegotiationPresentation(negotiationStatus)
  const negotiationNotes = data.checkoutCase?.negotiationNotes

  const sentDrafts = data.emailDrafts.filter((d) => d.status === 'sent')
  const numericClaimTotal = typeof claimTotal === 'number' ? claimTotal : Number(claimTotal ?? 0)
  const depositCoverage = deposit && deposit > 0
    ? Math.min(100, Math.round((numericClaimTotal / deposit) * 100))
    : null

  const latestMessageTimestamp = [...data.workspace.messages]
    .sort((a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at))[0]?.created_at

  const caseRef = data.checkoutCase?.caseReference ?? caseId.slice(0, 8).toUpperCase()
  const propertyAddress = [
    data.workspace.property.address_line_1,
    data.workspace.property.city,
    data.workspace.property.postcode,
  ].filter(Boolean).join(', ')

  function handleRefresh() {
    startTransition(() => { router.refresh() })
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
      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Total Claimed</p>
          <p className="mt-1 text-[28px] font-bold tabular-nums text-emerald-600">
            {formatCurrency(claimTotal)}
          </p>
          {depositCoverage != null ? (
            <p className="mt-0.5 text-xs text-zinc-500">{depositCoverage}% of deposit</p>
          ) : null}
        </div>
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Return to Tenant</p>
          <p className="mt-1 text-[28px] font-bold tabular-nums text-zinc-900">
            {totals.returnToTenant != null ? formatCurrency(totals.returnToTenant) : '—'}
          </p>
          {deposit != null ? (
            <p className="mt-0.5 text-xs text-zinc-500">of {formatCurrency(deposit)} deposit</p>
          ) : null}
        </div>
      </div>

      {/* ── Itemised Deductions card ── */}
      {breakdown.length > 0 ? (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 text-base font-semibold text-zinc-950">Itemised Deductions</h3>
          <div className="overflow-hidden rounded-[10px] border border-zinc-200">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Item
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Room
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Liability
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item) => {
                  const decision = item.decision?.toLowerCase() ?? ''
                  const liabilityBadge = decision.includes('tenant')
                    ? { label: 'Tenant', cls: 'bg-rose-50 text-rose-700' }
                    : decision.includes('landlord')
                      ? { label: 'Landlord', cls: 'bg-sky-50 text-sky-700' }
                      : decision.includes('shared')
                        ? { label: 'Shared', cls: 'bg-amber-50 text-amber-700' }
                        : { label: item.decision ? formatEnumLabel(item.decision) : '—', cls: 'bg-zinc-100 text-zinc-600' }
                  return (
                    <tr key={item.id} className="border-t border-zinc-100">
                      <td className="px-4 py-3 text-[13px] font-medium text-zinc-950">{item.title}</td>
                      <td className="px-4 py-3 text-[13px]">
                        {'room' in item && item.room ? (
                          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                            {String(item.room)}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', liabilityBadge.cls)}>
                          {liabilityBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-zinc-600">
                        {formatCurrency(item.estimatedCost)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-200">
                  <td colSpan={3} className="px-4 py-3 text-[13px] font-bold text-zinc-950">Total</td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-emerald-600">
                    {formatCurrency(totals.totalClaimed)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}

      {/* ── Negotiation card ── */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-950">Negotiation</h3>
          <WorkspaceBadge label={negotiationPresentation.label} tone={negotiationPresentation.tone} />
        </div>
        <p className="mt-1 text-[13px] text-zinc-500">
          {negotiationStatus === 'agreed'
            ? 'Both parties have reached agreement. Proceed to claim submission when ready.'
            : negotiationStatus === 'disputed'
              ? 'The case is flagged for dispute. Review the position and communication before proceeding.'
              : 'Review deductions with both parties and mark the negotiation outcome.'}
        </p>
        <div className="mt-4">
          <NegotiationActions
            caseId={caseId}
            currentStatus={negotiationStatus}
            onUpdated={handleRefresh}
          />
        </div>

        {/* Message thread */}
        <div className="mt-6 rounded-[10px] border border-zinc-200 bg-zinc-50/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-zinc-950">Message Thread</h4>
            </div>
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              {data.workspace.messages.length}
            </span>
          </div>
          <div className="mt-3">
            <MessageThreadCard workspace={data.workspace} showCompose />
          </div>
        </div>

        {/* Operator Notes */}
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Operator Notes</p>
          <div className="mt-2">
            <NegotiationNotes
              caseId={caseId}
              initialNotes={negotiationNotes ?? null}
              onUpdated={handleRefresh}
            />
          </div>
        </div>
      </div>

      {/* ── AI Drafts card ── */}
      {data.aiDrafts.length > 0 ? (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-zinc-950">AI Drafts</h3>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
              Powered by Renovo AI
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.aiDrafts.map((draft) => (
              <div key={draft.id} className="rounded-[10px] border border-zinc-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-950">
                      {draft.title || formatEnumLabel(draft.draftType)}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {draft.content ? 'Draft ready to review' : 'Generate a draft for this item'}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  {draft.content ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      <Check className="h-3 w-3" />
                      Generated
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-50"
                    >
                      Generate
                    </button>
                  )}
                </div>
                {draft.content ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/30 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Preview</p>
                    <pre className="mt-1 whitespace-pre-wrap text-xs leading-5 text-zinc-600">
                      {draft.content}
                    </pre>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Send to Tenant card ── */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-950">Send to Tenant</h3>
          {!showEmailCompose ? (
            <button
              type="button"
              onClick={() => setShowEmailCompose(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-[13px] font-medium text-white transition hover:bg-emerald-700"
            >
              <Mail className="h-3.5 w-3.5" />
              Send Draft
            </button>
          ) : null}
        </div>

        {showEmailCompose ? (
          <div className="mt-4">
            <EmailDraftCompose
              caseId={caseId}
              landlordName={landlordName}
              landlordEmail={landlordEmail ?? null}
              tenantName={tenantName}
              tenantEmail={tenantEmail ?? null}
              propertyAddress={propertyAddress}
              caseRef={caseRef}
              aiDrafts={data.aiDrafts}
              onSent={() => {
                setShowEmailCompose(false)
                handleRefresh()
              }}
              onCancel={() => setShowEmailCompose(false)}
            />
          </div>
        ) : null}

        {/* Delivery log */}
        {sentDrafts.length > 0 || (isDraftSent && !showEmailCompose) ? (
          <div className="mt-4">
            {isDraftSent && sentDrafts.length === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-zinc-950">Landlord — complete report</p>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">{landlordName} ({landlordEmail || 'no email'})</p>
                </div>
                <div className="rounded-lg border border-zinc-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-zinc-950">Tenant — liabilities only</p>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">{tenantName} ({tenantEmail || 'no email'})</p>
                </div>
              </div>
            ) : sentDrafts.length > 0 ? (
              <div className="space-y-2">
                {sentDrafts.map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-zinc-950">{draft.subject || formatEnumLabel(draft.draftType)}</p>
                      <p className="text-xs text-zinc-500">{draft.sentTo || 'Recipient not recorded'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Sent
                      </span>
                      {draft.sentAt ? (
                        <span className="text-[10px] text-zinc-400">{formatDateTime(draft.sentAt)}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

      {/* ── Workflow actions ── */}
      {isDraftSent ? (
        <div className="flex gap-3 border-t border-zinc-200 pt-6">
          <button
            type="button"
            disabled={isTransitioning}
            onClick={() => handleTransition('ready_for_claim')}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-[13px] font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Proceed to claim
          </button>
          <button
            type="button"
            disabled={isTransitioning}
            onClick={() => handleTransition('review')}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Back to review
          </button>
        </div>
      ) : isReady ? (
        <div className="border-t border-zinc-200 pt-6">
          <p className="mb-3 text-[13px] text-zinc-600">
            Once submitted, the case moves to the submitted state and cannot be edited without dispute
            resolution.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isTransitioning}
              onClick={() => setConfirmAction('submitted')}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-[13px] font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit claim
            </button>
            <button
              type="button"
              disabled={isTransitioning}
              onClick={() => handleTransition('draft_sent')}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Revert to draft sent
            </button>
          </div>
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
      ) : !isDraftSent && !isReady && !['submitted', 'resolved', 'disputed'].includes(caseStatus) ? (
        <WorkspaceNotice
          title="Awaiting deposit deductions"
          body="Complete the review step and send the draft to parties before deductions can be finalised."
          tone="info"
        />
      ) : null}
    </div>
  )
}
