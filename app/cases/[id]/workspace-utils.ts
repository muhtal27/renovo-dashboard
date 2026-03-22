import type {
  CaseDocumentRole,
  DecisionRecommendationRow,
  DepositClaimRow,
  EndOfTenancyIssueRow,
} from '@/lib/end-of-tenancy/types'
import type { WorkspaceContact, WorkspaceSectionStatus } from '@/app/cases/[id]/workspace-types'

export function formatLabel(value: string | null | undefined) {
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ')
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set'

  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not set'

  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return 'No recent activity'

  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return formatDate(value)
}

export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatMoney(value: number | string | null | undefined) {
  const amount = toNumber(value)
  if (amount === null) return 'Not set'
  return amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
}

export function buildAddress(property: {
  address_line_1: string | null
  address_line_2?: string | null
  city?: string | null
  postcode?: string | null
} | null) {
  if (!property) return 'Unknown property'
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

export function getContactName(contact: WorkspaceContact | null) {
  if (!contact) return 'Unknown'
  return (
    contact.full_name?.trim() ||
    contact.company_name?.trim() ||
    contact.email?.trim() ||
    contact.phone?.trim() ||
    'Unknown'
  )
}

export function getWorkflowTone(status: string | null) {
  switch (status) {
    case 'recommendation_approved':
    case 'ready_for_claim':
    case 'closed':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'review_pending':
    case 'evidence_ready':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'recommendation_drafted':
      return 'border border-violet-200 bg-violet-50 text-violet-800'
    case 'needs_manual_review':
      return 'border border-red-200 bg-red-50 text-red-800'
    case 'evidence_pending':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    default:
      return 'border border-stone-200 bg-stone-50 text-stone-700'
  }
}

export function getInspectionTone(status: string | null) {
  switch (status) {
    case 'completed':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'scheduled':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'waived':
      return 'border border-stone-200 bg-stone-100 text-stone-700'
    default:
      return 'border border-amber-200 bg-amber-50 text-amber-800'
  }
}

export function getDocumentRoleTone(role: CaseDocumentRole | null) {
  switch (role) {
    case 'check_in':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'check_out':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    case 'photo':
      return 'border border-violet-200 bg-violet-50 text-violet-800'
    case 'tenancy_agreement':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    default:
      return 'border border-stone-200 bg-stone-100 text-stone-700'
  }
}

export function getExtractionTone(status: string | null) {
  switch (status) {
    case 'completed':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'processing':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'failed':
      return 'border border-red-200 bg-red-50 text-red-800'
    default:
      return 'border border-amber-200 bg-amber-50 text-amber-800'
  }
}

export function getResponsibilityTone(value: EndOfTenancyIssueRow['responsibility'] | null) {
  switch (value) {
    case 'tenant':
      return 'border border-red-200 bg-red-50 text-red-800'
    case 'landlord':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'shared':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    default:
      return 'border border-stone-200 bg-stone-100 text-stone-700'
  }
}

export function getSeverityTone(value: EndOfTenancyIssueRow['severity'] | null) {
  switch (value) {
    case 'high':
      return 'border border-red-200 bg-red-50 text-red-800'
    case 'medium':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    default:
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
  }
}

export function getIssueStatusTone(value: EndOfTenancyIssueRow['status'] | null) {
  switch (value) {
    case 'accepted':
    case 'resolved':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'under_review':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    case 'rejected':
      return 'border border-red-200 bg-red-50 text-red-800'
    default:
      return 'border border-stone-200 bg-stone-100 text-stone-700'
  }
}

export function getRecommendationTone(status: DecisionRecommendationRow['recommendation_status'] | null) {
  switch (status) {
    case 'accepted':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-900'
    case 'pending_review':
    case 'reviewed':
      return 'border border-sky-200 bg-sky-50 text-sky-900'
    case 'rejected':
      return 'border border-red-200 bg-red-50 text-red-900'
    default:
      return 'border border-amber-200 bg-amber-50 text-amber-900'
  }
}

export function getOutcomeTone(outcome: DecisionRecommendationRow['recommended_outcome'] | null) {
  switch (outcome) {
    case 'full_claim':
      return 'text-red-700'
    case 'partial_claim':
      return 'text-amber-700'
    case 'no_action':
      return 'text-emerald-700'
    default:
      return 'text-stone-700'
  }
}

export function getClaimStatusTone(status: DepositClaimRow['claim_status'] | null) {
  switch (status) {
    case 'resolved':
    case 'submitted':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'draft':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    case 'disputed':
      return 'border border-red-200 bg-red-50 text-red-800'
    default:
      return 'border border-stone-200 bg-stone-100 text-stone-700'
  }
}

export function getComplianceTone(status: string | null) {
  switch (status) {
    case 'valid':
      return 'text-emerald-700'
    case 'expiring':
      return 'text-amber-700'
    case 'expired':
    case 'missing':
      return 'text-red-700'
    case 'pending':
      return 'text-sky-700'
    default:
      return 'text-stone-500'
  }
}

export function getComplianceBadgeTone(status: string | null) {
  switch (status) {
    case 'valid':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'expiring':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    case 'expired':
    case 'missing':
      return 'border border-red-200 bg-red-50 text-red-800'
    case 'pending':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    default:
      return 'border border-stone-200 bg-stone-100 text-stone-700'
  }
}

export function getSectionDotClass(status: WorkspaceSectionStatus) {
  switch (status) {
    case 'green':
      return 'bg-emerald-500'
    case 'amber':
      return 'bg-amber-500'
    case 'red':
      return 'bg-red-500'
    default:
      return 'bg-stone-300'
  }
}

export function getRecommendationProgressStep(workflowStatus: string | null) {
  switch (workflowStatus) {
    case 'evidence_pending':
      return 1
    case 'evidence_ready':
      return 2
    case 'review_pending':
    case 'recommendation_drafted':
      return 3
    case 'recommendation_approved':
      return 4
    case 'ready_for_claim':
    case 'closed':
      return 5
    default:
      return 1
  }
}

export function getRecommendationProgressLabel(step: number) {
  return `${step} of 5`
}

export function getCertificateLabel(recordType: string | null) {
  switch (recordType) {
    case 'electrical_installation':
      return 'EICR'
    case 'gas_safety':
      return 'Gas safety'
    case 'landlord_registration':
      return 'Landlord registration'
    default:
      return formatLabel(recordType)
  }
}
