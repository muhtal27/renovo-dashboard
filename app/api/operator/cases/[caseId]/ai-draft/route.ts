import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { generateAIDraft } from '@/lib/ai-drafting-service'
import type { AIDraftType } from '@/lib/operator-checkout-workspace-types'

type RouteContext = {
  params: Promise<{
    caseId: string
  }>
}

const VALID_DRAFT_TYPES: AIDraftType[] = [
  'liability_assessment',
  'proposed_charges',
  'tenant_negotiation',
  'combined_report',
]

export const maxDuration = 120

export async function POST(request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.GENERATE_CLAIM_OUTPUT)
  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  let body: { draft_type?: string }
  try {
    body = (await request.json()) as { draft_type?: string }
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 })
  }

  const draftType = body.draft_type as AIDraftType | undefined
  if (!draftType || !VALID_DRAFT_TYPES.includes(draftType)) {
    return NextResponse.json(
      { detail: `Invalid draft_type. Must be one of: ${VALID_DRAFT_TYPES.join(', ')}` },
      { status: 400 },
    )
  }

  try {
    const result = await generateAIDraft(caseId, authResult.context.tenantId, draftType)
    revalidatePath(`/operator/cases/${caseId}`)
    return NextResponse.json({
      success: true,
      draft_id: result.draftId,
      draft_type: draftType,
      title: result.title,
      content: result.content,
    })
  } catch (error) {
    console.error('AI draft generation failed', {
      caseId,
      tenantId: authResult.context.tenantId,
      draftType,
      error: error instanceof Error ? error.message : 'unknown',
    })
    const message = error instanceof Error ? error.message : 'Failed to generate draft.'
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
