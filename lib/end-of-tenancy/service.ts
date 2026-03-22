import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { withEndOfTenancyTransaction } from '@/lib/end-of-tenancy/db'
import {
  attachCaseDocument,
  getEndOfTenancyCaseDetail,
  linkEvidenceToIssue,
  storeDocumentExtractionResult,
  upsertEndOfTenancyIssue,
} from '@/lib/end-of-tenancy/queries'
import {
  syncMoveOutTrackerProgress,
  updateMoveOutChecklistItem,
} from '@/lib/end-of-tenancy/tracker'
import type {
  CaseDocumentRole,
  DecisionRecommendationRow,
  DecisionReviewActionType,
  DepositClaimLineItemRow,
  DepositClaimLineItemCategory,
  EndOfTenancyCaseRow,
  EndOfTenancyIssueRow,
  EndOfTenancyWorkflowStatus,
  JsonValue,
  MoveOutChecklistItemKey,
  MoveOutChecklistItemStatus,
  RecommendationOutcome,
  RecommendationStatus,
} from '@/lib/end-of-tenancy/types'
import { loadEndOfTenancyWorkspace } from '@/lib/end-of-tenancy/workspace'
import {
  assertArray,
  assertCaseDocumentRole,
  assertIssueStatus,
  assertIssueType,
  assertLineItemCategory,
  assertNonEmptyString,
  assertNumber,
  assertOptionalNumber,
  assertOptionalString,
  assertRecommendationOutcome,
  assertResponsibility,
  assertReviewAction,
  assertSeverity,
} from '@/lib/end-of-tenancy/validation'

type InitializeEndOfTenancyCaseInput = {
  caseId: string
  tenancyId?: string | null
  depositClaimId?: string | null
  moveOutDate?: string | null
  inspectionDate?: string | null
}

type AttachEvidenceInput = {
  endOfTenancyCaseId: string
  uploadedByUserId?: string | null
  tenancyDocumentId?: string | null
  messageAttachmentId?: string | null
  fileName?: string | null
  fileUrl?: string | null
  storagePath?: string | null
  mimeType?: string | null
  checksum?: string | null
  capturedAt?: string | null
  notes?: string | null
  documentRole?: CaseDocumentRole | null
  issueIds?: string[]
  excerpt?: string | null
  pageNumber?: number | null
}

type StoreExtractionInput = {
  endOfTenancyCaseId: string
  caseDocumentId: string
  aiRunId?: string | null
  extractionKind?: 'ocr' | 'classification' | 'structured' | 'summary'
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  extractedText?: string | null
  extractedData?: JsonValue
  confidence?: number | null
}

type CreateIssuesFromExtractionInput = {
  endOfTenancyCaseId: string
  caseDocumentId: string
  documentExtractionId: string
  createdByUserId?: string | null
  issues: Array<{
    issueType: EndOfTenancyIssueRow['issue_type']
    title: string
    description?: string | null
    roomArea?: string | null
    responsibility?: EndOfTenancyIssueRow['responsibility']
    severity?: EndOfTenancyIssueRow['severity']
    proposedAmount?: number | null
    excerpt?: string | null
    pageNumber?: number | null
    locator?: JsonValue
  }>
}

type TransactionClient = {
  query: <T = unknown>(text: string, values?: unknown[]) => Promise<{ rows: T[]; rowCount: number | null }>
}

type UpdateIssueAssessmentInput = {
  issueId: string
  issueType?: EndOfTenancyIssueRow['issue_type']
  title?: string
  description?: string | null
  roomArea?: string | null
  responsibility?: EndOfTenancyIssueRow['responsibility']
  severity?: EndOfTenancyIssueRow['severity']
  proposedAmount?: number | null
  status?: EndOfTenancyIssueRow['status']
}

type CreateDraftDecisionRecommendationInput = {
  endOfTenancyCaseId: string
  aiRunId?: string | null
  decisionSummary?: string | null
  rationale?: string | null
  recommendedOutcome?: RecommendationOutcome
  totalRecommendedAmount?: number | null
  issueIds?: string[]
}

type ConvertRecommendationToLineItemsInput = {
  decisionRecommendationId: string
  operatorUserId: string
  items?: Array<{
    issueId?: string | null
    category?: DepositClaimLineItemCategory | null
    description?: string | null
    amountClaimed?: number | null
    notes?: string | null
  }>
}

type RecordOperatorReviewInput = {
  decisionRecommendationId: string
  operatorUserId: string
  action: 'submit' | 'approve' | 'reject' | 'override' | 'comment' | 'send_back'
  notes?: string | null
  override?: {
    recommendedOutcome?: RecommendationOutcome
    totalRecommendedAmount?: number | null
    decisionSummary?: string | null
    rationale?: string | null
  }
}

type MarkCaseWorkflowInput = {
  endOfTenancyCaseId: string
  operatorUserId: string
  note?: string | null
}

type UpdateMoveOutChecklistInput = {
  endOfTenancyCaseId: string
  itemKey: MoveOutChecklistItemKey
  status: MoveOutChecklistItemStatus
  operatorUserId: string
  notes?: string | null
}

type InitializeEndOfTenancyCaseResult = {
  created: boolean
  endOfTenancyCase: EndOfTenancyCaseRow
}

const REVIEW_ACTION_MAP: Record<RecordOperatorReviewInput['action'], DecisionReviewActionType> = {
  submit: 'submitted_for_review',
  approve: 'approved',
  reject: 'rejected',
  override: 'edited',
  comment: 'commented',
  send_back: 'sent_back',
}

const ALLOWED_REVIEW_ACTIONS: Record<RecommendationStatus, DecisionReviewActionType[]> = {
  draft: ['submitted_for_review', 'commented', 'edited'],
  pending_review: ['approved', 'rejected', 'commented', 'edited', 'sent_back'],
  reviewed: ['approved', 'rejected', 'commented', 'edited', 'sent_back'],
  accepted: ['commented', 'edited', 'superseded'],
  rejected: ['commented', 'edited', 'superseded'],
  superseded: ['commented'],
}

function mapReviewActionToStatus(
  currentStatus: RecommendationStatus,
  actionType: DecisionReviewActionType
): RecommendationStatus {
  switch (actionType) {
    case 'submitted_for_review':
      return 'pending_review'
    case 'approved':
      return 'accepted'
    case 'rejected':
      return 'rejected'
    case 'edited':
      // Important rule: an operator override sends the recommendation back to reviewed state
      // so approval remains an explicit, human step after edits.
      return currentStatus === 'draft' ? 'draft' : 'reviewed'
    case 'sent_back':
      return 'pending_review'
    case 'superseded':
      return 'superseded'
    case 'commented':
    default:
      return currentStatus
  }
}

function assertValidReviewTransition(
  currentStatus: RecommendationStatus,
  actionType: DecisionReviewActionType
) {
  const allowedActions = ALLOWED_REVIEW_ACTIONS[currentStatus] ?? []

  if (!allowedActions.includes(actionType)) {
    throw new Error(
      `Cannot apply review action "${actionType}" when recommendation status is "${currentStatus}".`
    )
  }
}

function ensureLineItemCategory(
  value: DepositClaimLineItemCategory | EndOfTenancyIssueRow['issue_type'] | null | undefined
) {
  const safeValue = value ?? 'other'
  assertLineItemCategory(safeValue, 'category')
  return safeValue
}

async function updateEndOfTenancyWorkflowStatus(
  endOfTenancyCaseId: string,
  workflowStatus: EndOfTenancyWorkflowStatus,
  options?: {
    client?: TransactionClient
  }
) {
  const sql = `
    update public.end_of_tenancy_cases
    set
      workflow_status = $2,
      updated_at = now()
    where id = $1
  `

  if (options?.client) {
    await options.client.query(sql, [endOfTenancyCaseId, workflowStatus])
    return
  }

  const supabase = getSupabaseServiceRoleClient()
  const { error } = await supabase
    .from('end_of_tenancy_cases')
    .update({
      workflow_status: workflowStatus,
    })
    .eq('id', endOfTenancyCaseId)

  if (error) {
    throw new Error(`Unable to update end-of-tenancy workflow status: ${error.message}`)
  }
}

async function loadRecommendationState(decisionRecommendationId: string) {
  const supabase = getSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('decision_recommendations')
    .select('end_of_tenancy_case_id')
    .eq('id', decisionRecommendationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Unable to load decision recommendation: ${error.message}`)
  }

  if (!data?.end_of_tenancy_case_id) {
    throw new Error(`Decision recommendation ${decisionRecommendationId} was not found.`)
  }

  const detail = await getEndOfTenancyCaseDetail(data.end_of_tenancy_case_id)

  if (!detail) {
    throw new Error(`Decision recommendation ${decisionRecommendationId} was not found.`)
  }

  const recommendation = detail.recommendations.find((row) => row.id === decisionRecommendationId) ?? null

  if (!recommendation) {
    throw new Error(`Decision recommendation ${decisionRecommendationId} was not found.`)
  }

  return {
    detail,
    recommendation,
  }
}

export async function initializeEndOfTenancyCaseFromExistingCase(
  input: InitializeEndOfTenancyCaseInput
): Promise<InitializeEndOfTenancyCaseResult> {
  assertNonEmptyString(input.caseId, 'caseId')
  assertOptionalString(input.tenancyId, 'tenancyId')
  assertOptionalString(input.depositClaimId, 'depositClaimId')
  assertOptionalString(input.moveOutDate, 'moveOutDate')
  assertOptionalString(input.inspectionDate, 'inspectionDate')

  return withEndOfTenancyTransaction(async (client) => {
    const existingResult = await client.query<EndOfTenancyCaseRow>(
      `
        select
          id,
          case_id,
          tenancy_id,
          deposit_claim_id,
          workflow_status,
          inspection_status,
          move_out_date,
          inspection_date,
          closed_at,
          created_at,
          updated_at
        from public.end_of_tenancy_cases
        where case_id = $1
        limit 1
      `,
      [input.caseId]
    )

    if (existingResult.rows[0]) {
      return {
        created: false,
        endOfTenancyCase: existingResult.rows[0],
      }
    }

    const caseResult = await client.query<{
      id: string
      tenancy_id: string | null
    }>(
      `
        select id, tenancy_id
        from public.cases
        where id = $1
        limit 1
      `,
      [input.caseId]
    )

    const baseCase = caseResult.rows[0]

    if (!baseCase) {
      throw new Error(`Case ${input.caseId} was not found.`)
    }

    const tenancyId = input.tenancyId ?? baseCase.tenancy_id

    if (!tenancyId) {
      throw new Error('An end-of-tenancy case cannot be initialised without a tenancy.')
    }

    const insertResult = await client.query<EndOfTenancyCaseRow>(
      `
        insert into public.end_of_tenancy_cases (
          case_id,
          tenancy_id,
          deposit_claim_id,
          move_out_date,
          inspection_date
        )
        values ($1, $2, $3, $4, $5)
        returning
          id,
          case_id,
          tenancy_id,
          deposit_claim_id,
          workflow_status,
          inspection_status,
          move_out_date,
          inspection_date,
          closed_at,
          created_at,
          updated_at
      `,
      [
        input.caseId,
        tenancyId,
        input.depositClaimId ?? null,
        input.moveOutDate ?? null,
        input.inspectionDate ?? null,
      ]
    )

    await syncMoveOutTrackerProgress(insertResult.rows[0].id, {
      client,
    })

    return {
      created: true,
      endOfTenancyCase: insertResult.rows[0],
    }
  })
}

export async function attachEvidenceToEndOfTenancyCase(input: AttachEvidenceInput) {
  assertNonEmptyString(input.endOfTenancyCaseId, 'endOfTenancyCaseId')
  if (input.documentRole != null) {
    assertCaseDocumentRole(input.documentRole, 'documentRole')
  }
  assertArray<string>(input.issueIds ?? [], 'issueIds', (item, index) => {
    assertNonEmptyString(item, `issueIds[${index}]`)
  })
  assertOptionalNumber(input.pageNumber, 'pageNumber', { min: 1 })

  const detail = await getEndOfTenancyCaseDetail(input.endOfTenancyCaseId)

  if (!detail) {
    throw new Error(`End-of-tenancy case ${input.endOfTenancyCaseId} was not found.`)
  }

  const document = await attachCaseDocument({
    caseId: detail.endOfTenancyCase.case_id,
    uploadedByUserId: input.uploadedByUserId ?? null,
    tenancyDocumentId: input.tenancyDocumentId ?? null,
    messageAttachmentId: input.messageAttachmentId ?? null,
    fileName: input.fileName ?? null,
    fileUrl: input.fileUrl ?? null,
    storagePath: input.storagePath ?? null,
    mimeType: input.mimeType ?? null,
    checksum: input.checksum ?? null,
    capturedAt: input.capturedAt ?? null,
    notes: input.notes ?? null,
    sourceType:
      input.tenancyDocumentId != null
        ? 'tenancy_document'
        : input.messageAttachmentId != null
          ? 'message_attachment'
          : 'manual_upload',
    documentRole: input.documentRole ?? 'supporting_evidence',
  })

  const evidenceLinks = []

  for (const issueId of input.issueIds ?? []) {
    const issue = detail.issues.find((row) => row.id === issueId)

    if (!issue) {
      throw new Error(`Issue ${issueId} does not belong to end-of-tenancy case ${input.endOfTenancyCaseId}.`)
    }

    evidenceLinks.push(
      await linkEvidenceToIssue({
        issueId,
        caseDocumentId: document.id,
        excerpt: input.excerpt ?? null,
        pageNumber: input.pageNumber ?? null,
        locator: {},
      })
    )
  }

  if (detail.endOfTenancyCase.workflow_status === 'evidence_pending') {
    await updateEndOfTenancyWorkflowStatus(detail.endOfTenancyCase.id, 'evidence_ready')
  }

  await syncMoveOutTrackerProgress(detail.endOfTenancyCase.id, {
    event: {
      actorType: 'user',
      actorUserId: input.uploadedByUserId ?? null,
      eventType: 'evidence_attached',
      title: 'Checkout evidence attached',
      detail: document.file_name
        ? `${document.file_name} was attached to the move-out workspace.`
        : 'New supporting evidence was attached to the move-out workspace.',
    },
  })

  return {
    document,
    evidenceLinks,
  }
}

export async function storeEndOfTenancyExtractionResults(input: StoreExtractionInput) {
  assertNonEmptyString(input.endOfTenancyCaseId, 'endOfTenancyCaseId')
  assertNonEmptyString(input.caseDocumentId, 'caseDocumentId')
  assertOptionalNumber(input.confidence, 'confidence', { min: 0 })

  if (input.confidence != null && input.confidence > 1) {
    throw new Error('confidence must be between 0 and 1.')
  }

  const detail = await getEndOfTenancyCaseDetail(input.endOfTenancyCaseId)

  if (!detail) {
    throw new Error(`End-of-tenancy case ${input.endOfTenancyCaseId} was not found.`)
  }

  const document = detail.documents.find((row) => row.id === input.caseDocumentId)

  if (!document) {
    throw new Error(`Case document ${input.caseDocumentId} does not belong to this end-of-tenancy case.`)
  }

  const extraction = await storeDocumentExtractionResult({
    caseDocumentId: input.caseDocumentId,
    aiRunId: input.aiRunId ?? null,
    extractionKind: input.extractionKind ?? 'structured',
    status: input.status ?? 'completed',
    extractedText: input.extractedText ?? null,
    extractedData: input.extractedData ?? {},
    confidence: input.confidence ?? null,
  })

  await syncMoveOutTrackerProgress(input.endOfTenancyCaseId, {
    event: {
      actorType: input.aiRunId ? 'ai' : 'user',
      eventType: 'extraction_stored',
      title: 'Extraction stored',
      detail: `${input.extractionKind ?? 'structured'} extraction output was stored against a case document.`,
      sourceTable: 'document_extractions',
      sourceRecordId: extraction.id,
    },
  })

  return extraction
}

export async function createIssuesFromExtractionOutput(input: CreateIssuesFromExtractionInput) {
  assertNonEmptyString(input.endOfTenancyCaseId, 'endOfTenancyCaseId')
  assertNonEmptyString(input.caseDocumentId, 'caseDocumentId')
  assertNonEmptyString(input.documentExtractionId, 'documentExtractionId')
  assertArray(input.issues, 'issues', (item, index) => {
    if (typeof item !== 'object' || item == null) {
      throw new Error(`issues[${index}] must be an object.`)
    }
  })

  const detail = await getEndOfTenancyCaseDetail(input.endOfTenancyCaseId)

  if (!detail) {
    throw new Error(`End-of-tenancy case ${input.endOfTenancyCaseId} was not found.`)
  }

  const document = detail.documents.find((row) => row.id === input.caseDocumentId)
  const extraction = detail.extractions.find((row) => row.id === input.documentExtractionId)

  if (!document) {
    throw new Error(`Case document ${input.caseDocumentId} does not belong to this end-of-tenancy case.`)
  }

  if (!extraction || extraction.case_document_id !== input.caseDocumentId) {
    throw new Error('documentExtractionId must belong to the supplied caseDocumentId.')
  }

  const createdIssues = []
  const evidenceLinks = []

  for (const [index, issueInput] of input.issues.entries()) {
    assertIssueType(issueInput.issueType, `issues[${index}].issueType`)
    assertNonEmptyString(issueInput.title, `issues[${index}].title`)
    if (issueInput.responsibility != null) {
      assertResponsibility(issueInput.responsibility, `issues[${index}].responsibility`)
    }
    if (issueInput.severity != null) {
      assertSeverity(issueInput.severity, `issues[${index}].severity`)
    }
    assertOptionalNumber(issueInput.proposedAmount, `issues[${index}].proposedAmount`, { min: 0 })

    const issue = await upsertEndOfTenancyIssue({
      endOfTenancyCaseId: input.endOfTenancyCaseId,
      createdByUserId: input.createdByUserId ?? null,
      issueType: issueInput.issueType,
      title: issueInput.title,
      description: issueInput.description ?? null,
      roomArea: issueInput.roomArea ?? null,
      responsibility: issueInput.responsibility ?? 'undetermined',
      severity: issueInput.severity ?? 'medium',
      proposedAmount: issueInput.proposedAmount ?? null,
      status: 'open',
      identifiedByAiRunId: extraction.ai_run_id ?? null,
    })

    createdIssues.push(issue)

    evidenceLinks.push(
      await linkEvidenceToIssue({
        issueId: issue.id,
        caseDocumentId: input.caseDocumentId,
        documentExtractionId: input.documentExtractionId,
        excerpt: issueInput.excerpt ?? null,
        pageNumber: issueInput.pageNumber ?? null,
        locator: issueInput.locator ?? {},
      })
    )
  }

  await syncMoveOutTrackerProgress(input.endOfTenancyCaseId, {
    event: {
      actorType: input.createdByUserId ? 'user' : extraction.ai_run_id ? 'ai' : 'system',
      actorUserId: input.createdByUserId ?? null,
      eventType: 'issue_created',
      title: 'Issues created from extraction output',
      detail: `${createdIssues.length} issue${createdIssues.length === 1 ? '' : 's'} were added to the move-out review.`,
      sourceTable: 'document_extractions',
      sourceRecordId: input.documentExtractionId,
    },
  })

  return {
    issues: createdIssues,
    evidenceLinks,
  }
}

export async function updateIssueAssessment(input: UpdateIssueAssessmentInput) {
  assertNonEmptyString(input.issueId, 'issueId')
  if (input.issueType != null) {
    assertIssueType(input.issueType, 'issueType')
  }
  if (input.title != null) {
    assertNonEmptyString(input.title, 'title')
  }
  assertOptionalString(input.description, 'description')
  assertOptionalString(input.roomArea, 'roomArea')
  if (input.responsibility != null) {
    assertResponsibility(input.responsibility, 'responsibility')
  }
  if (input.severity != null) {
    assertSeverity(input.severity, 'severity')
  }
  if (input.status != null) {
    assertIssueStatus(input.status, 'status')
  }
  assertOptionalNumber(input.proposedAmount, 'proposedAmount', { min: 0 })

  const supabase = getSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('end_of_tenancy_issues')
    .update({
      issue_type: input.issueType,
      title: input.title,
      description: input.description,
      room_area: input.roomArea,
      responsibility: input.responsibility,
      severity: input.severity,
      proposed_amount: input.proposedAmount,
      status: input.status,
    })
    .eq('id', input.issueId)
    .select(
      'id, end_of_tenancy_case_id, identified_by_ai_run_id, created_by_user_id, issue_type, title, description, room_area, status, responsibility, severity, proposed_amount, created_at, updated_at'
    )
    .single()

  if (error) {
    throw new Error(`Unable to update issue assessment: ${error.message}`)
  }

  const updatedIssue = data as EndOfTenancyIssueRow

  await syncMoveOutTrackerProgress(updatedIssue.end_of_tenancy_case_id, {
    event: {
      actorType: 'user',
      eventType: 'issue_updated',
      title: 'Issue assessment updated',
      detail: `${updatedIssue.title} was updated during checkout review.`,
      sourceTable: 'end_of_tenancy_issues',
      sourceRecordId: updatedIssue.id,
    },
  })

  return updatedIssue
}

export async function createDraftDecisionRecommendation(
  input: CreateDraftDecisionRecommendationInput
) {
  assertNonEmptyString(input.endOfTenancyCaseId, 'endOfTenancyCaseId')
  if (input.recommendedOutcome != null) {
    assertRecommendationOutcome(input.recommendedOutcome, 'recommendedOutcome')
  }
  assertOptionalNumber(input.totalRecommendedAmount, 'totalRecommendedAmount', { min: 0 })
  assertArray<string>(input.issueIds ?? [], 'issueIds', (item, index) => {
    assertNonEmptyString(item, `issueIds[${index}]`)
  })

  const detail = await getEndOfTenancyCaseDetail(input.endOfTenancyCaseId)

  if (!detail) {
    throw new Error(`End-of-tenancy case ${input.endOfTenancyCaseId} was not found.`)
  }

  // Important workflow rule: AI outputs can draft recommendations, but human review remains mandatory.
  const issueIds = input.issueIds ?? []
  const issuesById = new Map(detail.issues.map((row) => [row.id, row]))

  const recommendation = await withEndOfTenancyTransaction(async (client) => {
    for (const issueId of issueIds) {
      if (!issuesById.has(issueId)) {
        throw new Error(`Issue ${issueId} does not belong to end-of-tenancy case ${input.endOfTenancyCaseId}.`)
      }
    }

    const insertRecommendation = await client.query<DecisionRecommendationRow>(
      `
        insert into public.decision_recommendations (
          end_of_tenancy_case_id,
          ai_run_id,
          recommendation_status,
          recommended_outcome,
          decision_summary,
          rationale,
          total_recommended_amount,
          human_review_required
        )
        values ($1, $2, 'draft', $3, $4, $5, $6, true)
        returning
          id,
          end_of_tenancy_case_id,
          ai_run_id,
          reviewed_by_user_id,
          recommendation_status,
          recommended_outcome,
          decision_summary,
          rationale,
          total_recommended_amount,
          human_review_required,
          reviewed_at,
          created_at,
          updated_at
      `,
      [
        input.endOfTenancyCaseId,
        input.aiRunId ?? null,
        input.recommendedOutcome ?? 'no_decision',
        input.decisionSummary ?? null,
        input.rationale ?? null,
        input.totalRecommendedAmount ?? null,
      ]
    )

    const recommendationRow = insertRecommendation.rows[0]

    for (const issueId of issueIds) {
      await client.query(
        `
          insert into public.decision_recommendation_sources (
            decision_recommendation_id,
            source_type,
            issue_id,
            source_note
          )
          values ($1, 'issue', $2, $3)
        `,
        [recommendationRow.id, issueId, 'Linked from issue assessment']
      )
    }

    await updateEndOfTenancyWorkflowStatus(input.endOfTenancyCaseId, 'recommendation_drafted', {
      client,
    })

    await syncMoveOutTrackerProgress(input.endOfTenancyCaseId, {
      client,
      event: {
        actorType: input.aiRunId ? 'ai' : 'user',
        eventType: 'recommendation_drafted',
        title: 'Draft recommendation created',
        detail: 'A reviewable recommendation is ready for operator review.',
        sourceTable: 'decision_recommendations',
        sourceRecordId: recommendationRow.id,
      },
    })

    return recommendationRow
  })

  return recommendation
}

export async function convertApprovedRecommendationToDepositClaimLineItems(
  input: ConvertRecommendationToLineItemsInput
) {
  assertNonEmptyString(input.decisionRecommendationId, 'decisionRecommendationId')
  assertNonEmptyString(input.operatorUserId, 'operatorUserId')

  const { detail, recommendation } = await loadRecommendationState(input.decisionRecommendationId)

  if (recommendation.human_review_required !== true) {
    throw new Error('Recommendations must keep human review explicit before creating line items.')
  }

  if (recommendation.recommendation_status !== 'accepted') {
    throw new Error('Deposit claim line items can only be created from an accepted recommendation.')
  }

  const approvedAction = detail.reviewActions.find(
    (row) =>
      row.decision_recommendation_id === recommendation.id &&
      row.action_type === 'approved' &&
      row.actor_user_id != null
  )

  if (!approvedAction) {
    throw new Error('An explicit operator approval is required before converting a recommendation into claim line items.')
  }

  if (!detail.depositClaim) {
    throw new Error('A deposit claim must exist before line items can be created.')
  }

  const sourceIssueIds = detail.recommendationSources
    .filter(
      (row) => row.decision_recommendation_id === recommendation.id && row.issue_id != null
    )
    .map((row) => row.issue_id as string)

  const issueMap = new Map(detail.issues.map((row) => [row.id, row]))
  const evidenceCountByIssueId = new Map<string, number>()

  for (const evidenceLink of detail.evidenceLinks) {
    evidenceCountByIssueId.set(
      evidenceLink.issue_id,
      (evidenceCountByIssueId.get(evidenceLink.issue_id) ?? 0) + 1
    )
  }

  const candidateItems =
    input.items && input.items.length > 0
      ? input.items
      : sourceIssueIds.map((issueId) => {
          const issue = issueMap.get(issueId)

          return {
            issueId,
            category: ensureLineItemCategory(issue?.issue_type),
            description: issue?.title ?? 'Claim item',
            amountClaimed:
              issue?.proposed_amount != null ? Number(issue.proposed_amount) : null,
            notes: issue?.description ?? null,
          }
        })

  if (candidateItems.length === 0) {
    throw new Error('No claimable items were available on the approved recommendation.')
  }

  const depositClaim = detail.depositClaim
  const createdLineItems: DepositClaimLineItemRow[] = []
  return withEndOfTenancyTransaction(async (client) => {
    for (const [index, item] of candidateItems.entries()) {
      if (item.issueId) {
        const issue = issueMap.get(item.issueId)

        if (!issue) {
          throw new Error(`items[${index}].issueId does not belong to the recommendation workspace.`)
        }

        if ((evidenceCountByIssueId.get(item.issueId) ?? 0) === 0) {
          throw new Error(`Issue ${item.issueId} cannot be converted into a claim line item without linked evidence.`)
        }
      }

      const amountClaimed = item.amountClaimed ?? null

      if (amountClaimed == null) {
        throw new Error(`items[${index}].amountClaimed is required.`)
      }

      assertNumber(amountClaimed, `items[${index}].amountClaimed`, { min: 0 })

      const category = ensureLineItemCategory(
        item.category ?? (item.issueId ? issueMap.get(item.issueId ?? '')?.issue_type ?? 'other' : 'other')
      )

      const insertResult = await client.query<DepositClaimLineItemRow>(
        `
          insert into public.deposit_claim_line_items (
            deposit_claim_id,
            end_of_tenancy_issue_id,
            decision_recommendation_id,
            line_item_status,
            category,
            description,
            amount_claimed,
            notes
          )
          values ($1, $2, $3, 'draft', $4, $5, $6, $7)
          returning
            id,
            deposit_claim_id,
            end_of_tenancy_issue_id,
            decision_recommendation_id,
            line_item_status,
            category,
            description,
            amount_claimed,
            amount_agreed,
            amount_awarded,
            notes,
            created_at,
            updated_at
        `,
        [
          depositClaim.id,
          item.issueId ?? null,
          recommendation.id,
          category,
          item.description ?? issueMap.get(item.issueId ?? '')?.title ?? 'Claim item',
          amountClaimed,
          item.notes ?? null,
        ]
      )

      createdLineItems.push(insertResult.rows[0])
    }

    await client.query(
      `
        insert into public.decision_review_actions (
          decision_recommendation_id,
          actor_user_id,
          actor_type,
          action_type,
          action_notes
        )
        values ($1, $2, 'user', 'commented', $3)
      `,
      [
        recommendation.id,
        input.operatorUserId,
        'Approved recommendation converted into draft deposit claim line items.',
      ]
    )

    await updateEndOfTenancyWorkflowStatus(detail.endOfTenancyCase.id, 'recommendation_approved', {
      client,
    })

    await syncMoveOutTrackerProgress(detail.endOfTenancyCase.id, {
      client,
      event: {
        actorType: 'user',
        actorUserId: input.operatorUserId,
        eventType: 'line_items_created',
        title: 'Claim line items prepared',
        detail: `${createdLineItems.length} draft line item${createdLineItems.length === 1 ? '' : 's'} were created from the approved recommendation.`,
        sourceTable: 'decision_recommendations',
        sourceRecordId: recommendation.id,
      },
    })

    return createdLineItems
  })
}

export async function recordOperatorReviewAction(input: RecordOperatorReviewInput) {
  assertNonEmptyString(input.decisionRecommendationId, 'decisionRecommendationId')
  assertNonEmptyString(input.operatorUserId, 'operatorUserId')
  assertOptionalString(input.notes, 'notes')

  const actionType = REVIEW_ACTION_MAP[input.action]
  assertReviewAction(actionType, 'actionType')

  if (input.action === 'override') {
    if (!input.override) {
      throw new Error('override details are required when action is "override".')
    }

    if (input.override.recommendedOutcome != null) {
      assertRecommendationOutcome(input.override.recommendedOutcome, 'override.recommendedOutcome')
    }

    assertOptionalNumber(
      input.override.totalRecommendedAmount,
      'override.totalRecommendedAmount',
      { min: 0 }
    )
  }

  const { detail, recommendation } = await loadRecommendationState(input.decisionRecommendationId)
  assertValidReviewTransition(recommendation.recommendation_status, actionType)

  const endOfTenancyCaseId = detail.endOfTenancyCase.id

  await withEndOfTenancyTransaction(async (client) => {
    let nextStatus = mapReviewActionToStatus(recommendation.recommendation_status, actionType)
    let recommendedOutcome = recommendation.recommended_outcome
    let totalRecommendedAmount = recommendation.total_recommended_amount
    let decisionSummary = recommendation.decision_summary
    let rationale = recommendation.rationale

    if (input.action === 'override' && input.override) {
      recommendedOutcome = input.override.recommendedOutcome ?? recommendation.recommended_outcome
      totalRecommendedAmount =
        input.override.totalRecommendedAmount ?? recommendation.total_recommended_amount
      decisionSummary = input.override.decisionSummary ?? recommendation.decision_summary
      rationale = input.override.rationale ?? recommendation.rationale
      nextStatus = 'reviewed'
    }

    if (actionType === 'approved' || actionType === 'rejected') {
      // Important workflow rule: AI confidence never finalises the decision. Final state requires
      // an explicit operator action, which is recorded below with actor_user_id and reviewed_at.
      await client.query(
        `
          update public.decision_recommendations
          set
            recommendation_status = $2,
            reviewed_by_user_id = $3,
            reviewed_at = now(),
            human_review_required = true,
            recommended_outcome = $4,
            total_recommended_amount = $5,
            decision_summary = $6,
            rationale = $7
          where id = $1
        `,
        [
          recommendation.id,
          nextStatus,
          input.operatorUserId,
          recommendedOutcome,
          totalRecommendedAmount,
          decisionSummary,
          rationale,
        ]
      )
    } else {
      await client.query(
        `
          update public.decision_recommendations
          set
            recommendation_status = $2,
            reviewed_by_user_id = case when $3::uuid is null then reviewed_by_user_id else $3::uuid end,
            human_review_required = true,
            recommended_outcome = $4,
            total_recommended_amount = $5,
            decision_summary = $6,
            rationale = $7
          where id = $1
        `,
        [
          recommendation.id,
          nextStatus,
          input.operatorUserId,
          recommendedOutcome,
          totalRecommendedAmount,
          decisionSummary,
          rationale,
        ]
      )
    }

    await client.query(
      `
        insert into public.decision_review_actions (
          decision_recommendation_id,
          actor_user_id,
          actor_type,
          action_type,
          action_notes
        )
        values ($1, $2, 'user', $3, $4)
      `,
      [recommendation.id, input.operatorUserId, actionType, input.notes ?? null]
    )

    if (actionType === 'submitted_for_review') {
      await updateEndOfTenancyWorkflowStatus(endOfTenancyCaseId, 'review_pending', {
        client,
      })
    } else if (actionType === 'approved') {
      await updateEndOfTenancyWorkflowStatus(endOfTenancyCaseId, 'recommendation_approved', {
        client,
      })
    } else if (actionType === 'rejected' || actionType === 'sent_back') {
      await updateEndOfTenancyWorkflowStatus(endOfTenancyCaseId, 'needs_manual_review', {
        client,
      })
    } else if (actionType === 'edited' && input.action === 'override') {
      await updateEndOfTenancyWorkflowStatus(endOfTenancyCaseId, 'review_pending', {
        client,
      })
    }

    await syncMoveOutTrackerProgress(endOfTenancyCaseId, {
      client,
      event: {
        actorType: 'user',
        actorUserId: input.operatorUserId,
        eventType:
          actionType === 'approved'
            ? 'recommendation_approved'
            : actionType === 'submitted_for_review'
              ? 'review_submitted'
              : actionType === 'rejected' || actionType === 'sent_back'
                ? 'recommendation_rejected'
                : actionType === 'edited'
                  ? 'recommendation_drafted'
                  : 'other',
        title:
          actionType === 'approved'
            ? 'Recommendation approved'
            : actionType === 'submitted_for_review'
              ? 'Recommendation submitted for review'
              : actionType === 'rejected'
                ? 'Recommendation rejected'
                : actionType === 'sent_back'
                  ? 'Recommendation sent back'
                  : actionType === 'edited'
                    ? 'Recommendation overridden'
                    : 'Recommendation commented',
        detail: input.notes ?? null,
        sourceTable: 'decision_recommendations',
        sourceRecordId: recommendation.id,
      },
    })

  })

  const workspace = await loadEndOfTenancyWorkspace(endOfTenancyCaseId)

  if (!workspace) {
    throw new Error('Recommendation review action was saved, but the workspace could not be reloaded.')
  }

  return workspace
}

export async function markEndOfTenancyCaseReadyForClaim(input: MarkCaseWorkflowInput) {
  assertNonEmptyString(input.endOfTenancyCaseId, 'endOfTenancyCaseId')
  assertNonEmptyString(input.operatorUserId, 'operatorUserId')
  assertOptionalString(input.note, 'note')

  const detail = await getEndOfTenancyCaseDetail(input.endOfTenancyCaseId)

  if (!detail) {
    throw new Error(`End-of-tenancy case ${input.endOfTenancyCaseId} was not found.`)
  }

  const acceptedRecommendation = detail.recommendations.find(
    (row) => row.recommendation_status === 'accepted'
  )

  if (!acceptedRecommendation) {
    throw new Error('The case cannot be marked ready_for_claim without an accepted recommendation.')
  }

  if (detail.lineItems.length === 0) {
    throw new Error('The case cannot be marked ready_for_claim until deposit claim line items exist.')
  }
  const endOfTenancyCaseId = detail.endOfTenancyCase.id

  await withEndOfTenancyTransaction(async (client) => {
    await updateEndOfTenancyWorkflowStatus(detail.endOfTenancyCase.id, 'ready_for_claim', {
      client,
    })

    await client.query(
      `
        insert into public.decision_review_actions (
          decision_recommendation_id,
          actor_user_id,
          actor_type,
          action_type,
          action_notes
        )
        values ($1, $2, 'user', 'commented', $3)
      `,
      [
        acceptedRecommendation.id,
        input.operatorUserId,
        input.note ?? 'Case marked ready_for_claim after explicit review and line-item creation.',
      ]
    )

    await syncMoveOutTrackerProgress(endOfTenancyCaseId, {
      client,
      event: {
        actorType: 'user',
        actorUserId: input.operatorUserId,
        eventType: 'claim_ready',
        title: 'Case marked ready for claim',
        detail: input.note ?? 'The move-out case is ready for claim or settlement handling.',
        isPortalVisible: true,
        sourceTable: 'end_of_tenancy_cases',
        sourceRecordId: endOfTenancyCaseId,
      },
    })

  })

  const workspace = await loadEndOfTenancyWorkspace(endOfTenancyCaseId)

  if (!workspace) {
    throw new Error('Case was updated but the workspace could not be reloaded.')
  }

  return workspace
}

export async function markEndOfTenancyCaseNeedsManualReview(input: MarkCaseWorkflowInput) {
  assertNonEmptyString(input.endOfTenancyCaseId, 'endOfTenancyCaseId')
  assertNonEmptyString(input.operatorUserId, 'operatorUserId')
  assertOptionalString(input.note, 'note')

  const detail = await getEndOfTenancyCaseDetail(input.endOfTenancyCaseId)

  if (!detail) {
    throw new Error(`End-of-tenancy case ${input.endOfTenancyCaseId} was not found.`)
  }

  const endOfTenancyCaseId = detail.endOfTenancyCase.id

  await withEndOfTenancyTransaction(async (client) => {
    await updateEndOfTenancyWorkflowStatus(detail.endOfTenancyCase.id, 'needs_manual_review', {
      client,
    })

    const latestRecommendation =
      detail.recommendations.at(-1) ?? null

    if (latestRecommendation) {
      await client.query(
        `
          insert into public.decision_review_actions (
            decision_recommendation_id,
            actor_user_id,
            actor_type,
            action_type,
            action_notes
          )
          values ($1, $2, 'user', 'sent_back', $3)
        `,
        [
          latestRecommendation.id,
          input.operatorUserId,
          input.note ?? 'Case moved to explicit manual review.',
        ]
      )
    }

    await syncMoveOutTrackerProgress(endOfTenancyCaseId, {
      client,
      event: {
        actorType: 'user',
        actorUserId: input.operatorUserId,
        eventType: 'manual_review_requested',
        title: 'Manual review requested',
        detail: input.note ?? 'An operator moved this move-out case into manual review.',
        sourceTable: 'end_of_tenancy_cases',
        sourceRecordId: endOfTenancyCaseId,
      },
    })

  })

  const workspace = await loadEndOfTenancyWorkspace(endOfTenancyCaseId)

  if (!workspace) {
    throw new Error('Case was updated but the workspace could not be reloaded.')
  }

  return workspace
}

export async function updateMoveOutChecklist(input: UpdateMoveOutChecklistInput) {
  const item = await updateMoveOutChecklistItem({
    endOfTenancyCaseId: input.endOfTenancyCaseId,
    itemKey: input.itemKey,
    status: input.status,
    operatorUserId: input.operatorUserId,
    notes: input.notes ?? null,
  })

  const workspace = await loadEndOfTenancyWorkspace(input.endOfTenancyCaseId)

  if (!workspace) {
    throw new Error('Checklist item was updated, but the workspace could not be reloaded.')
  }

  return {
    item,
    workspace,
  }
}
