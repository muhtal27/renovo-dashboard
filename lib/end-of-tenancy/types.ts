export type EndOfTenancyWorkflowStatus =
  | 'evidence_pending'
  | 'evidence_ready'
  | 'review_pending'
  | 'recommendation_drafted'
  | 'recommendation_approved'
  | 'ready_for_claim'
  | 'needs_manual_review'
  | 'closed'

export type EndOfTenancyInspectionStatus =
  | 'not_started'
  | 'scheduled'
  | 'completed'
  | 'waived'

export type CaseDocumentRole =
  | 'check_in'
  | 'check_out'
  | 'invoice'
  | 'receipt'
  | 'photo'
  | 'video'
  | 'email'
  | 'message_attachment'
  | 'tenancy_agreement'
  | 'deposit_scheme'
  | 'supporting_evidence'
  | 'other'

export type CaseDocumentSourceType =
  | 'tenancy_document'
  | 'message_attachment'
  | 'manual_upload'
  | 'generated'
  | 'external'

export type DocumentExtractionKind = 'ocr' | 'classification' | 'structured' | 'summary'
export type DocumentExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type EndOfTenancyIssueType =
  | 'cleaning'
  | 'damage'
  | 'missing_item'
  | 'repair'
  | 'redecoration'
  | 'gardening'
  | 'rubbish_removal'
  | 'rent_arrears'
  | 'utilities'
  | 'other'

export type EndOfTenancyIssueStatus =
  | 'open'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'resolved'

export type EndOfTenancyResponsibility = 'tenant' | 'landlord' | 'shared' | 'undetermined'
export type EndOfTenancyIssueSeverity = 'low' | 'medium' | 'high'

export type IssueEvidenceLinkType = 'supports' | 'contradicts' | 'context'

export type RecommendationStatus =
  | 'draft'
  | 'pending_review'
  | 'reviewed'
  | 'accepted'
  | 'rejected'
  | 'superseded'

export type RecommendationOutcome =
  | 'no_action'
  | 'partial_claim'
  | 'full_claim'
  | 'insufficient_evidence'
  | 'refer_to_human'
  | 'no_decision'

export type RecommendationSourceType =
  | 'issue'
  | 'issue_evidence_link'
  | 'case_document'
  | 'document_extraction'
  | 'knowledge_article'
  | 'knowledge_article_chunk'
  | 'deposit_claim'

export type DepositClaimLineItemStatus =
  | 'draft'
  | 'proposed'
  | 'submitted'
  | 'agreed'
  | 'disputed'
  | 'withdrawn'
  | 'resolved'

export type DepositClaimLineItemCategory =
  | 'cleaning'
  | 'damage'
  | 'missing_item'
  | 'repair'
  | 'redecoration'
  | 'gardening'
  | 'rubbish_removal'
  | 'rent_arrears'
  | 'utilities'
  | 'fees'
  | 'other'

export type DecisionReviewActorType = 'user' | 'system' | 'ai'

export type DecisionReviewActionType =
  | 'submitted_for_review'
  | 'commented'
  | 'approved'
  | 'rejected'
  | 'edited'
  | 'sent_back'
  | 'superseded'

export const MOVE_OUT_TRACKER_STAGES = [
  'notice_received',
  'move_out_date_confirmed',
  'handover_items_in_progress',
  'checkout_review_in_progress',
  'claim_settlement_being_prepared',
  'completed',
] as const

export type MoveOutTrackerStage = (typeof MOVE_OUT_TRACKER_STAGES)[number]

export const MOVE_OUT_TRACKER_PUBLIC_STATUSES = [
  'not_started',
  'in_progress',
  'waiting',
  'blocked',
  'completed',
] as const

export type MoveOutTrackerPublicStatus = (typeof MOVE_OUT_TRACKER_PUBLIC_STATUSES)[number]

export const MOVE_OUT_CHECKLIST_ITEM_KEYS = [
  'keys',
  'parking_permits',
  'utility_readings',
  'council_tax',
  'forwarding_address',
  'checkout_evidence',
  'ai_review',
  'claim_readiness',
] as const

export type MoveOutChecklistItemKey = (typeof MOVE_OUT_CHECKLIST_ITEM_KEYS)[number]

export const MOVE_OUT_CHECKLIST_ITEM_STATUSES = [
  'not_started',
  'in_progress',
  'waiting',
  'blocked',
  'complete',
] as const

export type MoveOutChecklistItemStatus = (typeof MOVE_OUT_CHECKLIST_ITEM_STATUSES)[number]

export type MoveOutChecklistItemAudience = 'operator' | 'shared'

export const MOVE_OUT_TRACKER_EVENT_TYPES = [
  'tracker_created',
  'lifecycle_event_synced',
  'stage_changed',
  'checklist_updated',
  'evidence_attached',
  'extraction_stored',
  'issue_created',
  'issue_updated',
  'recommendation_drafted',
  'ai_draft_generated',
  'review_submitted',
  'recommendation_approved',
  'recommendation_rejected',
  'manual_review_requested',
  'line_items_created',
  'claim_ready',
  'completed',
  'other',
] as const

export type MoveOutTrackerEventType = (typeof MOVE_OUT_TRACKER_EVENT_TYPES)[number]
export type MoveOutTrackerActorType = 'system' | 'user' | 'tenant' | 'landlord' | 'ai'

export const CASE_COMMUNICATION_DIRECTIONS = ['internal', 'outbound', 'inbound'] as const
export type CaseCommunicationDirection = (typeof CASE_COMMUNICATION_DIRECTIONS)[number]

export const CASE_COMMUNICATION_CHANNELS = [
  'internal_note',
  'email',
  'portal_message',
  'sms',
  'manual_log',
] as const
export type CaseCommunicationChannel = (typeof CASE_COMMUNICATION_CHANNELS)[number]

export const CASE_COMMUNICATION_RECIPIENT_ROLES = ['tenant', 'landlord', 'internal'] as const
export type CaseCommunicationRecipientRole = (typeof CASE_COMMUNICATION_RECIPIENT_ROLES)[number]

export const CASE_COMMUNICATION_STATUSES = [
  'draft',
  'queued',
  'sent',
  'delivered',
  'failed',
  'received',
  'read',
] as const
export type CaseCommunicationStatus = (typeof CASE_COMMUNICATION_STATUSES)[number]

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type CaseRow = {
  id: string
  case_number: string | null
  summary: string | null
  case_type: string | null
  priority: string | null
  status: string | null
  contact_id: string | null
  tenancy_id: string | null
  property_id: string | null
  assigned_user_id: string | null
  is_end_of_tenancy: boolean
  last_activity_at?: string | null
  created_at: string | null
  updated_at: string | null
}

export type TenancyRow = {
  id: string
  property_id: string | null
  tenant_contact_id: string | null
  landlord_contact_id: string | null
  status: string | null
  tenancy_status: string | null
  start_date: string | null
  end_date: string | null
  deposit_amount: number | string | null
  rent_amount: number | string | null
  deposit_scheme_name?: string | null
  deposit_reference?: string | null
  updated_at: string | null
}

export type PropertyRow = {
  id: string
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  postcode: string | null
  landlord_contact_id: string | null
  property_type?: string | null
  furnishing_status?: string | null
  bedroom_count?: number | null
  bathroom_count?: number | null
  updated_at: string | null
}

export type ContactSummaryRow = {
  id: string
  full_name: string | null
}

export type UserProfileSummaryRow = {
  id: string
  full_name: string | null
}

export type DepositClaimRow = {
  id: string
  case_id: string | null
  tenancy_id: string | null
  property_id: string | null
  claim_status: string | null
  total_claim_amount: number | string | null
  tenant_agreed_amount: number | string | null
  disputed_amount: number | string | null
  scheme_reference: string | null
  evidence_notes: string | null
  submitted_at: string | null
  resolved_at: string | null
  updated_at: string | null
}

export type EndOfTenancyCaseRow = {
  id: string
  case_id: string
  tenancy_id: string
  deposit_claim_id: string | null
  workflow_status: EndOfTenancyWorkflowStatus
  inspection_status: EndOfTenancyInspectionStatus
  move_out_date: string | null
  inspection_date: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export type MoveOutTrackerRow = {
  id: string
  tenancy_id: string
  case_id: string
  end_of_tenancy_case_id: string
  property_id: string | null
  tenant_contact_id: string | null
  landlord_contact_id: string | null
  current_stage: MoveOutTrackerStage
  public_status: MoveOutTrackerPublicStatus
  next_action_title: string | null
  next_action_detail: string | null
  started_at: string
  last_event_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type MoveOutChecklistItemRow = {
  id: string
  move_out_tracker_id: string
  item_key: MoveOutChecklistItemKey
  audience: MoveOutChecklistItemAudience
  status: MoveOutChecklistItemStatus
  is_required: boolean
  notes: string | null
  completed_at: string | null
  completed_by_user_id: string | null
  source_table: string | null
  source_record_id: string | null
  created_at: string
  updated_at: string
}

export type MoveOutTrackerEventRow = {
  id: string
  move_out_tracker_id: string
  actor_user_id: string | null
  actor_type: MoveOutTrackerActorType
  source_table: string | null
  source_record_id: string | null
  event_type: MoveOutTrackerEventType
  title: string
  detail: string | null
  metadata: JsonValue
  is_portal_visible: boolean
  created_at: string
}

export type CaseCommunicationAttachment = {
  case_document_id?: string | null
  file_name?: string | null
  file_url?: string | null
  document_role?: CaseDocumentRole | null
}

export type CaseCommunicationRow = {
  id: string
  case_id: string
  end_of_tenancy_case_id: string | null
  thread_key: string
  direction: CaseCommunicationDirection
  channel: CaseCommunicationChannel
  recipient_role: CaseCommunicationRecipientRole
  sender_user_id: string | null
  sender_contact_id: string | null
  recipient_contact_id: string | null
  subject: string | null
  body: string
  attachments: JsonValue
  metadata: JsonValue
  status: CaseCommunicationStatus
  unread: boolean
  sent_at: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export type CaseCommunicationRecord = CaseCommunicationRow & {
  sender_name: string | null
  recipient_name: string | null
}

export type CaseDocumentRow = {
  id: string
  case_id: string
  tenancy_document_id: string | null
  message_attachment_id: string | null
  uploaded_by_user_id: string | null
  document_role: CaseDocumentRole
  source_type: CaseDocumentSourceType
  file_name: string | null
  file_url: string | null
  storage_path: string | null
  mime_type: string | null
  checksum: string | null
  captured_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type DocumentExtractionRow = {
  id: string
  case_document_id: string
  ai_run_id: string | null
  extraction_kind: DocumentExtractionKind
  status: DocumentExtractionStatus
  extracted_text: string | null
  extracted_data: JsonValue
  confidence: number | null
  created_at: string
  updated_at: string
}

export type CaseDocumentSummary = {
  total: number
  checkIn: number
  checkOut: number
  photos: number
  supporting: number
  invoices: number
  receipts: number
  other: number
}

export type EndOfTenancyIssueRow = {
  id: string
  end_of_tenancy_case_id: string
  identified_by_ai_run_id: string | null
  created_by_user_id: string | null
  issue_type: EndOfTenancyIssueType
  title: string
  description: string | null
  room_area: string | null
  status: EndOfTenancyIssueStatus
  responsibility: EndOfTenancyResponsibility
  severity: EndOfTenancyIssueSeverity
  proposed_amount: number | string | null
  created_at: string
  updated_at: string
}

export type IssueEvidenceLinkRow = {
  id: string
  issue_id: string
  case_document_id: string
  document_extraction_id: string | null
  link_type: IssueEvidenceLinkType
  excerpt: string | null
  page_number: number | null
  locator: JsonValue
  created_at: string
  updated_at: string
}

export type DecisionRecommendationRow = {
  id: string
  end_of_tenancy_case_id: string
  ai_run_id: string | null
  reviewed_by_user_id: string | null
  recommendation_status: RecommendationStatus
  recommended_outcome: RecommendationOutcome
  decision_summary: string | null
  rationale: string | null
  total_recommended_amount: number | string | null
  human_review_required: boolean
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type DecisionRecommendationSourceRow = {
  id: string
  decision_recommendation_id: string
  source_type: RecommendationSourceType
  issue_id: string | null
  issue_evidence_link_id: string | null
  case_document_id: string | null
  document_extraction_id: string | null
  knowledge_article_id: string | null
  knowledge_article_chunk_id: string | null
  deposit_claim_id: string | null
  source_note: string | null
  created_at: string
}

export type DepositClaimLineItemRow = {
  id: string
  deposit_claim_id: string
  end_of_tenancy_issue_id: string | null
  decision_recommendation_id: string | null
  line_item_status: DepositClaimLineItemStatus
  category: DepositClaimLineItemCategory
  description: string
  amount_claimed: number | string
  amount_agreed: number | string | null
  amount_awarded: number | string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type DecisionReviewActionRow = {
  id: string
  decision_recommendation_id: string
  actor_user_id: string | null
  ai_run_id: string | null
  actor_type: DecisionReviewActorType
  action_type: DecisionReviewActionType
  action_notes: string | null
  created_at: string
}

export type CreateEndOfTenancyCaseInput = {
  caseId: string
  tenancyId?: string | null
  depositClaimId?: string | null
  workflowStatus?: EndOfTenancyWorkflowStatus
  inspectionStatus?: EndOfTenancyInspectionStatus
  moveOutDate?: string | null
  inspectionDate?: string | null
}

export type AttachCaseDocumentInput = {
  caseId: string
  tenancyDocumentId?: string | null
  messageAttachmentId?: string | null
  uploadedByUserId?: string | null
  documentRole?: CaseDocumentRole
  sourceType?: CaseDocumentSourceType
  fileName?: string | null
  fileUrl?: string | null
  storagePath?: string | null
  mimeType?: string | null
  checksum?: string | null
  capturedAt?: string | null
  notes?: string | null
}

export type StoreDocumentExtractionInput = {
  id?: string
  caseDocumentId: string
  aiRunId?: string | null
  extractionKind?: DocumentExtractionKind
  status?: DocumentExtractionStatus
  extractedText?: string | null
  extractedData?: JsonValue
  confidence?: number | null
}

export type UpsertEndOfTenancyIssueInput = {
  id?: string
  endOfTenancyCaseId: string
  identifiedByAiRunId?: string | null
  createdByUserId?: string | null
  issueType: EndOfTenancyIssueType
  title: string
  description?: string | null
  roomArea?: string | null
  status?: EndOfTenancyIssueStatus
  responsibility?: EndOfTenancyResponsibility
  severity?: EndOfTenancyIssueSeverity
  proposedAmount?: number | null
}

export type LinkIssueEvidenceInput = {
  issueId: string
  caseDocumentId: string
  documentExtractionId?: string | null
  linkType?: IssueEvidenceLinkType
  excerpt?: string | null
  pageNumber?: number | null
  locator?: JsonValue
}

export type RecommendationSourceInput = {
  sourceType: RecommendationSourceType
  issueId?: string | null
  issueEvidenceLinkId?: string | null
  caseDocumentId?: string | null
  documentExtractionId?: string | null
  knowledgeArticleId?: string | null
  knowledgeArticleChunkId?: string | null
  depositClaimId?: string | null
  sourceNote?: string | null
}

export type CreateDecisionRecommendationInput = {
  endOfTenancyCaseId: string
  aiRunId?: string | null
  reviewedByUserId?: string | null
  recommendationStatus?: RecommendationStatus
  recommendedOutcome?: RecommendationOutcome
  decisionSummary?: string | null
  rationale?: string | null
  totalRecommendedAmount?: number | null
  humanReviewRequired?: boolean
  reviewedAt?: string | null
  sources?: RecommendationSourceInput[]
}

export type UpsertDepositClaimLineItemInput = {
  id?: string
  depositClaimId: string
  endOfTenancyIssueId?: string | null
  decisionRecommendationId?: string | null
  lineItemStatus?: DepositClaimLineItemStatus
  category: DepositClaimLineItemCategory
  description: string
  amountClaimed: number
  amountAgreed?: number | null
  amountAwarded?: number | null
  notes?: string | null
}

export type StoreDecisionReviewActionInput = {
  decisionRecommendationId: string
  actorUserId?: string | null
  aiRunId?: string | null
  actorType?: DecisionReviewActorType
  actionType: DecisionReviewActionType
  actionNotes?: string | null
}

export type CreateCaseCommunicationInput = {
  caseId: string
  endOfTenancyCaseId?: string | null
  threadKey?: string | null
  direction: CaseCommunicationDirection
  channel: CaseCommunicationChannel
  recipientRole: CaseCommunicationRecipientRole
  senderUserId?: string | null
  senderContactId?: string | null
  recipientContactId?: string | null
  subject?: string | null
  body: string
  attachments?: CaseCommunicationAttachment[]
  metadata?: JsonValue
  status?: CaseCommunicationStatus
  unread?: boolean
  sentAt?: string | null
  readAt?: string | null
}

export type UpdateMoveOutChecklistItemInput = {
  endOfTenancyCaseId: string
  itemKey: MoveOutChecklistItemKey
  status: MoveOutChecklistItemStatus
  operatorUserId: string
  notes?: string | null
  sourceTable?: string | null
  sourceRecordId?: string | null
}

export type EndOfTenancyCaseListItem = {
  endOfTenancyCase: EndOfTenancyCaseRow
  case: CaseRow | null
  tenancy: TenancyRow | null
  property: PropertyRow | null
  tenant: ContactSummaryRow | null
  landlord: ContactSummaryRow | null
  assignedOperator: UserProfileSummaryRow | null
  depositClaim: DepositClaimRow | null
  moveOutTracker: MoveOutTrackerRow | null
  documentSummary: CaseDocumentSummary
}

export type EndOfTenancyCaseDetail = EndOfTenancyCaseListItem & {
  documents: CaseDocumentRow[]
  extractions: DocumentExtractionRow[]
  issues: EndOfTenancyIssueRow[]
  evidenceLinks: IssueEvidenceLinkRow[]
  recommendations: DecisionRecommendationRow[]
  recommendationSources: DecisionRecommendationSourceRow[]
  lineItems: DepositClaimLineItemRow[]
  reviewActions: DecisionReviewActionRow[]
  moveOutChecklistItems: MoveOutChecklistItemRow[]
  moveOutTrackerEvents: MoveOutTrackerEventRow[]
  communications: CaseCommunicationRecord[]
}

export type EndOfTenancyWorkspacePayload = {
  endOfTenancyCase: EndOfTenancyCaseRow
  case: CaseRow | null
  tenancy: TenancyRow | null
  property: PropertyRow | null
  depositClaim: DepositClaimRow | null
  moveOutTracker: MoveOutTrackerRow | null
  moveOutChecklistItems: MoveOutChecklistItemRow[]
  moveOutTrackerEvents: MoveOutTrackerEventRow[]
  communications: CaseCommunicationRecord[]
  documents: Array<
    CaseDocumentRow & {
      extractions: DocumentExtractionRow[]
    }
  >
  issues: Array<
    EndOfTenancyIssueRow & {
      evidence: IssueEvidenceLinkRow[]
    }
  >
  recommendations: Array<
    DecisionRecommendationRow & {
      sources: DecisionRecommendationSourceRow[]
      reviewActions: DecisionReviewActionRow[]
    }
  >
  lineItems: DepositClaimLineItemRow[]
}
