import type {
  CaseCommunicationChannel,
  CaseCommunicationDirection,
  CaseCommunicationRecipientRole,
  CaseDocumentRole,
  DecisionReviewActionType,
  DepositClaimLineItemCategory,
  EndOfTenancyIssueSeverity,
  EndOfTenancyIssueStatus,
  EndOfTenancyIssueType,
  EndOfTenancyResponsibility,
  MoveOutChecklistItemKey,
  MoveOutChecklistItemStatus,
  MoveOutTrackerEventType,
  RecommendationOutcome,
  RecommendationStatus,
} from '@/lib/end-of-tenancy/types'
import {
  CASE_COMMUNICATION_CHANNELS,
  CASE_COMMUNICATION_DIRECTIONS,
  CASE_COMMUNICATION_RECIPIENT_ROLES,
  MOVE_OUT_CHECKLIST_ITEM_KEYS,
  MOVE_OUT_CHECKLIST_ITEM_STATUSES,
  MOVE_OUT_TRACKER_EVENT_TYPES,
} from '@/lib/end-of-tenancy/types'

const ISSUE_TYPES: EndOfTenancyIssueType[] = [
  'cleaning',
  'damage',
  'missing_item',
  'repair',
  'redecoration',
  'gardening',
  'rubbish_removal',
  'rent_arrears',
  'utilities',
  'other',
]

const CASE_DOCUMENT_ROLES: CaseDocumentRole[] = [
  'check_in',
  'check_out',
  'invoice',
  'receipt',
  'photo',
  'video',
  'email',
  'message_attachment',
  'tenancy_agreement',
  'deposit_scheme',
  'supporting_evidence',
  'other',
]

const ISSUE_STATUSES: EndOfTenancyIssueStatus[] = [
  'open',
  'under_review',
  'accepted',
  'rejected',
  'resolved',
]

const RESPONSIBILITIES: EndOfTenancyResponsibility[] = [
  'tenant',
  'landlord',
  'shared',
  'undetermined',
]

const SEVERITIES: EndOfTenancyIssueSeverity[] = ['low', 'medium', 'high']

const RECOMMENDATION_STATUSES: RecommendationStatus[] = [
  'draft',
  'pending_review',
  'reviewed',
  'accepted',
  'rejected',
  'superseded',
]

const RECOMMENDATION_OUTCOMES: RecommendationOutcome[] = [
  'no_action',
  'partial_claim',
  'full_claim',
  'insufficient_evidence',
  'refer_to_human',
  'no_decision',
]

const REVIEW_ACTIONS: DecisionReviewActionType[] = [
  'submitted_for_review',
  'commented',
  'approved',
  'rejected',
  'edited',
  'sent_back',
  'superseded',
]

const LINE_ITEM_CATEGORIES: DepositClaimLineItemCategory[] = [
  'cleaning',
  'damage',
  'missing_item',
  'repair',
  'redecoration',
  'gardening',
  'rubbish_removal',
  'rent_arrears',
  'utilities',
  'fees',
  'other',
]

const MOVE_OUT_CHECKLIST_KEYS: MoveOutChecklistItemKey[] = [...MOVE_OUT_CHECKLIST_ITEM_KEYS]

const MOVE_OUT_CHECKLIST_STATUSES: MoveOutChecklistItemStatus[] = [...MOVE_OUT_CHECKLIST_ITEM_STATUSES]

const MOVE_OUT_EVENT_TYPES: MoveOutTrackerEventType[] = [...MOVE_OUT_TRACKER_EVENT_TYPES]
const CASE_COMMUNICATION_DIRECTION_VALUES: CaseCommunicationDirection[] = [
  ...CASE_COMMUNICATION_DIRECTIONS,
]
const CASE_COMMUNICATION_CHANNEL_VALUES: CaseCommunicationChannel[] = [...CASE_COMMUNICATION_CHANNELS]
const CASE_COMMUNICATION_RECIPIENT_ROLE_VALUES: CaseCommunicationRecipientRole[] = [
  ...CASE_COMMUNICATION_RECIPIENT_ROLES,
]

export function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required.`)
  }
}

export function assertOptionalString(value: unknown, label: string) {
  if (value == null) return

  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string.`)
  }
}

export function assertBoolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be true or false.`)
  }
}

export function assertNumber(value: unknown, label: string, options?: { min?: number }) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${label} must be a number.`)
  }

  if (options?.min != null && value < options.min) {
    throw new Error(`${label} must be at least ${options.min}.`)
  }
}

export function assertOptionalNumber(value: unknown, label: string, options?: { min?: number }) {
  if (value == null) return
  assertNumber(value, label, options)
}

export function assertArray<T>(
  value: unknown,
  label: string,
  validator?: (item: unknown, index: number) => void
): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`)
  }

  if (validator) {
    value.forEach((item, index) => validator(item, index))
  }
}

export function assertEnum<T extends string>(
  value: unknown,
  label: string,
  allowed: readonly T[]
): asserts value is T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}.`)
  }
}

export function assertIssueType(value: unknown, label = 'issueType') {
  assertEnum(value, label, ISSUE_TYPES)
}

export function assertCaseDocumentRole(value: unknown, label = 'documentRole') {
  assertEnum(value, label, CASE_DOCUMENT_ROLES)
}

export function assertIssueStatus(value: unknown, label = 'status') {
  assertEnum(value, label, ISSUE_STATUSES)
}

export function assertResponsibility(value: unknown, label = 'responsibility') {
  assertEnum(value, label, RESPONSIBILITIES)
}

export function assertSeverity(value: unknown, label = 'severity') {
  assertEnum(value, label, SEVERITIES)
}

export function assertRecommendationStatus(value: unknown, label = 'recommendationStatus') {
  assertEnum(value, label, RECOMMENDATION_STATUSES)
}

export function assertRecommendationOutcome(value: unknown, label = 'recommendedOutcome') {
  assertEnum(value, label, RECOMMENDATION_OUTCOMES)
}

export function assertReviewAction(value: unknown, label = 'actionType') {
  assertEnum(value, label, REVIEW_ACTIONS)
}

export function assertLineItemCategory(value: unknown, label = 'category') {
  assertEnum(value, label, LINE_ITEM_CATEGORIES)
}

export function assertMoveOutChecklistItemKey(value: unknown, label = 'itemKey') {
  assertEnum(value, label, MOVE_OUT_CHECKLIST_KEYS)
}

export function assertMoveOutChecklistItemStatus(value: unknown, label = 'status') {
  assertEnum(value, label, MOVE_OUT_CHECKLIST_STATUSES)
}

export function assertMoveOutTrackerEventType(value: unknown, label = 'eventType') {
  assertEnum(value, label, MOVE_OUT_EVENT_TYPES)
}

export function assertCaseCommunicationDirection(value: unknown, label = 'direction') {
  assertEnum(value, label, CASE_COMMUNICATION_DIRECTION_VALUES)
}

export function assertCaseCommunicationChannel(value: unknown, label = 'channel') {
  assertEnum(value, label, CASE_COMMUNICATION_CHANNEL_VALUES)
}

export function assertCaseCommunicationRecipientRole(value: unknown, label = 'recipientRole') {
  assertEnum(value, label, CASE_COMMUNICATION_RECIPIENT_ROLE_VALUES)
}
