import 'server-only'

import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import type {
  EotDefect,
  EotWorkflowStatus,
  EotUtilityReading,
  EotKeySet,
  EotNegotiationItem,
  EotNegotiationMessage,
  EotDraftSection,
  EotRefundSummary,
  EotAIRecommendation,
  EotWorkspaceStepData,
  EotLiability,
  WorkspaceStep,
  UpdateDefectInput,
  UpdateWorkflowInput,
  SaveNegotiationMessageInput,
  SaveDraftSectionInput,
  EotInventoryDocument,
  EotEvidencePhoto,
  EotAuditEvent,
} from '@/lib/eot-types'

type Row = Record<string, unknown>

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

// ── Reads ───────────────────────────────────────────────────────

/**
 * Load the checkout_cases row for a given parent case.
 * Returns the checkout case ID needed to query child tables.
 */
async function resolveCheckoutCaseId(
  caseId: string,
  tenantId: string,
): Promise<string | null> {
  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('checkout_cases')
    .select('id')
    .eq('case_id', caseId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  return (data?.id as string) ?? null
}

export async function loadDefects(
  caseId: string,
  tenantId: string,
): Promise<EotDefect[]> {
  const checkoutCaseId = await resolveCheckoutCaseId(caseId, tenantId)
  if (!checkoutCaseId) return []

  const supabase = getSupabaseServiceRoleClient()

  const [defectsResult, roomsResult] = await Promise.all([
    supabase
      .from('checkout_defects')
      .select('*')
      .eq('case_id', checkoutCaseId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('checkout_rooms')
      .select('id, room_name')
      .eq('case_id', checkoutCaseId)
      .is('deleted_at', null),
  ])

  const rooms = (roomsResult.data ?? []) as Row[]
  const roomMap = new Map(rooms.map((r) => [r.id as string, str(r.room_name, 'Room')]))

  return ((defectsResult.data ?? []) as Row[]).map((d): EotDefect => ({
    id: d.id as string,
    case_id: caseId,
    room_id: d.room_id as string,
    room_name: roomMap.get(d.room_id as string) ?? 'Unknown room',
    title: str(d.item_name, 'Defect'),
    description: str(d.description),
    defect_type: (str(d.defect_type, 'maintenance') as EotDefect['defect_type']),
    severity: 'medium',
    checkin_condition: typeof d.condition_checkin === 'string' ? d.condition_checkin : null,
    checkout_condition: typeof d.condition_current === 'string' ? d.condition_current : null,
    ai_liability: typeof d.ai_suggested_liability === 'string'
      ? (d.ai_suggested_liability as EotLiability)
      : null,
    operator_liability: typeof d.operator_liability === 'string'
      ? (d.operator_liability as EotLiability)
      : null,
    estimated_cost: num(d.cost_estimate),
    adjusted_cost: num(d.cost_adjusted),
    excluded: d.excluded === true,
    reviewed: d.reviewed_at != null,
    reviewed_at: typeof d.reviewed_at === 'string' ? d.reviewed_at : null,
    reviewed_by: typeof d.reviewed_by === 'string' ? d.reviewed_by : null,
    ai_confidence: num(d.ai_confidence),
    ai_reasoning: typeof d.ai_reasoning === 'string' ? d.ai_reasoning : null,
    expected_lifespan: num(d.expected_lifespan),
    age_at_checkout: num(d.age_at_checkout),
    evidence_quality: typeof d.evidence_quality === 'string'
      ? (d.evidence_quality as EotDefect['evidence_quality'])
      : null,
    created_at: str(d.created_at),
    updated_at: str(d.updated_at),
  }))
}

export async function loadWorkflowStatus(
  caseId: string,
  tenantId: string,
): Promise<EotWorkflowStatus | null> {
  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('eot_workflow_status')
    .select('*')
    .eq('case_id', caseId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!data) return null

  const row = data as Row
  return {
    id: row.id as string,
    case_id: caseId,
    active_step: str(row.active_step, 'inventory') as WorkspaceStep,
    completed_steps: Array.isArray(row.completed_steps)
      ? (row.completed_steps as WorkspaceStep[])
      : [],
    updated_by: typeof row.updated_by === 'string' ? row.updated_by : null,
    updated_at: str(row.updated_at),
  }
}

export async function loadUtilities(
  caseId: string,
  tenantId: string,
): Promise<EotUtilityReading[]> {
  const checkoutCaseId = await resolveCheckoutCaseId(caseId, tenantId)
  if (!checkoutCaseId) return []

  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('checkout_utilities')
    .select('*')
    .eq('case_id', checkoutCaseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return ((data ?? []) as Row[]).map((u): EotUtilityReading => ({
    id: u.id as string,
    case_id: caseId,
    utility_type: str(u.utility_type, 'Other'),
    reading_checkin: typeof u.reading_checkin === 'number'
      ? u.reading_checkin.toLocaleString()
      : null,
    reading_checkout: typeof u.reading_checkout === 'number'
      ? u.reading_checkout.toLocaleString()
      : null,
    usage: typeof u.usage_calculated === 'number'
      ? u.usage_calculated.toLocaleString()
      : null,
    unit: str(u.unit, ''),
    meter_location: typeof u.meter_location === 'string' ? u.meter_location : null,
  }))
}

export async function loadKeys(
  caseId: string,
  tenantId: string,
): Promise<EotKeySet[]> {
  const checkoutCaseId = await resolveCheckoutCaseId(caseId, tenantId)
  if (!checkoutCaseId) return []

  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('checkout_keys')
    .select('*')
    .eq('case_id', checkoutCaseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return ((data ?? []) as Row[]).map((k): EotKeySet => ({
    id: k.id as string,
    case_id: caseId,
    set_name: str(k.set_name, 'Key set'),
    key_count: (num(k.key_count) ?? 1),
    status: k.status === 'outstanding' ? 'outstanding' : 'returned',
    notes: typeof k.details === 'string' ? k.details : null,
  }))
}

export async function loadNegotiationItems(
  caseId: string,
  tenantId: string,
): Promise<EotNegotiationItem[]> {
  const checkoutCaseId = await resolveCheckoutCaseId(caseId, tenantId)
  if (!checkoutCaseId) return []

  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('checkout_negotiation_items')
    .select('*')
    .eq('case_id', checkoutCaseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return ((data ?? []) as Row[]).map((n): EotNegotiationItem => ({
    id: n.id as string,
    case_id: caseId,
    description: str(n.description),
    proposed_amount: num(n.proposed_amount) ?? 0,
    responded_amount: num(n.responded_amount),
    status: (str(n.status, 'pending') as EotNegotiationItem['status']),
    tenant_comment: typeof n.tenant_comment === 'string' ? n.tenant_comment : null,
    created_at: str(n.created_at),
    updated_at: str(n.updated_at),
  }))
}

export async function loadNegotiationMessages(
  caseId: string,
  tenantId: string,
): Promise<EotNegotiationMessage[]> {
  const checkoutCaseId = await resolveCheckoutCaseId(caseId, tenantId)
  if (!checkoutCaseId) return []

  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('checkout_timeline')
    .select('*')
    .eq('case_id', checkoutCaseId)
    .eq('event_type', 'negotiation_message')
    .is('deleted_at', null)
    .order('event_date', { ascending: true })

  return ((data ?? []) as Row[]).map((m): EotNegotiationMessage => ({
    id: m.id as string,
    case_id: caseId,
    sender_role: (str(m.performed_by, 'operator') as EotNegotiationMessage['sender_role']),
    sender_name: str(m.performed_by, 'System'),
    content: str(m.event_description),
    sent_at: str(m.event_date),
  }))
}

export async function loadDraftSections(
  caseId: string,
  tenantId: string,
): Promise<EotDraftSection[]> {
  const checkoutCaseId = await resolveCheckoutCaseId(caseId, tenantId)
  if (!checkoutCaseId) return []

  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('checkout_email_drafts')
    .select('*')
    .eq('case_id', checkoutCaseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return ((data ?? []) as Row[]).map((d, i): EotDraftSection => ({
    id: d.id as string,
    case_id: caseId,
    section_key: str(d.draft_type, `section_${i}`),
    title: str(d.subject, 'Draft section'),
    content: str(d.body),
    sort_order: i,
    updated_at: str(d.updated_at),
  }))
}

export async function loadRefundSummary(
  caseId: string,
  tenantId: string,
): Promise<EotRefundSummary | null> {
  const checkoutCaseId = await resolveCheckoutCaseId(caseId, tenantId)
  if (!checkoutCaseId) return null

  const supabase = getSupabaseServiceRoleClient()

  const [caseResult, itemsResult] = await Promise.all([
    supabase
      .from('checkout_cases')
      .select('deposit_held')
      .eq('id', checkoutCaseId)
      .maybeSingle(),
    supabase
      .from('checkout_negotiation_items')
      .select('description, proposed_amount, responded_amount, status')
      .eq('case_id', checkoutCaseId)
      .is('deleted_at', null),
  ])

  const depositHeld = num((caseResult.data as Row | null)?.deposit_held) ?? 0
  const items = ((itemsResult.data ?? []) as Row[])

  let agreedDeductions = 0
  let disputedDeductions = 0
  const lineItems: EotRefundSummary['line_items'] = []

  for (const item of items) {
    const status = str(item.status, 'pending') as EotNegotiationItem['status']
    const amount = num(item.responded_amount) ?? num(item.proposed_amount) ?? 0

    lineItems.push({
      description: str(item.description),
      amount,
      status,
    })

    if (status === 'agreed') {
      agreedDeductions += amount
    } else {
      disputedDeductions += amount
    }
  }

  return {
    deposit_held: depositHeld,
    agreed_deductions: agreedDeductions,
    disputed_deductions: disputedDeductions,
    refund_to_tenant: depositHeld - agreedDeductions,
    line_items: lineItems,
  }
}

export async function loadAIRecommendations(
  caseId: string,
  tenantId: string,
): Promise<EotAIRecommendation[]> {
  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('eot_ai_recommendations')
    .select('*')
    .eq('case_id', caseId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('generated_at', { ascending: false })

  return ((data ?? []) as Row[]).map((r): EotAIRecommendation => ({
    id: r.id as string,
    case_id: caseId,
    defect_id: typeof r.defect_id === 'string' ? r.defect_id : null,
    issue_id: typeof r.issue_id === 'string' ? r.issue_id : null,
    recommendation_type: str(r.recommendation_type, 'liability') as EotAIRecommendation['recommendation_type'],
    confidence: num(r.confidence) ?? 0,
    reasoning: str(r.reasoning),
    model_id: str(r.model_id, 'gpt-4o'),
    model_version: str(r.model_version, '2024-08-06'),
    generated_at: str(r.generated_at),
    operator_override: typeof r.operator_override === 'string'
      ? (r.operator_override as EotLiability)
      : null,
    operator_override_reason: typeof r.operator_override_reason === 'string'
      ? r.operator_override_reason
      : null,
    operator_override_at: typeof r.operator_override_at === 'string'
      ? r.operator_override_at
      : null,
    operator_override_by: typeof r.operator_override_by === 'string'
      ? r.operator_override_by
      : null,
    final_outcome: typeof r.final_outcome === 'string'
      ? (r.final_outcome as EotLiability)
      : null,
    final_outcome_at: typeof r.final_outcome_at === 'string'
      ? r.final_outcome_at
      : null,
    metadata: typeof r.metadata === 'object' && r.metadata !== null
      ? (r.metadata as Record<string, unknown>)
      : null,
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
  }))
}

export async function loadInventoryDocuments(
  caseId: string,
  tenantId: string,
): Promise<EotInventoryDocument[]> {
  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('case_id', caseId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return ((data ?? []) as Row[]).map((d): EotInventoryDocument => {
    const docType = str(d.document_type, 'supporting')
    const typeMap: Record<string, EotInventoryDocument['document_type']> = {
      checkin_report: 'checkin',
      checkout_report: 'checkout',
      schedule_of_condition: 'schedule',
      checkin: 'checkin',
      checkout: 'checkout',
      schedule: 'schedule',
    }
    return {
      id: d.id as string,
      case_id: caseId,
      name: str(d.name, 'Document'),
      document_type: typeMap[docType] ?? 'supporting',
      status: d.file_url ? 'uploaded' : 'pending',
      file_url: typeof d.file_url === 'string' ? d.file_url : null,
      uploaded_at: typeof d.created_at === 'string' ? d.created_at : null,
      page_count: num(
        typeof d.metadata === 'object' && d.metadata !== null
          ? (d.metadata as Record<string, unknown>).page_count
          : null,
      ),
    }
  })
}

export async function loadEvidencePhotos(
  caseId: string,
  tenantId: string,
): Promise<EotEvidencePhoto[]> {
  const supabase = getSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('evidence')
    .select('*')
    .eq('case_id', caseId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return ((data ?? []) as Row[]).map((e): EotEvidencePhoto => ({
    id: e.id as string,
    case_id: caseId,
    name: str(
      typeof e.metadata === 'object' && e.metadata !== null
        ? (e.metadata as Record<string, unknown>).original_file_name
        : null,
      str(e.area, 'Evidence'),
    ),
    room: typeof e.area === 'string' ? e.area : null,
    file_url: str(e.file_url),
    thumbnail_url: typeof e.metadata === 'object' && e.metadata !== null
      ? typeof (e.metadata as Record<string, unknown>).thumbnail_url === 'string'
        ? (e.metadata as Record<string, unknown>).thumbnail_url as string
        : null
      : null,
    type: (str(e.type, 'image') as EotEvidencePhoto['type']),
    uploaded_by: typeof e.uploaded_by === 'string' ? e.uploaded_by : null,
    created_at: str(e.created_at),
  }))
}

// ── Audit event logging ─────────────────────────────────────────

/**
 * Log a durable audit event to the checkout_timeline table.
 * Fire-and-forget — errors are logged but never thrown to callers.
 */
export async function logAuditEvent(
  caseId: string,
  tenantId: string,
  event: EotAuditEvent,
): Promise<void> {
  try {
    const checkoutCaseId = await resolveCheckoutCaseId(caseId, tenantId)
    const supabase = getSupabaseServiceRoleClient()
    const now = new Date().toISOString()

    // If we have a checkout case, write to checkout_timeline
    if (checkoutCaseId) {
      await supabase.from('checkout_timeline').insert({
        case_id: checkoutCaseId,
        event_type: event.event_type,
        event_description: event.description,
        performed_by: event.performed_by,
        event_date: now,
        created_at: now,
        updated_at: now,
      })
    }

    // Also touch the parent case last_activity_at
    await supabase
      .from('cases')
      .update({ last_activity_at: now, updated_at: now })
      .eq('id', caseId)
      .eq('tenant_id', tenantId)
  } catch (err) {
    console.error('Audit event logging failed (non-fatal)', {
      caseId,
      eventType: event.event_type,
      error: err instanceof Error ? err.message : 'unknown',
    })
  }
}

/**
 * Load all workspace step data for a case in a single call.
 * Runs independent queries in parallel for performance.
 */
export async function loadWorkspaceStepData(
  caseId: string,
  tenantId: string,
): Promise<EotWorkspaceStepData> {
  const [
    defects,
    workflow,
    utilities,
    keys,
    negotiationItems,
    negotiationMessages,
    draftSections,
    refund,
    aiRecommendations,
    inventoryDocuments,
    evidencePhotos,
  ] = await Promise.all([
    loadDefects(caseId, tenantId),
    loadWorkflowStatus(caseId, tenantId),
    loadUtilities(caseId, tenantId),
    loadKeys(caseId, tenantId),
    loadNegotiationItems(caseId, tenantId),
    loadNegotiationMessages(caseId, tenantId),
    loadDraftSections(caseId, tenantId),
    loadRefundSummary(caseId, tenantId),
    loadAIRecommendations(caseId, tenantId),
    loadInventoryDocuments(caseId, tenantId),
    loadEvidencePhotos(caseId, tenantId),
  ])

  return {
    defects,
    workflow,
    utilities,
    keys,
    negotiation_items: negotiationItems,
    negotiation_messages: negotiationMessages,
    draft_sections: draftSections,
    refund,
    ai_recommendations: aiRecommendations,
    inventory_documents: inventoryDocuments,
    evidence_photos: evidencePhotos,
  }
}

// ── Writes (mutation layer) ─────────────────────────────────────

export async function updateDefect(
  caseId: string,
  tenantId: string,
  userId: string,
  input: UpdateDefectInput,
): Promise<void> {
  const supabase = getSupabaseServiceRoleClient()
  const now = new Date().toISOString()

  const patch: Record<string, unknown> = { updated_at: now }
  const auditParts: string[] = []

  if (input.operator_liability !== undefined) {
    patch.operator_liability = input.operator_liability
    auditParts.push(`liability→${input.operator_liability ?? 'cleared'}`)
  }
  if (input.adjusted_cost !== undefined) {
    patch.cost_adjusted = input.adjusted_cost
    auditParts.push(`cost→£${input.adjusted_cost ?? 'reset'}`)
  }
  if (input.excluded !== undefined) {
    patch.excluded = input.excluded
    auditParts.push(input.excluded ? 'excluded' : 'included')
  }
  if (input.reviewed !== undefined && input.reviewed) {
    patch.reviewed_at = now
    patch.reviewed_by = userId
    auditParts.push('reviewed')
  }

  const { error } = await supabase
    .from('checkout_defects')
    .update(patch)
    .eq('id', input.defect_id)

  if (error) throw new Error(`Failed to update defect: ${error.message}`)

  // Audit log (fire-and-forget)
  const eventType = input.excluded !== undefined
    ? 'defect_excluded'
    : input.reviewed
      ? 'defect_reviewed'
      : input.operator_liability !== undefined
        ? 'defect_liability_changed'
        : 'defect_cost_adjusted'

  void logAuditEvent(caseId, tenantId, {
    case_id: caseId,
    event_type: eventType,
    description: `Defect ${input.defect_id}: ${auditParts.join(', ')}`,
    performed_by: userId,
  })
}

export async function upsertWorkflowStatus(
  tenantId: string,
  userId: string,
  input: UpdateWorkflowInput,
): Promise<EotWorkflowStatus> {
  const supabase = getSupabaseServiceRoleClient()
  const now = new Date().toISOString()

  function toResult(row: Row): EotWorkflowStatus {
    return {
      id: row.id as string,
      case_id: input.case_id,
      active_step: row.active_step as WorkspaceStep,
      completed_steps: row.completed_steps as WorkspaceStep[],
      updated_by: row.updated_by as string | null,
      updated_at: row.updated_at as string,
    }
  }

  // Try update first
  const { data: existing } = await supabase
    .from('eot_workflow_status')
    .select('id')
    .eq('case_id', input.case_id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  let result: EotWorkflowStatus

  if (existing) {
    const { data, error } = await supabase
      .from('eot_workflow_status')
      .update({
        active_step: input.active_step,
        completed_steps: input.completed_steps,
        updated_by: userId,
        updated_at: now,
      })
      .eq('id', (existing as Row).id)
      .select('*')
      .single()

    if (error) throw new Error(`Failed to update workflow: ${error.message}`)
    result = toResult(data as Row)
  } else {
    const { data, error } = await supabase
      .from('eot_workflow_status')
      .insert({
        case_id: input.case_id,
        tenant_id: tenantId,
        active_step: input.active_step,
        completed_steps: input.completed_steps,
        updated_by: userId,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single()

    if (error) throw new Error(`Failed to create workflow status: ${error.message}`)
    result = toResult(data as Row)
  }

  void logAuditEvent(input.case_id, tenantId, {
    case_id: input.case_id,
    event_type: 'workflow_step_changed',
    description: `Step → ${input.active_step}, completed: [${input.completed_steps.join(', ')}]`,
    performed_by: userId,
  })

  return result
}

export async function saveNegotiationMessage(
  tenantId: string,
  input: SaveNegotiationMessageInput,
): Promise<void> {
  const checkoutCaseId = await resolveCheckoutCaseId(input.case_id, tenantId)
  if (!checkoutCaseId) throw new Error('Checkout case not found')

  const supabase = getSupabaseServiceRoleClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('checkout_timeline')
    .insert({
      case_id: checkoutCaseId,
      event_type: 'negotiation_message',
      event_description: input.content,
      performed_by: input.sender_name,
      event_date: now,
      created_at: now,
      updated_at: now,
    })

  if (error) throw new Error(`Failed to save negotiation message: ${error.message}`)

  void logAuditEvent(input.case_id, tenantId, {
    case_id: input.case_id,
    event_type: 'negotiation_message_sent',
    description: `Message from ${input.sender_name} (${input.sender_role})`,
    performed_by: input.sender_name,
  })
}

export async function saveDraftSection(
  tenantId: string,
  input: SaveDraftSectionInput,
): Promise<void> {
  const checkoutCaseId = await resolveCheckoutCaseId(input.case_id, tenantId)
  if (!checkoutCaseId) throw new Error('Checkout case not found')

  const supabase = getSupabaseServiceRoleClient()
  const now = new Date().toISOString()

  // Find existing draft of this section key
  const { data: existing } = await supabase
    .from('checkout_email_drafts')
    .select('id')
    .eq('case_id', checkoutCaseId)
    .eq('draft_type', input.section_key)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('checkout_email_drafts')
      .update({
        subject: input.title,
        body: input.content,
        updated_at: now,
      })
      .eq('id', (existing as Row).id)

    if (error) throw new Error(`Failed to update draft section: ${error.message}`)
  } else {
    const { error } = await supabase
      .from('checkout_email_drafts')
      .insert({
        case_id: checkoutCaseId,
        draft_type: input.section_key,
        subject: input.title,
        body: input.content,
        status: 'draft',
        attachment_document_ids: [],
        created_at: now,
        updated_at: now,
      })

    if (error) throw new Error(`Failed to create draft section: ${error.message}`)
  }

  void logAuditEvent(input.case_id, tenantId, {
    case_id: input.case_id,
    event_type: 'draft_section_saved',
    description: `Draft "${input.title}" (${input.section_key}) saved`,
    performed_by: null,
  })
}

export async function saveAIRecommendation(
  caseId: string,
  tenantId: string,
  rec: {
    defect_id?: string | null
    issue_id?: string | null
    recommendation_type: EotAIRecommendation['recommendation_type']
    confidence: number
    reasoning: string
    model_id: string
    model_version: string
    metadata?: Record<string, unknown> | null
  },
): Promise<string> {
  const supabase = getSupabaseServiceRoleClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('eot_ai_recommendations')
    .insert({
      case_id: caseId,
      tenant_id: tenantId,
      defect_id: rec.defect_id ?? null,
      issue_id: rec.issue_id ?? null,
      recommendation_type: rec.recommendation_type,
      confidence: rec.confidence,
      reasoning: rec.reasoning,
      model_id: rec.model_id,
      model_version: rec.model_version,
      generated_at: now,
      metadata: rec.metadata ?? {},
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to save AI recommendation: ${error.message}`)
  return (data as Row).id as string
}

export async function overrideAIRecommendation(
  recommendationId: string,
  override: {
    operator_override: EotLiability
    operator_override_reason: string | null
    operator_override_by: string
  },
): Promise<void> {
  const supabase = getSupabaseServiceRoleClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('eot_ai_recommendations')
    .update({
      operator_override: override.operator_override,
      operator_override_reason: override.operator_override_reason,
      operator_override_by: override.operator_override_by,
      operator_override_at: now,
      updated_at: now,
    })
    .eq('id', recommendationId)

  if (error) throw new Error(`Failed to override AI recommendation: ${error.message}`)
}

export async function finalizeAIRecommendation(
  recommendationId: string,
  finalOutcome: EotLiability,
): Promise<void> {
  const supabase = getSupabaseServiceRoleClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('eot_ai_recommendations')
    .update({
      final_outcome: finalOutcome,
      final_outcome_at: now,
      updated_at: now,
    })
    .eq('id', recommendationId)

  if (error) throw new Error(`Failed to finalize AI recommendation: ${error.message}`)
}

// ── Evidence upload ─────────────────────────────────────────────

/**
 * Create a signed upload URL for evidence files (images, videos, PDFs).
 * Returns the bucket, storage path, and upload token.
 */
export async function createEvidenceUploadUrl(
  caseId: string,
  tenantId: string,
  input: { fileName: string; contentType: string; fileSize: number },
): Promise<{ bucketName: string; storagePath: string; token: string }> {
  const supabase = getSupabaseServiceRoleClient()
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET_INSPECTIONS?.trim() || 'inspection-files'
  const timestamp = Date.now()
  const storagePath = `${tenantId}/${caseId}/evidence/${timestamp}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(storagePath)

  if (error || !data?.token) {
    throw new Error(`Failed to create upload URL: ${error?.message ?? 'no token'}`)
  }

  return { bucketName, storagePath, token: data.token }
}

/**
 * Finalize an evidence upload — persist the DB record and log the event.
 */
export async function finalizeEvidenceUpload(
  caseId: string,
  tenantId: string,
  userId: string,
  input: {
    storagePath: string
    fileName: string
    contentType: string
    area: string | null
  },
): Promise<EotEvidencePhoto> {
  const supabase = getSupabaseServiceRoleClient()
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET_INSPECTIONS?.trim() || 'inspection-files'
  const now = new Date().toISOString()

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(input.storagePath)
  const publicUrl = urlData.publicUrl

  const evidenceType = input.contentType.startsWith('image/')
    ? 'image'
    : input.contentType.startsWith('video/')
      ? 'video'
      : 'document'

  const { data, error } = await supabase
    .from('evidence')
    .insert({
      case_id: caseId,
      tenant_id: tenantId,
      file_url: publicUrl,
      type: evidenceType,
      area: input.area,
      uploaded_by: userId,
      metadata: {
        original_file_name: input.fileName,
        storage_bucket: bucketName,
        storage_path: input.storagePath,
        content_type: input.contentType,
      },
      created_at: now,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to save evidence record: ${error.message}`)

  void logAuditEvent(caseId, tenantId, {
    case_id: caseId,
    event_type: 'evidence_uploaded',
    description: `Evidence "${input.fileName}" uploaded (${evidenceType}, area: ${input.area ?? 'unspecified'})`,
    performed_by: userId,
  })

  return {
    id: (data as Row).id as string,
    case_id: caseId,
    name: input.fileName,
    room: input.area,
    file_url: publicUrl,
    thumbnail_url: null,
    type: evidenceType,
    uploaded_by: userId,
    created_at: now,
  }
}

/**
 * Delete an evidence record and its storage object.
 */
export async function deleteEvidence(
  caseId: string,
  tenantId: string,
  userId: string,
  evidenceId: string,
): Promise<void> {
  const supabase = getSupabaseServiceRoleClient()
  const now = new Date().toISOString()

  // Load the record to get storage path
  const { data: record } = await supabase
    .from('evidence')
    .select('id, metadata')
    .eq('id', evidenceId)
    .eq('case_id', caseId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!record) return

  // Soft-delete
  await supabase
    .from('evidence')
    .update({ deleted_at: now })
    .eq('id', evidenceId)

  // Remove from storage
  const meta = (record as Row).metadata as Record<string, unknown> | null
  if (meta?.storage_bucket && meta?.storage_path) {
    await supabase.storage
      .from(meta.storage_bucket as string)
      .remove([meta.storage_path as string])
      .catch(() => {})
  }

  void logAuditEvent(caseId, tenantId, {
    case_id: caseId,
    event_type: 'evidence_deleted',
    description: `Evidence ${evidenceId} deleted`,
    performed_by: userId,
  })
}
