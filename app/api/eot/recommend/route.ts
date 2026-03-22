import { NextResponse } from 'next/server'
import { requireActiveOperator } from '@/app/api/end-of-tenancy/_auth'
import { getDefaultEndOfTenancyAiProvider } from '@/lib/end-of-tenancy/ai-provider'
import { withEndOfTenancyTransaction } from '@/lib/end-of-tenancy/db'
import { prepareEndOfTenancyAiInput } from '@/lib/end-of-tenancy/ai'

type RecommendationSourceOutput = {
  source_type: 'document' | 'issue' | 'extraction' | 'other'
  source_note: string
}

type RecommendationOutput = {
  recommended_outcome:
    | 'no_action'
    | 'partial_claim'
    | 'full_claim'
    | 'insufficient_evidence'
    | 'refer_to_human'
  decision_summary: string
  rationale: string
  total_recommended_amount: number
  confidence: number | null
  sources: RecommendationSourceOutput[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateModelOutput(value: unknown): RecommendationOutput {
  if (!isObject(value)) {
    throw new Error('Model output was not a valid object.')
  }

  const allowedOutcomes = new Set([
    'no_action',
    'partial_claim',
    'full_claim',
    'insufficient_evidence',
    'refer_to_human',
  ])
  const allowedSourceTypes = new Set(['document', 'issue', 'extraction', 'other'])

  if (
    typeof value.recommended_outcome !== 'string' ||
    !allowedOutcomes.has(value.recommended_outcome)
  ) {
    throw new Error('Model output included an invalid recommended_outcome.')
  }

  if (typeof value.decision_summary !== 'string' || value.decision_summary.trim() === '') {
    throw new Error('Model output included an invalid decision_summary.')
  }

  if (typeof value.rationale !== 'string' || value.rationale.trim() === '') {
    throw new Error('Model output included an invalid rationale.')
  }

  if (
    typeof value.total_recommended_amount !== 'number' ||
    Number.isNaN(value.total_recommended_amount) ||
    value.total_recommended_amount < 0
  ) {
    throw new Error('Model output included an invalid total_recommended_amount.')
  }

  const confidence =
    value.confidence == null
      ? null
      : typeof value.confidence === 'number' && value.confidence >= 0 && value.confidence <= 1
        ? value.confidence
        : (() => {
            throw new Error('Model output included an invalid confidence value.')
          })()

  if (!Array.isArray(value.sources)) {
    throw new Error('Model output included an invalid sources array.')
  }

  const sources = value.sources.map((source, index) => {
    if (!isObject(source)) {
      throw new Error(`Model source ${index + 1} was not a valid object.`)
    }

    if (typeof source.source_type !== 'string' || !allowedSourceTypes.has(source.source_type)) {
      throw new Error(`Model source ${index + 1} included an invalid source_type.`)
    }

    if (typeof source.source_note !== 'string' || source.source_note.trim() === '') {
      throw new Error(`Model source ${index + 1} included an invalid source_note.`)
    }

    return {
      source_type: source.source_type as RecommendationSourceOutput['source_type'],
      source_note: source.source_note.trim(),
    }
  })

  return {
    recommended_outcome: value.recommended_outcome as RecommendationOutput['recommended_outcome'],
    decision_summary: value.decision_summary.trim(),
    rationale: value.rationale.trim(),
    total_recommended_amount: value.total_recommended_amount,
    confidence,
    sources,
  }
}

function resolveSourceReference(
  source: RecommendationSourceOutput,
  workspace: Awaited<ReturnType<typeof prepareEndOfTenancyAiInput>>['workspace']
) {
  const firstIssueId = workspace.issues[0]?.id ?? null
  const firstDocumentId = workspace.documents[0]?.id ?? null
  const firstExtractionId =
    workspace.documents.flatMap((document) => document.extractions)[0]?.id ?? null

  if (source.source_type === 'issue' && firstIssueId) {
    return {
      sourceType: 'issue' as const,
      issueId: firstIssueId,
      caseDocumentId: null,
      documentExtractionId: null,
    }
  }

  if (source.source_type === 'document' && firstDocumentId) {
    return {
      sourceType: 'case_document' as const,
      issueId: null,
      caseDocumentId: firstDocumentId,
      documentExtractionId: null,
    }
  }

  if (source.source_type === 'extraction' && firstExtractionId) {
    return {
      sourceType: 'document_extraction' as const,
      issueId: null,
      caseDocumentId: null,
      documentExtractionId: firstExtractionId,
    }
  }

  if (firstIssueId) {
    return {
      sourceType: 'issue' as const,
      issueId: firstIssueId,
      caseDocumentId: null,
      documentExtractionId: null,
    }
  }

  if (firstDocumentId) {
    return {
      sourceType: 'case_document' as const,
      issueId: null,
      caseDocumentId: firstDocumentId,
      documentExtractionId: null,
    }
  }

  if (firstExtractionId) {
    return {
      sourceType: 'document_extraction' as const,
      issueId: null,
      caseDocumentId: null,
      documentExtractionId: firstExtractionId,
    }
  }

  return null
}

function buildPrompts(summary: unknown) {
  return {
    systemPrompt:
      'You are an expert property management AI. Based on the evidence and issues provided, generate a structured end-of-tenancy recommendation.',
    userPrompt: [
      'Return valid JSON only.',
      'The JSON must match this schema exactly:',
      '{',
      '  "recommended_outcome": "no_action" | "partial_claim" | "full_claim" | "insufficient_evidence" | "refer_to_human",',
      '  "decision_summary": "string",',
      '  "rationale": "string",',
      '  "total_recommended_amount": number,',
      '  "confidence": number | null,',
      '  "sources": [',
      '    {',
      '      "source_type": "document" | "issue" | "extraction" | "other",',
      '      "source_note": "string"',
      '    }',
      '  ]',
      '}',
      '',
      JSON.stringify(summary, null, 2),
    ].join('\n'),
  }
}

export async function POST(request: Request) {
  try {
    await requireActiveOperator(request)
    const payload = (await request.json().catch(() => null)) as { eot_case_id?: unknown } | null

    if (typeof payload?.eot_case_id !== 'string' || payload.eot_case_id.trim() === '') {
      return NextResponse.json({ error: 'eot_case_id is required.' }, { status: 400 })
    }

    const { workspace, prepared } = await prepareEndOfTenancyAiInput(payload.eot_case_id)

    if (!workspace.case || workspace.case.status === 'closed') {
      return NextResponse.json({ error: 'Recommendation drafting requires an active case.' }, { status: 409 })
    }

    const provider = getDefaultEndOfTenancyAiProvider()
    const prompt = buildPrompts(prepared)
    const providerResult = await provider.generateStructuredObject(prompt)

    let parsed: unknown

    try {
      parsed = JSON.parse(providerResult.outputText)
    } catch {
      return NextResponse.json({ error: 'Recommendation model returned invalid JSON.' }, { status: 422 })
    }

    let output: RecommendationOutput

    try {
      output = validateModelOutput(parsed)
    } catch (validationError) {
      return NextResponse.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : 'Recommendation model returned an invalid payload.',
        },
        { status: 422 }
      )
    }

    const result = await withEndOfTenancyTransaction(async (client) => {
      const aiRunResult = await client.query<{ id: string }>(
        `
          insert into public.ai_runs (
            case_id,
            call_session_id,
            run_type,
            model_name,
            classification,
            confidence,
            action_taken
          )
          values ($1, null, 'end_of_tenancy_recommendation', $2, 'end_of_tenancy_recommendation', $3, $4)
          returning id
        `,
        [
          workspace.case?.id ?? null,
          providerResult.model,
          output.confidence,
          output.decision_summary.slice(0, 900),
        ]
      )

      const aiRunId = aiRunResult.rows[0]?.id

      const recommendationResult = await client.query<{ id: string }>(
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
          returning id
        `,
        [
          workspace.endOfTenancyCase.id,
          aiRunId ?? null,
          output.recommended_outcome,
          output.decision_summary,
          output.rationale,
          output.total_recommended_amount,
        ]
      )

      const recommendationId = recommendationResult.rows[0]?.id

      for (const source of output.sources) {
        const resolvedSource = resolveSourceReference(source, workspace)

        if (!resolvedSource) {
          continue
        }

        await client.query(
          `
            insert into public.decision_recommendation_sources (
              decision_recommendation_id,
              source_type,
              issue_id,
              case_document_id,
              document_extraction_id,
              source_note
            )
            values ($1, $2, $3, $4, $5, $6)
          `,
          [
            recommendationId,
            resolvedSource.sourceType,
            resolvedSource.issueId,
            resolvedSource.caseDocumentId,
            resolvedSource.documentExtractionId,
            source.source_note,
          ]
        )
      }

      await client.query(
        `
          update public.end_of_tenancy_cases
          set
            workflow_status = 'recommendation_drafted',
            updated_at = now()
          where id = $1
        `,
        [workspace.endOfTenancyCase.id]
      )

      return {
        recommendationId,
      }
    })

    return NextResponse.json({
      success: true,
      recommendation_id: result.recommendationId,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to generate the recommendation.',
      },
      { status: 500 }
    )
  }
}
