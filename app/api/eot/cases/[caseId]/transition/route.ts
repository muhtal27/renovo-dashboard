import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

type RouteContext = {
  params: Promise<{
    caseId: string
  }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { caseId } = await context.params
  return proxyEotRequest(
    request,
    `/api/eot/cases/${caseId}/transition`,
    OPERATOR_PERMISSIONS.EDIT_CASE
  )
}
