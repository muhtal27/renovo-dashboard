'use client'

import { Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { EmptyState } from '@/app/operator-ui'
import { MessageThreadCard } from '@/app/(operator)/operator/cases/[id]/_components/message-thread-card'
import {
  WorkspaceActionButton,
  WorkspaceBadge,
  WorkspaceMetricCard,
  WorkspaceNotice,
  WorkspaceProgressBar,
  WorkspaceSelectableCard,
  WorkspaceTable,
  WorkspaceTableCell,
  WorkspaceTableHeaderCell,
  WorkspaceTableRow,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import {
  getCheckoutEmailDraftAttachmentNames,
  getCheckoutEmailDraftPreview,
  getCheckoutEmailDraftStatusTone,
  getCheckoutEmailDraftTypeTone,
  sortSendOutQueueDrafts,
  toTimestamp,
} from '@/lib/operator-checkout-workspace-helpers'
import {
  getResolvedSendOutRecipient,
  getSendOutDeliveryState,
  getSendOutQueueSummary,
  getSendOutReadiness,
} from '@/lib/operator-send-out-queue'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

const OUTBOUND_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL)

export function CaseSendOut({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isRefreshing, startTransition] = useTransition()
  const [transitionError, setTransitionError] = useState<string | null>(null)

  const caseStatus = data.workspace.case.status
  const caseId = data.workspace.case.id
  const isDraftSent = caseStatus === 'draft_sent'

  const tenantName = data.workspace.tenant?.name ?? data.workspace.tenancy.tenant_name
  const landlordName = data.workspace.overview.landlords[0]?.fullName ?? 'Landlord'
  const tenantEmail = data.checkoutCase?.tenantEmail ?? data.workspace.tenant?.email ?? null
  const landlordEmail = data.checkoutCase?.landlordEmail ?? null
  const currentClaimTotal = data.workspace.claim?.total_amount ?? data.workspace.totals.totalClaimed
  const depositHeld = data.checkoutCase?.depositHeld
  const chargeableRecs = data.workspace.recommendations.filter((r) => r.decision !== 'no_charge')

  async function handleTransition(targetStatus: string) {
    setIsTransitioning(true)
    setTransitionError(null)
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
    } catch (error) {
      setTransitionError(error instanceof Error ? error.message : 'Failed to update case status.')
    } finally {
      setIsTransitioning(false)
    }
  }

  const sortedDrafts = sortSendOutQueueDrafts(data.emailDrafts)
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(sortedDrafts[0]?.id ?? null)
  const selectedDraft =
    sortedDrafts.find((draft) => draft.id === selectedDraftId) ??
    sortedDrafts[0] ??
    null
  const {
    notice: sendOutNotice,
    readyCount,
    sentCount,
    unresolvedRecipientCount,
  } = getSendOutQueueSummary({
    data,
    drafts: sortedDrafts,
    outboundConfigured: OUTBOUND_CONFIGURED,
  })
  const latestOutboundActivity = [...sortedDrafts]
    .sort((left, right) => toTimestamp(right.sentAt ?? right.updatedAt) - toTimestamp(left.sentAt ?? left.updatedAt))[0]
  const selectedAttachments = selectedDraft ? getCheckoutEmailDraftAttachmentNames(selectedDraft, data) : []
  const selectedDeliveryState = selectedDraft
    ? getSendOutDeliveryState(selectedDraft, data, {
        outboundConfigured: OUTBOUND_CONFIGURED,
      })
    : null
  const selectedRecipient = selectedDraft ? getResolvedSendOutRecipient(selectedDraft, data) : null
  const selectedReadiness = getSendOutReadiness({
    data,
    draft: selectedDraft,
    outboundConfigured: OUTBOUND_CONFIGURED,
  })

  return (
    <div className="space-y-4">
      {/* Draft sent status panel */}
      {isDraftSent ? (
        <div className="space-y-4">
          <WorkspaceNotice
            body="The checkout report has been emailed to both parties from your account. Once both have reviewed, proceed to claim submission."
            title="Draft report sent to landlord and tenant"
            tone="success"
          />

          {transitionError ? (
            <WorkspaceNotice body={transitionError} title="Action failed" tone="danger" />
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section>
              <div className="space-y-4">
                <div className="border border-zinc-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Email to landlord</p>
                      <p className="mt-1 text-sm font-medium text-zinc-950">{landlordName}</p>
                      {landlordEmail ? <p className="text-xs text-zinc-400">{landlordEmail}</p> : null}
                    </div>
                    <WorkspaceBadge label="Complete report" tone="accepted" />
                  </div>
                  <div className="mt-3 border-t border-zinc-100 pt-3">
                    <p className="text-xs text-zinc-500"><span className="font-medium text-zinc-600">Attachment:</span> Checkout report PDF</p>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Full report: all {data.workspace.recommendations.length} recommendations, AI rationale, evidence, and deductions ({formatCurrency(currentClaimTotal)}).</p>
                </div>

                <div className="border border-zinc-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Email to tenant</p>
                      <p className="mt-1 text-sm font-medium text-zinc-950">{tenantName}</p>
                      {tenantEmail ? <p className="text-xs text-zinc-400">{tenantEmail}</p> : null}
                    </div>
                    <WorkspaceBadge label="Liabilities only" tone="review" />
                  </div>
                  <div className="mt-3 border-t border-zinc-100 pt-3">
                    <p className="text-xs text-zinc-500"><span className="font-medium text-zinc-600">Attachment:</span> Checkout report PDF</p>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Tenant liabilities: {chargeableRecs.length} chargeable items totalling {formatCurrency(currentClaimTotal)}{depositHeld != null ? ` against deposit of ${formatCurrency(depositHeld)}` : ''}.</p>
                </div>
              </div>

              {chargeableRecs.length > 0 ? (
                <div className="mt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 mb-3">Tenant liabilities breakdown</p>
                  <div className="space-y-2">
                    {chargeableRecs.map((rec) => {
                      const issue = data.workspace.issues.find((i) => i.id === rec.issue_id)
                      return (
                        <div key={rec.id} className="flex items-center justify-between border-b border-zinc-100 py-2">
                          <span className="text-sm text-zinc-700">{issue?.title ?? 'Issue not linked'}</span>
                          <span className="text-sm font-medium tabular-nums text-zinc-950">{formatCurrency(rec.estimated_cost)}</span>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-semibold text-zinc-950">Total tenant liability</span>
                      <span className="text-sm font-bold tabular-nums text-zinc-950">{formatCurrency(currentClaimTotal)}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex items-center gap-3">
                <WorkspaceActionButton
                  disabled={isTransitioning || isRefreshing}
                  onClick={() => { void handleTransition('ready_for_claim') }}
                  tone="primary"
                >
                  {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Proceed to claim
                </WorkspaceActionButton>
                <WorkspaceActionButton
                  disabled={isTransitioning || isRefreshing}
                  onClick={() => { void handleTransition('review') }}
                  tone="secondary"
                >
                  Back to review
                </WorkspaceActionButton>
              </div>
            </section>

            <section className="border border-zinc-200 bg-zinc-50/70 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Email status</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-violet-700">2 sent</p>
                </div>
                <WorkspaceBadge label="Awaiting response" tone="sent" />
              </div>
              <dl className="mt-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-zinc-500">Landlord email</dt>
                  <dd className="text-sm font-medium text-emerald-700">Delivered</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-zinc-500">Tenant email</dt>
                  <dd className="text-sm font-medium text-emerald-700">Delivered</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-zinc-500">Attachment</dt>
                  <dd className="text-sm font-medium text-zinc-950">Checkout report PDF</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      ) : null}

      <WorkspaceNotice
        body={sendOutNotice.body}
        title={sendOutNotice.title}
        tone={sendOutNotice.tone}
      />

      <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
        <WorkspaceMetricCard
          detail={OUTBOUND_CONFIGURED ? 'External handoff endpoint available in this deployment' : 'Drafts remain local to the operator workspace'}
          label="Integration"
          tone={OUTBOUND_CONFIGURED ? 'success' : 'warning'}
          value={OUTBOUND_CONFIGURED ? 'Connected' : 'Local only'}
        />
        <WorkspaceMetricCard
          detail={`${sentCount}/${sortedDrafts.length || 0} sent${readyCount > 0 ? ` · ${readyCount} ready for handoff` : ''}`}
          label="Draft queue"
          tone={
            sortedDrafts.length === 0
              ? 'warning'
              : sentCount === sortedDrafts.length
                ? 'success'
                : readyCount > 0
                  ? 'info'
                  : 'warning'
          }
          value={sortedDrafts.length}
        />
        <WorkspaceMetricCard
          detail={`${unresolvedRecipientCount} unresolved recipient${unresolvedRecipientCount === 1 ? '' : 's'}`}
          label="Recipient coverage"
          tone={unresolvedRecipientCount === 0 && sortedDrafts.length > 0 ? 'success' : 'warning'}
          value={sortedDrafts.length - unresolvedRecipientCount}
        />
        <WorkspaceMetricCard
          detail={latestOutboundActivity ? `Latest ${formatDateTime(latestOutboundActivity.sentAt ?? latestOutboundActivity.updatedAt)}` : 'No draft activity yet'}
          label="Sent drafts"
          tone={sentCount > 0 ? 'default' : 'warning'}
          value={sentCount}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
        <section className="border-b border-zinc-200 pb-4">
          <h3 className="text-sm font-semibold text-zinc-950">Outbound queue</h3>

          <div className="mt-2 space-y-3">
            {sortedDrafts.length > 0 ? (
              sortedDrafts.map((draft) => {
                const deliveryState = getSendOutDeliveryState(draft, data, {
                  outboundConfigured: OUTBOUND_CONFIGURED,
                })
                const recipient = getResolvedSendOutRecipient(draft, data)

                return (
                  <WorkspaceSelectableCard
                    key={draft.id}
                    description={getCheckoutEmailDraftPreview(draft.body)}
                    onClick={() => setSelectedDraftId(draft.id)}
                    selected={selectedDraft?.id === draft.id}
                    title={draft.subject?.trim() || formatEnumLabel(draft.draftType)}
                    tone={
                      deliveryState.kind === 'ready'
                        ? 'success'
                        : deliveryState.kind === 'sent'
                          ? 'default'
                          : 'warning'
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkspaceBadge label={formatEnumLabel(draft.draftType)} tone={getCheckoutEmailDraftTypeTone(draft.draftType)} />
                      <WorkspaceBadge label={formatEnumLabel(draft.status)} tone={getCheckoutEmailDraftStatusTone(draft.status)} />
                      <WorkspaceBadge label={deliveryState.label} tone={deliveryState.tone} />
                    </div>
                    <p className="mt-3 text-xs text-current/80 [overflow-wrap:anywhere]">
                      {recipient ?? 'Recipient not resolved'}
                    </p>
                    <p className="mt-1 text-xs text-current/80">
                      {draft.sentAt ? `Sent ${formatDateTime(draft.sentAt)}` : `Updated ${formatDateTime(draft.updatedAt)}`}
                    </p>
                  </WorkspaceSelectableCard>
                )
              })
            ) : (
              <EmptyState
                body="No outbound drafts exist yet. As the structured workspace accumulates landlord and tenant communication drafts, they will appear here for send-out review."
                title="Outbound queue is empty"
              />
            )}
          </div>
        </section>

        <div className="border-l-2 border-zinc-200 pl-4">
          <h3 className="text-sm font-semibold text-zinc-950">
            {selectedDraft?.subject?.trim() || (selectedDraft ? formatEnumLabel(selectedDraft.draftType) : 'Selected draft')}
          </h3>
          {selectedDraft ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <WorkspaceBadge
                  label={formatEnumLabel(selectedDraft.draftType)}
                  tone={getCheckoutEmailDraftTypeTone(selectedDraft.draftType)}
                />
                <WorkspaceBadge
                  label={formatEnumLabel(selectedDraft.status)}
                  tone={getCheckoutEmailDraftStatusTone(selectedDraft.status)}
                />
                <WorkspaceBadge
                  label={selectedDeliveryState?.label ?? 'Needs review'}
                  tone={selectedDeliveryState?.tone ?? 'warning'}
                />
              </div>

              <div className="mt-5 border border-zinc-200 bg-zinc-50/70 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Selected draft readiness</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-zinc-950">{selectedReadiness}%</p>
                <div className="mt-4">
                  <WorkspaceProgressBar
                    max={100}
                    tone={selectedReadiness === 100 ? 'success' : selectedReadiness >= 50 ? 'warning' : 'danger'}
                    value={selectedReadiness}
                  />
                </div>
              </div>

              <dl className="mt-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-zinc-500">Recipient</dt>
                  <dd className="text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
                    {selectedRecipient ?? 'Not resolved'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-zinc-500">Last update</dt>
                  <dd className="text-right text-sm font-medium text-zinc-950">
                    {formatDateTime(selectedDraft.sentAt ?? selectedDraft.updatedAt)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-zinc-500">Structured attachments</dt>
                  <dd className="text-sm font-medium text-zinc-950">{selectedAttachments.length}</dd>
                </div>
              </dl>

              <div className="mt-5 border border-zinc-200 bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Attached documents</p>
                {selectedAttachments.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedAttachments.map((attachmentName) => (
                      <WorkspaceBadge key={attachmentName} label={attachmentName} tone="neutral" />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    No structured attachments are linked to this draft.
                  </p>
                )}
              </div>

              <div className="mt-5 border border-zinc-200 bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Draft body</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
                  {selectedDraft.body}
                </p>
              </div>

              {!OUTBOUND_CONFIGURED ? (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href="/settings"
                    className="inline-flex min-h-10 items-center justify-center border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                  >
                    Open messaging settings
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              body="Select a draft to inspect the exact send-out content and delivery readiness."
              title="No draft selected"
            />
          )}
        </div>
      </div>

      <section className="border-b border-zinc-200 pb-4">
        <h3 className="text-sm font-semibold text-zinc-950">Sent and queued delivery log</h3>

        <div className="mt-2">
          {sortedDrafts.length > 0 ? (
            <WorkspaceTable>
              <thead>
                <tr>
                  <WorkspaceTableHeaderCell>Draft</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell>Recipient</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell align="center">Attachments</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell align="right">Activity</WorkspaceTableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {sortedDrafts.map((draft) => {
                  const recipient = getResolvedSendOutRecipient(draft, data)
                  const attachments = getCheckoutEmailDraftAttachmentNames(draft, data)
                  const deliveryState = getSendOutDeliveryState(draft, data, {
                    outboundConfigured: OUTBOUND_CONFIGURED,
                  })

                  return (
                    <WorkspaceTableRow key={draft.id}>
                      <WorkspaceTableCell emphasis="strong">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-950 [overflow-wrap:anywhere]">
                            {draft.subject?.trim() || formatEnumLabel(draft.draftType)}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {formatEnumLabel(draft.draftType)}
                          </p>
                        </div>
                      </WorkspaceTableCell>
                      <WorkspaceTableCell>{recipient ?? 'Not resolved'}</WorkspaceTableCell>
                      <WorkspaceTableCell>
                        <div className="flex flex-wrap gap-2">
                          <WorkspaceBadge label={formatEnumLabel(draft.status)} tone={getCheckoutEmailDraftStatusTone(draft.status)} />
                          <WorkspaceBadge label={deliveryState.label} tone={deliveryState.tone} />
                        </div>
                      </WorkspaceTableCell>
                      <WorkspaceTableCell align="center">{attachments.length}</WorkspaceTableCell>
                      <WorkspaceTableCell align="right">
                        {formatDateTime(draft.sentAt ?? draft.updatedAt)}
                      </WorkspaceTableCell>
                    </WorkspaceTableRow>
                  )
                })}
              </tbody>
            </WorkspaceTable>
          ) : (
            <EmptyState
              body="No delivery log exists yet because the send-out queue has not been populated."
              title="No send-out activity yet"
            />
          )}
        </div>
      </section>

      <section className="border-b border-zinc-200 pb-4">
        <h3 className="text-sm font-semibold text-zinc-950">Communication record</h3>

        <div className="mt-2">
          <MessageThreadCard workspace={data.workspace} />
        </div>
      </section>
    </div>
  )
}
