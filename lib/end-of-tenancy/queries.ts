import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import type {
  AttachCaseDocumentInput,
  CaseCommunicationAttachment,
  CaseCommunicationRecord,
  CaseCommunicationRow,
  CaseDocumentRow,
  CaseDocumentSummary,
  CaseRow,
  ContactSummaryRow,
  CreateCaseCommunicationInput,
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
  UserProfileSummaryRow,
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

const CASE_COMMUNICATION_SELECT =
  'id, case_id, end_of_tenancy_case_id, thread_key, direction, channel, recipient_role, sender_user_id, sender_contact_id, recipient_contact_id, subject, body, attachments, metadata, status, unread, sent_at, read_at, created_at, updated_at'

const END_OF_TENANCY_CASE_LIST_CASE_SELECT =
  'id, case_number, status, property_id, assigned_user_id, last_activity_at, updated_at, created_at'

const END_OF_TENANCY_CASE_LIST_TENANCY_SELECT =
  'id, property_id, tenant_contact_id, landlord_contact_id, end_date'

const END_OF_TENANCY_CASE_LIST_PROPERTY_SELECT =
  'id, address_line_1, address_line_2, city, postcode'

function getClient(supabase?: DbClient) {
  return supabase ?? getSupabaseServiceRoleClient()
}

function dedupe(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

function getContactLabel(contact: {
  full_name?: string | null
  company_name?: string | null
  email?: string | null
} | null) {
  return contact?.full_name?.trim() || contact?.company_name?.trim() || contact?.email?.trim() || null
}

function getUserLabel(user: {
  full_name?: string | null
  email?: string | null
} | null) {
  return user?.full_name?.trim() || user?.email?.trim() || null
}

function emptyDocumentSummary(): CaseDocumentSummary {
  return {
    total: 0,
    checkIn: 0,
    checkOut: 0,
    photos: 0,
    supporting: 0,
    invoices: 0,
    receipts: 0,
    other: 0,
  }
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

  if (eotCases.length === 0) {
    return []
  }

  const caseIds = dedupe(eotCases.map((row) => row.case_id))
  const tenancyIds = dedupe(eotCases.map((row) => row.tenancy_id))
  const depositClaimIds = dedupe(eotCases.map((row) => row.deposit_claim_id))
  const endOfTenancyCaseIds = dedupe(eotCases.map((row) => row.id))

  const [caseResult, tenancyResult, depositClaimResult, moveOutTrackerResult, documentSummaryResult] = await Promise.all([
    caseIds.length
      ? supabase.from('cases').select(END_OF_TENANCY_CASE_LIST_CASE_SELECT).in('id', caseIds)
      : Promise.resolve({ data: [], error: null }),
    tenancyIds.length
      ? supabase
          .from('tenancies')
          .select(END_OF_TENANCY_CASE_LIST_TENANCY_SELECT)
          .in('id', tenancyIds)
      : Promise.resolve({ data: [], error: null }),
    depositClaimIds.length
      ? supabase.from('deposit_claims').select(DEPOSIT_CLAIM_SELECT).in('id', depositClaimIds)
      : Promise.resolve({ data: [], error: null }),
    endOfTenancyCaseIds.length
      ? supabase
          .from('move_out_trackers')
          .select(MOVE_OUT_TRACKER_SELECT)
          .in('end_of_tenancy_case_id', endOfTenancyCaseIds)
      : Promise.resolve({ data: [], error: null }),
    caseIds.length
      ? supabase.from('case_documents').select('id, case_id, document_role').in('case_id', caseIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (caseResult.error) {
    throw new Error(`Unable to load cases: ${caseResult.error.message}`)
  }

  if (tenancyResult.error) {
    throw new Error(`Unable to load tenancies: ${tenancyResult.error.message}`)
  }

  if (depositClaimResult.error) {
    throw new Error(`Unable to load deposit claims: ${depositClaimResult.error.message}`)
  }

  if (moveOutTrackerResult.error) {
    throw new Error(`Unable to load move-out trackers: ${moveOutTrackerResult.error.message}`)
  }

  if (documentSummaryResult.error) {
    throw new Error(`Unable to load case document summaries: ${documentSummaryResult.error.message}`)
  }

  const caseRows = ((caseResult.data || []) as unknown) as CaseRow[]
  const tenancyRows = ((tenancyResult.data || []) as unknown) as TenancyRow[]
  const depositClaimRows = ((depositClaimResult.data || []) as unknown) as DepositClaimRow[]
  const moveOutTrackerRows = ((moveOutTrackerResult.data || []) as unknown) as MoveOutTrackerRow[]
  const documentSummaryRows = ((documentSummaryResult.data || []) as Array<{
    id: string
    case_id: string
    document_role: string | null
  }>)

  const caseMap = new Map(caseRows.map((row) => [row.id, row]))
  const tenancyMap = new Map(tenancyRows.map((row) => [row.id, row]))
  const depositClaimMap = new Map(depositClaimRows.map((row) => [row.id, row]))
  const moveOutTrackerMap = new Map(
    moveOutTrackerRows.map((row) => [row.end_of_tenancy_case_id, row])
  )
  const documentSummaryMap = new Map<string, CaseDocumentSummary>()

  for (const row of documentSummaryRows) {
    const summary = documentSummaryMap.get(row.case_id) ?? emptyDocumentSummary()
    summary.total += 1

    switch (row.document_role) {
      case 'check_in':
        summary.checkIn += 1
        break
      case 'check_out':
        summary.checkOut += 1
        break
      case 'photo':
        summary.photos += 1
        break
      case 'supporting_evidence':
        summary.supporting += 1
        break
      case 'invoice':
        summary.invoices += 1
        break
      case 'receipt':
        summary.receipts += 1
        break
      default:
        summary.other += 1
        break
    }

    documentSummaryMap.set(row.case_id, summary)
  }

  const propertyIds = dedupe(
    eotCases.map((row) => {
      const tenancy = tenancyMap.get(row.tenancy_id)
      const baseCase = caseMap.get(row.case_id)
      return tenancy?.property_id ?? baseCase?.property_id ?? null
    })
  )
  const contactIds = dedupe(
    eotCases.flatMap((row) => {
      const tenancy = tenancyMap.get(row.tenancy_id)
      return [tenancy?.tenant_contact_id, tenancy?.landlord_contact_id]
    })
  )
  const userIds = dedupe(eotCases.map((row) => caseMap.get(row.case_id)?.assigned_user_id ?? null))

  const [propertyResult, contactResult, userResult] = await Promise.all([
    propertyIds.length
      ? supabase
          .from('properties')
          .select(END_OF_TENANCY_CASE_LIST_PROPERTY_SELECT)
          .in('id', propertyIds)
      : Promise.resolve({ data: [], error: null }),
    contactIds.length
      ? supabase.from('contacts').select('id, full_name').in('id', contactIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase.from('users_profiles').select('id, full_name').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (propertyResult.error) {
    throw new Error(`Unable to load properties: ${propertyResult.error.message}`)
  }

  if (contactResult.error) {
    throw new Error(`Unable to load contacts: ${contactResult.error.message}`)
  }

  if (userResult.error) {
    throw new Error(`Unable to load users: ${userResult.error.message}`)
  }

  const propertyRows = ((propertyResult.data || []) as unknown) as PropertyRow[]
  const contactRows = ((contactResult.data || []) as unknown) as ContactSummaryRow[]
  const userRows = ((userResult.data || []) as unknown) as UserProfileSummaryRow[]

  const propertyMap = new Map(
    propertyRows.map((row) => [row.id, row])
  )
  const contactMap = new Map(
    contactRows.map((row) => [row.id, row])
  )
  const userMap = new Map(
    userRows.map((row) => [row.id, row])
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
      tenant: tenancy?.tenant_contact_id ? contactMap.get(tenancy.tenant_contact_id) ?? null : null,
      landlord: tenancy?.landlord_contact_id
        ? contactMap.get(tenancy.landlord_contact_id) ?? null
        : null,
      assignedOperator: caseRow?.assigned_user_id
        ? userMap.get(caseRow.assigned_user_id) ?? null
        : null,
      depositClaim: endOfTenancyCase.deposit_claim_id
        ? depositClaimMap.get(endOfTenancyCase.deposit_claim_id) ?? null
        : null,
      moveOutTracker: moveOutTrackerMap.get(endOfTenancyCase.id) ?? null,
      documentSummary: documentSummaryMap.get(endOfTenancyCase.case_id) ?? emptyDocumentSummary(),
    }
  })
}

export async function listCaseCommunicationRecords(
  options?: {
    supabase?: DbClient
    caseIds?: string[]
    endOfTenancyCaseIds?: string[]
    unreadOnly?: boolean
    limit?: number
  }
) {
  const supabase = getClient(options?.supabase)
  let query = supabase
    .from('case_communications')
    .select(CASE_COMMUNICATION_SELECT)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 250)

  if (options?.caseIds?.length) {
    query = query.in('case_id', dedupe(options.caseIds))
  }

  if (options?.endOfTenancyCaseIds?.length) {
    query = query.in('end_of_tenancy_case_id', dedupe(options.endOfTenancyCaseIds))
  }

  if (options?.unreadOnly) {
    query = query.eq('unread', true)
  }

  const rows = await requireMany<CaseCommunicationRow>('Unable to load case communications', query)

  if (rows.length === 0) {
    return []
  }

  const userIds = dedupe(rows.map((row) => row.sender_user_id))
  const contactIds = dedupe(
    rows.flatMap((row) => [row.sender_contact_id, row.recipient_contact_id])
  )

  const [userResult, contactResult] = await Promise.all([
    userIds.length
      ? supabase.from('users_profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
    contactIds.length
      ? supabase
          .from('contacts')
          .select('id, full_name, company_name, email')
          .in('id', contactIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (userResult.error) {
    throw new Error(`Unable to load communication users: ${userResult.error.message}`)
  }

  if (contactResult.error) {
    throw new Error(`Unable to load communication contacts: ${contactResult.error.message}`)
  }

  const userMap = new Map(
    (((userResult.data || []) as Array<{ id: string; full_name: string | null; email: string | null }>).map(
      (user) => [user.id, user] as const
    ))
  )
  const contactMap = new Map(
    (((contactResult.data || []) as Array<{
      id: string
      full_name: string | null
      company_name: string | null
      email: string | null
    }>).map((contact) => [contact.id, contact] as const))
  )

  return rows.map<CaseCommunicationRecord>((row) => ({
    ...row,
    sender_name: row.sender_user_id
      ? getUserLabel(userMap.get(row.sender_user_id) ?? null)
      : getContactLabel(row.sender_contact_id ? contactMap.get(row.sender_contact_id) ?? null : null),
    recipient_name: row.recipient_contact_id
      ? getContactLabel(contactMap.get(row.recipient_contact_id) ?? null)
      : row.recipient_role === 'internal'
        ? 'Internal'
        : null,
  }))
}

export async function createCaseCommunication(
  input: CreateCaseCommunicationInput,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)

  const attachments = (input.attachments ?? []).map<CaseCommunicationAttachment>((attachment) => ({
    case_document_id: attachment.case_document_id ?? null,
    file_name: attachment.file_name ?? null,
    file_url: attachment.file_url ?? null,
    document_role: attachment.document_role ?? null,
  }))

  const { data, error } = await supabase
    .from('case_communications')
    .insert({
      case_id: input.caseId,
      end_of_tenancy_case_id: input.endOfTenancyCaseId ?? null,
      thread_key: input.threadKey ?? 'primary',
      direction: input.direction,
      channel: input.channel,
      recipient_role: input.recipientRole,
      sender_user_id: input.senderUserId ?? null,
      sender_contact_id: input.senderContactId ?? null,
      recipient_contact_id: input.recipientContactId ?? null,
      subject: input.subject ?? null,
      body: input.body,
      attachments,
      metadata: input.metadata ?? {},
      status: input.status ?? 'draft',
      unread: input.unread ?? false,
      sent_at: input.sentAt ?? null,
      read_at: input.readAt ?? null,
    })
    .select(CASE_COMMUNICATION_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to create case communication: ${error.message}`)
  }

  const communication = data as CaseCommunicationRow

  const [userResult, contactResult] = await Promise.all([
    communication.sender_user_id
      ? supabase
          .from('users_profiles')
          .select('id, full_name, email')
          .eq('id', communication.sender_user_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    [communication.sender_contact_id, communication.recipient_contact_id].filter(Boolean).length > 0
      ? supabase
          .from('contacts')
          .select('id, full_name, company_name, email')
          .in(
            'id',
            [communication.sender_contact_id, communication.recipient_contact_id].filter(
              Boolean
            ) as string[]
          )
      : Promise.resolve({ data: [], error: null }),
  ])

  if (userResult.error) {
    throw new Error(`Unable to load communication sender: ${userResult.error.message}`)
  }

  if (contactResult.error) {
    throw new Error(`Unable to load communication contacts: ${contactResult.error.message}`)
  }

  const contacts = (contactResult.data || []) as Array<{
    id: string
    full_name: string | null
    company_name: string | null
    email: string | null
  }>
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact] as const))

  return {
    ...communication,
    sender_name: communication.sender_user_id
      ? getUserLabel((userResult.data as { full_name?: string | null; email?: string | null } | null) ?? null)
      : getContactLabel(
          communication.sender_contact_id
            ? contactMap.get(communication.sender_contact_id) ?? null
            : null
        ),
    recipient_name: communication.recipient_contact_id
      ? getContactLabel(contactMap.get(communication.recipient_contact_id) ?? null)
      : communication.recipient_role === 'internal'
        ? 'Internal'
        : null,
  }
}

export async function markCaseCommunicationRead(
  communicationId: string,
  options?: { supabase?: DbClient }
) {
  const supabase = getClient(options?.supabase)
  const { data, error } = await supabase
    .from('case_communications')
    .update({
      unread: false,
      read_at: new Date().toISOString(),
      status: 'read',
    })
    .eq('id', communicationId)
    .select(CASE_COMMUNICATION_SELECT)
    .single()

  if (error) {
    throw new Error(`Unable to mark communication as read: ${error.message}`)
  }

  return data as CaseCommunicationRow
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

  // Round 2: everything that only depends on endOfTenancyCase — run in parallel
  const [baseCase, tenancy, moveOutTracker, depositClaim, documents, issues, recommendations, communications] = await Promise.all([
    requireMaybeSingle<CaseRow>(
      'Unable to load base case',
      supabase.from('cases').select(CASE_SELECT).eq('id', endOfTenancyCase.case_id).maybeSingle()
    ),
    requireMaybeSingle<TenancyRow>(
      'Unable to load tenancy',
      supabase.from('tenancies').select(TENANCY_SELECT).eq('id', endOfTenancyCase.tenancy_id).maybeSingle()
    ),
    requireMaybeSingle<MoveOutTrackerRow>(
      'Unable to load move-out tracker',
      supabase
        .from('move_out_trackers')
        .select(MOVE_OUT_TRACKER_SELECT)
        .eq('end_of_tenancy_case_id', endOfTenancyCase.id)
        .maybeSingle()
    ),
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
    listCaseCommunicationRecords({
      supabase,
      endOfTenancyCaseIds: [endOfTenancyCase.id],
      limit: 500,
    }),
  ])

  // Derive IDs needed for round 3
  const propertyId = tenancy?.property_id ?? baseCase?.property_id ?? null
  const documentIds = dedupe(documents.map((row) => row.id))
  const issueIds = dedupe(issues.map((row) => row.id))
  const recommendationIds = dedupe(recommendations.map((row) => row.id))
  const trackerId = moveOutTracker?.id ?? null

  // Round 3: property + all child collections — run in parallel
  const [property, extractions, evidenceLinks, recommendationSources, lineItems, reviewActions, moveOutChecklistItems, moveOutTrackerEvents] = await Promise.all([
    propertyId
      ? requireMaybeSingle<PropertyRow>(
          'Unable to load property',
          supabase.from('properties').select(PROPERTY_SELECT).eq('id', propertyId).maybeSingle()
        )
      : Promise.resolve(null),
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

  const documentSummary = emptyDocumentSummary()

  for (const document of documents) {
    documentSummary.total += 1

    switch (document.document_role) {
      case 'check_in':
        documentSummary.checkIn += 1
        break
      case 'check_out':
        documentSummary.checkOut += 1
        break
      case 'photo':
        documentSummary.photos += 1
        break
      case 'supporting_evidence':
        documentSummary.supporting += 1
        break
      case 'invoice':
        documentSummary.invoices += 1
        break
      case 'receipt':
        documentSummary.receipts += 1
        break
      default:
        documentSummary.other += 1
        break
    }
  }

  const detail: EndOfTenancyCaseDetail = {
    endOfTenancyCase,
    case: baseCase,
    tenancy,
    property,
    tenant: null,
    landlord: null,
    assignedOperator: null,
    depositClaim,
    moveOutTracker,
    documentSummary,
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
    communications,
  }

  return detail
}
