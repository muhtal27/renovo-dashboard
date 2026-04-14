import type { OperatorCaseWorkspaceData } from '@/lib/operator-case-workspace-types'

export const CHECKOUT_WORKSPACE_TABS = [
  'overview',
  'process',
  'documents',
  'defects',
  'utilities',
  'negotiation',
  'send-out',
  'submission',
] as const

export type CheckoutWorkspaceTab = (typeof CHECKOUT_WORKSPACE_TABS)[number]

export const WORKSPACE_STEPS = [
  'inventory',
  'checkout',
  'readings',
  'analysis',
  'review',
  'deductions',
  'negotiation',
  'refund',
] as const

export type WorkspaceStep = (typeof WORKSPACE_STEPS)[number]

export type CheckoutWorkspaceCaseStatus =
  | 'in_review'
  | 'ready'
  | 'sent'
  | 'submitted'
  | 'disputed'
  | 'closed'

export type CheckoutWorkspaceNegotiationStatus = 'pending' | 'disputed' | 'agreed'

export type CheckoutWorkspaceSubmissionType = 'release' | 'dispute'

export type CheckoutWorkspaceDepositScheme =
  | 'tds'
  | 'dps'
  | 'mydeposits'
  | 'safedeposits_scotland'

export type CheckoutWorkspaceCondition =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'unacceptable'

export type CheckoutWorkspaceLiability = 'tenant' | 'landlord' | 'shared'

export type CheckoutWorkspaceDocumentType =
  | 'checkin'
  | 'checkout'
  | 'tenancy'
  | 'schedule_of_condition'
  | 'previous_inspection'
  | 'contractor_quote'
  | 'correspondence'
  | 'supplementary'

export type CheckoutWorkspaceDocumentProcessingStatus =
  | 'uploaded'
  | 'processing'
  | 'processed'
  | 'failed'

export type CheckoutWorkspaceDefectType = 'cleaning' | 'maintenance'

export type CheckoutWorkspaceUtilityType = 'electricity' | 'gas' | 'water' | 'oil'

export type CheckoutWorkspaceKeyStatus = 'returned' | 'outstanding' | 'not_applicable'

export type CheckoutWorkspaceDetectorType = 'smoke_alarm' | 'heat_detector' | 'co_detector'

export type AIDraftType =
  | 'liability_assessment'
  | 'proposed_charges'
  | 'tenant_negotiation'
  | 'combined_report'

export type AIDraftRecord = {
  id: string
  caseId: string
  draftType: AIDraftType
  title: string | null
  content: string
  metadata: Record<string, unknown>
  generatedAt: string
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceEmailDraftType = 'landlord_recommendation' | 'tenant_charges'

export type CheckoutWorkspaceEmailDraftStatus = 'draft' | 'sent'

export type CheckoutWorkspaceCaseRecord = {
  id: string
  caseId: string
  propertyAddress: string
  propertyPostcode: string
  caseReference: string
  checkoutDate: string
  checkinDate: string | null
  assessorName: string | null
  agencyName: string | null
  reportSource: string | null
  status: CheckoutWorkspaceCaseStatus
  depositHeld: number | null
  depositScheme: CheckoutWorkspaceDepositScheme | null
  landlordEmail: string | null
  tenantEmail: string | null
  negotiationStatus: CheckoutWorkspaceNegotiationStatus
  negotiationNotes: string | null
  submissionType: CheckoutWorkspaceSubmissionType | null
  submittedAt: string | null
  assignedTo: string | null
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceDocumentRecord = {
  id: string
  caseId: string
  documentName: string
  documentType: CheckoutWorkspaceDocumentType
  filePath: string
  fileSizeBytes: number | null
  pageCount: number | null
  source: string | null
  processingStatus: CheckoutWorkspaceDocumentProcessingStatus
  processedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceRoomRecord = {
  id: string
  caseId: string
  roomName: string
  sortOrder: number
  conditionCheckin: CheckoutWorkspaceCondition | null
  conditionCheckout: CheckoutWorkspaceCondition | null
  cleanlinessCheckin: CheckoutWorkspaceCondition | null
  cleanlinessCheckout: CheckoutWorkspaceCondition | null
  defectCount: number
  photoCount: number
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceDefectRecord = {
  id: string
  caseId: string
  roomId: string
  itemName: string
  defectType: CheckoutWorkspaceDefectType
  description: string
  conditionCurrent: CheckoutWorkspaceCondition | null
  cleanlinessCurrent: CheckoutWorkspaceCondition | null
  costEstimate: number | null
  costAdjusted: number | null
  aiSuggestedLiability: CheckoutWorkspaceLiability | null
  aiConfidence: number | null
  aiReasoning: string | null
  operatorLiability: CheckoutWorkspaceLiability | null
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceUtilityRecord = {
  id: string
  caseId: string
  utilityType: CheckoutWorkspaceUtilityType
  readingCheckin: number | null
  readingCheckout: number | null
  usageCalculated: number | null
  serialNumber: string | null
  meterLocation: string | null
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceKeyRecord = {
  id: string
  caseId: string
  setName: string
  keyCount: number
  details: string | null
  status: CheckoutWorkspaceKeyStatus
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceDetectorRecord = {
  id: string
  caseId: string
  detectorType: CheckoutWorkspaceDetectorType
  location: string
  tested: boolean
  expiryDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceComplianceRecord = {
  id: string
  caseId: string
  checkItem: string
  passed: boolean | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceCouncilTaxRecord = {
  id: string
  caseId: string
  councilName: string | null
  band: string | null
  tenancyEndDate: string | null
  councilNotified: boolean
  notifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceParkingRecord = {
  id: string
  caseId: string
  zone: string | null
  permitNumber: string | null
  status: CheckoutWorkspaceKeyStatus
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceEmailDraftRecord = {
  id: string
  caseId: string
  draftType: CheckoutWorkspaceEmailDraftType
  subject: string | null
  body: string
  attachmentDocumentIds: string[]
  sentAt: string | null
  sentTo: string | null
  status: CheckoutWorkspaceEmailDraftStatus
  createdAt: string
  updatedAt: string
}

export type CheckoutWorkspaceTimelineRecord = {
  id: string
  caseId: string
  eventType: string
  eventDescription: string
  performedBy: string | null
  eventDate: string
  createdAt: string
  updatedAt: string
}

export type OperatorCheckoutWorkspaceData = {
  workspace: OperatorCaseWorkspaceData
  checkoutCase: CheckoutWorkspaceCaseRecord | null
  documents: CheckoutWorkspaceDocumentRecord[]
  rooms: CheckoutWorkspaceRoomRecord[]
  defects: CheckoutWorkspaceDefectRecord[]
  utilities: CheckoutWorkspaceUtilityRecord[]
  keys: CheckoutWorkspaceKeyRecord[]
  detectors: CheckoutWorkspaceDetectorRecord[]
  compliance: CheckoutWorkspaceComplianceRecord[]
  councilTax: CheckoutWorkspaceCouncilTaxRecord | null
  parking: CheckoutWorkspaceParkingRecord | null
  emailDrafts: CheckoutWorkspaceEmailDraftRecord[]
  timeline: CheckoutWorkspaceTimelineRecord[]
  aiDrafts: AIDraftRecord[]
}

export function isCheckoutWorkspaceTab(value: string | null | undefined): value is CheckoutWorkspaceTab {
  return Boolean(value && CHECKOUT_WORKSPACE_TABS.includes(value as CheckoutWorkspaceTab))
}

export function normalizeCheckoutWorkspaceTab(value: string | null | undefined): CheckoutWorkspaceTab {
  if (value === 'sendout') {
    return 'send-out'
  }

  return isCheckoutWorkspaceTab(value) ? value : 'overview'
}

export function isWorkspaceStep(value: string | null | undefined): value is WorkspaceStep {
  return Boolean(value && WORKSPACE_STEPS.includes(value as WorkspaceStep))
}

export function normalizeWorkspaceStep(value: string | null | undefined): WorkspaceStep {
  if (!value) return 'inventory'
  const v = value.toLowerCase().trim()
  if (isWorkspaceStep(v)) return v
  // Legacy step aliases
  if (v === 'overview') return 'inventory'
  if (v === 'draft' || v === 'documents' || v === 'collecting-evidence') return 'checkout'
  if (v === 'utilities') return 'readings'
  if (v === 'process') return 'analysis'
  if (v === 'defects') return 'review'
  if (v === 'draft-sent' || v === 'send-out' || v === 'sendout') return 'deductions'
  if (v === 'ready-for-claim') return 'negotiation'
  if (v === 'submitted' || v === 'resolved' || v === 'submission') return 'refund'
  return 'inventory'
}
