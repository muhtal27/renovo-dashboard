'use client'

import { ActivityTimeline, EmptyState } from '@/app/operator-ui'
import { CaseWorkspaceOverviewDetails } from '@/app/(operator)/operator/cases/[id]/_components/case-workspace-overview-details'
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
    <div className="space-y-4">
      {overviewNotice ? (
        <WorkspaceNotice
          body={overviewNotice.body}
          title={overviewNotice.title}
          tone={overviewNotice.tone}
        />
      ) : null}

      <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
        <WorkspaceMetricCard
          label="Deposit held"
          tone={depositHeld == null ? 'warning' : 'default'}
          value={formatCurrencyValue(depositHeld)}
          detail={formatTextValue(data.checkoutCase?.depositScheme ? formatEnumLabel(data.checkoutCase.depositScheme) : null)}
        />
        <WorkspaceMetricCard
          label="Proposed deductions"
          tone={claimExceedsDeposit ? 'danger' : data.workspace.totals.proposedDeductions > 0 ? 'warning' : 'success'}
          value={formatCurrency(data.workspace.totals.proposedDeductions)}
          detail={`${openIssues} open${disputedIssues > 0 ? ` · ${disputedIssues} disputed` : ''}`}
        />
        <WorkspaceMetricCard
          label="Rooms captured"
          tone={data.rooms.length > 0 ? 'info' : 'warning'}
          value={data.rooms.length}
          detail={`${data.documents.length} docs · ${totalPhotos} photos`}
        />
        <WorkspaceMetricCard
          label="Handover"
          tone={handoverChecklistValue >= 5 ? 'success' : handoverChecklistValue >= 3 ? 'warning' : 'default'}
          value={`${handoverChecklistValue}/6`}
          detail={`${reviewedDefects}/${data.defects.length || 0} defects reviewed`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3">
        <WorkspaceBadge label={checkoutStatus.label} tone={checkoutStatus.tone} />
        <WorkspaceBadge label={`Case: ${formatEnumLabel(data.workspace.case.status)}`} tone={data.workspace.case.status === 'disputed' ? 'disputed' : 'review'} />
        <WorkspaceBadge label={negotiationStatus.label} tone={negotiationStatus.tone} />
        {data.checkoutCase?.submissionType ? (
          <WorkspaceBadge label={formatEnumLabel(data.checkoutCase.submissionType)} tone={data.checkoutCase.submissionType === 'dispute' ? 'disputed' : 'submitted'} />
        ) : null}
        <WorkspaceBadge label={`${coreDocumentCount}/3 core reports`} tone={coreDocumentCount === 3 ? 'processed' : 'warning'} />
      </div>

      {data.workspace.case.summary ? (
        <p className="border-b border-zinc-200 pb-3 text-sm leading-6 text-zinc-600">{data.workspace.case.summary}</p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <CaseWorkspaceOverviewDetails
            workspace={data.workspace}
            fallbackLandlordEmail={data.checkoutCase?.landlordEmail}
            fallbackTenantEmail={data.checkoutCase?.tenantEmail}
          />

          <dl className="grid gap-x-6 gap-y-1 border-b border-zinc-200 pb-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Checkout date', value: formatDate(data.checkoutCase?.checkoutDate ?? data.workspace.tenancy.end_date) },
              { label: 'Check-in date', value: formatDate(data.checkoutCase?.checkinDate) },
              { label: 'Property ref', value: formatTextValue(data.workspace.property.reference) },
              { label: 'Case ref', value: data.checkoutCase?.caseReference ?? data.workspace.case.id.slice(0, 8).toUpperCase() },
              { label: 'Assessor', value: formatTextValue(data.checkoutCase?.assessorName) },
              { label: 'Agency', value: formatTextValue(data.checkoutCase?.agencyName) },
              { label: 'Report source', value: formatTextValue(data.checkoutCase?.reportSource) },
              { label: 'Last activity', value: formatDateTime(data.workspace.case.last_activity_at) },
            ].map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-3 py-1">
                <span className="text-xs text-zinc-500">{item.label}</span>
                <span className="text-right text-sm font-medium text-zinc-950">{item.value}</span>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-4">
          <div className="border-l-2 border-zinc-200 pl-4">
            <h3 className="text-sm font-semibold text-zinc-950">Financial position</h3>
            <div className="mt-2">
              {[
                { label: 'Deposit held', value: formatCurrencyValue(depositHeld) },
                { label: 'Return to tenant', value: formatCurrencyValue(data.workspace.totals.returnToTenant) },
                { label: 'Disputed amount', value: formatCurrency(data.workspace.totals.disputedAmount) },
                { label: 'Breakdown items', value: String(data.workspace.claimBreakdown.length) },
              ].map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-3 border-b border-zinc-100 py-2">
                  <span className="text-xs text-zinc-500">{item.label}</span>
                  <span className="text-sm font-medium text-zinc-950">{item.value}</span>
                </div>
              ))}
            </div>
            {claimExceedsDeposit ? (
              <WorkspaceNotice body="Proposed deductions exceed deposit held." title="Deposit overrun" tone="warning" className="mt-2" />
            ) : null}
          </div>

          <div className="border-l-2 border-zinc-200 pl-4">
            <h3 className="text-sm font-semibold text-zinc-950">Readiness</h3>
            <div className="mt-2 space-y-2">
              <WorkspaceProgressBar label="Core documents" max={3} tone={coreDocumentCount === 3 ? 'success' : 'warning'} value={coreDocumentCount} valueLabel={`${coreDocumentCount}/3`} />
              <WorkspaceProgressBar label="Docs processed" max={Math.max(data.documents.length, 1)} tone={processedCheckoutDocuments === data.documents.length && data.documents.length > 0 ? 'success' : 'default'} value={processedCheckoutDocuments} valueLabel={`${processedCheckoutDocuments}/${data.documents.length}`} />
              <WorkspaceProgressBar label="Defects reviewed" max={Math.max(data.defects.length, 1)} tone={reviewedDefects === data.defects.length && data.defects.length > 0 ? 'success' : 'warning'} value={reviewedDefects} valueLabel={`${reviewedDefects}/${data.defects.length}`} />
              <WorkspaceProgressBar label="Handover checklist" max={6} tone={handoverChecklistValue >= 5 ? 'success' : 'info'} value={handoverChecklistValue} valueLabel={`${handoverChecklistValue}/6`} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Rooms & condition</h3>
          <div className="mt-2">
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
                      <WorkspaceTableCell><ConditionBadge value={room.conditionCheckin} /></WorkspaceTableCell>
                      <WorkspaceTableCell><ConditionBadge value={room.conditionCheckout} /></WorkspaceTableCell>
                      <WorkspaceTableCell align="center">{room.defectCount}</WorkspaceTableCell>
                      <WorkspaceTableCell align="center">{room.photoCount}</WorkspaceTableCell>
                    </WorkspaceTableRow>
                  ))}
                </tbody>
              </WorkspaceTable>
            ) : (
              <EmptyState body="Room capture not started yet." title="No rooms" />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Recent activity</h3>
          <div className="mt-2">
            <ActivityTimeline
              empty={<EmptyState body="No activity recorded." title="No activity" />}
              items={activityTimelineItems}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
