import type { EndOfTenancyWorkspacePayload } from '@/lib/end-of-tenancy/types'

export type WorkspaceContact = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
}

export type ComplianceRecordRow = {
  id: string
  property_id: string
  record_type: string
  status: string
  issue_date: string | null
  expiry_date: string | null
  reference_number: string | null
  document_url: string | null
  updated_at: string | null
}

export type AiRunRow = {
  id: string
  confidence: number | null
}

export type WorkspaceEnvelope = {
  workspace: EndOfTenancyWorkspacePayload
  tenant: WorkspaceContact | null
  landlord: WorkspaceContact | null
  complianceRecords: ComplianceRecordRow[]
  actorNames: Record<string, string>
  latestRecommendationConfidence: number | null
}

export type WorkspaceSectionKey =
  | 'overview'
  | 'evidence'
  | 'issues'
  | 'recommendation'
  | 'claim'
  | 'communication'
  | 'activity'

export type WorkspaceSectionStatus = 'green' | 'amber' | 'red' | 'gray'
