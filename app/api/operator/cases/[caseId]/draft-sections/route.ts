import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { saveDraftSection, loadDraftSections } from '@/lib/eot-workspace-service'

type RouteContext = {
  params: Promise<{ caseId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.VIEW_CASE)
  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  try {
    const sections = await loadDraftSections(caseId, authResult.context.tenantId)
    return NextResponse.json({ sections })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to load draft sections.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.EDIT_CASE)
  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  let body: { section_key?: string; title?: string; content?: string; sort_order?: number }
  try {
    body = (await request.json()) as { section_key?: string; title?: string; content?: string; sort_order?: number }
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.section_key || typeof body.section_key !== 'string') {
    return NextResponse.json({ detail: 'section_key is required.' }, { status: 400 })
  }

  if (typeof body.content !== 'string') {
    return NextResponse.json({ detail: 'content is required.' }, { status: 400 })
  }

  try {
    await saveDraftSection(authResult.context.tenantId, {
      case_id: caseId,
      section_key: body.section_key,
      title: body.title ?? body.section_key,
      content: body.content,
      sort_order: body.sort_order ?? 0,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('draft-sections PATCH failed', {
      caseId,
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to save draft section.' },
      { status: 500 },
    )
  }
}
