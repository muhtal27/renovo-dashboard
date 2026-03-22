import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import type {
  AttachCaseDocumentInput,
  CaseDocumentRow,
  CaseRow,
  CreateDecisionRecommendationInput,
  CreateEndOfTenancyCaseInput,
  DecisionRecommendationRow,
  DecisionRecommendationSourceRow,
  DecisionReviewActionRow,
  DepositClaimLineItemRow,
  DepositClaimRow,
  EndOfTenancyCaseDetail,
  EndOfTenancyCaseListItem,
  EndOfTenancyCaseRow,
  EndOfTenancyIssueRow,
  IssueEvidenceLinkRow,
  MoveOutChecklistItemRow,
  MoveOutTrackerEventRow,
  MoveOutTrackerRow,
  PropertyRow,
  StoreDecisionReviewActionInput,
  StoreDocumentExtractionInput,
  TenancyRow,
  UpsertDepositClaimLineItemInput,
  UpsertEndOfTenancyIssueInput,
  LinkIssueEvidenceInput,
  DocumentExtractionRow,
} from '@/lib/end-of-tenancy/types'

type DbClient = SupabaseClient

const CASE_SELECT =
  'id, case_number, summary, case_type, priority, status, contact_id, tenancy_id, property_id, assigned_user_id, is_end_of_tenancy, last_activity_at, created_at, updated_at'

const TENANCY_SELECT =
  'id, property_id, tenant_contact_id, landlord_contact_id, status, tenancy_status, start_date, end_date, deposit_amount, rent_amount, deposit_scheme_name, deposit_reference, updated_at'

const PROPERTY_SELECT =
  'id, address_line_1, address_line_2, city, postcode, landlord_contact_id, property_type, furnishing_status, bedroom_count, bathroom_count, updated_at'

const DEPOSIT_CLAIM_SELECT =
  'id, case_id, tenancy_id, property_id, claim_status, total_claim_amount, tenant_agreed_amount, disputed_amount, scheme_reference, evidence_notes, submitted_at, resolved_at, updated_at'

const END_OF_TENANCY_CASE_SELECT =
  'id, case_id, tenancy_id, deposit_claim_id, workflow_status, inspection_status, move_out_date, inspection_date, closed_at, created_at, updated_at'

const CASE_DOCUMENT_SELECT =
  'id, case_id, tenancy_document_id, message_attachment_id, uploaded_by_user_id, document_role, source_type, file_name, file_url, storage_path, mime_type, checksum, captured_at, notes, created_at, updated_at'

const DOCUMENT_EXTRACTION_SELECT =
  'id, case_document_id, ai_run_id, extraction_kind, status, extracted_text, extracted_data, confidence, created_at, updated_at'

const ISSUE_SELECT =
  'id, end_of_tenancy_case_id, identified_by_ai_run_id, created_by_user_id, issue_type, title, description, room_area, status, responsibility, severity, proposed_amount, created_at, updated_at'

const EVIDENCE_LINK_SELECT =
  'id, issue_id, case_document_id, document_extraction_id, link_type, excerpt, page_number, locator, created_at, updated_at'

const RECOMMENDATION_SELECT =
  'id, end_of_tenancy_case_id, ai_run_id, reviewed_by_user_id, recommendation_status, recommended_outcome, decision_summary, rationale, total_recommended_amount, human_review_required, reviewed_at, created_at, updated_at'

const RECOMMENDATION_SOURCE_SELECT =
  'id, decision_recommendation_id, source_type, issue_id, issue_evidence_link_id, case_document_id, document_extraction_id, knowledge_article_id, knowledge_article_chunk_id, deposit_claim_id, source_note, created_at'

const LINE_ITEM_SELECT =
  'id, deposit_claim_id, end_of_tenancy_issue_id, decision_recommendation_id, line_item_status, category, description, amount_claimed, amount_agreed, amount_awarded, notes, created_at, updated_at'

const REVIEW_ACTION_SELECT =
  'id, decision_recommendation_id, actor_user_id, ai_run_id, actor_type, action_type, action_notes, created_at'

const MOVE_OUT_TRACKER_SELECT =
  'id, tenancy_id, case_id, end_of_tenancy_case_id, property_id, tenant_contact_id, landlord_contact_id, current_stage, public_status, next_action_title, next_action_detail, started_at, last_event_at, completed_at, created_at, updated_at'

const MOVE_OUT_CHECKLIST_ITEM_SELECT =
  'id, move_out_tracker_id, item_key, audience, status, is_required, notes, completed_at, completed_by_user_id, source_table, source_record_id, created_at, updated_at'

const MOVE_OUT_TRACKER_EVENT_SELECT =
  'id, move_out_tracker_id, actor_user_id, actor_type, source_table, source_record_id, event_type, title, detail, metadata, is_portal_visible, created_at'

function getClient(supabase?: DbClient) {
  return supabase ?? getSupabaseServiceRoleClient()
}

function dedupe(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

async function requireMaybeSingle<T>(
  label: string,
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>
) {
  const { data, error } = await query

  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }

  return data
}

async function requireMany<T>(
  label: string,
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>
) {
  const { data, error } = await query

  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }

  return data ?? []
}

async function loadCasesByIds(supabase: DbClient, caseIds: string[]) {
  if (caseIds.length === 0) {
    return new Map<string, CaseRow>()
  }

  const rows = await requireMany<CaseRow>(
    'Unable to load cases',
    supabase.from('cases').select(CASE_SELECT).in('id', caseIds)
  )

  return new Map(rows.map((row) => [row.id, row]))
}

async function loadTenanciesByIds(supabase: DbClient, tenancyIds: string[]) {
  if (tenancyIds.length === 0) {
    return new Map<string, TenancyRow>()
  }

  const rows = await requireMany<TenancyRow>(
    'Unable to load tenancies',
    supabase.from('tenancies').select(TENANCY_SELECT).in('id', tenancyIds)
  )

  return new Map(rows.map((row) => [row.id, row]))
}

async function loadPropertiesByIds(supabase: DbClient, propertyIds: string[]) {
  if (propertyIds.length === 0) {
    return new Map<string, PropertyRow>()
  }

  const rows = await requireMany<PropertyRow>(
    'Unable to load properties',
    supabase.from('properties').select(PROPERTY_SELECT).in('id', propertyIds)
  )

  return new Map(rows.map((row) => [row.id, row]))
}

async function loadDepositClaimsByIds(supabase: DbClient, depositClaimIds: string[]) {
  if (depositClaimIds.length === 0) {
    return new Map<string, DepositClaimRow>()
  }

  const rows = await requireMany<DepositClaimRow>(
    'Unable to load deposit claims',
    supabase.from('deposit_claims').select(DEPOSIT_CLAIM_SELECT).in('id', depositClaimIds)
  )

  return new Map(rows.map((row) => [row.id, row]))
}

export async function createEndOfTenancyCaseExtension(
  input: CreateEndOfTenancyCaseInput,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)
  const baseCase = await requireMaybeSingle<CaseRow>(
    'Unable to load base case',
    supabase.from('cases').select(CASE_SELECT).eq('id', input.caseId).maybeSingle()
  )

  if (!baseCase) {
    throw new Error(`Case ${input.caseId} was not found.`)
  }

  const tenancyId = input.tenancyId ?? baseCase.tenancy_id

  if (!tenancyId) {
    throw new Error('An end-of-tenancy case requires a tenancy_id on the base case or in the create payload.')
  }

  const row = {
    case_id: input.caseId,
    tenancy_id: tenancyId,
    deposit_claim_id: input.depositClaimId ?? null,
    workflow_status: input.workflowStatus ?? 'evidence_pending',
    inspection_status: input.inspectionStatus ?? 'not_started',
    move_out_date: input.moveOutDate ?? null,
    inspection_date: input.inspectionDate ?? null,
  }

  const { data, error } = await supabase
    .from('end_of_tenancy_cases')
    .upsert(row, { onConflict: 'case_id' })
    .select(END_OF_TENANCY_CASE_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to create end-of-tenancy case extension: ${error.message}`)
  }

  return data as EndOfTenancyCaseRow
}

export async function listEndOfTenancyCases(options?: {
  supabase?: DbClient
  limit?: number
  workflowStatus?: EndOfTenancyCaseRow['workflow_status']
}) {
  const supabase = getClient(options?.supabase)
  let query = supabase
    .from('end_of_tenancy_cases')
    .select(END_OF_TENANCY_CASE_SELECT)
    .order('updated_at', { ascending: false })
    .limit(options?.limit ?? 100)

  if (options?.workflowStatus) {
    query = query.eq('workflow_status', options.workflowStatus)
  }

  const eotCases = await requireMany<EndOfTenancyCaseRow>('Unable to list end-of-tenancy cases', query)

  const caseMap = await loadCasesByIds(supabase, dedupe(eotCases.map((row) => row.case_id)))
  const tenancyMap = await loadTenanciesByIds(supabase, dedupe(eotCases.map((row) => row.tenancy_id)))
  const depositClaimMap = await loadDepositClaimsByIds(
    supabase,
    dedupe(eotCases.map((row) => row.deposit_claim_id))
  )
  const trackerRows =
    eotCases.length > 0
      ? await requireMany<MoveOutTrackerRow>(
          'Unable to load move-out trackers',
          supabase
            .from('move_out_trackers')
            .select(MOVE_OUT_TRACKER_SELECT)
            .in('end_of_tenancy_case_id', dedupe(eotCases.map((row) => row.id)))
        )
      : []
  const trackerByEndOfTenancyCaseId = new Map(
    trackerRows.map((row) => [row.end_of_tenancy_case_id, row] as const)
  )

  const propertyMap = await loadPropertiesByIds(
    supabase,
    dedupe(
      eotCases.map((row) => {
        const tenancy = tenancyMap.get(row.tenancy_id)
        const baseCase = caseMap.get(row.case_id)
        return tenancy?.property_id ?? baseCase?.property_id ?? null
      })
    )
  )

  return eotCases.map<EndOfTenancyCaseListItem>((endOfTenancyCase) => {
    const caseRow = caseMap.get(endOfTenancyCase.case_id) ?? null
    const tenancy = tenancyMap.get(endOfTenancyCase.tenancy_id) ?? null
    const propertyId = tenancy?.property_id ?? caseRow?.property_id ?? null

    return {
      endOfTenancyCase,
      case: caseRow,
      tenancy,
      property: propertyId ? propertyMap.get(propertyId) ?? null : null,
      depositClaim: endOfTenancyCase.deposit_claim_id
        ? depositClaimMap.get(endOfTenancyCase.deposit_claim_id) ?? null
        : null,
      moveOutTracker: trackerByEndOfTenancyCaseId.get(endOfTenancyCase.id) ?? null,
    }
  })
}

export async function attachCaseDocument(
  input: AttachCaseDocumentInput,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)

  // Assumption: tenancy_documents.id and message_attachments.id are UUIDs like the rest of the dashboard schema.
  const { data, error } = await supabase
    .from('case_documents')
    .insert({
      case_id: input.caseId,
      tenancy_document_id: input.tenancyDocumentId ?? null,
      message_attachment_id: input.messageAttachmentId ?? null,
      uploaded_by_user_id: input.uploadedByUserId ?? null,
      document_role: input.documentRole ?? 'supporting_evidence',
      source_type: input.sourceType ?? 'manual_upload',
      file_name: input.fileName ?? null,
      file_url: input.fileUrl ?? null,
      storage_path: input.storagePath ?? null,
      mime_type: input.mimeType ?? null,
      checksum: input.checksum ?? null,
      captured_at: input.capturedAt ?? null,
      notes: input.notes ?? null,
    })
    .select(CASE_DOCUMENT_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to attach case document: ${error.message}`)
  }

  return data as CaseDocumentRow
}

export async function storeDocumentExtractionResult(
  input: StoreDocumentExtractionInput,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    case_document_id: input.caseDocumentId,
    ai_run_id: input.aiRunId ?? null,
    extraction_kind: input.extractionKind ?? 'structured',
    status: input.status ?? 'completed',
    extracted_text: input.extractedText ?? null,
    extracted_data: input.extractedData ?? {},
    confidence: input.confidence ?? null,
  }

  const { data, error } = await supabase
    .from('document_extractions')
    .upsert(payload)
    .select(DOCUMENT_EXTRACTION_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to store document extraction: ${error.message}`)
  }

  return data as DocumentExtractionRow
}

export async function upsertEndOfTenancyIssue(
  input: UpsertEndOfTenancyIssueInput,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    end_of_tenancy_case_id: input.endOfTenancyCaseId,
    identified_by_ai_run_id: input.identifiedByAiRunId ?? null,
    created_by_user_id: input.createdByUserId ?? null,
    issue_type: input.issueType,
    title: input.title,
    description: input.description ?? null,
    room_area: input.roomArea ?? null,
    status: input.status ?? 'open',
    responsibility: input.responsibility ?? 'undetermined',
    severity: input.severity ?? 'medium',
    proposed_amount: input.proposedAmount ?? null,
  }

  const { data, error } = await supabase
    .from('end_of_tenancy_issues')
    .upsert(payload)
    .select(ISSUE_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to save end-of-tenancy issue: ${error.message}`)
  }

  return data as EndOfTenancyIssueRow
}

export async function linkEvidenceToIssue(
  input: LinkIssueEvidenceInput,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)

  const { data, error } = await supabase
    .from('issue_evidence_links')
    .insert({
      issue_id: input.issueId,
      case_document_id: input.caseDocumentId,
      document_extraction_id: input.documentExtractionId ?? null,
      link_type: input.linkType ?? 'supports',
      excerpt: input.excerpt ?? null,
      page_number: input.pageNumber ?? null,
      locator: input.locator ?? {},
    })
    .select(EVIDENCE_LINK_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to link evidence to issue: ${error.message}`)
  }

  return data as IssueEvidenceLinkRow
}

export async function createDecisionRecommendation(
  input: CreateDecisionRecommendationInput,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)
  const { sources = [], ...recommendationInput } = input

  const { data, error } = await supabase
    .from('decision_recommendations')
    .insert({
      end_of_tenancy_case_id: recommendationInput.endOfTenancyCaseId,
      ai_run_id: recommendationInput.aiRunId ?? null,
      reviewed_by_user_id: recommendationInput.reviewedByUserId ?? null,
      recommendation_status: recommendationInput.recommendationStatus ?? 'draft',
      recommended_outcome: recommendationInput.recommendedOutcome ?? 'no_decision',
      decision_summary: recommendationInput.decisionSummary ?? null,
      rationale: recommendationInput.rationale ?? null,
      total_recommended_amount: recommendationInput.totalRecommendedAmount ?? null,
      human_review_required: recommendationInput.humanReviewRequired ?? true,
      reviewed_at: recommendationInput.reviewedAt ?? null,
    })
    .select(RECOMMENDATION_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to create decision recommendation: ${error.message}`)
  }

  const recommendation = data as DecisionRecommendationRow

  if (sources.length > 0) {
    const { error: sourceError } = await supabase.from('decision_recommendation_sources').insert(
      sources.map((source) => ({
        decision_recommendation_id: recommendation.id,
        source_type: source.sourceType,
        issue_id: source.issueId ?? null,
        issue_evidence_link_id: source.issueEvidenceLinkId ?? null,
        case_document_id: source.caseDocumentId ?? null,
        document_extraction_id: source.documentExtractionId ?? null,
        knowledge_article_id: source.knowledgeArticleId ?? null,
        knowledge_article_chunk_id: source.knowledgeArticleChunkId ?? null,
        deposit_claim_id: source.depositClaimId ?? null,
        source_note: source.sourceNote ?? null,
      }))
    )

    if (sourceError) {
      throw new Error(`Recommendation created but sources failed to save: ${sourceError.message}`)
    }
  }

  return recommendation
}

export async function upsertDepositClaimLineItem(
  input: UpsertDepositClaimLineItemInput,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    deposit_claim_id: input.depositClaimId,
    end_of_tenancy_issue_id: input.endOfTenancyIssueId ?? null,
    decision_recommendation_id: input.decisionRecommendationId ?? null,
    line_item_status: input.lineItemStatus ?? 'draft',
    category: input.category,
    description: input.description,
    amount_claimed: input.amountClaimed,
    amount_agreed: input.amountAgreed ?? null,
    amount_awarded: input.amountAwarded ?? null,
    notes: input.notes ?? null,
  }

  const { data, error } = await supabase
    .from('deposit_claim_line_items')
    .upsert(payload)
    .select(LINE_ITEM_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to save deposit claim line item: ${error.message}`)
  }

  return data as DepositClaimLineItemRow
}

export async function storeDecisionReviewAction(
  input: StoreDecisionReviewActionInput,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)

  const { data, error } = await supabase
    .from('decision_review_actions')
    .insert({
      decision_recommendation_id: input.decisionRecommendationId,
      actor_user_id: input.actorUserId ?? null,
      ai_run_id: input.aiRunId ?? null,
      actor_type: input.actorType ?? 'user',
      action_type: input.actionType,
      action_notes: input.actionNotes ?? null,
    })
    .select(REVIEW_ACTION_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to store decision review action: ${error.message}`)
  }

  return data as DecisionReviewActionRow
}

export async function getEndOfTenancyCaseDetail(
  endOfTenancyCaseId: string,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)
  const endOfTenancyCase = await requireMaybeSingle<EndOfTenancyCaseRow>(
    'Unable to load end-of-tenancy case',
    supabase
      .from('end_of_tenancy_cases')
      .select(END_OF_TENANCY_CASE_SELECT)
      .eq('id', endOfTenancyCaseId)
      .maybeSingle()
  )

  if (!endOfTenancyCase) {
    return null
  }

  const baseCase = await requireMaybeSingle<CaseRow>(
    'Unable to load base case',
    supabase.from('cases').select(CASE_SELECT).eq('id', endOfTenancyCase.case_id).maybeSingle()
  )

  const tenancy = await requireMaybeSingle<TenancyRow>(
    'Unable to load tenancy',
    supabase.from('tenancies').select(TENANCY_SELECT).eq('id', endOfTenancyCase.tenancy_id).maybeSingle()
  )

  const propertyId = tenancy?.property_id ?? baseCase?.property_id ?? null

  const [property, depositClaim, documents, issues, recommendations] = await Promise.all([
    propertyId
      ? requireMaybeSingle<PropertyRow>(
          'Unable to load property',
          supabase.from('properties').select(PROPERTY_SELECT).eq('id', propertyId).maybeSingle()
        )
      : Promise.resolve(null),
    endOfTenancyCase.deposit_claim_id
      ? requireMaybeSingle<DepositClaimRow>(
          'Unable to load deposit claim',
          supabase
            .from('deposit_claims')
            .select(DEPOSIT_CLAIM_SELECT)
            .eq('id', endOfTenancyCase.deposit_claim_id)
            .maybeSingle()
        )
      : Promise.resolve(null),
    requireMany<CaseDocumentRow>(
      'Unable to load case documents',
      supabase.from('case_documents').select(CASE_DOCUMENT_SELECT).eq('case_id', endOfTenancyCase.case_id).order('created_at')
    ),
    requireMany<EndOfTenancyIssueRow>(
      'Unable to load end-of-tenancy issues',
      supabase
        .from('end_of_tenancy_issues')
        .select(ISSUE_SELECT)
        .eq('end_of_tenancy_case_id', endOfTenancyCase.id)
        .order('created_at')
    ),
    requireMany<DecisionRecommendationRow>(
      'Unable to load decision recommendations',
      supabase
        .from('decision_recommendations')
        .select(RECOMMENDATION_SELECT)
        .eq('end_of_tenancy_case_id', endOfTenancyCase.id)
        .order('created_at')
    ),
  ])

  const moveOutTracker = await requireMaybeSingle<MoveOutTrackerRow>(
    'Unable to load move-out tracker',
    supabase
      .from('move_out_trackers')
      .select(MOVE_OUT_TRACKER_SELECT)
      .eq('end_of_tenancy_case_id', endOfTenancyCase.id)
      .maybeSingle()
  )

  const documentIds = dedupe(documents.map((row) => row.id))
  const issueIds = dedupe(issues.map((row) => row.id))
  const recommendationIds = dedupe(recommendations.map((row) => row.id))

  const trackerId = moveOutTracker?.id ?? null

  const [extractions, evidenceLinks, recommendationSources, lineItems, reviewActions, moveOutChecklistItems, moveOutTrackerEvents] = await Promise.all([
    documentIds.length > 0
      ? requireMany<DocumentExtractionRow>(
          'Unable to load document extractions',
          supabase
            .from('document_extractions')
            .select(DOCUMENT_EXTRACTION_SELECT)
            .in('case_document_id', documentIds)
            .order('created_at')
        )
      : Promise.resolve([]),
    issueIds.length > 0
      ? requireMany<IssueEvidenceLinkRow>(
          'Unable to load issue evidence links',
          supabase
            .from('issue_evidence_links')
            .select(EVIDENCE_LINK_SELECT)
            .in('issue_id', issueIds)
            .order('created_at')
        )
      : Promise.resolve([]),
    recommendationIds.length > 0
      ? requireMany<DecisionRecommendationSourceRow>(
          'Unable to load recommendation sources',
          supabase
            .from('decision_recommendation_sources')
            .select(RECOMMENDATION_SOURCE_SELECT)
            .in('decision_recommendation_id', recommendationIds)
            .order('created_at')
        )
      : Promise.resolve([]),
    depositClaim?.id
      ? requireMany<DepositClaimLineItemRow>(
          'Unable to load deposit claim line items',
          supabase
            .from('deposit_claim_line_items')
            .select(LINE_ITEM_SELECT)
            .eq('deposit_claim_id', depositClaim.id)
            .order('created_at')
        )
      : Promise.resolve([]),
    recommendationIds.length > 0
      ? requireMany<DecisionReviewActionRow>(
          'Unable to load decision review actions',
          supabase
            .from('decision_review_actions')
            .select(REVIEW_ACTION_SELECT)
            .in('decision_recommendation_id', recommendationIds)
            .order('created_at')
        )
      : Promise.resolve([]),
    trackerId
      ? requireMany<MoveOutChecklistItemRow>(
          'Unable to load move-out checklist items',
          supabase
            .from('move_out_checklist_items')
            .select(MOVE_OUT_CHECKLIST_ITEM_SELECT)
            .eq('move_out_tracker_id', trackerId)
            .order('created_at')
        )
      : Promise.resolve([]),
    trackerId
      ? requireMany<MoveOutTrackerEventRow>(
          'Unable to load move-out tracker events',
          supabase
            .from('move_out_tracker_events')
            .select(MOVE_OUT_TRACKER_EVENT_SELECT)
            .eq('move_out_tracker_id', trackerId)
            .order('created_at')
        )
      : Promise.resolve([]),
  ])

  const detail: EndOfTenancyCaseDetail = {
    endOfTenancyCase,
    case: baseCase,
    tenancy,
    property,
    depositClaim,
    moveOutTracker,
    documents,
    extractions,
    issues,
    evidenceLinks,
    recommendations,
    recommendationSources,
    lineItems,
    reviewActions,
    moveOutChecklistItems,
    moveOutTrackerEvents,
  }

  return detail
}
