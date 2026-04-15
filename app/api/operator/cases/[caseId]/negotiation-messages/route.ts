import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import {
  saveNegotiationMessage,
  loadNegotiationMessages,
} from '@/lib/eot-workspace-service'

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
    const messages = await loadNegotiationMessages(caseId, authResult.context.tenantId)
    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to load messages.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.EDIT_CASE)
  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  let body: { content?: string; sender_role?: string; sender_name?: string }
  try {
    body = (await request.json()) as { content?: string; sender_role?: string; sender_name?: string }
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
    return NextResponse.json({ detail: 'content is required.' }, { status: 400 })
  }

  const validRoles = ['operator', 'tenant', 'landlord']
  const senderRole = body.sender_role ?? 'operator'
  if (!validRoles.includes(senderRole)) {
    return NextResponse.json(
      { detail: `sender_role must be one of: ${validRoles.join(', ')}` },
      { status: 400 },
    )
  }

  try {
    await saveNegotiationMessage(authResult.context.tenantId, {
      case_id: caseId,
      sender_role: senderRole as 'operator' | 'tenant' | 'landlord',
      sender_name: body.sender_name ?? authResult.context.profile?.full_name ?? 'Operator',
      content: body.content.trim(),
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('negotiation-messages POST failed', {
      caseId,
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to save message.' },
      { status: 500 },
    )
  }
}
