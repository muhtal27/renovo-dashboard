import 'server-only'

import { buildEotInternalAuthHeaders, getEotApiBaseUrl } from '@/lib/eot-server'
import type { EotCaseWorkspace, EotDocument, EotEvidence } from '@/lib/eot-types'
import { requireOperatorTenant } from '@/lib/operator-server'
import type {
  CaseWorkspaceClaimBreakdownItem,
  CaseWorkspaceIssue,
  CaseWorkspaceReportDocument,
  CaseWorkspaceReportDocumentKind,
  OperatorCaseWorkspaceData,
} from '@/lib/operator-case-workspace-types'

class OperatorCaseWorkspaceError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'OperatorCaseWorkspaceError'
    this.status = status
  }
}

function buildBackendUrl(pathname: string) {
  return new URL(pathname, getEotApiBaseUrl())
}

function getTextCandidate(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function matchesReportKind(candidate: string, kind: CaseWorkspaceReportDocumentKind) {
  if (!candidate) return false

  if (kind === 'check_in') {
    return (
      candidate.includes('check in') ||
      candidate.includes('check-in') ||
      candidate.includes('inventory') ||
      candidate.includes('move in') ||
      candidate.includes('move-in')
    )
  }

  if (kind === 'tenancy_agreement') {
    return (
      candidate.includes('tenancy agreement') ||
      candidate.includes('lease agreement') ||
      candidate.includes('rental agreement') ||
      candidate.includes('occupation contract') ||
      candidate.includes('agreement')
    )
  }

  return (
    candidate.includes('check out') ||
    candidate.includes('check-out') ||
    candidate.includes('checkout') ||
    candidate.includes('move out') ||
    candidate.includes('move-out')
  )
}

function buildDocumentSearchValues(
  name: string,
  type: string,
  fileUrl: string,
  metadata: Record<string, unknown> | null | undefined
) {
  return [
    name,
    type,
    fileUrl,
    getTextCandidate(metadata?.label),
    getTextCandidate(metadata?.source),
    getTextCandidate(metadata?.uploaded_from),
  ]
}

function pickReportDocumentFromDocuments(
  documents: EotDocument[],
  kind: CaseWorkspaceReportDocumentKind
) {
  for (const document of documents) {
    const candidates = buildDocumentSearchValues(
      document.name,
      document.document_type,
      document.file_url,
      document.metadata
    )

    if (candidates.some((candidate) => matchesReportKind(candidate, kind))) {
      return {
        id: document.id,
        kind,
        source: 'document',
        fileName: document.name,
        documentType: document.document_type,
        createdAt: document.created_at,
        fileUrl: document.file_url,
      } satisfies CaseWorkspaceReportDocument
    }
  }

  return null
}

function pickReportDocumentFromEvidence(
  evidence: EotEvidence[],
  kind: CaseWorkspaceReportDocumentKind
) {
  for (const item of evidence) {
    const label =
      typeof item.metadata?.label === 'string' && item.metadata.label.trim()
        ? item.metadata.label.trim()
        : item.area?.trim() || `${item.type} evidence`
    const candidates = buildDocumentSearchValues(label, item.type, item.file_url, item.metadata)

    if (candidates.some((candidate) => matchesReportKind(candidate, kind))) {
      return {
        id: item.id,
        kind,
        source: 'evidence',
        fileName: label,
        documentType: item.type,
        createdAt: item.created_at,
        fileUrl: item.file_url,
      } satisfies CaseWorkspaceReportDocument
    }
  }

  return null
}

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function getProposedDeductions(workspace: EotCaseWorkspace) {
  const claimTotal = toNumber(workspace.claim?.total_amount)

  if (claimTotal != null) {
    return claimTotal
  }

  return workspace.recommendations.reduce((sum, recommendation) => {
    if (!recommendation.decision || recommendation.decision === 'no_charge') {
      return sum
    }

    return sum + (toNumber(recommendation.estimated_cost) ?? 0)
  }, 0)
}

function normalizeIssue(issue: EotCaseWorkspace['issues'][number]): CaseWorkspaceIssue {
  const areas = Array.from(
    new Set(
      issue.linked_evidence
        .map((item) => item.area?.trim())
        .filter((value): value is string => Boolean(value))
    )
  )

  return {
    ...issue,
    area: areas.length ? areas.join(', ') : null,
  }
}

function normalizeClaimBreakdown(
  claim: EotCaseWorkspace['claim']
): CaseWorkspaceClaimBreakdownItem[] {
  if (!claim?.breakdown.length) {
    return []
  }

  return claim.breakdown.map((item, index) => {
    const title =
      typeof item.title === 'string' && item.title.trim()
        ? item.title.trim()
        : `Claim item ${index + 1}`

    return {
      id:
        typeof item.issue_id === 'string' && item.issue_id.trim()
          ? item.issue_id.trim()
          : `${claim.id}-${index}`,
      title,
      decision: typeof item.decision === 'string' ? item.decision : null,
      estimatedCost:
        typeof item.estimated_cost === 'string'
          ? item.estimated_cost
          : typeof item.amount === 'string'
            ? item.amount
            : null,
    }
  })
}

async function fetchWorkspace(caseId: string) {
  const context = await requireOperatorTenant(`/operator/cases/${caseId}`)
  const response = await fetch(buildBackendUrl(`/api/eot/cases/${caseId}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildEotInternalAuthHeaders({
        userId: context.user.id,
        tenantId: context.tenantId,
        role: context.role,
        membershipId: context.membershipId,
        membershipStatus: context.membershipStatus,
      }),
    },
    cache: 'no-store',
  })

  const text = await response.text()
  let payload: unknown = null

  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string'
        ? payload.detail
        : `Request failed with status ${response.status}.`

    throw new OperatorCaseWorkspaceError(detail, response.status)
  }

  return payload as EotCaseWorkspace
}

export function isOperatorCaseWorkspaceNotFoundError(error: unknown) {
  return error instanceof OperatorCaseWorkspaceError && error.status === 404
}

export async function getEotCaseWorkspace(caseId: string): Promise<OperatorCaseWorkspaceData> {
  const workspace = await fetchWorkspace(caseId)
  const issues = workspace.issues.map(normalizeIssue)
  const depositAmount = toNumber(workspace.tenancy.deposit_amount)
  const proposedDeductions = getProposedDeductions(workspace)
  const remainingDeposit =
    depositAmount == null ? null : Math.max(0, Number((depositAmount - proposedDeductions).toFixed(2)))
  const claimBreakdown = normalizeClaimBreakdown(workspace.claim)

  return {
    case: workspace.case,
    tenancy: workspace.tenancy,
    tenant: {
      id: workspace.tenancy.id,
      name: workspace.tenancy.tenant_name,
      email: workspace.tenancy.tenant_email,
    },
    property: workspace.property,
    documents: workspace.documents,
    evidence: workspace.evidence,
    issues,
    recommendations: workspace.recommendations,
    claim: workspace.claim,
    messages: workspace.messages,
    reportDocuments: {
      checkIn:
        pickReportDocumentFromDocuments(workspace.documents, 'check_in') ??
        pickReportDocumentFromEvidence(workspace.evidence, 'check_in'),
      checkOut:
        pickReportDocumentFromDocuments(workspace.documents, 'check_out') ??
        pickReportDocumentFromEvidence(workspace.evidence, 'check_out'),
      tenancyAgreement:
        pickReportDocumentFromDocuments(workspace.documents, 'tenancy_agreement') ??
        pickReportDocumentFromEvidence(workspace.evidence, 'tenancy_agreement'),
    },
    claimBreakdown,
    totals: {
      depositAmount,
      proposedDeductions,
      remainingDeposit,
      returnToTenant: remainingDeposit,
    },
  }
}
