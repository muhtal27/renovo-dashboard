import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

type RouteContext = {
  params: Promise<{
    caseId: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const { caseId } = await context.params
  return proxyEotRequest(
    request,
    `/operator/cases/${caseId}/analyse`,
    OPERATOR_PERMISSIONS.GENERATE_CLAIM_OUTPUT
  )
}
