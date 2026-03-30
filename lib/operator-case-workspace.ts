import 'server-only'

import { buildEotInternalAuthHeaders, getEotApiBaseUrl } from '@/lib/eot-server'
import { isCoreCaseDocumentType } from '@/lib/operator-core-documents'
import type { EotCaseWorkspace, EotDocument, EotEvidence } from '@/lib/eot-types'
import { requireOperatorTenant } from '@/lib/operator-server'
import type {
  CaseWorkspaceOverviewData,
  CaseWorkspaceParty,
  CaseWorkspaceClaimBreakdownItem,
  CaseWorkspaceIssue,
  CaseWorkspaceReportDocument,
  CaseWorkspaceReportDocumentKind,
  OperatorCaseWorkspaceData,
  SupportingCaseDocument,
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

  const numericValue = Number(value.replaceAll(',', ''))
  return Number.isFinite(numericValue) ? numericValue : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getPathValue(record: Record<string, unknown>, path: string[]) {
  let current: unknown = record

  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      return null
    }

    current = current[segment]
  }

  return current
}

function getStringFromPaths(record: Record<string, unknown>, paths: string[][]) {
  for (const path of paths) {
    const value = getPathValue(record, path)

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function getBooleanFromPaths(record: Record<string, unknown>, paths: string[][]) {
  for (const path of paths) {
    const value = getPathValue(record, path)

    if (typeof value === 'boolean') {
      return value
    }
  }

  return null
}

function getNumberFromPaths(record: Record<string, unknown>, paths: string[][]) {
  for (const path of paths) {
    const value = getPathValue(record, path)
    const numericValue = toNumber(
      typeof value === 'number' || typeof value === 'string' ? value : null
    )

    if (numericValue != null) {
      return numericValue
    }
  }

  return null
}

function parseNotesRecord(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()

  if (!trimmedValue.startsWith('{') || !trimmedValue.endsWith('}')) {
    return null
  }

  try {
    const parsedValue = JSON.parse(trimmedValue) as unknown
    return isRecord(parsedValue) ? parsedValue : null
  } catch {
    return null
  }
}

function parseCurrencyFromText(value: string | null | undefined, patterns: RegExp[]) {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  for (const pattern of patterns) {
    const match = value.match(pattern)
    const numericValue = toNumber(match?.[1] ?? null)

    if (numericValue != null) {
      return numericValue
    }
  }

  return null
}

function normalizeParty(
  value: unknown,
  index: number,
  prefix: 'tenant' | 'landlord'
): CaseWorkspaceParty | null {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return null
    }

    return {
      id: `${prefix}-${index}-${trimmedValue.toLowerCase()}`,
      fullName: trimmedValue.includes('@') ? null : trimmedValue,
      email: trimmedValue.includes('@') ? trimmedValue : null,
      phone: null,
      isLead: false,
      ownershipLabel: null,
    }
  }

  if (!isRecord(value)) {
    return null
  }

  const fullName = getStringFromPaths(value, [
    ['fullName'],
    ['full_name'],
    ['name'],
    ['displayName'],
    ['display_name'],
    ['tenantName'],
    ['tenant_name'],
    ['landlordName'],
    ['landlord_name'],
  ])
  const email = getStringFromPaths(value, [
    ['email'],
    ['emailAddress'],
    ['email_address'],
  ])
  const phone = getStringFromPaths(value, [
    ['phone'],
    ['phoneNumber'],
    ['phone_number'],
    ['mobile'],
    ['telephone'],
  ])
  const explicitOwnershipLabel = getStringFromPaths(value, [
    ['ownershipLabel'],
    ['ownership_label'],
    ['ownershipType'],
    ['ownership_type'],
    ['ownership'],
  ])
  const isJointOwnership = getBooleanFromPaths(value, [
    ['isJointOwnership'],
    ['is_joint_ownership'],
    ['jointOwnership'],
    ['joint_ownership'],
  ])
  const leadFlag = getBooleanFromPaths(value, [
      ['isLead'],
      ['is_lead'],
      ['leadTenant'],
      ['lead_tenant'],
    ])
  const role = getStringFromPaths(value, [['role'], ['type']])
  const isLead = leadFlag ?? (role === 'lead_tenant' || role === 'lead' || role === 'primary')

  if (!fullName && !email && !phone) {
    return null
  }

  return {
    id:
      getStringFromPaths(value, [['id']]) ??
      email ??
      fullName ??
      `${prefix}-${index}`,
    fullName,
    email,
    phone,
    isLead,
    ownershipLabel: explicitOwnershipLabel ?? (isJointOwnership ? 'Joint ownership' : null),
  }
}

function collectOverviewRecords(workspace: EotCaseWorkspace) {
  const records: Record<string, unknown>[] = []
  const notesRecord = parseNotesRecord(workspace.tenancy.notes)

  if (notesRecord) {
    records.push(notesRecord)
  }

  for (const source of [...workspace.documents, ...workspace.evidence]) {
    if (!isRecord(source.metadata)) {
      continue
    }

    records.push(source.metadata)

    for (const key of ['overview', 'case_overview', 'tenancy_overview', 'tenancy', 'contacts', 'parties']) {
      const nestedValue = source.metadata[key]

      if (isRecord(nestedValue)) {
        records.push(nestedValue)
      }
    }
  }

  return records
}

function getOverviewParties(
  records: Record<string, unknown>[],
  keyPaths: string[][],
  prefix: 'tenant' | 'landlord'
) {
  for (const record of records) {
    for (const path of keyPaths) {
      const rawValue = getPathValue(record, path)

      if (!Array.isArray(rawValue)) {
        continue
      }

      const parties = rawValue
        .map((value, index) => normalizeParty(value, index, prefix))
        .filter((value): value is CaseWorkspaceParty => value !== null)

      if (parties.length > 0) {
        return parties
      }
    }
  }

  return []
}

function applyLeadTenantMarkers(
  tenants: CaseWorkspaceParty[],
  records: Record<string, unknown>[]
) {
  if (tenants.some((tenant) => tenant.isLead)) {
    return tenants
  }

  const leadTenantId = records
    .map((record) =>
      getStringFromPaths(record, [['leadTenantId'], ['lead_tenant_id']])
    )
    .find(Boolean)
  const leadTenantEmail = records
    .map((record) =>
      getStringFromPaths(record, [['leadTenantEmail'], ['lead_tenant_email']])
    )
    .find(Boolean)
  const leadTenantName = records
    .map((record) =>
      getStringFromPaths(record, [['leadTenantName'], ['lead_tenant_name']])
    )
    .find(Boolean)

  return tenants.map((tenant) => {
    const isLead =
      tenant.id === leadTenantId ||
      (leadTenantEmail != null && tenant.email === leadTenantEmail) ||
      (leadTenantName != null && tenant.fullName === leadTenantName)

    return isLead ? { ...tenant, isLead: true } : tenant
  })
}

function buildWorkspaceOverview(workspace: EotCaseWorkspace): CaseWorkspaceOverviewData {
  const overviewRecords = collectOverviewRecords(workspace)
  const notesText = workspace.tenancy.notes
  const monthlyRent =
    overviewRecords
      .map((record) =>
        getNumberFromPaths(record, [
          ['monthlyRent'],
          ['monthly_rent'],
          ['rentPcm'],
          ['rent_pcm'],
          ['financials', 'monthlyRent'],
          ['financials', 'monthly_rent'],
          ['tenancy', 'monthlyRent'],
          ['tenancy', 'monthly_rent'],
        ])
      )
      .find((value) => value != null) ??
    parseCurrencyFromText(notesText, [
      /monthly rent(?: pcm)?[:\s-]*£?\s*([\d,.]+)/i,
      /rent pcm[:\s-]*£?\s*([\d,.]+)/i,
    ])
  const rentArrears =
    overviewRecords
      .map((record) =>
        getNumberFromPaths(record, [
          ['rentArrears'],
          ['rent_arrears'],
          ['arrears'],
          ['arrearsBalance'],
          ['arrears_balance'],
          ['financials', 'rentArrears'],
          ['financials', 'rent_arrears'],
          ['tenancy', 'rentArrears'],
          ['tenancy', 'rent_arrears'],
        ])
      )
      .find((value) => value != null) ??
    parseCurrencyFromText(notesText, [
      /rent arrears(?: balance)?[:\s-]*£?\s*([\d,.]+)/i,
      /arrears(?: balance)?[:\s-]*£?\s*([\d,.]+)/i,
    ])

  const tenants = applyLeadTenantMarkers(
    getOverviewParties(
      overviewRecords,
      [
        ['tenants'],
        ['tenantContacts'],
        ['tenant_contacts'],
        ['contacts', 'tenants'],
        ['parties', 'tenants'],
      ],
      'tenant'
    ),
    overviewRecords
  )
  const landlords = getOverviewParties(
    overviewRecords,
    [
      ['landlords'],
      ['landlordContacts'],
      ['landlord_contacts'],
      ['owners'],
      ['contacts', 'landlords'],
      ['parties', 'landlords'],
      ['parties', 'owners'],
    ],
    'landlord'
  )

  return {
    monthlyRent,
    rentArrears,
    tenants:
      tenants.length > 0
        ? tenants
        : [
            {
              id: workspace.tenancy.id,
              fullName: workspace.tenancy.tenant_name,
              email: workspace.tenancy.tenant_email,
              phone: null,
              isLead: false,
              ownershipLabel: null,
            },
          ],
    landlords,
  }
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

function getDisputedAmount(workspace: EotCaseWorkspace) {
  return workspace.issues.reduce((sum, issue) => {
    if (issue.status !== 'disputed') {
      return sum
    }

    if (!issue.recommendation || issue.recommendation.decision === 'no_charge') {
      return sum
    }

    return sum + (toNumber(issue.recommendation.estimated_cost) ?? 0)
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

function normalizeSupportingDocuments(documents: EotDocument[]): SupportingCaseDocument[] {
  return documents
    .filter((document) => !isCoreCaseDocumentType(document.document_type))
    .map((document) => {
      const metadata = document.metadata
      const label =
        typeof metadata?.label === 'string' && metadata.label.trim()
          ? metadata.label.trim()
          : document.name

      return {
        ...document,
        label,
        canManage: metadata?.source === 'operator_supporting_document',
        contentType:
          typeof metadata?.content_type === 'string' && metadata.content_type.trim()
            ? metadata.content_type.trim()
            : null,
      } satisfies SupportingCaseDocument
    })
    .sort((left, right) => {
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
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
  const disputedAmount = getDisputedAmount(workspace)
  const returnToLandlord = proposedDeductions
  const remainingDeposit =
    depositAmount == null ? null : Math.max(0, Number((depositAmount - proposedDeductions).toFixed(2)))
  const claimBreakdown = normalizeClaimBreakdown(workspace.claim)
  const supportingDocuments = normalizeSupportingDocuments(workspace.documents)

  return {
    case: workspace.case,
    tenancy: workspace.tenancy,
    tenant: {
      id: workspace.tenancy.id,
      name: workspace.tenancy.tenant_name,
      email: workspace.tenancy.tenant_email,
    },
    overview: buildWorkspaceOverview(workspace),
    property: workspace.property,
    documents: workspace.documents,
    supportingDocuments,
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
      totalClaimed: proposedDeductions,
      proposedDeductions,
      returnToLandlord,
      disputedAmount,
      remainingDeposit,
      returnToTenant: remainingDeposit,
    },
  }
}
