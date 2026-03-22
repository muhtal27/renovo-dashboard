import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import {
  getDefaultEndOfTenancyAiProvider,
  isEndOfTenancyAiProviderConfigured,
  type EndOfTenancyAiProvider,
} from '@/lib/end-of-tenancy/ai-provider'
import type {
  DecisionRecommendationRow,
  DecisionRecommendationSourceRow,
  DecisionReviewActionRow,
  EndOfTenancyIssueRow,
  EndOfTenancyWorkspacePayload,
  JsonValue,
} from '@/lib/end-of-tenancy/types'
import { loadEndOfTenancyWorkspace } from '@/lib/end-of-tenancy/workspace'
import { syncMoveOutTrackerProgress } from '@/lib/end-of-tenancy/tracker'

type KnowledgeMatch = {
  article_id: string | null
  chunk_id: string | null
  title: string | null
  category: string | null
  snippet: string | null
  source_url: string | null
  review_status: string | null
}

type PreparedWorkspaceAiInput = {
  endOfTenancyCaseId: string
  baseCase: {
    id: string | null
    caseNumber: string | null
    summary: string | null
    caseType: string | null
    priority: string | null
    status: string | null
  }
  tenancy: {
    id: string | null
    startDate: string | null
    endDate: string | null
    status: string | null
  }
  property: {
    id: string | null
    address: string | null
  }
  depositClaim: {
    id: string | null
    claimStatus: string | null
    totalClaimAmount: number | string | null
    disputedAmount: number | string | null
    evidenceNotes: string | null
  } | null
  documents: Array<{
    id: string
    role: string
    fileName: string | null
    notes: string | null
    extractions: Array<{
      id: string
      kind: string
      status: string
      text: string | null
      data: JsonValue
      confidence: number | null
    }>
  }>
  issues: Array<{
    id: string
    title: string
    issueType: string
    description: string | null
    status: string
    responsibility: string
    severity: string
    proposedAmount: number | string | null
    evidenceLinkIds: string[]
  }>
  knowledge: Array<{
    articleId: string | null
    chunkId: string | null
    title: string | null
    category: string | null
    snippet: string | null
    sourceUrl: string | null
  }>
}

type AiSuggestedIssue = {
  existing_issue_id?: string | null
  issue_type: EndOfTenancyIssueRow['issue_type']
  title: string
  description: string | null
  room_area: string | null
  responsibility: EndOfTenancyIssueRow['responsibility']
  severity: EndOfTenancyIssueRow['severity']
  proposed_amount: number | null
  rationale: string
  confidence: number | null
  evidence_document_ids?: string[]
  evidence_extraction_ids?: string[]
}

type AiRecommendationDraft = {
  recommended_outcome: DecisionRecommendationRow['recommended_outcome']
  decision_summary: string
  rationale: string
  total_recommended_amount: number | null
  confidence: number | null
  linked_issue_ids?: string[]
  source_document_ids?: string[]
  source_extraction_ids?: string[]
  source_knowledge_article_ids?: string[]
  source_knowledge_chunk_ids?: string[]
}

type AiDraftAssessmentOutput = {
  summary: string
  overall_confidence: number | null
  uncertainty_notes: string[]
  conflicting_points: string[]
  suggested_issues: AiSuggestedIssue[]
  recommendation: AiRecommendationDraft
}

export type GeneratedDraftAssessmentResult = {
  aiRun: {
    id: string
    modelName: string
    confidence: number | null
  }
  storedIssues: EndOfTenancyIssueRow[]
  storedRecommendation: DecisionRecommendationRow
  storedRecommendationSources: DecisionRecommendationSourceRow[]
  reviewAction: DecisionReviewActionRow | null
  assessment: AiDraftAssessmentOutput
  workspace: EndOfTenancyWorkspacePayload
}

export function isEndOfTenancyAiDraftingConfigured() {
  return isEndOfTenancyAiProviderConfigured()
}

function buildAddress(workspace: EndOfTenancyWorkspacePayload) {
  const property = workspace.property
  if (!property) return null

  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

function coerceConfidence(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  if (value < 0 || value > 1) return null
  return value
}

function ensureStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

function asObject(value: unknown) {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function sanitizeAiIssue(value: unknown): AiSuggestedIssue | null {
  const item = asObject(value)

  if (!item || typeof item.title !== 'string' || item.title.trim() === '') {
    return null
  }

  const allowedIssueTypes: EndOfTenancyIssueRow['issue_type'][] = [
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

  const allowedResponsibilities: EndOfTenancyIssueRow['responsibility'][] = [
    'tenant',
    'landlord',
    'shared',
    'undetermined',
  ]

  const allowedSeverities: EndOfTenancyIssueRow['severity'][] = ['low', 'medium', 'high']

  return {
    existing_issue_id:
      typeof item.existing_issue_id === 'string' && item.existing_issue_id.trim() !== ''
        ? item.existing_issue_id
        : null,
    issue_type: allowedIssueTypes.includes(item.issue_type as EndOfTenancyIssueRow['issue_type'])
      ? (item.issue_type as EndOfTenancyIssueRow['issue_type'])
      : 'other',
    title: item.title.trim(),
    description: typeof item.description === 'string' ? item.description : null,
    room_area: typeof item.room_area === 'string' ? item.room_area : null,
    responsibility: allowedResponsibilities.includes(
      item.responsibility as EndOfTenancyIssueRow['responsibility']
    )
      ? (item.responsibility as EndOfTenancyIssueRow['responsibility'])
      : 'undetermined',
    severity: allowedSeverities.includes(item.severity as EndOfTenancyIssueRow['severity'])
      ? (item.severity as EndOfTenancyIssueRow['severity'])
      : 'medium',
    proposed_amount:
      typeof item.proposed_amount === 'number' && item.proposed_amount >= 0
        ? item.proposed_amount
        : null,
    rationale:
      typeof item.rationale === 'string' && item.rationale.trim() !== ''
        ? item.rationale.trim()
        : 'AI rationale unavailable.',
    confidence: coerceConfidence(item.confidence),
    evidence_document_ids: ensureStringArray(item.evidence_document_ids),
    evidence_extraction_ids: ensureStringArray(item.evidence_extraction_ids),
  }
}

function sanitizeAiRecommendation(value: unknown): AiRecommendationDraft | null {
  const item = asObject(value)
  if (!item) return null

  const allowedOutcomes: DecisionRecommendationRow['recommended_outcome'][] = [
    'no_action',
    'partial_claim',
    'full_claim',
    'insufficient_evidence',
    'refer_to_human',
    'no_decision',
  ]

  return {
    recommended_outcome: allowedOutcomes.includes(
      item.recommended_outcome as DecisionRecommendationRow['recommended_outcome']
    )
      ? (item.recommended_outcome as DecisionRecommendationRow['recommended_outcome'])
      : 'refer_to_human',
    decision_summary:
      typeof item.decision_summary === 'string' && item.decision_summary.trim() !== ''
        ? item.decision_summary.trim()
        : 'AI draft recommendation generated for operator review.',
    rationale:
      typeof item.rationale === 'string' && item.rationale.trim() !== ''
        ? item.rationale.trim()
        : 'AI rationale unavailable.',
    total_recommended_amount:
      typeof item.total_recommended_amount === 'number' && item.total_recommended_amount >= 0
        ? item.total_recommended_amount
        : null,
    confidence: coerceConfidence(item.confidence),
    linked_issue_ids: ensureStringArray(item.linked_issue_ids),
    source_document_ids: ensureStringArray(item.source_document_ids),
    source_extraction_ids: ensureStringArray(item.source_extraction_ids),
    source_knowledge_article_ids: ensureStringArray(item.source_knowledge_article_ids),
    source_knowledge_chunk_ids: ensureStringArray(item.source_knowledge_chunk_ids),
  }
}

function sanitizeDraftAssessment(value: unknown): AiDraftAssessmentOutput {
  const item = asObject(value)

  if (!item) {
    throw new Error('AI response was not a valid object.')
  }

  const recommendation = sanitizeAiRecommendation(item.recommendation)

  if (!recommendation) {
    throw new Error('AI response did not include a valid recommendation draft.')
  }

  return {
    summary:
      typeof item.summary === 'string' && item.summary.trim() !== ''
        ? item.summary.trim()
        : 'AI draft assessment generated.',
    overall_confidence: coerceConfidence(item.overall_confidence),
    uncertainty_notes: ensureStringArray(item.uncertainty_notes),
    conflicting_points: ensureStringArray(item.conflicting_points),
    suggested_issues: Array.isArray(item.suggested_issues)
      ? item.suggested_issues
          .map(sanitizeAiIssue)
          .filter((issue): issue is AiSuggestedIssue => Boolean(issue))
      : [],
    recommendation,
  }
}

async function searchApprovedKnowledge(workspace: EndOfTenancyWorkspacePayload) {
  const supabase = getSupabaseServiceRoleClient()
  const query = [
    workspace.case?.summary,
    workspace.depositClaim?.evidence_notes,
    ...workspace.issues.map((issue) => `${issue.issue_type} ${issue.title}`),
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 500)

  if (!query.trim()) {
    return [] as KnowledgeMatch[]
  }

  const { data, error } = await supabase.rpc('search_scotland_knowledge', {
    search_query: query,
    match_limit: 6,
  })

  if (error) {
    return [] as KnowledgeMatch[]
  }

  return ((data || []) as KnowledgeMatch[]).filter((item) => item.review_status === 'approved')
}

export async function prepareEndOfTenancyAiInput(endOfTenancyCaseId: string) {
  const workspace = await loadEndOfTenancyWorkspace(endOfTenancyCaseId)

  if (!workspace) {
    throw new Error(`End-of-tenancy case ${endOfTenancyCaseId} was not found.`)
  }

  const knowledge = await searchApprovedKnowledge(workspace)

  const prepared: PreparedWorkspaceAiInput = {
    endOfTenancyCaseId: workspace.endOfTenancyCase.id,
    baseCase: {
      id: workspace.case?.id ?? null,
      caseNumber: workspace.case?.case_number ?? null,
      summary: workspace.case?.summary ?? null,
      caseType: workspace.case?.case_type ?? null,
      priority: workspace.case?.priority ?? null,
      status: workspace.case?.status ?? null,
    },
    tenancy: {
      id: workspace.tenancy?.id ?? null,
      startDate: workspace.tenancy?.start_date ?? null,
      endDate: workspace.tenancy?.end_date ?? null,
      status: workspace.tenancy?.tenancy_status ?? workspace.tenancy?.status ?? null,
    },
    property: {
      id: workspace.property?.id ?? null,
      address: buildAddress(workspace),
    },
    depositClaim: workspace.depositClaim
      ? {
          id: workspace.depositClaim.id,
          claimStatus: workspace.depositClaim.claim_status,
          totalClaimAmount: workspace.depositClaim.total_claim_amount,
          disputedAmount: workspace.depositClaim.disputed_amount,
          evidenceNotes: workspace.depositClaim.evidence_notes,
        }
      : null,
    documents: workspace.documents.map((document) => ({
      id: document.id,
      role: document.document_role,
      fileName: document.file_name,
      notes: document.notes,
      extractions: document.extractions.map((extraction) => ({
        id: extraction.id,
        kind: extraction.extraction_kind,
        status: extraction.status,
        text: extraction.extracted_text,
        data: extraction.extracted_data,
        confidence: extraction.confidence,
      })),
    })),
    issues: workspace.issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      issueType: issue.issue_type,
      description: issue.description,
      status: issue.status,
      responsibility: issue.responsibility,
      severity: issue.severity,
      proposedAmount: issue.proposed_amount,
      evidenceLinkIds: issue.evidence.map((link) => link.id),
    })),
    knowledge: knowledge.map((item) => ({
      articleId: item.article_id,
      chunkId: item.chunk_id,
      title: item.title,
      category: item.category,
      snippet: item.snippet,
      sourceUrl: item.source_url,
    })),
  }

  return {
    workspace,
    prepared,
  }
}

function buildDraftAssessmentPrompts(input: PreparedWorkspaceAiInput) {
  const systemPrompt = [
    'You are drafting review-first end-of-tenancy decision support for a property operator.',
    'Help the operator make a better decision without hiding the reasoning.',
    'Return only valid JSON.',
    'Do not approve anything. Do not finalise claims. Keep all outputs reviewable and cautious.',
    'Always include rationale text, uncertainty_notes, and source references when possible.',
    'If evidence is weak or conflicting, say so clearly and prefer refer_to_human or insufficient_evidence.',
  ].join(' ')

  const userPrompt = [
    'Prepare a draft end-of-tenancy assessment from this workspace.',
    'Return JSON with keys:',
    '{',
    '"summary": string,',
    '"overall_confidence": number|null,',
    '"uncertainty_notes": string[],',
    '"conflicting_points": string[],',
    '"suggested_issues": [{',
    '"existing_issue_id": string|null,',
    '"issue_type": string,',
    '"title": string,',
    '"description": string|null,',
    '"room_area": string|null,',
    '"responsibility": string,',
    '"severity": string,',
    '"proposed_amount": number|null,',
    '"rationale": string,',
    '"confidence": number|null,',
    '"evidence_document_ids": string[],',
    '"evidence_extraction_ids": string[]',
    '}],',
    '"recommendation": {',
    '"recommended_outcome": string,',
    '"decision_summary": string,',
    '"rationale": string,',
    '"total_recommended_amount": number|null,',
    '"confidence": number|null,',
    '"linked_issue_ids": string[],',
    '"source_document_ids": string[],',
    '"source_extraction_ids": string[],',
    '"source_knowledge_article_ids": string[],',
    '"source_knowledge_chunk_ids": string[]',
    '}',
    '}',
    '',
    JSON.stringify(input, null, 2),
  ].join('\n')

  return {
    systemPrompt,
    userPrompt,
  }
}

async function createAiRunRecord(params: {
  caseId: string | null
  modelName: string
  confidence: number | null
  actionTaken: string
}) {
  const supabase = getSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('ai_runs')
    .insert({
      case_id: params.caseId,
      call_session_id: null,
      run_type: 'end_of_tenancy_draft_assessment',
      model_name: params.modelName,
      classification: 'end_of_tenancy_draft_assessment',
      confidence: params.confidence,
      action_taken: params.actionTaken,
    })
    .select('id, model_name, confidence')
    .single()

  if (error) {
    throw new Error(`Unable to log ai_runs provenance: ${error.message}`)
  }

  return {
    id: data.id as string,
    modelName: data.model_name as string,
    confidence: (data.confidence as number | null) ?? null,
  }
}

function buildActionSummary(assessment: AiDraftAssessmentOutput) {
  const uncertaintySuffix =
    assessment.uncertainty_notes.length > 0 || assessment.conflicting_points.length > 0
      ? ' Uncertainty flagged for operator review.'
      : ''

  return `${assessment.summary}${uncertaintySuffix}`.slice(0, 900)
}

async function persistDraftAssessment(params: {
  workspace: EndOfTenancyWorkspacePayload
  assessment: AiDraftAssessmentOutput
  aiRunId: string
}) {
  const supabase = getSupabaseServiceRoleClient()
  const workspace = params.workspace
  const assessment = params.assessment

  const issuesById = new Map(workspace.issues.map((issue) => [issue.id, issue]))
  const documentsById = new Map(workspace.documents.map((document) => [document.id, document]))
  const extractionIds = new Set(
    workspace.documents.flatMap((document) => document.extractions.map((extraction) => extraction.id))
  )

  const storedIssues: EndOfTenancyIssueRow[] = []
  const sourceIssueIds: string[] = []
  const issueEvidenceLinkIds: string[] = []

  for (const suggestion of assessment.suggested_issues) {
    const targetIssue =
      (suggestion.existing_issue_id && issuesById.get(suggestion.existing_issue_id)) ||
      workspace.issues.find(
        (issue) =>
          issue.issue_type === suggestion.issue_type &&
          issue.title.trim().toLowerCase() === suggestion.title.trim().toLowerCase()
      ) ||
      null

    const issuePayload = {
      end_of_tenancy_case_id: workspace.endOfTenancyCase.id,
      identified_by_ai_run_id: params.aiRunId,
      created_by_user_id: null,
      issue_type: suggestion.issue_type,
      title: suggestion.title,
      description:
        suggestion.description || `AI draft rationale: ${suggestion.rationale}`,
      room_area: suggestion.room_area,
      status: 'under_review',
      responsibility: suggestion.responsibility,
      severity: suggestion.severity,
      proposed_amount: suggestion.proposed_amount,
    }

    const issueResult = targetIssue
      ? await supabase
          .from('end_of_tenancy_issues')
          .update(issuePayload)
          .eq('id', targetIssue.id)
          .select(
            'id, end_of_tenancy_case_id, identified_by_ai_run_id, created_by_user_id, issue_type, title, description, room_area, status, responsibility, severity, proposed_amount, created_at, updated_at'
          )
          .single()
      : await supabase
          .from('end_of_tenancy_issues')
          .insert(issuePayload)
          .select(
            'id, end_of_tenancy_case_id, identified_by_ai_run_id, created_by_user_id, issue_type, title, description, room_area, status, responsibility, severity, proposed_amount, created_at, updated_at'
          )
          .single()

    if (issueResult.error) {
      throw new Error(`Unable to persist AI draft issue: ${issueResult.error.message}`)
    }

    const storedIssue = issueResult.data as EndOfTenancyIssueRow
    storedIssues.push(storedIssue)
    sourceIssueIds.push(storedIssue.id)

    for (const documentId of suggestion.evidence_document_ids ?? []) {
      if (!documentsById.has(documentId)) continue

      const extractionId =
        (suggestion.evidence_extraction_ids ?? []).find((item) => extractionIds.has(item)) ?? null

      const evidenceInsert = await supabase
        .from('issue_evidence_links')
        .insert({
          issue_id: storedIssue.id,
          case_document_id: documentId,
          document_extraction_id: extractionId,
          link_type: 'supports',
          excerpt: suggestion.rationale,
          locator: {},
        })
        .select('id')
        .single()

      if (!evidenceInsert.error && evidenceInsert.data?.id) {
        issueEvidenceLinkIds.push(evidenceInsert.data.id as string)
      }
    }
  }

  const lowConfidence =
    assessment.overall_confidence != null && assessment.overall_confidence < 0.65
  const hasConflicts = assessment.conflicting_points.length > 0

  const recommendationResult = await supabase
    .from('decision_recommendations')
    .insert({
      end_of_tenancy_case_id: workspace.endOfTenancyCase.id,
      ai_run_id: params.aiRunId,
      recommendation_status: 'draft',
      recommended_outcome:
        lowConfidence || hasConflicts
          ? 'refer_to_human'
          : assessment.recommendation.recommended_outcome,
      decision_summary: assessment.recommendation.decision_summary,
      rationale: assessment.recommendation.rationale,
      total_recommended_amount: assessment.recommendation.total_recommended_amount,
      human_review_required: true,
    })
    .select(
      'id, end_of_tenancy_case_id, ai_run_id, reviewed_by_user_id, recommendation_status, recommended_outcome, decision_summary, rationale, total_recommended_amount, human_review_required, reviewed_at, created_at, updated_at'
    )
    .single()

  if (recommendationResult.error) {
    throw new Error(`Unable to persist AI draft recommendation: ${recommendationResult.error.message}`)
  }

  const storedRecommendation = recommendationResult.data as DecisionRecommendationRow
  const storedSources: DecisionRecommendationSourceRow[] = []

  const sourceRows: Array<Record<string, unknown>> = []

  for (const linkedIssueId of sourceIssueIds) {
    sourceRows.push({
      decision_recommendation_id: storedRecommendation.id,
      source_type: 'issue',
      issue_id: linkedIssueId,
      source_note: 'AI draft linked issue assessment',
    })
  }

  for (const linkedEvidenceLinkId of issueEvidenceLinkIds) {
    sourceRows.push({
      decision_recommendation_id: storedRecommendation.id,
      source_type: 'issue_evidence_link',
      issue_evidence_link_id: linkedEvidenceLinkId,
      source_note: 'AI draft linked issue evidence',
    })
  }

  for (const sourceKnowledgeArticleId of assessment.recommendation.source_knowledge_article_ids ?? []) {
    sourceRows.push({
      decision_recommendation_id: storedRecommendation.id,
      source_type: 'knowledge_article',
      knowledge_article_id: sourceKnowledgeArticleId,
      source_note: 'AI draft cited approved knowledge article',
    })
  }

  for (const sourceKnowledgeChunkId of assessment.recommendation.source_knowledge_chunk_ids ?? []) {
    sourceRows.push({
      decision_recommendation_id: storedRecommendation.id,
      source_type: 'knowledge_article_chunk',
      knowledge_article_chunk_id: sourceKnowledgeChunkId,
      source_note: 'AI draft cited approved knowledge chunk',
    })
  }

  if (sourceRows.length > 0) {
    const batchResult = await supabase
      .from('decision_recommendation_sources')
      .insert(sourceRows)
      .select(
        'id, decision_recommendation_id, source_type, issue_id, issue_evidence_link_id, case_document_id, document_extraction_id, knowledge_article_id, knowledge_article_chunk_id, deposit_claim_id, source_note, created_at'
      )

    if (!batchResult.error && batchResult.data) {
      storedSources.push(...(batchResult.data as DecisionRecommendationSourceRow[]))
    }
  }

  const reviewActionResult = await supabase
    .from('decision_review_actions')
    .insert({
      decision_recommendation_id: storedRecommendation.id,
      actor_user_id: null,
      ai_run_id: params.aiRunId,
      actor_type: 'ai',
      action_type: 'commented',
      action_notes: [
        'AI draft generated for operator review.',
        `Confidence: ${assessment.overall_confidence ?? 'unknown'}.`,
        assessment.uncertainty_notes.length > 0
          ? `Uncertainty: ${assessment.uncertainty_notes.join(' | ')}`
          : null,
      ]
        .filter(Boolean)
        .join(' '),
    })
    .select(
      'id, decision_recommendation_id, actor_user_id, ai_run_id, actor_type, action_type, action_notes, created_at'
    )
    .single()

  if (
    lowConfidence ||
    hasConflicts ||
    assessment.recommendation.recommended_outcome === 'refer_to_human'
  ) {
    await supabase
      .from('end_of_tenancy_cases')
      .update({
        workflow_status: 'needs_manual_review',
      })
      .eq('id', workspace.endOfTenancyCase.id)
  } else {
    await supabase
      .from('end_of_tenancy_cases')
      .update({
        workflow_status: 'recommendation_drafted',
      })
      .eq('id', workspace.endOfTenancyCase.id)
  }

  await syncMoveOutTrackerProgress(workspace.endOfTenancyCase.id, {
    event: {
      actorType: 'ai',
      eventType: 'ai_draft_generated',
      title: 'AI draft assessment generated',
      detail: 'AI review completed and a draft assessment is ready for operator review.',
      metadata: {
        confidence: assessment.overall_confidence,
        has_conflicts: hasConflicts,
      },
      sourceTable: 'ai_runs',
      sourceRecordId: params.aiRunId,
    },
  })

  return {
    storedIssues,
    storedRecommendation,
    storedRecommendationSources: storedSources,
    reviewAction: reviewActionResult.error
      ? null
      : (reviewActionResult.data as DecisionReviewActionRow),
  }
}

export async function generateDraftAssessmentForEndOfTenancyCase(
  endOfTenancyCaseId: string,
  options?: {
    provider?: EndOfTenancyAiProvider
  }
): Promise<GeneratedDraftAssessmentResult> {
  const { workspace, prepared } = await prepareEndOfTenancyAiInput(endOfTenancyCaseId)
  const provider = options?.provider ?? getDefaultEndOfTenancyAiProvider()
  const prompts = buildDraftAssessmentPrompts(prepared)
  const providerResult = await provider.generateStructuredObject(prompts)

  let parsed: unknown

  try {
    parsed = JSON.parse(providerResult.outputText)
  } catch {
    throw new Error('AI drafting returned invalid JSON.')
  }

  const assessment = sanitizeDraftAssessment(parsed)
  const aiRun = await createAiRunRecord({
    caseId: workspace.case?.id ?? null,
    modelName: providerResult.model,
    confidence: assessment.overall_confidence,
    actionTaken: buildActionSummary(assessment),
  })

  const persisted = await persistDraftAssessment({
    workspace,
    assessment,
    aiRunId: aiRun.id,
  })

  const refreshedWorkspace = await loadEndOfTenancyWorkspace(endOfTenancyCaseId)

  if (!refreshedWorkspace) {
    throw new Error('AI draft was stored but the workspace could not be reloaded.')
  }

  return {
    aiRun,
    storedIssues: persisted.storedIssues,
    storedRecommendation: persisted.storedRecommendation,
    storedRecommendationSources: persisted.storedRecommendationSources,
    reviewAction: persisted.reviewAction,
    assessment,
    workspace: refreshedWorkspace,
  }
}
