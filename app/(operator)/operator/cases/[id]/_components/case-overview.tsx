'use client'

import { ActivityTimeline, DetailPanel, EmptyState, SectionCard } from '@/app/operator-ui'
import {
  ConditionBadge,
  WorkspaceBadge,
  WorkspaceMetricCard,
  WorkspaceNotice,
  WorkspaceProgressBar,
  WorkspaceSectionTitle,
  WorkspaceTable,
  WorkspaceTableCell,
  WorkspaceTableHeaderCell,
  WorkspaceTableRow,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import {
  getCheckoutNegotiationPresentation,
  toTimestamp,
} from '@/lib/operator-checkout-workspace-helpers'
import type {
  CheckoutWorkspaceCaseStatus,
  OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

type OverviewActivityTone = 'accent' | 'danger' | 'default' | 'warning'

type OverviewActivityItem = {
  detail: string
  id: string
  timestamp: string
  title: string
  tone: OverviewActivityTone
}

type OverviewNotice = {
  body: string
  title: string
  tone: 'info' | 'neutral' | 'success' | 'warning'
}

function formatCurrencyValue(value: number | null | undefined) {
  return value == null ? 'Not recorded' : formatCurrency(value)
}

function formatTextValue(value: string | null | undefined, fallback = 'Not recorded') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function getCheckoutStatusPresentation(status: CheckoutWorkspaceCaseStatus | null | undefined) {
  switch (status) {
    case 'ready':
      return { label: 'Ready to finalise', tone: 'accepted' as const }
    case 'sent':
      return { label: 'Sent out', tone: 'sent' as const }
    case 'submitted':
      return { label: 'Submitted', tone: 'submitted' as const }
    case 'disputed':
      return { label: 'Disputed', tone: 'disputed' as const }
    case 'closed':
      return { label: 'Closed', tone: 'neutral' as const }
    case 'in_review':
    default:
      return { label: 'In review', tone: 'review' as const }
  }
}

function getTimelineTone(value: string) {
  const normalized = value.toLowerCase()

  if (
    normalized.includes('submit') ||
    normalized.includes('sent') ||
    normalized.includes('claim') ||
    normalized.includes('generated')
  ) {
    return 'accent' as const
  }

  if (
    normalized.includes('dispute') ||
    normalized.includes('liability') ||
    normalized.includes('charge')
  ) {
    return 'danger' as const
  }

  if (
    normalized.includes('review') ||
    normalized.includes('processing') ||
    normalized.includes('analyse')
  ) {
    return 'warning' as const
  }

  return 'default' as const
}

function buildFallbackTimeline(data: OperatorCheckoutWorkspaceData) {
  const items: OverviewActivityItem[] = []
  const latestMessage = [...data.workspace.messages].sort((left, right) => {
    return toTimestamp(right.created_at) - toTimestamp(left.created_at)
  })[0]

  items.push({
    id: `case-created-${data.workspace.case.id}`,
    timestamp: data.workspace.case.created_at,
    title: 'Case opened',
    detail: 'The operator workspace was created for this tenancy review.',
    tone: 'default',
  })

  if (data.checkoutCase?.createdAt) {
    items.push({
      id: `checkout-created-${data.checkoutCase.id}`,
      timestamp: data.checkoutCase.createdAt,
      title: 'Structured checkout created',
      detail: 'The structured checkout summary record is now attached to this case.',
      tone: 'warning',
    })
  }

  if (
    data.workspace.case.last_activity_at &&
    data.workspace.case.last_activity_at !== data.workspace.case.created_at
  ) {
    items.push({
      id: `case-active-${data.workspace.case.id}`,
      timestamp: data.workspace.case.last_activity_at,
      title: 'Case activity updated',
      detail: `Latest operator activity was recorded while the case remained ${formatEnumLabel(data.workspace.case.status).toLowerCase()}.`,
      tone: getTimelineTone(data.workspace.case.status),
    })
  }

  if (data.workspace.claim?.generated_at) {
    items.push({
      id: `claim-generated-${data.workspace.claim.id}`,
      timestamp: data.workspace.claim.generated_at,
      title: 'Claim pack generated',
      detail: `Current proposed deductions total ${formatCurrency(data.workspace.totals.proposedDeductions)}.`,
      tone: 'accent',
    })
  }

  if (latestMessage) {
    items.push({
      id: `message-${latestMessage.id}`,
      timestamp: latestMessage.created_at,
      title: `Latest ${latestMessage.sender_type} message`,
      detail: latestMessage.content.trim().slice(0, 140) || 'A new case message was added.',
      tone: getTimelineTone(latestMessage.sender_type),
    })
  }

  if (data.checkoutCase?.submittedAt) {
    items.push({
      id: `submitted-${data.checkoutCase.id}`,
      timestamp: data.checkoutCase.submittedAt,
      title: 'Submission recorded',
      detail: `The case was marked for ${formatEnumLabel(data.checkoutCase.submissionType ?? 'submission').toLowerCase()}.`,
      tone: 'accent',
    })
  }

  return items
    .sort((left, right) => toTimestamp(right.timestamp) - toTimestamp(left.timestamp))
    .slice(0, 6)
}

function buildActivityTimeline(data: OperatorCheckoutWorkspaceData) {
  const timelineItems =
    data.timeline.length > 0
      ? [...data.timeline]
          .sort((left, right) => toTimestamp(right.eventDate) - toTimestamp(left.eventDate))
          .slice(0, 6)
          .map((item) => ({
            id: item.id,
            title: formatTextValue(item.eventType, 'Activity'),
            detail: formatTextValue(item.eventDescription, 'An event was recorded for this case.'),
            timestamp: item.eventDate,
            tone: getTimelineTone(`${item.eventType} ${item.eventDescription}`),
          }))
      : buildFallbackTimeline(data)

  return timelineItems.map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    meta: formatDateTime(item.timestamp),
    tone: item.tone,
  }))
}

function getOverviewNotice({
  checkoutCaseExists,
  coreDocumentCount,
  roomCount,
  structuredDocumentCount,
}: {
  checkoutCaseExists: boolean
  coreDocumentCount: number
  roomCount: number
  structuredDocumentCount: number
}): OverviewNotice | null {
  if (!checkoutCaseExists) {
    return {
      title: 'Structured checkout fields are not populated yet',
      body:
        'This overview is falling back to the live operator case data. The workspace shell is in place, and structured checkout fields will become richer as the later tabs start writing to the new schema.',
      tone: 'info',
    }
  }

  if (roomCount === 0 && structuredDocumentCount === 0) {
    return {
      title: 'Structured evidence capture has only started',
      body:
        'The checkout summary record exists, but room-by-room detail and structured documents have not been added yet. This overview is combining the new checkout tables with the existing operator workspace data.',
      tone: 'warning',
    }
  }

  if (coreDocumentCount < 3) {
    return {
      title: 'Core report pack is incomplete',
      body:
        'One or more of the key report documents is still missing from the case workspace. The overview remains usable, but later review steps will be working from a partial evidence pack.',
      tone: 'warning',
    }
  }

  return null
}

export function CaseOverview({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const checkoutStatus = getCheckoutStatusPresentation(data.checkoutCase?.status)
  const negotiationStatus = getCheckoutNegotiationPresentation(data.checkoutCase?.negotiationStatus)
  const depositHeld = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const coreDocumentCount = [
    data.workspace.reportDocuments.checkIn,
    data.workspace.reportDocuments.checkOut,
    data.workspace.reportDocuments.tenancyAgreement,
  ].filter(Boolean).length
  const processedCheckoutDocuments = data.documents.filter((document) => {
    return document.processingStatus === 'processed'
  }).length
  const reviewedDefects = data.defects.filter((defect) => {
    return Boolean(defect.reviewedAt || defect.operatorLiability)
  }).length
  const openIssues = data.workspace.issues.filter((issue) => issue.status === 'open').length
  const disputedIssues = data.workspace.issues.filter((issue) => issue.status === 'disputed').length
  const totalPhotos = data.rooms.reduce((sum, room) => sum + room.photoCount, 0)
  const handoverChecklistValue = [
    data.utilities.length > 0,
    data.keys.length > 0,
    data.detectors.length > 0,
    data.compliance.length > 0,
    Boolean(data.councilTax),
    Boolean(data.parking),
  ].filter(Boolean).length
  const overviewNotice = getOverviewNotice({
    checkoutCaseExists: Boolean(data.checkoutCase),
    coreDocumentCount,
    roomCount: data.rooms.length,
    structuredDocumentCount: data.documents.length,
  })
  const activityTimelineItems = buildActivityTimeline(data)
  const claimExceedsDeposit =
    depositHeld != null && data.workspace.totals.proposedDeductions > depositHeld

  return (
    <div className="space-y-6">
      {overviewNotice ? (
        <WorkspaceNotice
          body={overviewNotice.body}
          title={overviewNotice.title}
          tone={overviewNotice.tone}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <WorkspaceMetricCard
          detail={formatTextValue(data.checkoutCase?.depositScheme ? formatEnumLabel(data.checkoutCase.depositScheme) : null)}
          label="Deposit held"
          tone={depositHeld == null ? 'warning' : 'default'}
          value={formatCurrencyValue(depositHeld)}
        />
        <WorkspaceMetricCard
          detail={`${openIssues} open issues${disputedIssues > 0 ? ` · ${disputedIssues} disputed` : ''}`}
          label="Proposed deductions"
          tone={
            claimExceedsDeposit
              ? 'danger'
              : data.workspace.totals.proposedDeductions > 0
                ? 'warning'
                : 'success'
          }
          value={formatCurrency(data.workspace.totals.proposedDeductions)}
        />
        <WorkspaceMetricCard
          detail={`${data.documents.length} structured docs · ${totalPhotos} photos noted`}
          label="Structured capture"
          tone={data.rooms.length > 0 ? 'info' : 'warning'}
          value={`${data.rooms.length} rooms`}
        />
        <WorkspaceMetricCard
          detail={`${reviewedDefects}/${data.defects.length || 0} defects reviewed`}
          label="Handover readiness"
          tone={
            handoverChecklistValue >= 5
              ? 'success'
              : handoverChecklistValue >= 3
                ? 'warning'
                : 'default'
          }
          value={`${handoverChecklistValue}/6`}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <SectionCard className="px-6 py-6 md:px-7">
          <WorkspaceSectionTitle>Case snapshot</WorkspaceSectionTitle>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <WorkspaceBadge label={checkoutStatus.label} tone={checkoutStatus.tone} />
            <WorkspaceBadge
              label={`Operator case: ${formatEnumLabel(data.workspace.case.status)}`}
              tone={data.workspace.case.status === 'disputed' ? 'disputed' : 'review'}
            />
            <WorkspaceBadge label={negotiationStatus.label} tone={negotiationStatus.tone} />
            {data.checkoutCase?.submissionType ? (
              <WorkspaceBadge
                label={`Submission: ${formatEnumLabel(data.checkoutCase.submissionType)}`}
                tone={data.checkoutCase.submissionType === 'dispute' ? 'disputed' : 'submitted'}
              />
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
            {formatTextValue(
              data.workspace.case.summary,
              'No structured case summary has been recorded yet.'
            )}
          </p>

          <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-slate-200 pt-6 md:grid-cols-2">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Tenancy dates</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950">
                {formatDate(data.workspace.tenancy.start_date)} to {formatDate(data.workspace.tenancy.end_date)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Checkout date</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950">
                {formatDate(data.checkoutCase?.checkoutDate ?? data.workspace.tenancy.end_date)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Check-in date</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950">
                {formatDate(data.checkoutCase?.checkinDate)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Property reference</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {formatTextValue(data.workspace.property.reference)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Assessor</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {formatTextValue(data.checkoutCase?.assessorName)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Agency</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {formatTextValue(data.checkoutCase?.agencyName)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Report source</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {formatTextValue(data.checkoutCase?.reportSource)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Last activity</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950">
                {formatDateTime(data.workspace.case.last_activity_at)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Tenant email</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {formatTextValue(data.checkoutCase?.tenantEmail ?? data.workspace.tenant.email)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Landlord email</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {formatTextValue(data.checkoutCase?.landlordEmail)}
              </dd>
            </div>
          </dl>

          {data.workspace.tenancy.notes ? (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <WorkspaceSectionTitle className="mb-3">Tenancy notes</WorkspaceSectionTitle>
              <p className="text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                {data.workspace.tenancy.notes}
              </p>
            </div>
          ) : null}
        </SectionCard>

        <DetailPanel
          description="Current deposit position and structured coverage before the case moves into deeper review."
          title="Financial & readiness"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <WorkspaceBadge
                label={`Case reference ${data.checkoutCase?.caseReference ?? data.workspace.case.id.slice(0, 8).toUpperCase()}`}
                tone="neutral"
              />
              <WorkspaceBadge
                label={`${coreDocumentCount}/3 core reports`}
                tone={coreDocumentCount === 3 ? 'processed' : 'warning'}
              />
            </div>

            <dl className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Deposit held</dt>
                <dd className="text-right text-sm font-medium text-slate-950">
                  {formatCurrencyValue(depositHeld)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Return to tenant</dt>
                <dd className="text-right text-sm font-medium text-slate-950">
                  {formatCurrencyValue(data.workspace.totals.returnToTenant)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Disputed amount</dt>
                <dd className="text-right text-sm font-medium text-slate-950">
                  {formatCurrency(data.workspace.totals.disputedAmount)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Claim breakdown items</dt>
                <dd className="text-right text-sm font-medium text-slate-950">
                  {data.workspace.claimBreakdown.length}
                </dd>
              </div>
            </dl>
          </div>

          {claimExceedsDeposit ? (
            <WorkspaceNotice
              body="The current proposed deductions exceed the recorded deposit held. Check the deduction logic before moving the case forward."
              title="Deposit overrun risk"
              tone="warning"
            />
          ) : null}

          <div className="space-y-4 border-t border-slate-200 pt-4">
            <WorkspaceProgressBar
              label="Core documents linked"
              max={3}
              tone={coreDocumentCount === 3 ? 'success' : 'warning'}
              value={coreDocumentCount}
              valueLabel={`${coreDocumentCount}/3`}
            />
            <WorkspaceProgressBar
              label="Structured documents processed"
              max={Math.max(data.documents.length, 1)}
              tone={processedCheckoutDocuments === data.documents.length && data.documents.length > 0 ? 'success' : 'default'}
              value={processedCheckoutDocuments}
              valueLabel={`${processedCheckoutDocuments}/${data.documents.length}`}
            />
            <WorkspaceProgressBar
              label="Defects reviewed"
              max={Math.max(data.defects.length, 1)}
              tone={reviewedDefects === data.defects.length && data.defects.length > 0 ? 'success' : 'warning'}
              value={reviewedDefects}
              valueLabel={`${reviewedDefects}/${data.defects.length}`}
            />
            <WorkspaceProgressBar
              label="Handover checklist coverage"
              max={6}
              tone={handoverChecklistValue >= 5 ? 'success' : 'info'}
              value={handoverChecklistValue}
              valueLabel={`${handoverChecklistValue}/6`}
            />
          </div>
        </DetailPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <SectionCard className="px-6 py-6 md:px-7">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
            <WorkspaceSectionTitle>Rooms & condition</WorkspaceSectionTitle>
            <p className="text-sm leading-6 text-slate-600">
              Room-by-room capture pulled from the structured checkout tables.
            </p>
          </div>

          <div className="pt-5">
            {data.rooms.length > 0 ? (
              <WorkspaceTable>
                <thead>
                  <tr>
                    <WorkspaceTableHeaderCell>Room</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Check-in</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Checkout</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="center">Defects</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="center">Photos</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {data.rooms.map((room) => (
                    <WorkspaceTableRow key={room.id}>
                      <WorkspaceTableCell emphasis="strong">{room.roomName}</WorkspaceTableCell>
                      <WorkspaceTableCell>
                        <ConditionBadge value={room.conditionCheckin} />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell>
                        <ConditionBadge value={room.conditionCheckout} />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell align="center">{room.defectCount}</WorkspaceTableCell>
                      <WorkspaceTableCell align="center">{room.photoCount}</WorkspaceTableCell>
                    </WorkspaceTableRow>
                  ))}
                </tbody>
              </WorkspaceTable>
            ) : (
              <EmptyState
                body="Structured room capture has not been added yet. As room parsing and defect extraction land in later steps, this overview will show condition drift and room-level evidence here."
                title="No structured rooms yet"
              />
            )}
          </div>
        </SectionCard>

        <SectionCard className="px-6 py-6 md:px-7">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
            <WorkspaceSectionTitle>Recent activity</WorkspaceSectionTitle>
            <p className="text-sm leading-6 text-slate-600">
              Latest structured events for the checkout workspace, falling back to operator case activity when needed.
            </p>
          </div>
          <div className="pt-5">
            <ActivityTimeline
              empty={
                <EmptyState
                  body="No activity entries have been recorded for this case yet."
                  title="No activity yet"
                />
              }
              items={activityTimelineItems}
            />
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
