import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { loadWorkspaceStepData } from '@/lib/eot-workspace-service'

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
    const data = await loadWorkspaceStepData(caseId, authResult.context.tenantId)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=30' },
    })
  } catch (error) {
    console.error('workspace-steps GET failed', {
      caseId,
      tenantId: authResult.context.tenantId,
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to load workspace step data.' },
      { status: 500 },
    )
  }
}
