import type {
  CheckoutWorkspaceDefectRecord,
  CheckoutWorkspaceEmailDraftRecord,
  CheckoutWorkspaceNegotiationStatus,
  OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

type CheckoutEmailDraftRecipientFallback = {
  landlord?: string | null
  tenant?: string | null
}

type CheckoutEmailDraftRecipientContext = {
  checkoutCase?: {
    landlordEmail: string | null
    tenantEmail: string | null
  } | null
  workspace: {
    tenant: {
      email: string | null
    }
  }
}

type CheckoutEmailDraftAttachmentContext = {
  documents: OperatorCheckoutWorkspaceData['documents']
}

export type CheckoutEmailDraftContext =
  CheckoutEmailDraftRecipientContext &
  CheckoutEmailDraftAttachmentContext

export function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function getCheckoutNegotiationPresentation(
  status: CheckoutWorkspaceNegotiationStatus | null | undefined
) {
  switch (status) {
    case 'agreed':
      return { label: 'Negotiation agreed', tone: 'accepted' as const }
    case 'disputed':
      return { label: 'Negotiation disputed', tone: 'disputed' as const }
    case 'pending':
    default:
      return { label: 'Negotiation pending', tone: 'pending' as const }
  }
}

export function getCheckoutSelectedLiability(defect: CheckoutWorkspaceDefectRecord) {
  return defect.operatorLiability ?? defect.aiSuggestedLiability
}

export function getCheckoutEmailDraftTypeTone(type: CheckoutWorkspaceEmailDraftRecord['draftType']) {
  return type === 'tenant_charges' ? 'warning' as const : 'info' as const
}

export function getCheckoutEmailDraftStatusTone(status: CheckoutWorkspaceEmailDraftRecord['status']) {
  return status === 'sent' ? 'sent' as const : 'draft' as const
}

export function sortCheckoutEmailDrafts(drafts: CheckoutWorkspaceEmailDraftRecord[]) {
  return [...drafts].sort((left, right) => {
    const sentDifference = toTimestamp(right.sentAt) - toTimestamp(left.sentAt)

    if (sentDifference !== 0) {
      return sentDifference
    }

    return toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt)
  })
}

export function sortSendOutQueueDrafts(drafts: CheckoutWorkspaceEmailDraftRecord[]) {
  return [...drafts].sort((left, right) => {
    const statusDifference = Number(right.status === 'sent') - Number(left.status === 'sent')

    if (statusDifference !== 0) {
      return statusDifference
    }

    return toTimestamp(right.sentAt ?? right.updatedAt) - toTimestamp(left.sentAt ?? left.updatedAt)
  })
}

export function getCheckoutEmailDraftRecipient(
  draft: CheckoutWorkspaceEmailDraftRecord,
  data: CheckoutEmailDraftRecipientContext,
  {
    fallback,
  }: {
    fallback?: CheckoutEmailDraftRecipientFallback
  } = {}
) {
  if (draft.sentTo?.trim()) {
    return draft.sentTo.trim()
  }

  if (draft.draftType === 'tenant_charges') {
    return data.checkoutCase?.tenantEmail ?? data.workspace.tenant.email ?? fallback?.tenant ?? null
  }

  return data.checkoutCase?.landlordEmail ?? fallback?.landlord ?? null
}

export function getCheckoutEmailDraftAttachmentNames(
  draft: CheckoutWorkspaceEmailDraftRecord,
  data: CheckoutEmailDraftAttachmentContext
) {
  const structuredDocuments = new Map(data.documents.map((document) => [document.id, document.documentName]))

  return draft.attachmentDocumentIds.map((documentId) => {
    return structuredDocuments.get(documentId) ?? `Document ${documentId.slice(0, 8)}`
  })
}

export function getCheckoutEmailDraftPreview(body: string) {
  const normalized = body.replace(/\s+/g, ' ').trim()

  if (normalized.length <= 120) {
    return normalized || 'No body recorded.'
  }

  return `${normalized.slice(0, 117)}...`
}
