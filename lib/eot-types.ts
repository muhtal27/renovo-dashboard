export type EotCaseStatus =
  | 'draft'
  | 'collecting_evidence'
  | 'analysis'
  | 'review'
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

export type EotCaseListItem = {
  id: string
  property: {
    id: string
    name: string
    reference: string | null
  }
  tenant_name: string
  status: EotCaseStatus
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
