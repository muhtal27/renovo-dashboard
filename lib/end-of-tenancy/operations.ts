import type {
  CaseCommunicationRecord,
  EndOfTenancyCaseListItem,
} from '@/lib/end-of-tenancy/types'

export type DisputeQueueStatus =
  | 'Open'
  | 'Awaiting evidence'
  | 'Awaiting response'
  | 'Submitted'
  | 'Resolved'

export type DisputeRecord = {
  id: string
  caseId: string
  endOfTenancyCaseId: string
  caseNumber: string
  propertyAddress: string
  tenantName: string
  landlordName: string
  status: DisputeQueueStatus
  schemeReference: string | null
  totalClaimAmount: number | string | null
  disputedAmount: number | string | null
  updatedAt: string | null
}

export type InventoryRecord = {
  id: string
  caseId: string
  endOfTenancyCaseId: string
  caseNumber: string
  propertyAddress: string
  tenantName: string
  landlordName: string
  checkInCount: number
  checkOutCount: number
  photoCount: number
  missingEvidence: string[]
  pendingReview: boolean
  linkedCase: string
  updatedAt: string | null
}

export type InboxThreadSummary = {
  caseId: string
  endOfTenancyCaseId: string | null
  caseNumber: string
  propertyAddress: string
  tenantName: string
  landlordName: string
  unreadCount: number
  latestMessageAt: string | null
  latestMessageType: string
  latestPreview: string
  internalCount: number
  externalCount: number
}

export type DashboardSearchEntry = {
  id: string
  type: 'case' | 'dispute' | 'inventory'
  title: string
  subtitle: string
  href: string
  searchText: string
}

export function buildAddress(item: {
  address_line_1: string | null
  address_line_2?: string | null
  city?: string | null
  postcode?: string | null
} | null) {
  if (!item) return 'Unknown property'

  return [item.address_line_1, item.address_line_2, item.city, item.postcode]
    .filter(Boolean)
    .join(', ')
}

export function getDisplayName(item: {
  full_name?: string | null
} | null) {
  return item?.full_name?.trim() || 'Unknown'
}

export function getCaseNumber(item: EndOfTenancyCaseListItem) {
  return item.case?.case_number?.trim() || item.case?.id?.slice(0, 8) || item.endOfTenancyCase.case_id.slice(0, 8)
}

export function getCaseHref(item: EndOfTenancyCaseListItem) {
  return `/cases/${item.case?.id || item.endOfTenancyCase.case_id}`
}

export function getEffectiveMoveOutDate(item: EndOfTenancyCaseListItem) {
  return item.endOfTenancyCase.move_out_date || item.tenancy?.end_date || null
}

export function isAwaitingReview(item: EndOfTenancyCaseListItem) {
  return (
    item.endOfTenancyCase.workflow_status === 'recommendation_drafted' ||
    item.endOfTenancyCase.workflow_status === 'needs_manual_review'
  )
}

export function isEvidencePending(item: EndOfTenancyCaseListItem) {
  return ['evidence_pending', 'evidence_ready'].includes(item.endOfTenancyCase.workflow_status)
}

export function getOpenCases(items: EndOfTenancyCaseListItem[]) {
  return items.filter((item) => (item.case?.status || '').toLowerCase() !== 'closed')
}

export function deriveDisputeStatus(item: EndOfTenancyCaseListItem): DisputeQueueStatus {
  if (item.depositClaim?.claim_status === 'resolved') {
    return 'Resolved'
  }

  if (item.depositClaim?.claim_status === 'submitted') {
    return 'Submitted'
  }

  const disputedAmount = Number(item.depositClaim?.disputed_amount ?? 0)
  if (Number.isFinite(disputedAmount) && disputedAmount > 0) {
    return 'Awaiting response'
  }

  if (item.documentSummary.checkIn === 0 || item.documentSummary.checkOut === 0) {
    return 'Awaiting evidence'
  }

  return 'Open'
}

export function deriveDisputeRecords(items: EndOfTenancyCaseListItem[]) {
  return getOpenCases(items)
    .filter(
      (item) =>
        item.depositClaim != null ||
        ['review_pending', 'recommendation_drafted', 'recommendation_approved', 'ready_for_claim', 'needs_manual_review'].includes(
          item.endOfTenancyCase.workflow_status
        )
    )
    .map<DisputeRecord>((item) => ({
      id: item.depositClaim?.id || item.endOfTenancyCase.id,
      caseId: item.case?.id || item.endOfTenancyCase.case_id,
      endOfTenancyCaseId: item.endOfTenancyCase.id,
      caseNumber: getCaseNumber(item),
      propertyAddress: buildAddress(item.property),
      tenantName: getDisplayName(item.tenant),
      landlordName: getDisplayName(item.landlord),
      status: deriveDisputeStatus(item),
      schemeReference: item.depositClaim?.scheme_reference ?? null,
      totalClaimAmount: item.depositClaim?.total_claim_amount ?? null,
      disputedAmount: item.depositClaim?.disputed_amount ?? null,
      updatedAt:
        item.depositClaim?.updated_at ||
        item.case?.last_activity_at ||
        item.case?.updated_at ||
        item.endOfTenancyCase.updated_at,
    }))
}

export function deriveInventoryRecords(items: EndOfTenancyCaseListItem[]) {
  return getOpenCases(items).map<InventoryRecord>((item) => {
    const missingEvidence: string[] = []

    if (item.documentSummary.checkIn === 0) {
      missingEvidence.push('Check-in report')
    }

    if (item.documentSummary.checkOut === 0) {
      missingEvidence.push('Check-out report')
    }

    if (item.documentSummary.photos === 0) {
      missingEvidence.push('Photos')
    }

    return {
      id: item.endOfTenancyCase.id,
      caseId: item.case?.id || item.endOfTenancyCase.case_id,
      endOfTenancyCaseId: item.endOfTenancyCase.id,
      caseNumber: getCaseNumber(item),
      propertyAddress: buildAddress(item.property),
      tenantName: getDisplayName(item.tenant),
      landlordName: getDisplayName(item.landlord),
      checkInCount: item.documentSummary.checkIn,
      checkOutCount: item.documentSummary.checkOut,
      photoCount: item.documentSummary.photos,
      missingEvidence,
      pendingReview:
        item.documentSummary.checkIn > 0 &&
        item.documentSummary.checkOut > 0 &&
        ['evidence_ready', 'review_pending', 'recommendation_drafted', 'needs_manual_review'].includes(
          item.endOfTenancyCase.workflow_status
        ),
      linkedCase: getCaseNumber(item),
      updatedAt:
        item.moveOutTracker?.updated_at ||
        item.case?.last_activity_at ||
        item.case?.updated_at ||
        item.endOfTenancyCase.updated_at,
    }
  })
}

export function buildInboxThreads(
  items: EndOfTenancyCaseListItem[],
  communications: CaseCommunicationRecord[]
) {
  const itemsByCaseId = new Map(
    items.map((item) => [item.case?.id || item.endOfTenancyCase.case_id, item] as const)
  )
  const threads = new Map<string, InboxThreadSummary>()

  for (const communication of communications) {
    const item = itemsByCaseId.get(communication.case_id)
    if (!item) continue

    const existing = threads.get(communication.case_id)
    const latestAt = communication.sent_at || communication.created_at

    if (!existing) {
      threads.set(communication.case_id, {
        caseId: communication.case_id,
        endOfTenancyCaseId: communication.end_of_tenancy_case_id,
        caseNumber: getCaseNumber(item),
        propertyAddress: buildAddress(item.property),
        tenantName: getDisplayName(item.tenant),
        landlordName: getDisplayName(item.landlord),
        unreadCount: communication.unread ? 1 : 0,
        latestMessageAt: latestAt,
        latestMessageType:
          communication.recipient_role === 'internal' ? 'Internal note' : communication.direction,
        latestPreview: communication.subject?.trim() || communication.body.trim(),
        internalCount: communication.recipient_role === 'internal' ? 1 : 0,
        externalCount: communication.recipient_role === 'internal' ? 0 : 1,
      })
      continue
    }

    existing.unreadCount += communication.unread ? 1 : 0
    existing.internalCount += communication.recipient_role === 'internal' ? 1 : 0
    existing.externalCount += communication.recipient_role === 'internal' ? 0 : 1

    if ((latestAt || '') > (existing.latestMessageAt || '')) {
      existing.latestMessageAt = latestAt
      existing.latestMessageType =
        communication.recipient_role === 'internal' ? 'Internal note' : communication.direction
      existing.latestPreview = communication.subject?.trim() || communication.body.trim()
    }
  }

  return Array.from(threads.values()).sort((left, right) =>
    (right.latestMessageAt || '').localeCompare(left.latestMessageAt || '')
  )
}

export function buildDashboardSearchEntries(items: EndOfTenancyCaseListItem[]) {
  const disputes = deriveDisputeRecords(items)
  const inventories = deriveInventoryRecords(items)

  const caseEntries = getOpenCases(items).map<DashboardSearchEntry>((item) => ({
    id: `case:${item.endOfTenancyCase.id}`,
    type: 'case',
    title: getCaseNumber(item),
    subtitle: `${buildAddress(item.property)} · ${getDisplayName(item.tenant)} · ${getDisplayName(item.landlord)}`,
    href: getCaseHref(item),
    searchText: [
      getCaseNumber(item),
      item.case?.id,
      buildAddress(item.property),
      getDisplayName(item.tenant),
      getDisplayName(item.landlord),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }))

  const disputeEntries = disputes.map<DashboardSearchEntry>((item) => ({
    id: `dispute:${item.id}`,
    type: 'dispute',
    title: item.schemeReference || item.caseNumber,
    subtitle: `${item.propertyAddress} · ${item.status}`,
    href: `/cases/${item.caseId}#claim`,
    searchText: [
      item.schemeReference,
      item.caseNumber,
      item.propertyAddress,
      item.tenantName,
      item.landlordName,
      'dispute',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }))

  const inventoryEntries = inventories.map<DashboardSearchEntry>((item) => ({
    id: `inventory:${item.id}`,
    type: 'inventory',
    title: item.caseNumber,
    subtitle: `${item.propertyAddress} · ${item.missingEvidence.length > 0 ? item.missingEvidence.join(', ') : 'Inventory ready for review'}`,
    href: `/cases/${item.caseId}#evidence`,
    searchText: [
      item.caseNumber,
      item.endOfTenancyCaseId,
      item.propertyAddress,
      item.tenantName,
      item.landlordName,
      'inventory',
      'check in',
      'check out',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }))

  return [...caseEntries, ...disputeEntries, ...inventoryEntries]
}
