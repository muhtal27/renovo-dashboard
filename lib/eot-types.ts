export type EotCaseStatus =
  | 'draft'
  | 'collecting_evidence'
  | 'analysis'
  | 'review'
  | 'draft_sent'
  | 'ready_for_claim'
  | 'submitted'
  | 'disputed'
  | 'resolved'

export type EotCasePriority = 'low' | 'medium' | 'high'
export type EotEvidenceType = 'image' | 'video' | 'document'
export type EotIssueSeverity = 'low' | 'medium' | 'high'
export type EotIssueStatus = 'open' | 'resolved' | 'disputed'
export type EotRecommendationDecision = 'charge' | 'no_charge' | 'partial'
export type EotMessageSenderType = 'manager' | 'landlord' | 'tenant'

// ── Workspace step / workflow types ─────────────────────────────

// Prototype ref: private-content/demo.html:2323 — 7-step workflow
// inventory → checkout → readings → analysis → deductions → negotiation → refund.
// Human QA of AI-suggested defects ("review" in demo's case-status pipeline)
// is folded into the analysis step per demo.html's "Analysis & Review" pattern.
export type WorkspaceStep =
  | 'inventory'
  | 'checkout'
  | 'readings'
  | 'analysis'
  | 'deductions'
  | 'negotiation'
  | 'refund'

export type WorkspaceStepDef = {
  key: WorkspaceStep
  label: string
  shortLabel: string
}

export const WORKSPACE_STEPS: WorkspaceStepDef[] = [
  { key: 'inventory', label: 'Inventory', shortLabel: 'Inv' },
  { key: 'checkout', label: 'Checkout', shortLabel: 'Chk' },
  { key: 'readings', label: 'Readings', shortLabel: 'Read' },
  { key: 'analysis', label: 'Analysis', shortLabel: 'AI' },
  { key: 'deductions', label: 'Deductions', shortLabel: 'Ded' },
  { key: 'negotiation', label: 'Negotiation', shortLabel: 'Neg' },
  { key: 'refund', label: 'Refund', shortLabel: 'Ref' },
]

export type EotWorkflowStatus = {
  id: string
  case_id: string
  active_step: WorkspaceStep
  completed_steps: WorkspaceStep[]
  updated_by: string | null
  updated_at: string
}

// ── Liability ───────────────────────────────────────────────────

export type EotLiability = 'tenant' | 'shared' | 'landlord'

// ── Defect (checkout_defects mapped to frontend) ────────────────

export type EotDefect = {
  id: string
  case_id: string
  room_id: string
  room_name: string
  title: string
  description: string
  defect_type: 'damage' | 'cleaning' | 'maintenance'
  severity: EotIssueSeverity
  checkin_condition: string | null
  checkout_condition: string | null
  ai_liability: EotLiability | null
  operator_liability: EotLiability | null
  estimated_cost: number | null
  adjusted_cost: number | null
  excluded: boolean
  reviewed: boolean
  reviewed_at: string | null
  reviewed_by: string | null
  ai_confidence: number | null
  ai_reasoning: string | null
  expected_lifespan: number | null
  age_at_checkout: number | null
  evidence_quality: 'good' | 'fair' | 'poor' | null
  created_at: string
  updated_at: string
}

// ── AI recommendation (first-class stored record) ───────────────

export type EotAIRecommendation = {
  id: string
  case_id: string
  defect_id: string | null
  issue_id: string | null
  recommendation_type: 'liability' | 'charge' | 'no_charge' | 'partial'
  confidence: number
  reasoning: string
  model_id: string
  model_version: string
  generated_at: string
  operator_override: EotLiability | null
  operator_override_reason: string | null
  operator_override_at: string | null
  operator_override_by: string | null
  final_outcome: EotLiability | null
  final_outcome_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// ── Negotiation ─────────────────────────────────────────────────

export type EotNegotiationStatus = 'pending' | 'disputed' | 'agreed'

export type EotNegotiationItem = {
  id: string
  case_id: string
  description: string
  proposed_amount: number
  responded_amount: number | null
  status: EotNegotiationStatus
  tenant_comment: string | null
  created_at: string
  updated_at: string
}

export type EotNegotiationMessage = {
  id: string
  case_id: string
  sender_role: 'operator' | 'tenant' | 'landlord'
  sender_name: string
  content: string
  sent_at: string
}

// ── Draft (editable letter sections) ────────────────────────────

export type EotDraftSection = {
  id: string
  case_id: string
  section_key: string
  title: string
  content: string
  sort_order: number
  updated_at: string
}

// ── Utility readings / keys ─────────────────────────────────────

export type EotUtilityReading = {
  id: string
  case_id: string
  utility_type: string
  reading_checkin: string | null
  reading_checkout: string | null
  usage: string | null
  unit: string
  meter_location: string | null
}

export type EotKeySet = {
  id: string
  case_id: string
  set_name: string
  key_count: number
  status: 'returned' | 'outstanding'
  notes: string | null
}

// ── Inventory documents ─────────────────────────────────────────

export type EotInventoryDocumentStatus = 'uploaded' | 'pending' | 'missing'
export type EotInventoryDocumentType = 'checkin' | 'checkout' | 'schedule' | 'supporting'

export type EotInventoryDocument = {
  id: string
  case_id: string
  name: string
  document_type: EotInventoryDocumentType
  status: EotInventoryDocumentStatus
  file_url: string | null
  uploaded_at: string | null
  page_count: number | null
}

// ── Evidence photos (persisted to Supabase Storage) ─────────────

export type EotEvidencePhoto = {
  id: string
  case_id: string
  name: string
  room: string | null
  file_url: string
  thumbnail_url: string | null
  type: EotEvidenceType
  uploaded_by: string | null
  created_at: string
}

// ── Audit event logging ─────────────────────────────────────────

export type EotAuditEventType =
  | 'evidence_uploaded'
  | 'evidence_deleted'
  | 'defect_liability_changed'
  | 'defect_cost_adjusted'
  | 'defect_excluded'
  | 'defect_reviewed'
  | 'workflow_step_changed'
  | 'draft_section_saved'
  | 'negotiation_message_sent'
  | 'refund_submitted'
  | 'document_uploaded'
  | 'document_deleted'
  | 'ai_recommendation_generated'
  | 'ai_recommendation_overridden'

export type EotAuditEvent = {
  case_id: string
  event_type: EotAuditEventType
  description: string
  performed_by: string | null
  metadata?: Record<string, unknown>
}

// ── Refund calculation ──────────────────────────────────────────

export type EotRefundSummary = {
  deposit_held: number
  agreed_deductions: number
  disputed_deductions: number
  refund_to_tenant: number
  line_items: Array<{
    description: string
    amount: number
    status: EotNegotiationStatus
  }>
}

export type EotTenancyListItem = {
  id: string
  property: {
    id: string
    name: string
    reference: string | null
    address_line_1: string | null
    address_line_2: string | null
    city: string | null
    postcode: string | null
  }
  tenant_name: string
  tenant_email: string | null
  landlord_name: string | null
  start_date: string | null
  end_date: string | null
  deposit_amount: string | null
  deposit_scheme: string | null
  case_id: string | null
  case_status: EotCaseStatus | null
  created_at: string
  updated_at: string
}

export type EotCaseListItem = {
  id: string
  property: {
    id: string
    name: string
    reference: string | null
    address_line_1: string | null
    address_line_2: string | null
    city: string | null
    postcode: string | null
  }
  tenant_name: string
  landlord_name: string | null
  deposit_amount: string | null
  deposit_scheme: string | null
  status: EotCaseStatus
  assigned_to: string | null
  priority: EotCasePriority
  issue_count: number
  evidence_count: number
  last_activity_at: string
}

export type EotProperty = {
  id: string
  name: string
  reference: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  postcode: string | null
  country_code: string | null
}

export type EotTenancy = {
  id: string
  property_id: string
  tenant_name: string
  tenant_email: string | null
  start_date: string | null
  end_date: string | null
  deposit_amount: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type EotCase = {
  id: string
  tenancy_id: string
  summary: string | null
  status: EotCaseStatus
  assigned_to: string | null
  priority: EotCasePriority
  last_activity_at: string
  created_at: string
  updated_at: string
}

export type EotEvidence = {
  id: string
  case_id: string
  file_url: string
  type: EotEvidenceType
  area: string | null
  uploaded_by: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export type EotRecommendation = {
  id: string
  issue_id: string
  decision: EotRecommendationDecision | null
  rationale: string | null
  estimated_cost: string | null
  created_at: string
  updated_at: string
}

export type EotIssue = {
  id: string
  case_id: string
  title: string
  description: string | null
  severity: EotIssueSeverity
  status: EotIssueStatus
  linked_evidence: EotEvidence[]
  recommendation: EotRecommendation | null
  created_at: string
  updated_at: string
}

export type EotClaim = {
  id: string
  case_id: string
  total_amount: string
  breakdown: Array<Record<string, unknown>>
  generated_at: string
  updated_at: string
  scheme_provider: string | null
  scheme_reference: string | null
  scheme_status: string | null
  submitted_at: string | null
  outcome: Record<string, unknown> | null
  outcome_received_at: string | null
  adjudicator_notes: string | null
}

export type EotMessage = {
  id: string
  case_id: string
  sender_type: EotMessageSenderType
  sender_id: string
  content: string
  attachments: Array<Record<string, unknown>>
  created_at: string
}

export type EotDocument = {
  id: string
  case_id: string
  name: string
  document_type: string
  file_url: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type EotCaseWorkspace = {
  case: EotCase
  tenancy: EotTenancy
  property: EotProperty
  evidence: EotEvidence[]
  issues: EotIssue[]
  recommendations: EotRecommendation[]
  claim: EotClaim | null
  messages: EotMessage[]
  documents: EotDocument[]
}

export type EotClaimSummary = {
  id: string
  case_id: string
  total_amount: string
  generated_at: string
  updated_at: string
}

export type EotCaseWorkspaceMetrics = {
  evidence_count: number
  issue_count: number
  open_issue_count: number
  resolved_issue_count: number
  high_severity_open_issue_count: number
  recommendation_count: number
  message_count: number
  document_count: number
}

export type EotCaseWorkspaceSummary = {
  case: EotCase
  tenancy: EotTenancy
  property: EotProperty
  metrics: EotCaseWorkspaceMetrics
  claim: EotClaimSummary | null
}

export type EotSectionPage<T> = {
  items: T[]
  next_offset: number | null
  has_more: boolean
}

export type EotCaseTimelineItem = {
  id: string
  timestamp: string
  title: string
  detail: string
  meta: string
  tone: string
}

export type EotCaseSubmission = {
  claim: EotClaim | null
  issues: EotIssue[]
}

export type EotReportSummaryStats = {
  total_cases: number
  active_cases: number
  ready_for_claim: number
  disputed: number
  total_evidence: number
  average_evidence_per_case: number
  total_issues: number
  resolved_issues: number
  claim_amount: string
  recommendation_count: number
  generated_claim_count: number
}

export type EotReportPerformanceRow = {
  case_id: string
  property_name: string
  tenant_name: string
  status: EotCaseStatus
  priority: EotCasePriority
  evidence_count: number
  issue_count: number
  claim_total_amount: string | null
  last_activity_at: string
}

export type EotReportSummary = {
  stats: EotReportSummaryStats
  status_breakdown: Record<string, number>
  issue_severity_breakdown: Record<string, number>
  performance_rows: EotReportPerformanceRow[]
}

export type CreateEotCaseInput = {
  property_id: string
  summary: string | null
  status: EotCaseStatus
  assigned_to: string | null
  priority: EotCasePriority
  tenancy: {
    tenant_name: string
    tenant_email: string | null
    start_date: string | null
    end_date: string | null
    deposit_amount: string | null
    notes: string | null
  }
}

export type CreateEotEvidenceInput = {
  case_id: string
  file_url: string
  type: EotEvidenceType
  area: string | null
  uploaded_by: string
  metadata: Record<string, unknown> | null
}

export type UpsertEotIssueInput = {
  case_id: string
  issue_id?: string
  title?: string
  description?: string | null
  severity?: EotIssueSeverity
  status?: EotIssueStatus
  evidence_ids?: string[]
  recommendation?: {
    decision: EotRecommendationDecision | null
    rationale: string | null
    estimated_cost: string | null
  } | null
}

export type CreateEotMessageInput = {
  case_id: string
  sender_type: EotMessageSenderType
  sender_id: string
  content: string
  attachments: Array<Record<string, unknown>>
}

// ── Deposit scheme types ─────────────────────────────────────────

export type EotClaimSubmissionResult = {
  case_id: string
  claim_id: string
  scheme_provider: string | null
  scheme_reference: string | null
  scheme_status: string | null
  submitted_at: string | null
}

export type EotClaimStatusResult = {
  scheme_provider: string | null
  scheme_reference: string | null
  scheme_status: string | null
  outcome: Record<string, unknown> | null
  outcome_received_at: string | null
  adjudicator_notes: string | null
  submitted_at: string | null
}

export type EotEvidenceFileInput = {
  name: string
  document_type: string
  url: string
  mime_type: string | null
}

// ── Analytics dashboard types ────────────────────────────────────

export type EotCaseThroughputWeek = {
  week_start: string
  created: number
  resolved: number
}

export type EotResolutionTimeByStage = {
  stage: string
  avg_days: number
  case_count: number
}

export type EotResolutionTimeSummary = {
  overall_avg_days: number
  previous_period_avg_days: number | null
  by_stage: EotResolutionTimeByStage[]
}

export type EotClaimRecoveryMetrics = {
  total_claimed: string
  total_recovered: string
  success_rate: number
  cases_with_claims: number
  avg_claim_per_case: string
}

export type EotTeamMemberWorkload = {
  user_id: string
  display_name: string
  total_cases: number
  resolved_cases: number
  avg_resolution_days: number | null
}

export type EotIntegrationConnectionHealth = {
  connection_id: string
  provider: string
  display_name: string | null
  status: string
  health_status: string
  consecutive_failures: number
  last_synced_at: string | null
  sync_success_rate: number
  dead_letter_count: number
}

export type EotIntegrationHealthSummary = {
  connections: EotIntegrationConnectionHealth[]
  total_dead_letters: number
}

export type EotAnalyticsDashboard = {
  period_days: number
  throughput: EotCaseThroughputWeek[]
  resolution_time: EotResolutionTimeSummary
  claim_recovery: EotClaimRecoveryMetrics
  team_workload: EotTeamMemberWorkload[]
  integration_health: EotIntegrationHealthSummary
}

// ── Workspace mutation inputs ───────────────────────────────────

export type UpdateDefectInput = {
  defect_id: string
  operator_liability?: EotLiability | null
  adjusted_cost?: number | null
  excluded?: boolean
  reviewed?: boolean
}

export type UpdateWorkflowInput = {
  case_id: string
  active_step: WorkspaceStep
  completed_steps: WorkspaceStep[]
}

export type SaveNegotiationMessageInput = {
  case_id: string
  sender_role: 'operator' | 'tenant' | 'landlord'
  sender_name: string
  content: string
}

export type SaveDraftSectionInput = {
  case_id: string
  section_key: string
  title: string
  content: string
  sort_order: number
}

// ── Composite workspace data for step panels ────────────────────

export type EotWorkspaceStepData = {
  defects: EotDefect[]
  workflow: EotWorkflowStatus | null
  utilities: EotUtilityReading[]
  keys: EotKeySet[]
  negotiation_items: EotNegotiationItem[]
  negotiation_messages: EotNegotiationMessage[]
  draft_sections: EotDraftSection[]
  refund: EotRefundSummary | null
  ai_recommendations: EotAIRecommendation[]
  inventory_documents: EotInventoryDocument[]
  evidence_photos: EotEvidencePhoto[]
}
