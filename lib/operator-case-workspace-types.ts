import type {
  EotCase,
  EotClaim,
  EotDocument,
  EotEvidence,
  EotIssue,
  EotMessage,
  EotProperty,
  EotRecommendation,
  EotTenancy,
} from '@/lib/eot-types'

export type CaseWorkspaceTenant = {
  id: string
  name: string
  email: string | null
}

export type CaseWorkspaceIssue = EotIssue & {
  area: string | null
}

export type CaseWorkspaceReportDocumentKind = 'check_in' | 'check_out' | 'tenancy_agreement'

export type CaseWorkspaceReportDocument = {
  id: string
  kind: CaseWorkspaceReportDocumentKind
  source: 'document' | 'evidence'
  fileName: string
  documentType: string
  createdAt: string
  fileUrl: string
}

export type CaseWorkspaceClaimBreakdownItem = {
  id: string
  title: string
  decision: string | null
  estimatedCost: string | null
}

export type CaseWorkspaceTotals = {
  depositAmount: number | null
  proposedDeductions: number
  remainingDeposit: number | null
  returnToTenant: number | null
}

export type OperatorCaseWorkspaceData = {
  case: EotCase
  tenancy: EotTenancy
  tenant: CaseWorkspaceTenant
  property: EotProperty
  documents: EotDocument[]
  evidence: EotEvidence[]
  issues: CaseWorkspaceIssue[]
  recommendations: EotRecommendation[]
  claim: EotClaim | null
  messages: EotMessage[]
  reportDocuments: {
    checkIn: CaseWorkspaceReportDocument | null
    checkOut: CaseWorkspaceReportDocument | null
    tenancyAgreement: CaseWorkspaceReportDocument | null
  }
  claimBreakdown: CaseWorkspaceClaimBreakdownItem[]
  totals: CaseWorkspaceTotals
}
