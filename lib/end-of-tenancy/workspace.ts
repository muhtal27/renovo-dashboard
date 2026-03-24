import type { SupabaseClient } from '@supabase/supabase-js'
import { getEndOfTenancyCaseDetail } from '@/lib/end-of-tenancy/queries'
import type { EndOfTenancyWorkspacePayload } from '@/lib/end-of-tenancy/types'

type DbClient = SupabaseClient

export async function loadEndOfTenancyWorkspace(
  endOfTenancyCaseId: string,
  options?: { supabase?: DbClient }
): Promise<EndOfTenancyWorkspacePayload | null> {
  const detail = await getEndOfTenancyCaseDetail(endOfTenancyCaseId, options)

  if (!detail) {
    return null
  }

  const extractionsByDocumentId = new Map<string, EndOfTenancyWorkspacePayload['documents'][number]['extractions']>()

  for (const extraction of detail.extractions) {
    const items = extractionsByDocumentId.get(extraction.case_document_id) ?? []
    items.push(extraction)
    extractionsByDocumentId.set(extraction.case_document_id, items)
  }

  const evidenceByIssueId = new Map<string, EndOfTenancyWorkspacePayload['issues'][number]['evidence']>()

  for (const evidenceLink of detail.evidenceLinks) {
    const items = evidenceByIssueId.get(evidenceLink.issue_id) ?? []
    items.push(evidenceLink)
    evidenceByIssueId.set(evidenceLink.issue_id, items)
  }

  const sourcesByRecommendationId = new Map<
    string,
    EndOfTenancyWorkspacePayload['recommendations'][number]['sources']
  >()

  for (const source of detail.recommendationSources) {
    const items = sourcesByRecommendationId.get(source.decision_recommendation_id) ?? []
    items.push(source)
    sourcesByRecommendationId.set(source.decision_recommendation_id, items)
  }

  const reviewActionsByRecommendationId = new Map<
    string,
    EndOfTenancyWorkspacePayload['recommendations'][number]['reviewActions']
  >()

  for (const reviewAction of detail.reviewActions) {
    const items = reviewActionsByRecommendationId.get(reviewAction.decision_recommendation_id) ?? []
    items.push(reviewAction)
    reviewActionsByRecommendationId.set(reviewAction.decision_recommendation_id, items)
  }

  return {
    endOfTenancyCase: detail.endOfTenancyCase,
    case: detail.case,
    tenancy: detail.tenancy,
    property: detail.property,
    depositClaim: detail.depositClaim,
    moveOutTracker: detail.moveOutTracker,
    moveOutChecklistItems: detail.moveOutChecklistItems,
    moveOutTrackerEvents: detail.moveOutTrackerEvents,
    communications: detail.communications,
    documents: detail.documents.map((document) => ({
      ...document,
      extractions: extractionsByDocumentId.get(document.id) ?? [],
    })),
    issues: detail.issues.map((issue) => ({
      ...issue,
      evidence: evidenceByIssueId.get(issue.id) ?? [],
    })),
    recommendations: detail.recommendations.map((recommendation) => ({
      ...recommendation,
      sources: sourcesByRecommendationId.get(recommendation.id) ?? [],
      reviewActions: reviewActionsByRecommendationId.get(recommendation.id) ?? [],
    })),
    lineItems: detail.lineItems,
  }
}
