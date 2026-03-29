import 'server-only'

import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { getEotCaseWorkspace } from '@/lib/operator-case-workspace'
import { requireOperatorTenant } from '@/lib/operator-server'
import {
  getOptionalBoolean,
  getOptionalString,
  isMissingRelationError,
} from '@/lib/operator-schema-compat'
import type {
  CheckoutWorkspaceCaseRecord,
  CheckoutWorkspaceComplianceRecord,
  CheckoutWorkspaceCouncilTaxRecord,
  CheckoutWorkspaceDefectRecord,
  CheckoutWorkspaceDetectorRecord,
  CheckoutWorkspaceDocumentRecord,
  CheckoutWorkspaceEmailDraftRecord,
  CheckoutWorkspaceKeyRecord,
  CheckoutWorkspaceParkingRecord,
  CheckoutWorkspaceRoomRecord,
  CheckoutWorkspaceTimelineRecord,
  CheckoutWorkspaceUtilityRecord,
  OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

type RowRecord = Record<string, unknown>

function isRowRecord(value: unknown): value is RowRecord {
  return typeof value === 'object' && value !== null
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : null
}

function toRequiredString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function toNullableNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : null
  }

  return null
}

function toNumberWithFallback(value: unknown, fallback = 0) {
  return toNullableNumber(value) ?? fallback
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

function normalizeCheckoutCase(row: RowRecord): CheckoutWorkspaceCaseRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    propertyAddress: toRequiredString(row.property_address, 'Address not recorded'),
    propertyPostcode: toRequiredString(row.property_postcode, 'Not recorded'),
    caseReference: toRequiredString(row.case_reference, 'Case reference unavailable'),
    checkoutDate: toRequiredString(row.checkout_date, ''),
    checkinDate: toStringValue(row.checkin_date),
    assessorName: getOptionalString(row, 'assessor_name'),
    agencyName: getOptionalString(row, 'agency_name'),
    reportSource: getOptionalString(row, 'report_source'),
    status: toRequiredString(row.status, 'in_review') as CheckoutWorkspaceCaseRecord['status'],
    depositHeld: toNullableNumber(row.deposit_held),
    depositScheme: toStringValue(row.deposit_scheme) as CheckoutWorkspaceCaseRecord['depositScheme'],
    landlordEmail: getOptionalString(row, 'landlord_email'),
    tenantEmail: getOptionalString(row, 'tenant_email'),
    negotiationStatus: toRequiredString(row.negotiation_status, 'pending') as CheckoutWorkspaceCaseRecord['negotiationStatus'],
    negotiationNotes: getOptionalString(row, 'negotiation_notes'),
    submissionType: toStringValue(row.submission_type) as CheckoutWorkspaceCaseRecord['submissionType'],
    submittedAt: toStringValue(row.submitted_at),
    assignedTo: toStringValue(row.assigned_to),
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutDocument(row: RowRecord): CheckoutWorkspaceDocumentRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    documentName: toRequiredString(row.document_name, 'Untitled document'),
    documentType: toRequiredString(row.document_type, 'supplementary') as CheckoutWorkspaceDocumentRecord['documentType'],
    filePath: toRequiredString(row.file_path, ''),
    fileSizeBytes: toNullableNumber(row.file_size_bytes),
    pageCount: toNullableNumber(row.page_count),
    source: getOptionalString(row, 'source'),
    processingStatus: toRequiredString(row.processing_status, 'uploaded') as CheckoutWorkspaceDocumentRecord['processingStatus'],
    processedAt: toStringValue(row.processed_at),
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutRoom(row: RowRecord): CheckoutWorkspaceRoomRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    roomName: toRequiredString(row.room_name, 'Room'),
    sortOrder: toNumberWithFallback(row.sort_order),
    conditionCheckin: toStringValue(row.condition_checkin) as CheckoutWorkspaceRoomRecord['conditionCheckin'],
    conditionCheckout: toStringValue(row.condition_checkout) as CheckoutWorkspaceRoomRecord['conditionCheckout'],
    cleanlinessCheckin: toStringValue(row.cleanliness_checkin) as CheckoutWorkspaceRoomRecord['cleanlinessCheckin'],
    cleanlinessCheckout: toStringValue(row.cleanliness_checkout) as CheckoutWorkspaceRoomRecord['cleanlinessCheckout'],
    defectCount: toNumberWithFallback(row.defect_count),
    photoCount: toNumberWithFallback(row.photo_count),
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutDefect(row: RowRecord): CheckoutWorkspaceDefectRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    roomId: toRequiredString(row.room_id, ''),
    itemName: toRequiredString(row.item_name, 'Item'),
    defectType: toRequiredString(row.defect_type, 'maintenance') as CheckoutWorkspaceDefectRecord['defectType'],
    description: toRequiredString(row.description, ''),
    conditionCurrent: toStringValue(row.condition_current) as CheckoutWorkspaceDefectRecord['conditionCurrent'],
    cleanlinessCurrent: toStringValue(row.cleanliness_current) as CheckoutWorkspaceDefectRecord['cleanlinessCurrent'],
    costEstimate: toNullableNumber(row.cost_estimate),
    costAdjusted: toNullableNumber(row.cost_adjusted),
    aiSuggestedLiability: toStringValue(row.ai_suggested_liability) as CheckoutWorkspaceDefectRecord['aiSuggestedLiability'],
    aiConfidence: toNullableNumber(row.ai_confidence),
    aiReasoning: getOptionalString(row, 'ai_reasoning'),
    operatorLiability: toStringValue(row.operator_liability) as CheckoutWorkspaceDefectRecord['operatorLiability'],
    reviewedAt: toStringValue(row.reviewed_at),
    reviewedBy: toStringValue(row.reviewed_by),
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutUtility(row: RowRecord): CheckoutWorkspaceUtilityRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    utilityType: toRequiredString(row.utility_type, 'electricity') as CheckoutWorkspaceUtilityRecord['utilityType'],
    readingCheckin: toNullableNumber(row.reading_checkin),
    readingCheckout: toNullableNumber(row.reading_checkout),
    usageCalculated: toNullableNumber(row.usage_calculated),
    serialNumber: getOptionalString(row, 'serial_number'),
    meterLocation: getOptionalString(row, 'meter_location'),
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutKey(row: RowRecord): CheckoutWorkspaceKeyRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    setName: toRequiredString(row.set_name, 'Key set'),
    keyCount: toNumberWithFallback(row.key_count),
    details: getOptionalString(row, 'details'),
    status: toRequiredString(row.status, 'returned') as CheckoutWorkspaceKeyRecord['status'],
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutDetector(row: RowRecord): CheckoutWorkspaceDetectorRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    detectorType: toRequiredString(row.detector_type, 'smoke_alarm') as CheckoutWorkspaceDetectorRecord['detectorType'],
    location: toRequiredString(row.location, ''),
    tested: getOptionalBoolean(row, 'tested') ?? false,
    expiryDate: getOptionalString(row, 'expiry_date'),
    notes: getOptionalString(row, 'notes'),
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutCompliance(row: RowRecord): CheckoutWorkspaceComplianceRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    checkItem: toRequiredString(row.check_item, ''),
    passed: getOptionalBoolean(row, 'passed'),
    notes: getOptionalString(row, 'notes'),
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutCouncilTax(row: RowRecord): CheckoutWorkspaceCouncilTaxRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    councilName: getOptionalString(row, 'council_name'),
    band: getOptionalString(row, 'band'),
    tenancyEndDate: toStringValue(row.tenancy_end_date),
    councilNotified: getOptionalBoolean(row, 'council_notified') ?? false,
    notifiedAt: toStringValue(row.notified_at),
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutParking(row: RowRecord): CheckoutWorkspaceParkingRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    zone: getOptionalString(row, 'zone'),
    permitNumber: getOptionalString(row, 'permit_number'),
    status: toRequiredString(row.status, 'not_applicable') as CheckoutWorkspaceParkingRecord['status'],
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutEmailDraft(row: RowRecord): CheckoutWorkspaceEmailDraftRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    draftType: toRequiredString(row.draft_type, 'landlord_recommendation') as CheckoutWorkspaceEmailDraftRecord['draftType'],
    subject: getOptionalString(row, 'subject'),
    body: toRequiredString(row.body, ''),
    attachmentDocumentIds: toStringArray(row.attachment_document_ids),
    sentAt: toStringValue(row.sent_at),
    sentTo: getOptionalString(row, 'sent_to'),
    status: toRequiredString(row.status, 'draft') as CheckoutWorkspaceEmailDraftRecord['status'],
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

function normalizeCheckoutTimeline(row: RowRecord): CheckoutWorkspaceTimelineRecord {
  return {
    id: toRequiredString(row.id, ''),
    caseId: toRequiredString(row.case_id, ''),
    eventType: toRequiredString(row.event_type, ''),
    eventDescription: toRequiredString(row.event_description, ''),
    performedBy: getOptionalString(row, 'performed_by'),
    eventDate: toRequiredString(row.event_date, ''),
    createdAt: toRequiredString(row.created_at, ''),
    updatedAt: toRequiredString(row.updated_at, ''),
  }
}

async function listCheckoutRows<TRecord>({
  table,
  tenantId,
  checkoutCaseId,
  orderBy,
  ascending = true,
  normalize,
}: {
  table: string
  tenantId: string
  checkoutCaseId: string
  orderBy?: string
  ascending?: boolean
  normalize: (row: RowRecord) => TRecord
}) {
  const supabase = getSupabaseServiceRoleClient()
  let query = supabase
    .from(table)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('case_id', checkoutCaseId)
    .is('deleted_at', null)

  if (orderBy) {
    query = query.order(orderBy, { ascending })
  }

  const result = await query

  if (result.error) {
    if (isMissingRelationError(result.error, table)) {
      return []
    }

    throw result.error
  }

  return (result.data ?? []).filter(isRowRecord).map(normalize)
}

async function getCheckoutSingleton<TRecord>({
  table,
  tenantId,
  checkoutCaseId,
  normalize,
}: {
  table: string
  tenantId: string
  checkoutCaseId: string
  normalize: (row: RowRecord) => TRecord
}) {
  const supabase = getSupabaseServiceRoleClient()
  const result = await supabase
    .from(table)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('case_id', checkoutCaseId)
    .is('deleted_at', null)
    .maybeSingle()

  if (result.error) {
    if (isMissingRelationError(result.error, table)) {
      return null
    }

    throw result.error
  }

  return isRowRecord(result.data) ? normalize(result.data) : null
}

export async function getOperatorCheckoutWorkspaceData(caseId: string): Promise<OperatorCheckoutWorkspaceData> {
  const [workspace, context] = await Promise.all([
    getEotCaseWorkspace(caseId),
    requireOperatorTenant(`/operator/cases/${caseId}`),
  ])

  const supabase = getSupabaseServiceRoleClient()
  const checkoutCaseResult = await supabase
    .from('checkout_cases')
    .select('*')
    .eq('tenant_id', context.tenantId)
    .eq('case_id', caseId)
    .is('deleted_at', null)
    .maybeSingle()

  if (checkoutCaseResult.error) {
    if (isMissingRelationError(checkoutCaseResult.error, 'checkout_cases')) {
      return {
        workspace,
        checkoutCase: null,
        documents: [],
        rooms: [],
        defects: [],
        utilities: [],
        keys: [],
        detectors: [],
        compliance: [],
        councilTax: null,
        parking: null,
        emailDrafts: [],
        timeline: [],
      }
    }

    throw checkoutCaseResult.error
  }

  if (!isRowRecord(checkoutCaseResult.data)) {
    return {
      workspace,
      checkoutCase: null,
      documents: [],
      rooms: [],
      defects: [],
      utilities: [],
      keys: [],
      detectors: [],
      compliance: [],
      councilTax: null,
      parking: null,
      emailDrafts: [],
      timeline: [],
    }
  }

  const checkoutCase = normalizeCheckoutCase(checkoutCaseResult.data)

  const [
    documents,
    rooms,
    defects,
    utilities,
    keys,
    detectors,
    compliance,
    councilTax,
    parking,
    emailDrafts,
    timeline,
  ] = await Promise.all([
    listCheckoutRows({
      table: 'checkout_documents',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      orderBy: 'created_at',
      normalize: normalizeCheckoutDocument,
    }),
    listCheckoutRows({
      table: 'checkout_rooms',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      orderBy: 'sort_order',
      normalize: normalizeCheckoutRoom,
    }),
    listCheckoutRows({
      table: 'checkout_defects',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      orderBy: 'created_at',
      normalize: normalizeCheckoutDefect,
    }),
    listCheckoutRows({
      table: 'checkout_utilities',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      orderBy: 'created_at',
      normalize: normalizeCheckoutUtility,
    }),
    listCheckoutRows({
      table: 'checkout_keys',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      orderBy: 'created_at',
      normalize: normalizeCheckoutKey,
    }),
    listCheckoutRows({
      table: 'checkout_detectors',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      orderBy: 'created_at',
      normalize: normalizeCheckoutDetector,
    }),
    listCheckoutRows({
      table: 'checkout_compliance',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      orderBy: 'created_at',
      normalize: normalizeCheckoutCompliance,
    }),
    getCheckoutSingleton({
      table: 'checkout_council_tax',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      normalize: normalizeCheckoutCouncilTax,
    }),
    getCheckoutSingleton({
      table: 'checkout_parking',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      normalize: normalizeCheckoutParking,
    }),
    listCheckoutRows({
      table: 'checkout_email_drafts',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      orderBy: 'created_at',
      normalize: normalizeCheckoutEmailDraft,
    }),
    listCheckoutRows({
      table: 'checkout_timeline',
      tenantId: context.tenantId,
      checkoutCaseId: checkoutCase.id,
      orderBy: 'event_date',
      ascending: true,
      normalize: normalizeCheckoutTimeline,
    }),
  ])

  return {
    workspace,
    checkoutCase,
    documents,
    rooms,
    defects,
    utilities,
    keys,
    detectors,
    compliance,
    councilTax,
    parking,
    emailDrafts,
    timeline,
  }
}
