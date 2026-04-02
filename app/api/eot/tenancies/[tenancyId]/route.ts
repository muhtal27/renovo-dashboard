import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

type RouteContext = { params: Promise<{ tenancyId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { tenancyId } = await context.params
  return proxyEotRequest(request, `/api/eot/tenancies/${tenancyId}`, OPERATOR_PERMISSIONS.VIEW_CASE)
}
