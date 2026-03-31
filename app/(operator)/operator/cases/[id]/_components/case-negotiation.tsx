'use client'

import { useState } from 'react'
import { EmptyState } from '@/app/operator-ui'
import { ClaimSummaryCard } from '@/app/(operator)/operator/cases/[id]/_components/claim-summary-card'
import { MessageThreadCard } from '@/app/(operator)/operator/cases/[id]/_components/message-thread-card'
import {
  WorkspaceBadge,
  WorkspaceMetricCard,
  WorkspaceNotice,
  WorkspaceProgressBar,
  WorkspaceSelectableCard,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import {
  formatCurrency,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import {
  getCheckoutEmailDraftAttachmentNames,
  getCheckoutEmailDraftPreview,
  getCheckoutEmailDraftRecipient,
  getCheckoutEmailDraftStatusTone,
  getCheckoutEmailDraftTypeTone,
  getCheckoutNegotiationPresentation,
  sortCheckoutEmailDrafts,
  toTimestamp,
} from '@/lib/operator-checkout-workspace-helpers'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

function getRecommendationValue(value: string | null | undefined) {
  const numericValue = value ? Number(value) : 0

  return Number.isFinite(numericValue) ? numericValue : 0
}

export function CaseNegotiation({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(data.emailDrafts[0]?.id ?? null)

  const negotiationStatus = getCheckoutNegotiationPresentation(data.checkoutCase?.negotiationStatus)
  const sortedDrafts = sortCheckoutEmailDrafts(data.emailDrafts)
  const selectedDraft =
    sortedDrafts.find((draft) => draft.id === selectedDraftId) ??
    sortedDrafts[0] ??
    null
  const sentDraftCount = data.emailDrafts.filter((draft) => draft.status === 'sent').length
  const unsentDraftCount = data.emailDrafts.length - sentDraftCount
  const chargeCount = data.workspace.recommendations.filter((recommendation) => {
    return recommendation.decision === 'charge'
  }).length
  const partialCount = data.workspace.recommendations.filter((recommendation) => {
    return recommendation.decision === 'partial'
  }).length
  const noChargeCount = data.workspace.recommendations.filter((recommendation) => {
    return recommendation.decision === 'no_charge'
  }).length
  const latestMessageTimestamp = [...data.workspace.messages]
    .sort((left, right) => toTimestamp(right.created_at) - toTimestamp(left.created_at))[0]?.created_at
  const depositHeld = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const currentClaimTotal = data.workspace.claim?.total_amount ?? data.workspace.totals.totalClaimed
  const numericClaimTotal = getRecommendationValue(String(currentClaimTotal ?? 0))
  const depositCoverage =
    depositHeld && depositHeld > 0
      ? Math.min(100, Math.round((numericClaimTotal / depositHeld) * 100))
      : null

  const negotiationNotice =
    data.checkoutCase?.negotiationStatus === 'agreed'
      ? {
          body: 'The current checkout case is marked as agreed. Use this tab to review the settled position before any later send-out or submission work.',
          title: 'Negotiation appears settled',
          tone: 'success' as const,
        }
      : data.checkoutCase?.negotiationStatus === 'disputed' || data.checkoutCase?.submissionType === 'dispute'
        ? {
            body: 'The case is already leaning into dispute handling. Keep the evidence, recommendation mix, and communication trail aligned before moving into submission.',
            title: 'Dispute path flagged',
            tone: 'warning' as const,
          }
        : data.workspace.recommendations.length > 0
          ? {
              body: 'Recommendations and claim figures are available, so operators can review the proposed negotiation position before preparing outbound communication.',
              title: 'Negotiation pack ready for review',
              tone: 'info' as const,
            }
          : {
              body: 'No recommendation set exists yet. Generate the analysis output first so negotiation has a real deduction position to work from.',
              title: 'Negotiation position not ready',
              tone: 'warning' as const,
            }

  return (
    <div className="space-y-4">
      <WorkspaceNotice
        body={negotiationNotice.body}
        title={negotiationNotice.title}
        tone={negotiationNotice.tone}
      />

      <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
        <WorkspaceMetricCard
          detail={data.checkoutCase?.submissionType ? `Submission path: ${formatEnumLabel(data.checkoutCase.submissionType)}` : 'Submission path not selected'}
          label="Negotiation status"
          tone={
            data.checkoutCase?.negotiationStatus === 'agreed'
              ? 'success'
              : data.checkoutCase?.negotiationStatus === 'disputed'
                ? 'danger'
                : 'warning'
          }
          value={negotiationStatus.label}
        />
        <WorkspaceMetricCard
          detail={
            depositHeld == null
              ? 'Deposit amount not recorded in the checkout workspace'
              : `${depositCoverage ?? 0}% of the held deposit`
          }
          label="Amount under discussion"
          tone={numericClaimTotal > 0 ? 'warning' : 'default'}
          value={formatCurrency(currentClaimTotal)}
        />
        <WorkspaceMetricCard
          detail={`${sentDraftCount} sent · ${unsentDraftCount} pending review`}
          label="Negotiation drafts"
          tone={data.emailDrafts.length > 0 ? 'info' : 'warning'}
          value={data.emailDrafts.length}
        />
        <WorkspaceMetricCard
          detail={latestMessageTimestamp ? `Latest ${formatDateTime(latestMessageTimestamp)}` : 'No communication recorded yet'}
          label="Stakeholder messages"
          tone={data.workspace.messages.length > 0 ? 'default' : 'warning'}
          value={data.workspace.messages.length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="border-b border-zinc-200 pb-4">
          <h3 className="text-sm font-semibold text-zinc-950">Negotiation position</h3>

          <div className="mt-2">
            <ClaimSummaryCard workspace={data.workspace} />
          </div>
        </section>

        <div className="border-l-2 border-zinc-200 pl-4">
          <h3 className="text-sm font-semibold text-zinc-950">Negotiation stance</h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <WorkspaceBadge label={negotiationStatus.label} tone={negotiationStatus.tone} />
            {data.checkoutCase?.submissionType ? (
              <WorkspaceBadge
                label={`Submission: ${formatEnumLabel(data.checkoutCase.submissionType)}`}
                tone={data.checkoutCase.submissionType === 'dispute' ? 'disputed' : 'submitted'}
              />
            ) : null}
          </div>

          {depositCoverage != null ? (
            <div className="mt-5 border border-zinc-200 bg-zinc-50/70 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Claim vs deposit</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-zinc-950">
                {depositCoverage}%
              </p>
              <div className="mt-4">
                <WorkspaceProgressBar
                  max={100}
                  tone={
                    depositCoverage >= 100 ? 'danger' : depositCoverage >= 70 ? 'warning' : 'success'
                  }
                  value={depositCoverage}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {formatCurrency(currentClaimTotal)} proposed against {formatCurrency(depositHeld)} held.
              </p>
            </div>
          ) : null}

          <div className="mt-5 border border-zinc-200 bg-white px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Recommendation mix</p>
            <dl className="mt-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Charge</dt>
                <dd className="text-sm font-medium text-zinc-950">{chargeCount}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Partial</dt>
                <dd className="text-sm font-medium text-zinc-950">{partialCount}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">No charge</dt>
                <dd className="text-sm font-medium text-zinc-950">{noChargeCount}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 border border-zinc-200 bg-white px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Operator notes</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
              {data.checkoutCase?.negotiationNotes?.trim() || 'No negotiation notes recorded yet.'}
            </p>
          </div>
        </div>
      </div>

      <section className="border-b border-zinc-200 pb-4">
        <h3 className="text-sm font-semibold text-zinc-950">Negotiation draft pack</h3>

        <div className="mt-2">
          {sortedDrafts.length > 0 ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
              <div className="space-y-3">
                {sortedDrafts.map((draft) => (
                  <WorkspaceSelectableCard
                    key={draft.id}
                    description={getCheckoutEmailDraftPreview(draft.body)}
                    onClick={() => setSelectedDraftId(draft.id)}
                    selected={selectedDraft?.id === draft.id}
                    title={draft.subject?.trim() || formatEnumLabel(draft.draftType)}
                    tone={draft.status === 'sent' ? 'success' : draft.draftType === 'tenant_charges' ? 'warning' : 'default'}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkspaceBadge
                        label={formatEnumLabel(draft.draftType)}
                        tone={getCheckoutEmailDraftTypeTone(draft.draftType)}
                      />
                      <WorkspaceBadge
                        label={formatEnumLabel(draft.status)}
                        tone={getCheckoutEmailDraftStatusTone(draft.status)}
                      />
                    </div>
                    <p className="mt-3 text-xs text-current/80">
                      {draft.sentAt ? `Sent ${formatDateTime(draft.sentAt)}` : `Updated ${formatDateTime(draft.updatedAt)}`}
                    </p>
                  </WorkspaceSelectableCard>
                ))}
              </div>

              <div className="border-l-2 border-zinc-200 pl-4">
                <h3 className="text-sm font-semibold text-zinc-950">
                  {selectedDraft?.subject?.trim() || (selectedDraft ? formatEnumLabel(selectedDraft.draftType) : 'Draft detail')}
                </h3>

                {selectedDraft ? (
                  <div className="mt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkspaceBadge
                        label={formatEnumLabel(selectedDraft.draftType)}
                        tone={getCheckoutEmailDraftTypeTone(selectedDraft.draftType)}
                      />
                      <WorkspaceBadge
                        label={formatEnumLabel(selectedDraft.status)}
                        tone={getCheckoutEmailDraftStatusTone(selectedDraft.status)}
                      />
                    </div>

                    <dl className="mt-5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-sm text-zinc-500">Recipient</dt>
                        <dd className="text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
                          {getCheckoutEmailDraftRecipient(selectedDraft, data, {
                            fallback: {
                              landlord: 'Landlord address not recorded',
                              tenant: 'Tenant address not recorded',
                            },
                          })}
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
                        <dd className="text-sm font-medium text-zinc-950">
                          {selectedDraft.attachmentDocumentIds.length}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 border border-zinc-200 bg-white px-5 py-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Attached documents</p>
                      {selectedDraft.attachmentDocumentIds.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {getCheckoutEmailDraftAttachmentNames(selectedDraft, data).map((attachmentName) => (
                            <WorkspaceBadge
                              key={attachmentName}
                              label={attachmentName}
                              tone="neutral"
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-zinc-600">
                          No structured checkout attachments are linked to this draft yet.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 border border-zinc-200 bg-white px-5 py-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Draft body</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
                        {selectedDraft.body}
                      </p>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    body="Select a draft to inspect its recipient, attached documents, and message body."
                    title="No draft selected"
                  />
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              body="No negotiation emails have been drafted yet. Once draft records exist in the structured workspace, this tab will surface them for review before send-out."
              title="No negotiation drafts yet"
            />
          )}
        </div>
      </section>

      <section className="border-b border-zinc-200 pb-4">
        <h3 className="text-sm font-semibold text-zinc-950">Stakeholder communication</h3>

        <div className="mt-2">
          <MessageThreadCard workspace={data.workspace} />
        </div>
      </section>
    </div>
  )
}
