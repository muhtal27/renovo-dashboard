import { NextResponse } from 'next/server'
import { requireActiveOperator } from '@/app/api/eot/_auth'
import {
  generateDraftAssessmentForEndOfTenancyCase,
  isEndOfTenancyAiDraftingConfigured,
} from '@/lib/end-of-tenancy/ai'
import { upsertEndOfTenancyIssue } from '@/lib/end-of-tenancy/queries'
import { syncMoveOutTrackerProgress } from '@/lib/end-of-tenancy/tracker'
import type { JsonValue } from '@/lib/end-of-tenancy/types'
import {
  attachEvidenceToEndOfTenancyCase,
  convertApprovedRecommendationToDepositClaimLineItems,
  createDraftDecisionRecommendation,
  markEndOfTenancyCaseNeedsManualReview,
  markEndOfTenancyCaseReadyForClaim,
  recordOperatorReviewAction,
  storeEndOfTenancyExtractionResults,
  updateMoveOutChecklist,
  updateIssueAssessment,
} from '@/lib/end-of-tenancy/service'
import { loadEndOfTenancyWorkspace } from '@/lib/end-of-tenancy/workspace'

type RouteParams = {
  params: Promise<{ id: string }>
}

type ActionPayload =
  | {
      action: 'generate_draft_assessment'
    }
  | {
      action: 'attach_evidence'
      tenancyDocumentId?: string | null
      messageAttachmentId?: string | null
      fileName?: string | null
      fileUrl?: string | null
      storagePath?: string | null
      mimeType?: string | null
      checksum?: string | null
      capturedAt?: string | null
      notes?: string | null
      documentRole?:
        | 'check_in'
        | 'check_out'
        | 'invoice'
        | 'receipt'
        | 'photo'
        | 'video'
        | 'email'
        | 'message_attachment'
        | 'tenancy_agreement'
        | 'deposit_scheme'
        | 'supporting_evidence'
        | 'other'
      issueIds?: string[]
      excerpt?: string | null
      pageNumber?: number | null
    }
  | {
      action: 'store_extraction'
      caseDocumentId: string
      aiRunId?: string | null
      extractionKind?: 'ocr' | 'classification' | 'structured' | 'summary'
      status?: 'pending' | 'processing' | 'completed' | 'failed'
      extractedText?: string | null
      extractedData?: unknown
      confidence?: number | null
    }
  | {
      action: 'create_issue'
      issueType:
        | 'cleaning'
        | 'damage'
        | 'missing_item'
        | 'repair'
        | 'redecoration'
        | 'gardening'
        | 'rubbish_removal'
        | 'rent_arrears'
        | 'utilities'
        | 'other'
      title: string
      description?: string | null
      roomArea?: string | null
      responsibility?: 'tenant' | 'landlord' | 'shared' | 'undetermined'
      severity?: 'low' | 'medium' | 'high'
      proposedAmount?: number | null
    }
  | {
      action: 'update_issue'
      issueId: string
      issueType?:
        | 'cleaning'
        | 'damage'
        | 'missing_item'
        | 'repair'
        | 'redecoration'
        | 'gardening'
        | 'rubbish_removal'
        | 'rent_arrears'
        | 'utilities'
        | 'other'
      title?: string
      description?: string | null
      roomArea?: string | null
      responsibility?: 'tenant' | 'landlord' | 'shared' | 'undetermined'
      severity?: 'low' | 'medium' | 'high'
      proposedAmount?: number | null
      status?: 'open' | 'under_review' | 'accepted' | 'rejected' | 'resolved'
    }
  | {
      action: 'update_move_out_checklist_item'
      itemKey:
        | 'keys'
        | 'parking_permits'
        | 'utility_readings'
        | 'council_tax'
        | 'forwarding_address'
        | 'checkout_evidence'
        | 'ai_review'
        | 'claim_readiness'
      status: 'not_started' | 'in_progress' | 'waiting' | 'blocked' | 'complete'
      notes?: string | null
    }
  | {
      action: 'create_draft_recommendation'
      aiRunId?: string | null
      decisionSummary?: string | null
      rationale?: string | null
      recommendedOutcome?:
        | 'no_action'
        | 'partial_claim'
        | 'full_claim'
        | 'insufficient_evidence'
        | 'refer_to_human'
        | 'no_decision'
      totalRecommendedAmount?: number | null
      issueIds?: string[]
    }
  | {
      action: 'review_recommendation'
      decisionRecommendationId: string
      reviewAction: 'submit' | 'approve' | 'reject' | 'override' | 'comment' | 'send_back'
      notes?: string | null
      override?: {
        recommendedOutcome?:
          | 'no_action'
          | 'partial_claim'
          | 'full_claim'
          | 'insufficient_evidence'
          | 'refer_to_human'
          | 'no_decision'
        totalRecommendedAmount?: number | null
        decisionSummary?: string | null
        rationale?: string | null
      }
    }
  | {
      action: 'convert_recommendation_to_line_items'
      decisionRecommendationId: string
    }
  | {
      action: 'mark_ready_for_claim'
      note?: string | null
    }
  | {
      action: 'mark_needs_manual_review'
      note?: string | null
    }

export async function GET(request: Request, context: RouteParams) {
  try {
    await requireActiveOperator(request)
    const { id } = await context.params
    const workspace = await loadEndOfTenancyWorkspace(id)

    if (!workspace) {
      return NextResponse.json({ error: 'End-of-tenancy case not found.' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      workspace,
      aiDraftingConfigured: isEndOfTenancyAiDraftingConfigured(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to load the end-of-tenancy workspace.',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, context: RouteParams) {
  try {
    const operator = await requireActiveOperator(request)
    const { id } = await context.params
    const payload = (await request.json()) as ActionPayload

    switch (payload.action) {
      case 'generate_draft_assessment': {
        if (!isEndOfTenancyAiDraftingConfigured()) {
          const workspace = await loadEndOfTenancyWorkspace(id)

          if (!workspace) {
            return NextResponse.json({ error: 'End-of-tenancy case not found.' }, { status: 404 })
          }

          return NextResponse.json({
            ok: true,
            workspace,
            aiDraftingConfigured: false,
            message: 'AI drafting is not configured.',
            draftResult: null,
          })
        }

        const result = await generateDraftAssessmentForEndOfTenancyCase(id)

        return NextResponse.json({
          ok: true,
          workspace: result.workspace,
          aiDraftingConfigured: true,
          draftResult: {
            aiRun: result.aiRun,
            assessment: result.assessment,
            storedIssueIds: result.storedIssues.map((item: { id: string }) => item.id),
            storedRecommendationId: result.storedRecommendation.id,
          },
        })
      }
      case 'attach_evidence':
        await attachEvidenceToEndOfTenancyCase({
          endOfTenancyCaseId: id,
          uploadedByUserId: operator.operatorProfileId,
          tenancyDocumentId: payload.tenancyDocumentId ?? null,
          messageAttachmentId: payload.messageAttachmentId ?? null,
          fileName: payload.fileName ?? null,
          fileUrl: payload.fileUrl ?? null,
          storagePath: payload.storagePath ?? null,
          mimeType: payload.mimeType ?? null,
          checksum: payload.checksum ?? null,
          capturedAt: payload.capturedAt ?? null,
          notes: payload.notes ?? null,
          documentRole: payload.documentRole ?? 'supporting_evidence',
          issueIds: payload.issueIds ?? [],
          excerpt: payload.excerpt ?? null,
          pageNumber: payload.pageNumber ?? null,
        })
        break
      case 'store_extraction':
        await storeEndOfTenancyExtractionResults({
          endOfTenancyCaseId: id,
          caseDocumentId: payload.caseDocumentId,
          aiRunId: payload.aiRunId ?? null,
          extractionKind: payload.extractionKind ?? 'structured',
          status: payload.status ?? 'completed',
          extractedText: payload.extractedText ?? null,
          extractedData:
            payload.extractedData && typeof payload.extractedData === 'object'
              ? (payload.extractedData as JsonValue)
              : ({} as JsonValue),
          confidence: payload.confidence ?? null,
        })
        break
      case 'create_issue': {
        const issue = await upsertEndOfTenancyIssue({
          endOfTenancyCaseId: id,
          createdByUserId: operator.operatorProfileId,
          issueType: payload.issueType,
          title: payload.title,
          description: payload.description ?? null,
          roomArea: payload.roomArea ?? null,
          responsibility: payload.responsibility ?? 'undetermined',
          severity: payload.severity ?? 'medium',
          proposedAmount: payload.proposedAmount ?? null,
          status: 'open',
        })
        await syncMoveOutTrackerProgress(id, {
          event: {
            actorType: 'user',
            actorUserId: operator.operatorProfileId,
            eventType: 'issue_created',
            title: 'Issue created',
            detail: `${issue.title} was added to the move-out review.`,
            sourceTable: 'end_of_tenancy_issues',
            sourceRecordId: issue.id,
          },
        })
        break
      }
      case 'update_issue':
        await updateIssueAssessment({
          issueId: payload.issueId,
          issueType: payload.issueType,
          title: payload.title,
          description: payload.description ?? null,
          roomArea: payload.roomArea ?? null,
          responsibility: payload.responsibility,
          severity: payload.severity,
          proposedAmount: payload.proposedAmount ?? null,
          status: payload.status,
        })
        break
      case 'update_move_out_checklist_item':
        await updateMoveOutChecklist({
          endOfTenancyCaseId: id,
          itemKey: payload.itemKey,
          status: payload.status,
          operatorUserId: operator.operatorProfileId,
          notes: payload.notes ?? null,
        })
        break
      case 'create_draft_recommendation':
        await createDraftDecisionRecommendation({
          endOfTenancyCaseId: id,
          aiRunId: payload.aiRunId ?? null,
          decisionSummary: payload.decisionSummary ?? null,
          rationale: payload.rationale ?? null,
          recommendedOutcome: payload.recommendedOutcome ?? 'no_decision',
          totalRecommendedAmount: payload.totalRecommendedAmount ?? null,
          issueIds: payload.issueIds ?? [],
        })
        break
      case 'review_recommendation':
        await recordOperatorReviewAction({
          decisionRecommendationId: payload.decisionRecommendationId,
          operatorUserId: operator.operatorProfileId,
          action: payload.reviewAction,
          notes: payload.notes ?? null,
          override: payload.override,
        })
        break
      case 'convert_recommendation_to_line_items':
        await convertApprovedRecommendationToDepositClaimLineItems({
          decisionRecommendationId: payload.decisionRecommendationId,
          operatorUserId: operator.operatorProfileId,
        })
        break
      case 'mark_ready_for_claim':
        await markEndOfTenancyCaseReadyForClaim({
          endOfTenancyCaseId: id,
          operatorUserId: operator.operatorProfileId,
          note: payload.note ?? null,
        })
        break
      case 'mark_needs_manual_review':
        await markEndOfTenancyCaseNeedsManualReview({
          endOfTenancyCaseId: id,
          operatorUserId: operator.operatorProfileId,
          note: payload.note ?? null,
        })
        break
      default:
        return NextResponse.json({ error: 'Unsupported end-of-tenancy action.' }, { status: 400 })
    }

    const workspace = await loadEndOfTenancyWorkspace(id)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Action completed but the end-of-tenancy workspace could not be reloaded.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      workspace,
      aiDraftingConfigured: isEndOfTenancyAiDraftingConfigured(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to process the end-of-tenancy action right now.',
      },
      { status: 500 }
    )
  }
}
