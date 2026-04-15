import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { upsertWorkflowStatus, loadWorkflowStatus } from '@/lib/eot-workspace-service'
import type { WorkspaceStep } from '@/lib/eot-types'
import { WORKSPACE_STEPS } from '@/lib/eot-types'

type RouteContext = {
  params: Promise<{ caseId: string }>
}

const VALID_STEPS = new Set(WORKSPACE_STEPS.map((s) => s.key))

export async function GET(_request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.VIEW_CASE)
  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  try {
    const workflow = await loadWorkflowStatus(caseId, authResult.context.tenantId)
    return NextResponse.json({ workflow })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to load workflow.' },
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

  let body: { active_step?: string; completed_steps?: string[] }
  try {
    body = (await request.json()) as { active_step?: string; completed_steps?: string[] }
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.active_step || !VALID_STEPS.has(body.active_step as WorkspaceStep)) {
    return NextResponse.json(
      { detail: `active_step must be one of: ${[...VALID_STEPS].join(', ')}` },
      { status: 400 },
    )
  }

  const completedSteps = (body.completed_steps ?? []).filter((s) =>
    VALID_STEPS.has(s as WorkspaceStep),
  ) as WorkspaceStep[]

  try {
    const workflow = await upsertWorkflowStatus(
      authResult.context.tenantId,
      authResult.context.user.id,
      {
        case_id: caseId,
        active_step: body.active_step as WorkspaceStep,
        completed_steps: completedSteps,
      },
    )
    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('workflow PATCH failed', {
      caseId,
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to update workflow.' },
      { status: 500 },
    )
  }
}
